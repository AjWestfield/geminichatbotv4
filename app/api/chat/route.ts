import { GoogleGenerativeAI } from "@google/generative-ai"
import { MCPToolsContext } from "@/lib/mcp/mcp-tools-context"
import { MCPServerIntelligence } from "@/lib/mcp/mcp-server-intelligence"
import { MCPServerManager } from "@/lib/mcp/mcp-server-manager"
import { MCPConfigManager } from "@/lib/mcp/mcp-config-manager"
import { MCPGitHubPrompts } from "@/lib/mcp/mcp-github-prompts"
import { MCP_AGENT_INSTRUCTIONS, MCP_SYSTEM_PROMPT } from "@/lib/mcp/mcp-agent-instructions"
import { MCP_AGENT_INSTRUCTIONS_ENHANCED, MCP_SYSTEM_PROMPT_ENHANCED, MCP_AGENT_INSTRUCTIONS_WITH_PLANS } from "@/lib/mcp/mcp-agent-instructions-enhanced"
import { getClaudeClient, formatMessagesForClaude, convertMCPToolsToClaudeTools, parseClaudeToolCalls, formatToolResultsForClaude } from "@/lib/claude-client"
import { MCPPlanContextManager } from "@/lib/mcp/mcp-plan-context-manager"
import { TavilyClient, WebSearchContextDetector } from "@/lib/tavily-client"
import { ENHANCED_AGENT_INSTRUCTIONS_WITH_WEB_SEARCH } from "@/lib/mcp/mcp-agent-web-search-instructions"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Note: MCP servers will be auto-connected when needed by MCPToolsContext.getAvailableTools()

