import { GoogleGenerativeAI } from "@google/generative-ai"
import { MCPToolsContext } from "@/lib/mcp/mcp-tools-context"
import { MCPServerIntelligence } from "@/lib/mcp/mcp-server-intelligence"
import { MCPServerManager } from "@/lib/mcp/mcp-server-manager"
import { MCPConfigManager } from "@/lib/mcp/mcp-config-manager"
import { MCPGitHubPrompts } from "@/lib/mcp/mcp-github-prompts"
import { MCP_AGENT_INSTRUCTIONS_ENHANCED, MCP_SYSTEM_PROMPT_ENHANCED } from "@/lib/mcp/mcp-agent-instructions-enhanced"
import { VideoGenerationHandler } from "@/lib/video-generation-handler"
import { ImageEditingHandler } from "@/lib/image-editing-handler"
import { ImageUrlConverter } from "@/lib/image-url-converter"
import { streamText } from 'ai'
import { convertToCoreMessages, type Message } from 'ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Note: MCP servers will be auto-connected when needed by MCPToolsContext.getAvailableTools()

export async function POST(req: Request) {
  try {
    // Parse request
    const { messages, model = "gemini-2.5-flash-preview-05-20", fileUri, fileMimeType, transcription, multipleFiles } = await req.json()

    console.log(`[Chat API] Request received with model: ${model}`);
    console.log(`[Chat API] Model type: ${typeof model}`);
    console.log(`[Chat API] Available models: gemini-2.5-pro-preview-05-06, gemini-2.5-flash-preview-05-20, gemini-2.0-flash-exp, Claude Sonnet 4`);

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 })
    }

    // Check if it's a Claude model
    if (model === "Claude Sonnet 4") {
      console.log('[Chat API] Routing to Claude Sonnet 4 handler');
      // Import Claude handler dynamically to avoid circular dependencies
      const { handleClaudeRequest } = await import('./claude-handler');
      return handleClaudeRequest(messages);
    }

    // Build system instruction - use only MCP_AGENT_INSTRUCTIONS_ENHANCED to avoid duplication
    const systemInstruction = MCP_AGENT_INSTRUCTIONS_ENHANCED

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

    console.log(`[Chat API] Using Gemini model: ${model}`);
    console.log(`[Chat API] Model config:`, JSON.stringify(modelConfig, null, 2));
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

    // Add multiple files if provided
    if (multipleFiles && multipleFiles.length > 0) {
      console.log(`Processing ${multipleFiles.length} files`)
      for (const file of multipleFiles) {
        if (file.uri && file.mimeType) {
          console.log(`Adding file: ${file.name}, ${file.mimeType}`)
          contentParts.push({
            fileData: {
              mimeType: file.mimeType,
              fileUri: file.uri
            }
          })
        }
      }
    } 
    // Add single file if provided (fallback for backward compatibility)
    else if (fileUri && fileMimeType) {
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
    const hasMultipleFiles = multipleFiles && multipleFiles.length > 0
    if ((fileMimeType || hasMultipleFiles) && !lastMessage.content.trim()) {
      console.log(`[Chat API] Detected media file(s) with no text`)
      console.log(`[Chat API] Message content is empty: "${lastMessage.content}"`)
      console.log(`[Chat API] Has multiple files: ${hasMultipleFiles}, count: ${multipleFiles?.length || 0}`)
      
      if (hasMultipleFiles) {
        // For multiple files, analyze all of them
        const imageCount = multipleFiles.filter(f => f.mimeType?.startsWith("image/")).length
        const videoCount = multipleFiles.filter(f => f.mimeType?.startsWith("video/")).length
        const audioCount = multipleFiles.filter(f => f.mimeType?.startsWith("audio/")).length
        
        if (imageCount > 0) {
          messageContent = `Please analyze all ${multipleFiles.length} uploaded files. For each image, provide:
1. A detailed description of what you see
2. Key elements, objects, people, or text visible
3. The mood, style, or atmosphere
4. Any notable technical aspects (composition, lighting, etc.)
5. How the images relate to each other (if applicable)

Please analyze each file thoroughly and provide insights.`
        } else {
          messageContent = "Please analyze all the uploaded files and provide detailed insights about their content."
        }
      } else if (fileMimeType) {
        // Single file handling
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
          console.log(`[Chat API] Detected single image upload with no text - returning IMAGE_OPTIONS`)
          // Return image options instead of auto-analyzing for single images
          messageContent = "[IMAGE_OPTIONS]" + JSON.stringify({
            type: "image_upload",
            fileUri: fileUri,
            options: [
              {
                id: "analyze",
                label: "🔍 Analyze Image",
                description: "Get detailed insights about the image content"
              },
            {
              id: "edit", 
              label: "✏️ Edit Image",
              description: "Modify the image using AI-powered editing"
            },
            {
              id: "animate",
              label: "🎬 Animate Image", 
              description: "Transform this image into a video"
            }
          ]
        }) + "[/IMAGE_OPTIONS]";
        console.log(`[Chat API] Set messageContent to include IMAGE_OPTIONS marker`)
        }
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

    // Check if this is a video generation request and store the result
    let videoGenerationData: any = null
    let imageEditingData: any = null

    // Enhanced detection with file context - now with async aspect ratio detection
    const videoRequest = await VideoGenerationHandler.detectVideoRequest(messageContent, fileUri, fileMimeType)
    const imageEditRequest = ImageEditingHandler.detectEditRequest(messageContent, fileUri, fileMimeType)

    // Priority: Image editing takes precedence over video generation if both are detected
    if (imageEditRequest && !isMCPServerRequest) {
      console.log('[Chat API] Detected image editing request:', imageEditRequest)

      try {
        // Check if we have OPENAI_API_KEY
        if (!process.env.OPENAI_API_KEY) {
          finalMessageContent = `I understand you want to edit an image, but the image editing feature is not configured yet.

To enable image editing, you need to:
1. Sign up for an OpenAI account at https://platform.openai.com
2. Get your API key from https://platform.openai.com/api-keys
3. Add it to your .env.local file as OPENAI_API_KEY

Once configured, I'll be able to edit images using GPT-Image-1 inpainting.`
        } else {
          // Convert Google AI File Manager URI to a format we can use
          let imageUrl = imageEditRequest.imageUri

          // For now, we'll need to handle the URI conversion
          // TODO: Implement proper image URL conversion
          if (ImageUrlConverter.isGoogleAIFileUri(imageUrl || '')) {
            // Use a temporary approach - return instructions for now
            finalMessageContent = `I can see you want to edit your uploaded image, but there's a technical limitation with accessing images from Google AI File Manager for editing.

**Workaround for now:**
1. Download your image locally
2. Re-upload it using a direct image URL or file upload
3. Then I can edit it using GPT-Image-1

**What you wanted to do:** "${imageEditRequest.prompt}"

I'm working on implementing seamless image editing from uploads. For now, please try the workaround above.`
          } else {
            // Trigger actual image editing
            const editResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/edit-image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: imageUrl,
                prompt: imageEditRequest.prompt,
                quality: imageEditRequest.quality,
                style: imageEditRequest.style,
                size: imageEditRequest.size
              })
            })

            if (editResponse.ok) {
              const result = await editResponse.json()
              console.log('[IMAGE EDIT] Image editing API response:', result)

              // Store image editing data to inject after AI response
              imageEditingData = {
                success: true,
                images: result.images,
                metadata: result.metadata,
                prompt: imageEditRequest.prompt
              }

              finalMessageContent = ImageEditingHandler.generateResponse(imageEditRequest)
            } else {
              const error = await editResponse.text()
              finalMessageContent = `I encountered an error while trying to edit the image:

${error}

Please check your OpenAI API configuration and try again.`
            }
        }
          }
        } catch (error) {
          console.error('Image editing error:', error)
          finalMessageContent = `I encountered an error while trying to edit the image:

${error instanceof Error ? error.message : 'Unknown error'}

Please make sure the image editing API is properly configured.`
        }
    } else if (videoRequest && !isMCPServerRequest) {
      console.log('[Chat API] Detected video generation request:', videoRequest)

      // Check if this is an image-to-video request (user mentioned animating an image)
      if (videoRequest.type === 'image-to-video') {
        try {
          // Check if we have REPLICATE_API_KEY
          if (!process.env.REPLICATE_API_KEY) {
            finalMessageContent = `I understand you want to animate an image, but the video generation feature is not configured yet.

To enable video generation, you need to:
1. Sign up for a Replicate account at https://replicate.com
2. Get your API token from https://replicate.com/account/api-tokens
3. Add it to your .env.local file as REPLICATE_API_KEY

Once configured, I'll be able to animate images using Kling v1.6 models.`
          } else {
            // For image-to-video, we can try using the Google AI File Manager URI directly
            // Many external APIs can handle these URIs, and if not, we'll get a clear error
            let startImageUrl = videoRequest.imageUri

            console.log('[VIDEO] Processing image-to-video request with URI:', startImageUrl);

            // Try video generation with the Google AI File Manager URI
            try {
              // Trigger actual video generation with image
              const videoGenResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: videoRequest.prompt,
                  duration: videoRequest.duration,
                  aspectRatio: videoRequest.aspectRatio,
                  model: videoRequest.model,
                  negativePrompt: videoRequest.negativePrompt,
                  startImage: startImageUrl
                })
              })

              if (videoGenResponse.ok) {
                const result = await videoGenResponse.json()
                console.log('[VIDEO] Image-to-video generation API response:', result)

                // Store video generation data to inject after AI response
                console.log('[VIDEO API] Storing image-to-video generation data for injection')
                videoGenerationData = {
                  id: result.id,
                  url: result.output || '',
                  status: result.status === 'succeeded' ? 'succeeded' : 'generating',
                  prompt: videoRequest.prompt,
                  duration: videoRequest.duration,
                  aspectRatio: videoRequest.aspectRatio,
                  model: videoRequest.model,
                  sourceImage: startImageUrl
                }

                finalMessageContent = VideoGenerationHandler.generateResponse(videoRequest)
              } else {
                const error = await videoGenResponse.text()
                console.error('[VIDEO] Image-to-video generation failed:', error)

                // If the direct approach failed, provide helpful feedback
                finalMessageContent = `I encountered an issue while trying to animate your uploaded image:

**Error:** ${error}

This might be because the image format needs to be converted. Let me try to help you work around this:

**Alternative approaches:**
1. Try uploading the image in a different format (JPEG, PNG)
2. Use a direct image URL if you have one
3. The image processing system may need a moment to fully process your upload

**What you wanted:** "${videoRequest.prompt}"
**Duration:** ${videoRequest.duration} seconds
**Model:** Kling v1.6 ${videoRequest.model === 'pro' ? 'Pro' : 'Standard'}

Please try uploading the image again or use a direct image URL if available.`
              }
            } catch (networkError) {
              console.error('[VIDEO] Network error during image-to-video:', networkError)
              finalMessageContent = `I encountered a network error while trying to animate your image:

**Error:** ${networkError instanceof Error ? networkError.message : 'Unknown network error'}

Please try again in a moment, or ensure your connection is stable.`
            }
          }
        } catch (error) {
          console.error('Image-to-video generation error:', error)
          finalMessageContent = `I encountered an error while trying to animate the image:

${error instanceof Error ? error.message : 'Unknown error'}

Please make sure the video generation API is properly configured.`
        }
      } else {
        // For text-to-video, trigger actual video generation
        try {
          // Check if we have REPLICATE_API_KEY
          if (!process.env.REPLICATE_API_KEY) {
            finalMessageContent = `I understand you want to generate a video, but the video generation feature is not configured yet.

To enable video generation, you need to:
1. Sign up for a Replicate account at https://replicate.com
2. Get your API token from https://replicate.com/account/api-tokens
3. Add it to your .env.local file as REPLICATE_API_KEY

Once configured, I'll be able to generate videos using Kling v1.6 models.`
          } else {
            // Trigger actual video generation
            const videoGenResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-video`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: videoRequest.prompt,
                duration: videoRequest.duration,
                aspectRatio: videoRequest.aspectRatio,
                model: videoRequest.model,
                negativePrompt: videoRequest.negativePrompt
              })
            })

            if (videoGenResponse.ok) {
              const result = await videoGenResponse.json()
              console.log('[VIDEO] Video generation API response:', result)

              // Store video generation data to inject after AI response
              console.log('[VIDEO API] Storing video generation data for injection')
              videoGenerationData = {
                id: result.id,
                url: result.output || '',
                status: result.status === 'succeeded' ? 'succeeded' : 'generating',
                prompt: videoRequest.prompt,
                duration: videoRequest.duration,
                aspectRatio: videoRequest.aspectRatio,
                model: videoRequest.model
              }

              // Check if we got a direct video URL or a prediction ID
              if (result.status === 'succeeded' && result.output) {
                // Direct generation succeeded
                console.log('[VIDEO] Direct video generation succeeded with URL:', result.output)
                finalMessageContent = `I've generated a ${videoRequest.duration}-second video of "${videoRequest.prompt}" for you! 🎬

**Video Generation Complete**
- Model: Kling v1.6 ${videoRequest.model === 'pro' ? 'Pro' : 'Standard'}
- Duration: ${videoRequest.duration} seconds
- Aspect Ratio: ${videoRequest.aspectRatio}
- Status: Completed

The video is ready and should appear in the **Video** tab on the right.`
              } else {
                // Prediction-based generation (needs polling)
                finalMessageContent = `I'm generating a ${videoRequest.duration}-second video of "${videoRequest.prompt}" for you! 🎬

**Video Generation Started**
- ID: ${result.id}
- Model: Kling v1.6 ${videoRequest.model === 'pro' ? 'Pro' : 'Standard'}
- Duration: ${videoRequest.duration} seconds
- Aspect Ratio: ${videoRequest.aspectRatio}
- Status: ${result.status || 'generating'}

The video is being generated and will appear in the **Video** tab on the right. Kling v1.6 typically takes 5-8 minutes.`
              }
            } else {
              const error = await videoGenResponse.text()
              finalMessageContent = `I encountered an error while trying to generate the video:

${error}

Please check your Replicate API configuration and try again.`
            }
          }
        } catch (error) {
          console.error('Video generation error:', error)
          finalMessageContent = `I encountered an error while trying to generate the video:

${error instanceof Error ? error.message : 'Unknown error'}

Please make sure the video generation API is properly configured.`
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


    contentParts.push({ text: finalMessageContent })

    // Use AI SDK streamText instead of manual streaming
    if (model === "gemini-2.5-flash-preview-05-20" || model === "gemini-2.5-pro-preview-05-06" || model === "gemini-2.0-flash-exp") {
      // For video generation and image editing, we'll handle them specially
      if (videoGenerationData || imageEditingData) {
        // Send message and get streaming response using manual approach for special data injection
        const result = await chat.sendMessageStream(contentParts)

        // Create proper streaming response with injected data
        const encoder = new TextEncoder()
        let responseBuffer = ''

        const stream = new ReadableStream({
          async start(controller) {
            try {
              // Collect the response
              for await (const chunk of result.stream) {
                const text = chunk.text()
                responseBuffer += text
              }

              // Send the response in proper Server-Sent Events format
              const responseChunks = responseBuffer.split(' ')
              for (const chunk of responseChunks) {
                if (chunk.trim()) {
                  // Use proper AI SDK format: 0:"content"
                  const escapedChunk = JSON.stringify(chunk + ' ')
                  controller.enqueue(encoder.encode(`0:${escapedChunk}\n`))
                }
              }

              // Inject video generation data if available
              if (videoGenerationData) {
                // Split the video marker into smaller chunks to avoid parsing issues
                const videoMarkerStart = '\n\n[VIDEO_GENERATION_STARTED]\n'
                const videoMarkerData = JSON.stringify(videoGenerationData, null, 2)
                const videoMarkerEnd = '\n[/VIDEO_GENERATION_STARTED]'
                
                // Send each part separately
                controller.enqueue(encoder.encode(`0:${JSON.stringify(videoMarkerStart)}\n`))
                
                // Split the JSON data into smaller chunks
                const chunkSize = 100
                for (let i = 0; i < videoMarkerData.length; i += chunkSize) {
                  const chunk = videoMarkerData.slice(i, i + chunkSize)
                  controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`))
                }
                
                controller.enqueue(encoder.encode(`0:${JSON.stringify(videoMarkerEnd)}\n`))
              }

              // Inject image editing data if available
              if (imageEditingData) {
                // Split the image marker into smaller chunks to avoid parsing issues
                const imageMarkerStart = '\n\n[IMAGE_EDITING_COMPLETED]\n'
                const imageMarkerData = JSON.stringify(imageEditingData, null, 2)
                const imageMarkerEnd = '\n[/IMAGE_EDITING_COMPLETED]'
                
                // Send each part separately
                controller.enqueue(encoder.encode(`0:${JSON.stringify(imageMarkerStart)}\n`))
                
                // Split the JSON data into smaller chunks
                const chunkSize = 100
                for (let i = 0; i < imageMarkerData.length; i += chunkSize) {
                  const chunk = imageMarkerData.slice(i, i + chunkSize)
                  controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`))
                }
                
                controller.enqueue(encoder.encode(`0:${JSON.stringify(imageMarkerEnd)}\n`))
              }

              // Send finish message
              controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`))
            } catch (error) {
              console.error("Streaming error:", error)
              const errorMessage = error instanceof Error ? error.message : "Unknown error"
              const escapedError = JSON.stringify(errorMessage)
              controller.enqueue(encoder.encode(`3:${escapedError}\n`))
            } finally {
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } else {
        // For regular streaming without special data injection, use simpler approach
        const result = await chat.sendMessageStream(contentParts)

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const text = chunk.text()
                if (text) {
                  // Use proper AI SDK format: 0:"content"
                  const escapedText = JSON.stringify(text)
                  controller.enqueue(encoder.encode(`0:${escapedText}\n`))
                }
              }
              controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`))
            } catch (error) {
              console.error("Streaming error:", error)
              const errorMessage = error instanceof Error ? error.message : "Unknown error"
              const escapedError = JSON.stringify(errorMessage)
              controller.enqueue(encoder.encode(`3:${escapedError}\n`))
            } finally {
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
    } else {
      // For non-Gemini models, return a simple response
      return new Response(
        JSON.stringify({ error: "Unsupported model: " + model }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  } catch (error) {
    console.error("Chat API Error:", error)

    // Return error in data stream format
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const escapedErrorMessage = errorMessage.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    return new Response(
      `3:"${escapedErrorMessage}"\n`,
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
