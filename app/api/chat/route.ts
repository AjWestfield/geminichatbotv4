import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: Request) {
  try {
    // Parse request
    const { messages, model = "gemini-2.5-flash-preview-05-20", fileUri, fileMimeType, transcription } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 })
    }

    // Get the generative model with appropriate settings
    const modelConfig: any = { model }
    
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
    
    // Add text message
    let finalMessageContent = messageContent
    
    // If we have transcription data for video/audio, include it as context
    if (transcription && transcription.text && (fileMimeType?.startsWith("video/") || fileMimeType?.startsWith("audio/"))) {
      const duration = transcription.duration ? ` (Duration: ${Math.floor(transcription.duration / 60)}:${Math.floor(transcription.duration % 60).toString().padStart(2, '0')})` : ''
      const language = transcription.language ? ` [Language: ${transcription.language}]` : ''
      
      finalMessageContent += `\n\nTranscription of audio track${language}${duration}:\n"${transcription.text}"\n\nPlease incorporate this transcription into your complete analysis.`
      
      console.log(`Including transcription in analysis - Length: ${transcription.text.length} chars`)
    }
    
    contentParts.push({ text: finalMessageContent })
    
    // Send message and get streaming response
    const result = await chat.sendMessageStream(contentParts)

    // Create a TransformStream to convert the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            // Format as data stream for AI SDK v4
            // Escape the text properly for JSON
            const escapedText = text
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
            
            const formatted = `0:"${escapedText}"\n`
            controller.enqueue(encoder.encode(formatted))
          }
          // Send the done signal
          controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`))
        } catch (error) {
          console.error("Streaming error:", error)
          // Send error signal
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          const escapedError = errorMessage
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
          controller.enqueue(encoder.encode(`3:{"error":"${escapedError}"}\n`))
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
      `3:{"error":"${escapedError}"}\n`,
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