export async function POST(req: Request) {
  try {
    // Parse request
    const { messages, model = "gemini-2.5-flash-preview-05-20", fileUri, fileMimeType, transcription } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 })
    }

    // Check if it's a Claude model
    if (model === "Claude Sonnet 4") {
      // Import Claude handler dynamically to avoid circular dependencies
      const { handleClaudeRequest } = await import('./claude-handler');
      return handleClaudeRequest(messages, model);
    }

    // Get active plan context if any
    const messageIds = messages.map(m => m.id).filter(Boolean)
    const activePlanContext = MCPPlanContextManager.getInstance().getActivePlanForConversation(messageIds)
    
    // Build system instruction with plan context and web search capabilities
    let systemInstruction = MCP_SYSTEM_PROMPT_ENHANCED + '\n\n' + ENHANCED_AGENT_INSTRUCTIONS_WITH_WEB_SEARCH
    
    if (activePlanContext) {
      systemInstruction += `\n\n## ACTIVE PLAN CONTEXT
You are currently executing a plan with the following details:
- Plan ID: ${activePlanContext.planId}
- Current Task: ${activePlanContext.currentTask.id} - "${activePlanContext.currentTask.title}"
- Task Status: ${activePlanContext.currentTask.status}
- Progress: ${activePlanContext.completedTasks}/${activePlanContext.totalTasks} tasks completed

IMPORTANT: Use this plan ID (${activePlanContext.planId}) for all [TASK_UPDATE] messages.
Continue working on the current task and update its status as you progress.`
    }
    
    // Get the generative model with appropriate settings
    const modelConfig: any = { 
      model,
      systemInstruction
    }
    
    // Add specific configurations for video-capable models
    if (model === "gemini-2.0-flash-exp" && fileMimeType?.startsWith("video/")) {
      // Gemini 2.0 Flash might have different video capabilities
      modelConfig.generationConfig = {
        temperature: 0.4, // Lower temperature for more focused analysis
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    }
    
    const generativeModel = genAI.getGenerativeModel(modelConfig)

    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== "user") {
      return new Response("No user message found", { status: 400 })
    }

    // Convert messages to Gemini format, excluding system messages and initial assistant greeting
    const history = messages
      .filter((m) => m.role !== "system" && m.id !== "welcome-message")
      .slice(0, -1) // Exclude the last message which we'll send separately
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }))
    
    // Ensure history starts with user message or is empty
    if (history.length > 0 && history[0].role !== "user") {
      history.shift() // Remove first message if it's not from user
    }

    // Start chat session with history
    // Use higher token limits for video analysis
    const isVideoAnalysis = fileMimeType?.startsWith("video/")
    const chat = generativeModel.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: isVideoAnalysis ? 8192 : 4096, // Much higher limit for videos
      },
    })

    // Prepare content parts for multimodal input
    const contentParts = []
    
    // Add file if provided
    if (fileUri && fileMimeType) {
      console.log(`Processing file: ${fileMimeType}, URI: ${fileUri}`)
      contentParts.push({
        fileData: {
          mimeType: fileMimeType,
          fileUri: fileUri
        }
      })
    }
    
    // Prepare the message content
    let messageContent = lastMessage.content
    
    // If it's a media file and no user input, add appropriate analysis instruction
    if (fileMimeType && !lastMessage.content.trim()) {
      if (fileMimeType.startsWith("audio/")) {
        messageContent = "Please analyze this audio file. Provide insights about the content, context, and any notable aspects you observe."
      } else if (fileMimeType.startsWith("video/")) {
        messageContent = `Please provide a comprehensive analysis of this entire video from start to finish. Include:

1. **Overview**: Brief summary of the video's purpose and content
2. **Visual Analysis**: 
   - Describe all scenes in chronological order with timestamps
   - Note any text, graphics, or visual effects
   - Describe camera movements, transitions, and editing style
3. **Audio Analysis**:
   - Transcribe or summarize any narration, dialogue, or speech
   - Describe background music, sound effects, or audio cues
   - Note the tone and pacing of audio elements
4. **Technical Aspects**: Video quality, aspect ratio, production value
5. **Complete Timeline**: Provide a scene-by-scene breakdown with approximate timestamps
6. **Key Messages**: Main themes or messages conveyed
7. **Overall Assessment**: Style, effectiveness, and notable features

Please ensure you analyze the ENTIRE video duration from beginning to end.`
      } else if (fileMimeType.startsWith("image/")) {
        messageContent = "Please analyze this image. Describe what you see and provide any relevant insights or observations."
      }
    } else if (fileMimeType?.startsWith("video/") && lastMessage.content.trim().toLowerCase().includes("analyze")) {
      // If user asks to analyze a video, ensure comprehensive analysis
      messageContent = lastMessage.content + `

Please ensure your analysis covers:
- The complete video from start to finish
- All visual scenes with timestamps
- Any audio, narration, or dialogue
- Technical aspects and production quality
- A detailed timeline of events
- Key messages and themes

Analyze the ENTIRE video duration, not just the beginning.`
    }
    
    // Check if web search is needed
    const requiresWebSearch = WebSearchContextDetector.requiresWebSearch(messageContent)
    let webSearchResults = null
    
    // Add text message
    let finalMessageContent = messageContent
    
    // Check if this is an API key response
    if (messageContent.includes('API_KEY_PROVIDED:')) {
      console.log('[Chat API] Detected API key response')
      // The agent will handle this internally, just pass it through
    }
    
    // Check if this is an MCP server management request
    const mcpServerPatterns = [
      /(?:add|install|setup|configure|enable|remove|delete|list|show)\s+.*mcp\s+server/i,
      /mcp\s+server.*(?:add|install|setup|configure|enable|remove|delete|list|show)/i,
      /(?:add|install|setup|configure)\s+(?:the\s+)?(?:@[\w/-]+|[\w-]+)\s+(?:mcp\s+)?server/i,
      /here'?s?\s+(?:the\s+)?(?:json|config|configuration)\s+for\s+.*mcp/i,
      /\{[^}]*["']?(?:name|command|url)["']?\s*:/i,  // Looks like MCP JSON config
      /https?:\/\/github\.com\/[^\s]+/i  // GitHub URLs
    ]
    
    const isMCPServerRequest = mcpServerPatterns.some(pattern => pattern.test(messageContent))
    const githubUrlMatch = messageContent.match(/https?:\/\/github\.com\/[^\s]+/i)
    let isGitHubAnalysis = false
    
    if (isMCPServerRequest) {
      console.log('[Chat API] Detected MCP server request')
      
      // Handle GitHub URLs specially
      if (githubUrlMatch) {
        const githubUrl = githubUrlMatch[0]
        console.log('[Chat API] Processing GitHub URL:', githubUrl)
        
        // Natural language request with GitHub URL
        const serverManager = MCPServerManager.getInstance()
        const nlResult = await MCPServerIntelligence.processNaturalLanguageRequest(messageContent, serverManager)
        
        if (nlResult.action === 'add' && nlResult.suggestion) {
          // Successfully analyzed GitHub repo
          const config = await MCPConfigManager.loadConfig() || { servers: [] as any[] }
          
          const serverConfig: any = {
            name: nlResult.suggestion.name,
            transportType: nlResult.suggestion.transportType
          }
          
          if (nlResult.suggestion.transportType === 'stdio') {
            serverConfig.command = nlResult.suggestion.command
            if (nlResult.suggestion.args) serverConfig.args = nlResult.suggestion.args
            if (nlResult.suggestion.env) serverConfig.env = nlResult.suggestion.env
          } else {
            serverConfig.url = nlResult.suggestion.url
            if (nlResult.suggestion.apiKey) serverConfig.apiKey = nlResult.suggestion.apiKey
          }
          
          if (!config.servers) config.servers = []
          
          const existingIndex = config.servers.findIndex((s: any) => s.name === serverConfig.name)
          if (existingIndex >= 0) {
            config.servers[existingIndex] = serverConfig
          } else {
            config.servers.push(serverConfig)
          }
          
          await MCPConfigManager.saveConfig(config.servers)
          
          finalMessageContent = `## 🎉 Successfully analyzed and added MCP server!

**Server**: ${nlResult.suggestion.name}
**Source**: ${githubUrl}
**Confidence**: ${(nlResult.suggestion.confidence * 100).toFixed(0)}%
${nlResult.suggestion.description ? `**Description**: ${nlResult.suggestion.description}` : ''}

**Configuration**:
\`\`\`json
${JSON.stringify(serverConfig, null, 2)}
\`\`\`

The server has been added and is ready to use. Would you like me to connect to it and show you the available tools?`
        } else {
          // Need to search for more information
          // Extract repo info from URL for better search
          const urlParts = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/[^\/]+)?(?:\/(.+))?/)
          const repoPath = urlParts ? `${urlParts[1]}/${urlParts[2]}` : 'repository'
          const serverPath = urlParts?.[3] || ''
          
          // Get available tools to find a web search tool
          const toolsCtx = await MCPToolsContext.getAvailableTools()
          const searchTool = toolsCtx.tools.find(t => 
            t.toolName.toLowerCase().includes('web_search') || 
            t.toolName.toLowerCase().includes('search')
          )
          
          if (searchTool) {
            finalMessageContent = `I'm analyzing the GitHub repository at ${githubUrl} to find the MCP server configuration. Let me search for more details.

[TOOL_CALL]
{
  "tool": "${searchTool.toolName}",
  "server": "${searchTool.serverName}",
  "arguments": {
    "query": "${githubUrl} MCP server installation npm install npx command configuration Model Context Protocol setup"
  }
}
[/TOOL_CALL]

${MCPGitHubPrompts.githubAnalysisFollowup}

After receiving the search results, I will:
1. Extract the installation command (npx or npm install)
2. Determine the correct package name
3. Identify any required environment variables
4. Build a complete MCP server configuration
5. Add it to your system automatically

Repository: ${repoPath}
${serverPath ? `Server path: ${serverPath}` : ''}`
          } else {
            // No search tool available
            finalMessageContent = `I need to analyze the GitHub repository at ${githubUrl}, but no search tools are currently available. 

To enable GitHub repository analysis, please add a search tool like context7:
1. Click the + button in the MCP panel
2. Add context7 server with your API key
3. Then I'll be able to search for the MCP server configuration

Repository: ${repoPath}
${serverPath ? `Server path: ${serverPath}` : ''}`
          }
          isGitHubAnalysis = true
        }
      } else {
        // Check if it contains JSON configuration
        const jsonMatch = messageContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (jsonMatch) {
          // User provided JSON configuration
          const jsonInput = jsonMatch[0]
          const analysis = await MCPServerIntelligence.analyzeAndCorrectJSON(jsonInput)
          
          if (analysis.correctedJSON) {
            // Add the corrected server configuration
            const config = await MCPConfigManager.loadConfig() || { servers: [] as any[] }
            
            if (!config.servers) config.servers = []
            
            // Handle different JSON formats
            const serversToAdd = Array.isArray(analysis.correctedJSON) 
              ? analysis.correctedJSON 
              : analysis.correctedJSON.mcpServers 
                ? Object.entries(analysis.correctedJSON.mcpServers).map(([name, cfg]: [string, any]) => ({ name, ...cfg }))
                : [analysis.correctedJSON]
            
            for (const server of serversToAdd) {
              const existingIndex = config.servers.findIndex((s: any) => s.name === server.name)
              if (existingIndex >= 0) {
                config.servers[existingIndex] = server
              } else {
                config.servers.push(server)
              }
            }
            
            await MCPConfigManager.saveConfig(config.servers)
            
            // Modify the message to inform about the addition
            const addedServers = serversToAdd.map((s: any) => s.name).join(', ')
            finalMessageContent = `I've analyzed and added the following MCP server(s): ${addedServers}. ` +
              (analysis.suggestions ? `Notes: ${analysis.suggestions.join('. ')}. ` : '') +
              `The server(s) are now available for use. Would you like me to test them or show you what tools they provide?`
          } else {
            // Could not parse or correct the JSON
            finalMessageContent = `I couldn't parse the MCP server configuration. ` +
              (analysis.errors ? `Errors: ${analysis.errors.join('. ')}. ` : '') +
              `Please provide a valid JSON configuration or tell me which MCP server you'd like to add (e.g., "add the filesystem MCP server").`
          }
        } else {
          // Natural language request
          const serverManager = MCPServerManager.getInstance()
          const nlResult = await MCPServerIntelligence.processNaturalLanguageRequest(messageContent, serverManager)
          
          if (nlResult.action === 'add' && nlResult.suggestion && nlResult.suggestion.confidence > 0.5) {
            // Add the suggested server
            const config = await MCPConfigManager.loadConfig() || { servers: [] as any[] }
            
            const serverConfig: any = {
              name: nlResult.suggestion.name,
              transportType: nlResult.suggestion.transportType
            }
            
            if (nlResult.suggestion.transportType === 'stdio') {
              serverConfig.command = nlResult.suggestion.command
              if (nlResult.suggestion.args) serverConfig.args = nlResult.suggestion.args
              if (nlResult.suggestion.env) serverConfig.env = nlResult.suggestion.env
            } else {
              serverConfig.url = nlResult.suggestion.url
              if (nlResult.suggestion.apiKey) serverConfig.apiKey = nlResult.suggestion.apiKey
            }
            
            if (!config.servers) config.servers = []
            
            const existingIndex = config.servers.findIndex((s: any) => s.name === serverConfig.name)
            if (existingIndex >= 0) {
              config.servers[existingIndex] = serverConfig
            } else {
              config.servers.push(serverConfig)
            }
            
            await MCPConfigManager.saveConfig(config.servers)
            
            finalMessageContent = `I've added the ${nlResult.serverName} MCP server with ${(nlResult.suggestion.confidence * 100).toFixed(0)}% confidence. ` +
              (nlResult.suggestion.description ? `This server provides: ${nlResult.suggestion.description}. ` : '') +
              `The server is now available for use. Would you like me to connect to it and show you what tools it provides?`
          } else if (nlResult.action === 'add' && !nlResult.suggestion) {
            // Need to search for the server configuration
            // Get available tools to find a web search tool
            const toolsCtx = await MCPToolsContext.getAvailableTools()
            const searchTool = toolsCtx.tools.find(t => 
              t.toolName.toLowerCase().includes('web_search') || 
              t.toolName.toLowerCase().includes('search')
            )
            
            if (searchTool) {
              finalMessageContent = `I'll help you add the ${nlResult.serverName || 'requested'} MCP server. Let me search for its configuration using available tools.

[TOOL_CALL]
{
  "tool": "${searchTool.toolName}",
  "server": "${searchTool.serverName}",
  "arguments": {
    "query": "MCP server ${nlResult.serverName} configuration JSON Model Context Protocol setup"
  }
}
[/TOOL_CALL]`
            } else {
              finalMessageContent = `I'd like to help you add the ${nlResult.serverName || 'requested'} MCP server, but I need a search tool to find its configuration.

Please add a search tool like context7 first:
1. Click the + button in the MCP panel
2. Add context7 server with your API key
3. Then I'll be able to search for the server configuration`
            }
          } else if (nlResult.action === 'list') {
            const config = await MCPConfigManager.loadConfig() || { servers: [] as any[] }
            const servers = config.servers || []
            
            if (servers.length === 0) {
              finalMessageContent = "You don't have any MCP servers configured yet. Would you like me to help you add some? Popular options include filesystem, github, postgres, and more."
            } else {
              const serverList = servers.map((s: any) => `- ${s.name} (${s.transportType || 'stdio'})`).join('\n')
              finalMessageContent = `Here are your configured MCP servers:\n\n${serverList}\n\nWould you like to add more servers or connect to any of these?`
            }
          } else {
            finalMessageContent = nlResult.message
          }
        }
      }
    }
    
    // Get MCP tools context
    console.log('[Chat API] Getting MCP tools context...')
    const toolsContext = await MCPToolsContext.getAvailableTools()
    
    // Add GitHub analysis instructions if we're searching for MCP config
    if (githubUrlMatch && isMCPServerRequest && isGitHubAnalysis) {
      const githubPrompt = `
${MCPGitHubPrompts.searchResultAnalysis}

When you receive search results about the GitHub repository, analyze them to find:
1. The correct NPM package name or installation command
2. How to run the server (npx, npm install -g, etc.)
3. Any required configuration or environment variables
4. Whether it uses stdio (default) or http transport

After receiving the search results, I will automatically analyze them and configure the server for you.`
      
      finalMessageContent = githubPrompt + '\n\n' + finalMessageContent
    }
    console.log('[Chat API] Tools context:', {
      toolsCount: toolsContext.tools.length,
      hasSystemPrompt: !!toolsContext.systemPrompt,
      systemPromptLength: toolsContext.systemPrompt.length
    })
    if (toolsContext.tools.length > 0) {
      console.log('[Chat API] Available tools:', toolsContext.tools.map(t => `${t.serverName}:${t.toolName}`))
    }
    if (toolsContext.systemPrompt) {
      finalMessageContent = toolsContext.systemPrompt + "\n\n" + finalMessageContent
    }
    
    // If we have transcription data for video/audio, include it as context
    if (transcription && transcription.text && (fileMimeType?.startsWith("video/") || fileMimeType?.startsWith("audio/"))) {
      const duration = transcription.duration ? ` (Duration: ${Math.floor(transcription.duration / 60)}:${Math.floor(transcription.duration % 60).toString().padStart(2, '0')})` : ''
      const language = transcription.language ? ` [Language: ${transcription.language}]` : ''
      
      finalMessageContent += `\n\nTranscription of audio track${language}${duration}:\n"${transcription.text}"\n\nPlease incorporate this transcription into your complete analysis.`
      
      console.log(`Including transcription in analysis - Length: ${transcription.text.length} chars`)
    }
    
    // Perform web search if needed
    if (requiresWebSearch && !isMCPServerRequest) {
      try {
        const searchQuery = WebSearchContextDetector.extractSearchQuery(messageContent)
        const searchContext = WebSearchContextDetector.getSearchContext(messages)
        
        // Initialize Tavily client
        const tavilyApiKey = process.env.TAVILY_API_KEY || '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'
        const tavily = new TavilyClient(tavilyApiKey)
        
        // Perform search
        const searchResponse = await tavily.searchWithContext(searchQuery, searchContext, {
          max_results: 5,
          search_depth: 'advanced',
          include_images: true
        })
        
        webSearchResults = searchResponse
        
        // Create a clean context for the AI with search results
        const searchResultsContext = searchResponse.results.map((result, index) => 
          `[${index + 1}] ${result.title}\n   URL: ${result.url}\n   Content: ${result.content}\n   Published: ${result.published_date || 'Unknown'}\n   Relevance: ${(result.score * 100).toFixed(0)}%`
        ).join('\n\n')
        
        // Add search context to the AI's message
        finalMessageContent = `I found ${searchResponse.results.length} relevant sources for "${searchQuery}". Here are the search results:\n\n${searchResultsContext}\n\nBased on these sources, ` + finalMessageContent
      } catch (error) {
        console.error('Web search error:', error)
        // Continue without search results
      }
    }
    
    contentParts.push({ text: finalMessageContent })
    
    // Send message and get streaming response
    const result = await chat.sendMessageStream(contentParts)

    // Create a TransformStream to convert the response
    const encoder = new TextEncoder()
    let responseBuffer = ''
    const processedToolCalls = new Set<string>()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // If we have web search results, send them first as a special message type
          if (webSearchResults) {
            const searchData = {
              query: WebSearchContextDetector.extractSearchQuery(messageContent),
              results: TavilyClient.formatResultsWithThumbnails(webSearchResults.results),
              images: webSearchResults.images,
              responseTime: webSearchResults.response_time,
              followUpQuestions: webSearchResults.follow_up_questions
            }
            
            // Send web search results as a special data type
            const escapedSearchData = JSON.stringify(searchData)
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
            
            controller.enqueue(encoder.encode(`data: 5:"${escapedSearchData}"\n\n`))
          }
          
          // First pass: collect the initial response and check for tool calls
          const chunks: string[] = []
          let hasToolCalls = false
          
          for await (const chunk of result.stream) {
            const text = chunk.text()
            chunks.push(text)
            responseBuffer += text
            
            // Check for tool calls
            if (text.includes('[TOOL_CALL]')) {
              hasToolCalls = true
            }
          }
          
          // If no tool calls, stream the entire response as-is
          if (!hasToolCalls) {
            const escapedText = responseBuffer
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
            
            controller.enqueue(encoder.encode(`data: 0:"${escapedText}"\n\n`))
          } else {
            // Stream the response but remove TOOL_CALL blocks (we'll send them with results later)
            let cleanedResponse = responseBuffer
            const toolCallRegex = /\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g
            cleanedResponse = cleanedResponse.replace(toolCallRegex, '')
            
            if (cleanedResponse.trim()) {
              const escapedText = cleanedResponse
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
              
              controller.enqueue(encoder.encode(`data: 0:"${escapedText}"\n\n`))
            }
          }
          
          // Debug: Log the full initial response
          console.log('[DEBUG] Full AI response:', responseBuffer.substring(0, 500) + '...')
          console.log('[DEBUG] Has tool calls:', hasToolCalls)
          
          // If there are tool calls, process them and get analysis
          if (hasToolCalls) {
            const toolCallRegex = /\[TOOL_CALL\]([\s\S]*?)\[\/TOOL_CALL\]/g
            let match
            
            while ((match = toolCallRegex.exec(responseBuffer)) !== null) {
              const toolCallStr = match[0]
              
              if (!processedToolCalls.has(toolCallStr)) {
                processedToolCalls.add(toolCallStr)
                const toolCall = MCPToolsContext.parseToolCall(toolCallStr)
                
                if (toolCall) {
                  try {
                    // Execute the tool
                    const toolResult = await MCPToolsContext.executeToolCall(toolCall)
                    
                    // Format the tool execution result to match what the frontend parser expects
                    // The parser looks for tool calls with execution results inside
                    const toolExecutionMessage = `[TOOL_CALL]
{
  "tool": "${toolCall.tool}",
  "server": "${toolCall.server}",
  "arguments": ${JSON.stringify(toolCall.arguments || {})}
}
Tool executed successfully.
${toolResult}
[Tool execution completed]
[/TOOL_CALL]`
                    
                    const escapedExecution = toolExecutionMessage
                      .replace(/\\/g, '\\\\')
                      .replace(/"/g, '\\"')
                      .replace(/\n/g, '\\n')
                      .replace(/\r/g, '\\r')
                      .replace(/\t/g, '\\t')
                    
                    controller.enqueue(encoder.encode(`data: 0:"${escapedExecution}"\n\n`))
                    
                    // Small delay to ensure tool results are processed
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Check if this is a web search for GitHub MCP server
                    let autoConfigured = false
                    if (toolCall.tool === 'web_search_exa' && isMCPServerRequest && githubUrlMatch) {
                      try {
                        // Parse search results from tool result
                        const searchResults = []
                        const resultsMatch = toolResult.match(/\[[\s\S]*\]/);
                        if (resultsMatch) {
                          const parsed = JSON.parse(resultsMatch[0])
                          searchResults.push(...parsed)
                        }
                        
                        if (searchResults.length > 0) {
                          // Call the github-analyze API internally
                          const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp/github-analyze`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              githubUrl: githubUrlMatch[0],
                              searchResults: searchResults
                            })
                          })
                          
                          if (analyzeResponse.ok) {
                            const result = await analyzeResponse.json()
                            if (result.success) {
                              autoConfigured = true
                              // Send success message
                              const successMsg = `\n\n✅ **Automatically configured ${result.suggestion.name} MCP server!**\n\nThe server has been added to your configuration and is ready to use.\n\n`
                              const escapedSuccess = successMsg
                                .replace(/\\/g, '\\\\')
                                .replace(/"/g, '\\"')
                                .replace(/\n/g, '\\n')
                              controller.enqueue(encoder.encode(`0:"${escapedSuccess}"\n`))
                            }
                          }
                        }
                      } catch (error) {
                        console.error('Auto-configuration error:', error)
                      }
                    }
                    
                    // Create analysis instruction without repeating the tool results
                    let analysisInstruction = autoConfigured 
                      ? `I've successfully configured the MCP server from the GitHub repository. Let me explain what I found and what was configured.`
                      : `I've executed the ${toolCall.tool} tool and the results are displayed above. Now I'll analyze these results to answer your question: "${lastMessage.content}"`
                    
                    // Special instructions for sequential thinking
                    if (toolCall.tool === 'sequentialthinking') {
                      // Try to parse the sequential thinking results from toolResult
                      let thinkingData: any = {}
                      try {
                        // Extract JSON from the tool result
                        const jsonMatch = toolResult.match(/\{[\s\S]*\}/)
                        if (jsonMatch) {
                          thinkingData = JSON.parse(jsonMatch[0])
                        }
                      } catch (e) {
                        // If parsing fails, use default values
                      }
                      
                      analysisInstruction = `I've executed the sequential thinking tool, which is now processing your request step by step. 

Based on the thinking progress shown above, here's my analysis:

1. **Current Status**: The tool is on thought ${thinkingData.thoughtNumber || 1} of ${thinkingData.totalThoughts || 'multiple'} thoughts.

2. **What This Means**: Sequential thinking allows me to break down complex problems into smaller, manageable steps. ${thinkingData.nextThoughtNeeded ? 'The tool needs to continue processing to complete the full analysis.' : 'The thinking process is now complete.'}

3. **Your Question**: "${lastMessage.content}"
   - I'm using structured thinking to ensure a thorough and accurate response
   - Each thought builds upon the previous ones to develop a comprehensive answer

${thinkingData.nextThoughtNeeded 
  ? '4. **Next Steps**: The tool will continue with additional thoughts to fully address your question. Would you like me to continue the thinking process?'
  : '4. **Conclusion**: The sequential thinking process has completed. Let me provide you with the final analysis based on all the thoughts generated.'}`
                    }
                    
                    // Send continuation to the same chat for analysis
                    // Include tool result in context but instruct not to repeat it
                    const continuationMessages = [
                      { text: `[The tool ${toolCall.tool} was executed and returned the following results: ${toolResult}]\n\n${analysisInstruction}\n\nPlease provide your analysis without repeating the raw tool output (it's already displayed to the user in the tool results section).` }
                    ]
                    
                    const continuationResult = await chat.sendMessageStream(continuationMessages)
                    
                    console.log('[ANALYSIS] Sending analysis request to AI')
                    console.log('[ANALYSIS] Analysis prompt:', analysisInstruction.substring(0, 200))
                    
                    // Stream the analysis
                    for await (const chunk of continuationResult.stream) {
                      const analysisText = chunk.text()
                      const escapedAnalysis = analysisText
                        .replace(/\\/g, '\\\\')
                        .replace(/"/g, '\\"')
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r')
                        .replace(/\t/g, '\\t')
                      
                      controller.enqueue(encoder.encode(`data: 0:"${escapedAnalysis}"\n\n`))
                    }
                    
                    console.log('[ANALYSIS] Analysis response received')
                  } catch (error) {
                    const errorMsg = `\n\n❌ Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`
                    const escapedError = errorMsg
                      .replace(/\\/g, '\\\\')
                      .replace(/"/g, '\\"')
                      .replace(/\n/g, '\\n')
                      .replace(/\r/g, '\\r')
                      .replace(/\t/g, '\\t')
                    
                    controller.enqueue(encoder.encode(`data: 0:"${escapedError}"\n\n`))
                  }
                }
              }
            }
          }
          
          // Send done signal
          controller.enqueue(encoder.encode(`data: d:{"finishReason":"stop"}\n\n`))
        } catch (error) {
          console.error("Streaming error:", error)
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          const escapedError = errorMessage
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
          controller.enqueue(encoder.encode(`data: 3:"${escapedError}"\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    
    // Return error in data stream format
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const escapedError = errorMessage
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
    return new Response(
      `3:"${escapedError}"\n`,
      { 
        status: 200, // Keep 200 for data stream compatibility
        headers: { 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        }
      }
    )
  }
}