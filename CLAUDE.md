# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Development:**
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

**Testing:**
```bash
npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:ui       # Run tests with UI
npm run test:e2e:debug    # Debug tests
```

**Utilities:**
```bash
npm run check-env         # Verify environment variables
npm run check-api-keys    # Check API key validity
npm run setup-mcp-example # Set up example MCP server
```

## Architecture Overview

This is a Next.js 15 application with a three-panel layout: MCP tools panel, chat interface, and canvas view for images.

**Core Architecture:**
- **API Routes** (`/app/api/`): Handle chat streaming, MCP operations, image generation, and file uploads
- **MCP Integration** (`/lib/mcp/`): Manages Model Context Protocol servers for extensible tool system
- **Multi-Model Support**: Integrates Google Gemini, Claude Sonnet 4, OpenAI GPT-Image-1, and WaveSpeed AI
- **Real-time Streaming**: Uses Server-Sent Events for chat responses and tool execution

**Key Patterns:**
- Component-based UI with shadcn/ui
- Custom hooks for state management
- Service clients for external APIs
- LocalStorage for persistence with quota management

## Important Implementation Notes

**MCP Tool System:**
- Tools are discovered dynamically from connected servers
- Tool execution follows: user request → analysis → execution → result display
- GitHub repository analysis has special intelligence layer
- Visual feedback shows tool status (analyzing, executing, completed)

**Image Generation:**
- Dual quality system (HD uses GPT-Image-1, Standard uses WaveSpeed)
- Progress tracking with real-time updates
- Gallery management with edit capabilities
- Reveal animations for generated images

**File Handling:**
- Supports images, audio, video, PDFs, and documents
- Audio transcription includes timestamp extraction
- Video analysis with frame extraction
- Automatic format conversion when needed

**Error Handling:**
- Build errors are ignored in next.config.mjs
- Comprehensive try-catch blocks in API routes
- User-friendly error messages
- Fallback behaviors for failed operations

## Configuration

**Required Environment Variables:**
```
GOOGLE_AI_API_KEY         # For Gemini models
OPENAI_API_KEY           # For GPT-Image-1 and Whisper
ANTHROPIC_API_KEY        # For Claude Sonnet 4 chat model
```

**MCP Configuration:**
- Servers defined in `mcp.config.json`
- Each server has command, args, and optional env
- Tools discovered automatically on connection

## Claude Integration

**Model Selection**: Claude Sonnet 4 is available in the model dropdown alongside Gemini models
- Located in `/components/ui/animated-ai-input.tsx`
- Full MCP tool support when using Claude
- Streaming responses like Gemini

**Claude-specific files**:
- `/lib/claude-client.ts` - Claude SDK initialization and helpers
- `/lib/claude-streaming-handler.ts` - Streaming response handler
- `/app/api/chat/claude-handler.ts` - Main Claude request handler

## Development Tips

- When modifying chat flow, check `/app/api/chat/route.ts`
- Claude models are routed to a separate handler for optimal performance
- MCP-related changes often require updates to both server and client components
- Image generation logic split between `/lib/openai-image-client.ts` and `/lib/wavespeed-client.ts`
- Tool execution visualization in `/components/mcp-tool-result.tsx`
- Always test with actual MCP servers when making MCP changes