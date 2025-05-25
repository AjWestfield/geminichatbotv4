import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: Request) {
  try {
    // Parse request
    const { messages, model = "gemini-2.5-flash-preview-05-20", fileUri, fileMimeType } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 })
    }

    // Get the generative model
    const generativeModel = genAI.getGenerativeModel({ model })

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
    const chat = generativeModel.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    })

    // Prepare content parts for multimodal input
    const contentParts = []
    
    // Add file if provided
    if (fileUri && fileMimeType) {
      contentParts.push({
        fileData: {
          mimeType: fileMimeType,
          fileUri: fileUri
        }
      })
    }
    
    // Add text message
    contentParts.push({ text: lastMessage.content })
    
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