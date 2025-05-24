"use client"

import { AppSidebar } from "@/components/app-sidebar"
import ChatInterface from "@/components/chat-interface"
import CanvasView from "@/components/canvas-view"
import ResizablePanels from "@/components/resizable-panels"

export default function Home() {
  return (
    <main className="h-screen bg-[#1E1E1E]">
      <AppSidebar />
      <div className="pl-[3.05rem] transition-all duration-200 h-full">
        <ResizablePanels
          leftPanel={<ChatInterface />}
          rightPanel={<CanvasView />}
          defaultLeftWidth={600}
          minLeftWidth={360}
          maxLeftWidth={800}
        />
      </div>
    </main>
  )
}
