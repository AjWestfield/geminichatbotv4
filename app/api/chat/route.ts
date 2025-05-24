import { StreamingTextResponse, type Message } from "ai"

// Simple mock responses for different types of queries
const MOCK_RESPONSES: Record<string, string> = {
  greeting: "Hello! I'm Claude Sonnet 4, an AI assistant created by Vercel. How can I help you today?",
  help: "I can help with various tasks like answering questions, providing information, creative writing, or just chatting. What would you like assistance with?",
  weather:
    "I don't have access to real-time weather data, but I can discuss weather patterns in general or help you understand meteorological concepts.",
  time: "I don't have access to the current time, but I can help you with time management concepts or discuss time-related topics.",
  default:
    "That's an interesting question. As Claude Sonnet 4, I'm designed to be helpful, harmless, and honest in my responses. Let me think about this...",
  error:
    "I apologize, but I'm currently operating in offline mode due to connection issues. I'll do my best to assist you with limited capabilities.",
}

// Function to generate a response based on the user's message
function generateResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return MOCK_RESPONSES.greeting
  }

  if (lowerMessage.includes("help") || lowerMessage.includes("assist")) {
    return MOCK_RESPONSES.help
  }

  if (lowerMessage.includes("weather")) {
    return MOCK_RESPONSES.weather
  }

  if (lowerMessage.includes("time")) {
    return MOCK_RESPONSES.time
  }

  if (lowerMessage.includes("claude")) {
    return "Yes, I'm Claude Sonnet 4, a large language model created by Anthropic. I'm designed to be helpful, harmless, and honest. How can I assist you today?"
  }

  if (lowerMessage.includes("anthropic")) {
    return "Anthropic is the AI company that created me. They focus on building AI systems that are safe, beneficial, and aligned with human values."
  }

  // Add more patterns as needed

  return MOCK_RESPONSES.default
}

// Create a readable stream from a string
function createStream(text: string) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Add a small delay to simulate thinking
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Send the text in chunks to simulate streaming
      const chunks = text.split(" ")
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk + " "))
        // Small delay between words for a more natural effect
        await new Promise((resolve) => setTimeout(resolve, 40))
      }
      controller.close()
    },
  })

  return stream
}

export async function POST(req: Request) {
  console.log("Chat API route called")

  try {
    // Parse request
    const body = await req.json()
    const messages = body.messages as Message[]

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format")
      return new Response("Invalid messages format", { status: 400 })
    }

    console.log(`Received ${messages.length} messages`)

    // Get the last user message
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()

    if (!lastUserMessage) {
      const responseText = MOCK_RESPONSES.greeting
      return new StreamingTextResponse(createStream(responseText))
    }

    // Generate a response based on the user's message
    const responseText = generateResponse(lastUserMessage.content)

    // Return a streaming response
    return new StreamingTextResponse(createStream(responseText))
  } catch (error) {
    console.error("Server Error:", error)

    // Even if there's an error, return a valid streaming response
    return new StreamingTextResponse(createStream(MOCK_RESPONSES.error))
  }
}
