"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import ChatInterface from "@/components/chat-interface"
import CanvasView from "@/components/canvas-view"
import ResizablePanels from "@/components/resizable-panels"
import { GeneratedImage } from "@/lib/image-utils"
import { useMCPInitialization } from "@/hooks/use-mcp-initialization"

export default function Home() {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [activeCanvasTab, setActiveCanvasTab] = useState("preview")
  
  // Initialize MCP state once at the app root
  useMCPInitialization()
  
  return (
    <main className="h-screen bg-[#1E1E1E]">
      <AppSidebar />
      <div className="pl-[3.05rem] transition-all duration-200 h-full">
        <ResizablePanels
          leftPanel={
            <ChatInterface 
              onGeneratedImagesChange={setGeneratedImages}
              onImageGenerationStart={() => setActiveCanvasTab("images")}
            />
          }
          rightPanel={
            <CanvasView 
              generatedImages={generatedImages} 
              onImagesChange={setGeneratedImages}
              activeTab={activeCanvasTab}
              onTabChange={setActiveCanvasTab}
            />
          }
          defaultLeftWidth={600}
          minLeftWidth={360}
          maxLeftWidth={800}
        />
      </div>
    </main>
  )
}
