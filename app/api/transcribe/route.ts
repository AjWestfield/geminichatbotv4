import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  timeout: 60000, // 60 second timeout
  maxRetries: 2, // Retry up to 2 times on failure
})

export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file" },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Check if it's an audio or video file
    const isAudio = file.type.startsWith("audio/")
    const isVideo = file.type.startsWith("video/")
    
    if (!isAudio && !isVideo) {
      return NextResponse.json(
        { error: "File must be an audio or video file" },
        { status: 400 }
      )
    }

    console.log(`Processing ${isVideo ? 'video' : 'audio'} file:`, file.name, "Type:", file.type, "Size:", file.size)

    // Check file size (Whisper has a 25MB limit)
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File size exceeds limit: ${(file.size / 1024 / 1024).toFixed(1)}MB > 25MB`)
      const response = NextResponse.json(
        { 
          error: "File too large",
          details: `Maximum file size is 25MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`
        },
        { status: 400 }
      )
      console.log('Sending file size error response:', { 
        status: 400, 
        headers: Object.fromEntries(response.headers.entries()),
        body: { 
          error: "File too large",
          details: `Maximum file size is 25MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`
        }
      })
      return response
    }

    try {
      // Whisper API supports both audio and video files
      console.log("Calling OpenAI Whisper API...")
      
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        response_format: "verbose_json", // Get more detailed response
      })
      
      console.log("Transcription successful!")
      
      // Extract additional metadata if available
      const response = transcription as any; // Type assertion for verbose response
      
      return NextResponse.json({
        success: true,
        transcription: {
          text: response.text || "No transcription available",
          language: response.language || undefined,
          duration: response.duration || undefined,
          segments: response.segments || [], // Detailed timing information
        },
        fileInfo: {
          name: file.name,
          type: file.type,
          size: file.size,
          isVideo: isVideo
        }
      })
    } catch (transcriptionError: any) {
      console.error("Transcription error:", transcriptionError)
      console.error("Error type:", transcriptionError.constructor.name)
      console.error("Error message:", transcriptionError.message)
      
      // Check if it's an authentication error
      if (transcriptionError.status === 401) {
        return NextResponse.json(
          { 
            error: "Invalid OpenAI API key",
            details: "Please check your OPENAI_API_KEY in the .env file"
          },
          { status: 401 }
        )
      }
      
      // Check if it's a file format error
      if (transcriptionError.message?.includes("format")) {
        return NextResponse.json(
          { 
            error: "Unsupported file format",
            details: "Please upload a supported audio or video format (MP3, MP4, MOV, etc.)"
          },
          { status: 400 }
        )
      }
      
      // Check for connection errors
      if (transcriptionError.code === 'ECONNRESET' || 
          transcriptionError.code === 'ECONNREFUSED' ||
          transcriptionError.message?.includes("Connection error") ||
          transcriptionError.message?.includes("ECONNRESET")) {
        return NextResponse.json(
          { 
            error: "Connection error",
            details: "Failed to connect to OpenAI transcription service. This may be due to network issues or service unavailability. Please try again later."
          },
          { status: 503 }
        )
      }
      
      // Check for timeout errors
      if (transcriptionError.code === 'ETIMEDOUT' || 
          transcriptionError.message?.includes("timeout")) {
        return NextResponse.json(
          { 
            error: "Request timeout",
            details: "The transcription request timed out. This may happen with large files or slow connections. Please try again."
          },
          { status: 504 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "Failed to transcribe media",
          details: transcriptionError.message || "Unknown error"
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("General error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}
