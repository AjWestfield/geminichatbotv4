# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
npm run dev        # Start development server on http://localhost:3000

# Production
npm run build      # Build for production
npm run start      # Start production server

# Code Quality
npm run lint       # Run Next.js linter

# API Key Verification
npm run check-api-keys  # Check which API keys are configured
npm run check-env      # Direct environment check

# MCP Setup
npm run setup-mcp-example  # Set up the example calculator MCP server

# Testing (various image generation tests)
npm run test-wavespeed
npm run test-wavespeed-params
npm run test-image-edit
npm run test-simple-edit
npm run test-openai-edit
npm run test-gpt-image-1

# E2E Testing
npm run test:e2e          # Run Playwright tests
npm run test:e2e:ui       # Run tests with UI
npm run test:e2e:debug    # Debug tests

# Shell Script Tests (for specific features)
./test-image-generation.sh
./test-quality-selection.sh
./test-model-selection.sh
./test-animation-fix.sh
./test-mcp-json-import.sh
./test-mcp-tools.sh      # Test MCP tool integration
./test-mcp-intelligence.sh # Test intelligent MCP context awareness
./test-github-intelligence.sh # Test GitHub repository analysis
```

Note: When installing dependencies, use `npm install --legacy-peer-deps` due to a date-fns version conflict with react-day-picker.

## Architecture Overview

This is a Next.js 15.2.4 multimodal AI chatbot with comprehensive support for text, images, audio, and video analysis, plus extensible tool support via MCP (Model Context Protocol) with intelligent context awareness.

### Core Layout

The application uses a three-panel layout implemented in `components/resizable-three-panels.tsx`:

- **Left Panel**: MCP servers management panel (collapsible)
- **Middle Panel**: Chat interface with streaming AI responses (360-800px)
- **Right Panel**: Canvas view with multi-tab content display

### Key Architectural Decisions

1. **Client-side rendering** for all interactive components using "use client" directive
2. **Local state management** - no global state management library, chat state managed via Vercel AI SDK's useChat hook
3. **Multiple AI providers**:
   - Google Gemini (2.5 Flash/Pro, 2.0 Flash) for text and visual analysis
   - OpenAI Whisper for audio/video transcription
   - OpenAI GPT-Image-1 for image editing (HD quality)
   - WaveSpeed Flux for image generation (standard quality)
4. **Dark-first design** with next-themes for theme switching
5. **Custom resizable panels** implementation (not using react-resizable-panels despite being installed)
6. **Token limits**: 8192 for video analysis, 4096 for general content

### MCP (Model Context Protocol) Architecture

The application includes a full MCP implementation for extensible tool support:

- **MCP Client** (`lib/mcp/mcp-client.ts`): Stdio-based communication with MCP servers using StdioClientTransport
- **Server Manager** (`lib/mcp/mcp-server-manager.ts`): Lifecycle management for multiple servers
- **Config Manager** (`lib/mcp/mcp-config-manager.ts`): Persistent storage in localStorage
- **JSON Parser** (`lib/mcp/mcp-json-parser.ts`): Intelligent parser supporting multiple MCP config formats
- **Tools Context** (`lib/mcp/mcp-tools-context.ts`): Generates system prompts with available tools

MCP tool calls are embedded in chat messages using `[TOOL_CALL]` markers. The chat API automatically detects these markers, executes the tools, and streams results back to the user.

**Supported MCP Configuration Formats:**
- Claude Desktop: `{"mcpServers": {"name": {...}}}`
- HTTP servers: `{"mcpServers": {"name": {"url": "...", "apiKey": "...", "transportType": "http"}}}`
- Simple array: `[{"name": "...", "command": "..."}]`
- NPX shorthand: `{"name": "package-name"}`

**Transport Types:**
- **stdio**: Local processes using stdin/stdout (default)
- **http**: Remote servers via HTTP streaming (e.g., Smithery CLI)

**Recent Fixes:** 
1. StdioClientTransport now handles process spawning internally
2. Added StreamableHTTPClientTransport support for HTTP-based MCP servers like Smithery CLI
3. Just-in-time MCP connection - servers connect automatically when tools are requested
4. Enhanced system prompt to make AI more aware of available tools and encourage their usage
5. Fixed state persistence issue between API calls by using on-demand connections
6. Fixed server name mismatch in tool calls - system prompt now correctly identifies server names
7. Fixed premature tool call parsing - waits for complete `[TOOL_CALL]...[/TOOL_CALL]` before execution
8. Added intelligent MCP context awareness - automatic JSON correction, natural language server addition, smart discovery

**MCP Tool Enhancements:**
1. **Animation System**: Loading animations during tool execution with tool/server info
2. **Collapsible Results**: Tool results displayed in expandable/collapsible UI components
3. **AI Analysis**: Automatic analysis of tool results with insights and recommendations
4. **Enhanced UX**: Professional animations, copy buttons, timestamps, and result previews

**Intelligent MCP Context Awareness:**
- **JSON Correction**: Automatically fixes malformed MCP server configurations
- **Natural Language**: Add servers using commands like "add the filesystem MCP server"
- **Smart Discovery**: Uses context7/exa to find configurations for unknown servers
- **Format Detection**: Supports Claude Desktop, HTTP, array, and NPX shorthand formats
- **Chat Integration**: Detects MCP requests in chat and handles them intelligently
- **GitHub Intelligence**: Analyzes GitHub repositories to extract MCP configurations
  - Paste any GitHub URL to automatically configure the MCP server
  - Fetches README and package.json for analysis
  - Uses AI to understand documentation and build configurations
  - Falls back to web search for additional information
- See `MCP_INTELLIGENT_CONTEXT.md` and `MCP_GITHUB_INTELLIGENCE.md` for detailed documentation

### Component Structure

- `/components/` - Main application components
  - `chat-interface.tsx` - Core chat UI with file upload and MCP integration
  - `chat-message.tsx` - Message rendering with media previews and tool results
  - `resizable-three-panels.tsx` - Three-panel layout implementation
  - `canvas-view.tsx` - Multi-tab content display (preview, code, browser, video, audio, images, docs)
  - `agent-task-view.tsx` - Modal for AI agent task progress visualization
  - `image-gallery.tsx` - Generated images gallery with filters
  - `settings-dialog.tsx` - Centralized settings with model selection and MCP config
- `/components/ui/` - Atomic UI components following shadcn/ui pattern (Radix UI + Tailwind)
  - `agent-plan.tsx` - Sophisticated task planning UI with hierarchical structure
- `/components/mcp/` - MCP-specific components
  - `mcp-panel.tsx` - Main MCP management interface
  - `mcp-server-list.tsx` - Server display and management
  - `mcp-tools-panel.tsx` - Available tools display and execution
  - `mcp-tool-animation.tsx` - Loading animation during tool execution
  - `mcp-tool-result.tsx` - Collapsible tool result display
- All UI components use Radix UI primitives with Tailwind styling
- Animations via Framer Motion (sidebar hover, loading states, task transitions)

### API Routes

- `/api/chat/route.ts` - Main chat endpoint with streaming support and MCP integration
- `/api/upload/route.ts` - File upload to Google Gemini
- `/api/transcribe/route.ts` - Audio/video transcription via Whisper
- `/api/generate-image/route.ts` - Image generation via WaveSpeed
- `/api/edit-image/route.ts` - Image editing via GPT-Image-1
- `/api/mcp/init/route.ts` - Initialize MCP system
- `/api/mcp/servers/route.ts` - Manage server configurations
- `/api/mcp/servers/[serverId]/connect/route.ts` - Connect to specific servers
- `/api/mcp/tools/route.ts` - Execute MCP tools

### Important Implementation Details

- Chat functionality uses Vercel AI SDK's `useChat` hook for streaming responses
- Form handling with React Hook Form + Zod validation
- Toast notifications via Sonner
- Custom hooks in `/hooks/` for reusable logic (mobile detection, toast)
- MCP hooks in `/hooks/mcp/` for server and tool management
- `use-chat-with-tools.ts` - Enhanced chat hook with MCP tool integration
- ESLint and TypeScript errors are ignored in build configuration
- Video processing includes automatic thumbnail generation at 2-second mark
- Audio transcription has a 25MB file size limit
- The body element requires `suppressHydrationWarning` due to browser extensions
- MCP configurations are stored in localStorage with automatic migration
- Example MCP server (calculator) included in `example-servers/calculator/`

### Environment Variables

Required:
- `GEMINI_API_KEY` - Google Gemini API key

Optional:
- `OPENAI_API_KEY` - For audio/video transcription and image editing
- `WAVESPEED_API_KEY` - For image generation
- `XAI_API_KEY`, `OPENROUTER_API_KEY` - Additional AI services
- `TAVILY_API_KEY` - Web search tool
- `ANTHROPIC_API_KEY`, `REPLICATE_API_KEY` - Additional AI providers
- `BLOB_READ_WRITE_TOKEN` - Vercel blob storage
- `SUPABASE_URL`, `SUPABASE_API_KEY` - Database (if using Supabase)
- `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` - PostgreSQL configuration
- `REDIS_URL` - Redis cache
- `AUTH_SECRET` - Required for production deployments

### File References

- Main entry: `app/page.tsx`
- Chat API: `app/api/chat/route.ts`
- Core layout: `components/resizable-three-panels.tsx`
- Chat logic: `components/chat-interface.tsx`
- MCP integration: `lib/mcp/mcp-server-manager.ts`
- MCP intelligence: `lib/mcp/mcp-server-intelligence.ts`
- MCP GitHub prompts: `lib/mcp/mcp-github-prompts.ts`
- MCP analysis API: `app/api/mcp/analyze/route.ts`
- MCP GitHub API: `app/api/mcp/github-analyze/route.ts`
- Agent task system: `components/agent-task-view.tsx`
- Image utilities: `lib/image-utils.ts`
- Video utilities: `lib/video-utils.ts`
- WaveSpeed client: `lib/wavespeed-client.ts`
- OpenAI image client: `lib/openai-image-client.ts`