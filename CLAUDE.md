# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Development:**
```bash
npm run dev               # Start development server (http://localhost:3000)
npm run build             # Build for production
npm start                 # Start production server
npm run lint              # Run ESLint
npx tsc --noEmit          # Run TypeScript compiler check
```

**Testing:**
```bash
npm run test:e2e          # Run Playwright E2E tests (port 3003)
npm run test:e2e:ui       # Run tests with UI
npm run test:e2e:debug    # Debug tests
npm run test:e2e:report   # View test report
npx playwright test tests/e2e/mcp-servers.spec.ts  # Run specific test
npx playwright test --project=chromium              # Run with specific browser
```

**Utilities:**
```bash
npm run check-env         # Verify environment variables
npm run check-api-keys    # Check API key validity
npm run setup-mcp-example # Set up example MCP server
npm run setup-persistence # Set up database persistence
npm run mcp:calculator    # Run example calculator MCP server
```

**Project Setup:**
```bash
npm install               # Install all dependencies
cp .env.example .env.local   # Copy environment template
node setup-persistence.js    # Initialize database (if using persistence)
```

## Architecture Overview

This is a Next.js 15 multimodal AI chatbot with a three-panel layout: MCP tools panel, chat interface, and canvas view for images/videos.

**Core Architecture:**
- **API Routes** (`/app/api/`): Handle chat streaming, MCP operations, image/video generation, file uploads, and persistence
- **MCP Integration** (`/lib/mcp/`): Model Context Protocol enables extensible tool system with stdio/HTTP transports
- **Multi-Model Support**: Gemini (2.5 Flash/Pro Preview, 2.0 Flash Exp), Claude 3.5 Sonnet, OpenAI GPT-Image-1, WaveSpeed AI, and Replicate
- **Real-time Streaming**: Server-Sent Events in AI SDK format (`0:"content"`, `d:{"finishReason":"stop"}`)
- **Persistence Layer**: Supabase for chat/message storage, Vercel Blob for files, LocalStorage fallback

**Key Patterns:**
- Component-based UI with shadcn/ui
- Custom hooks for state management (`useChatWithTools`, `useMCPState`, `useChatPersistence`)
- Service clients for external APIs (`/lib/*-client.ts`)
- Zustand store for video progress tracking
- Agentic workflow with todo-based task execution

## Critical Implementation Details

**MCP Tool System:**
- Tools discovered dynamically from connected servers via `listTools()`
- Execution flow: user request → tool analysis → execution → result display
- GitHub repository analysis uses `MCPServerIntelligence` for natural language processing
- Visual feedback: analyzing (pulse), executing (spin), completed (checkmark)
- Agentic mode: Multi-step tasks with todo tracking and plan visualization

**Image Generation:**
- Dual quality: HD (GPT-Image-1, requires org), Standard (WaveSpeed Flux)
- Progress tracking with placeholder images and real-time updates
- Gallery persisted in LocalStorage with automatic cleanup on quota errors
- Image editing via GPT-Image-1 inpainting API
- Aspect ratio auto-detection for uploaded images
- Support for image-to-video conversion via Kling

**Video Generation:**
- Replicate API with Kling v1.5/1.6 models
- CRITICAL: Include `[VIDEO_GENERATION_STARTED]` marker in streaming responses
- Progress polling every 5 seconds (generation takes 3-8 minutes)
- Videos expire after 24 hours from Replicate CDN
- Auto-switches to Video tab when marker detected

**File Handling:**
- Images: Analysis with Gemini vision, editing, animation, persistence to Blob storage
- Audio: Whisper transcription with timestamp extraction and tabbed preview
- Video: Frame extraction at 1fps for analysis, upload progress tracking
- HEIC files automatically converted to JPEG for browser display
- Files uploaded to Google AI File Manager before use
- Multiple file support with batch upload and progress tracking

**Streaming Format:**
- Uses AI SDK compatible SSE format
- Special data injection for video/image generation between markers
- Error handling with `3:"error message"` format
- Tool execution status updates inline
- Infinite loop prevention with processing refs

## Required Configuration

**Essential Environment Variables:**
```
GEMINI_API_KEY           # Core functionality (required)
OPENAI_API_KEY          # GPT-Image-1 and Whisper transcription
ANTHROPIC_API_KEY       # Claude 3.5 Sonnet
REPLICATE_API_KEY       # Video generation
TAVILY_API_KEY          # Web search
WAVESPEED_API_KEY       # WaveSpeed Flux image generation

# Optional Persistence
SUPABASE_URL            # Database URL
SUPABASE_ANON_KEY       # Database public key
BLOB_READ_WRITE_TOKEN   # Vercel Blob storage
```

**MCP Configuration:**
- Servers in `mcp.config.json` with command, args, and optional env
- Environment variable substitution supported
- Natural language server management (e.g., "add filesystem server")

## Model-Specific Implementations

**Claude Integration:**
- Separate handler at `/app/api/chat/claude-handler.ts`
- Full MCP tool support with enhanced instructions
- Model ID: `claude-3-5-sonnet-20241022`
- Agentic workflow with todo management
- Enhanced JSON output handling with strict formatting rules

**Gemini Models:**
- Use Google Generative AI SDK
- Support function calling for MCP tools
- File attachments via Google AI File Manager
- Model switching between 2.5 and 2.0 versions

## Critical Build Configuration

**Important:** This project has TypeScript and ESLint errors intentionally ignored in `next.config.mjs`:
```javascript
eslint: { ignoreDuringBuilds: true }
typescript: { ignoreBuildErrors: true }
```
Always check console for runtime errors even if build succeeds.

## Key Files for Understanding

- `/app/page.tsx`: Main app component with state orchestration
- `/components/chat-interface.tsx`: Core chat UI logic
- `/hooks/use-chat-with-tools.ts`: Stream parsing & tool handling
- `/lib/mcp/mcp-client.ts`: MCP protocol implementation
- `/lib/claude-streaming-handler.ts`: Claude-specific streaming logic
- `/lib/database/schema.sql`: Database structure for persistence

## Development Tips

- Build errors ignored in `next.config.mjs` - check console for runtime issues
- MCP server logs available in browser console when debugging
- Test video generation with shorter prompts to reduce wait times
- Image generation fallback to WaveSpeed when OpenAI fails
- Tool execution monitoring in `/components/mcp-tool-result.tsx`
- Stream parsing logic in `/hooks/use-chat-with-tools.ts`
- Video progress state in `/lib/stores/video-progress-store.ts`
- Chat persistence logic in `/hooks/use-chat-persistence.ts`

## Common Debugging Scripts

The codebase includes numerous debugging scripts:
- `debug-*.js` - JavaScript debugging for specific features
- `test-*.sh` - Shell scripts for testing functionality
- `fix-*.sh` - Quick fix scripts for common issues
- `verify-*.js` - Verification scripts for API integrations