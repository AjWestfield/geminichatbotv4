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

# Testing (various image generation tests)
npm run test-wavespeed
npm run test-image-edit
npm run test-gpt-image-1
```

Note: When installing dependencies, use `npm install --legacy-peer-deps` due to a date-fns version conflict with react-day-picker.

## Architecture Overview

This is a Next.js 15.2.4 multimodal AI chatbot with comprehensive support for text, images, audio, and video analysis.

### Core Layout

The application uses a three-panel layout implemented in `components/resizable-panels.tsx`:

- **Collapsible Sidebar**: Project/chat history, user profile (3.05rem collapsed, 15rem expanded)
- **Chat Interface**: Resizable panel (360-800px) with streaming AI responses
- **Canvas View**: Multi-tab interface for different AI-generated content types

### Key Architectural Decisions

1. **Client-side rendering** for all interactive components using "use client" directive
2. **Local state management** - no global state management library, chat state managed via Vercel AI SDK's useChat hook
3. **Multiple AI providers**:
   - Google Gemini (2.5 Flash/Pro, 2.0 Flash) for text and visual analysis
   - OpenAI Whisper for audio/video transcription
   - OpenAI GPT-Image-1 for image editing
   - WaveSpeed Flux for image generation
4. **Dark-first design** with next-themes for theme switching
5. **Custom resizable panels** implementation (not using react-resizable-panels despite being installed)
6. **Token limits**: 8192 for video analysis, 4096 for general content

### Component Structure

- `/components/` - Main application components
  - `chat-interface.tsx` - Core chat UI with file upload support
  - `chat-message.tsx` - Individual message rendering with media previews
  - `resizable-panels.tsx` - Custom panel resize implementation
  - `image-gallery.tsx` - Generated images gallery with filters
  - `image-generation-settings.tsx` - Model and quality controls
- `/components/ui/` - Atomic UI components following shadcn/ui pattern (Radix UI + Tailwind)
- All UI components use Radix UI primitives with Tailwind styling
- Animations via Framer Motion (sidebar hover, loading states)

### API Routes

- `/api/chat/route.ts` - Main chat endpoint with streaming support
- `/api/upload/route.ts` - File upload to Google Gemini
- `/api/transcribe/route.ts` - Audio/video transcription via Whisper
- `/api/generate-image/route.ts` - Image generation via WaveSpeed
- `/api/edit-image/route.ts` - Image editing via GPT-Image-1

### Important Implementation Details

- Chat functionality uses Vercel AI SDK's `useChat` hook for streaming responses
- Form handling with React Hook Form + Zod validation
- Toast notifications via Sonner
- Custom hooks in `/hooks/` for reusable logic (mobile detection, toast)
- ESLint and TypeScript errors are ignored in build configuration
- Video processing includes automatic thumbnail generation at 2-second mark
- Audio transcription has a 25MB file size limit
- The body element requires `suppressHydrationWarning` due to browser extensions

### Environment Variables

Required:
- `GEMINI_API_KEY` - Google Gemini API key

Optional:
- `OPENAI_API_KEY` - For audio/video transcription and image editing
- `WAVESPEED_API_KEY` - For image generation

### File References

- Main entry: `app/page.tsx`
- Chat API: `app/api/chat/route.ts`
- Core layout: `components/resizable-panels.tsx`
- Chat logic: `components/chat-interface.tsx`
- Image utilities: `lib/image-utils.ts`
- Video utilities: `lib/video-utils.ts`