# Gemini Chatbot v4

An advanced AI chatbot application featuring multi-model support, image and video generation, file handling, and persistent storage.

## 🚀 Features

### 💬 AI Chat Models
- **Gemini 2.5 Flash** (default) - Fast and efficient conversations
- **Gemini 2.0 Flash** - Alternative Gemini model
- **Claude Support** - Interface for Claude models (requires Anthropic API key)

### 🎨 Image Generation
- **GPT-Image-1** (HD Quality)
  - High-quality image generation
  - Accurate text rendering
  - Requires OpenAI API key
- **WaveSpeed Flux Dev Ultra Fast** (Standard Quality)
  - Fast generation in seconds
  - Good quality results
  - Requires WaveSpeed API key

### ✏️ Image Editing
- Edit both generated and uploaded images
- Powered by GPT-Image-1
- Background generation capabilities
- Automatic aspect ratio detection

### 🎬 Video Generation
- **Kling v1.6 Models** via Replicate
  - Standard quality (5-10 second videos)
  - Pro quality (higher resolution)
- Generate videos from text prompts
- Image-to-video animation
- Real-time progress tracking

### 📁 File Support
**Images:**
- JPEG, PNG, WebP, AVIF
- HEIC/HEIF with automatic JPEG conversion
- Multi-file upload support

**Audio:**
- MP3, WAV, WEBM, MP4, M4A
- Automatic transcription via OpenAI Whisper
- Support for voice messages

**Video:**
- MP4, MOV, AVI, FLV, WEBM, WMV, 3GPP, QuickTime
- Video preview and playback

### 🔍 Advanced Features
- **Web Search Integration** - Powered by Tavily API
- **Chat Persistence** - Save conversations with Supabase
- **Cloud Storage** - Images and videos stored in Vercel Blob
- **MCP (Model Context Protocol)** - Extensible tool system
- **Canvas View** - Tabs for Preview, Code, Browser, Video, Audio, Images, and Docs

### 🛠️ Recent Updates (v4)
- ✅ Fixed image deletion persistence - deleted images stay deleted
- ✅ Automatic localStorage cleanup for better performance
- ✅ Enhanced image editing with background generation
- ✅ HEIC to JPEG auto-conversion
- ✅ Multi-file upload support
- ✅ Improved error handling and user feedback

## 📋 Requirements

### Required API Keys
```env
GEMINI_API_KEY=your_gemini_api_key        # Required for chat
```

### Optional API Keys
```env
OPENAI_API_KEY=your_openai_api_key        # For GPT-Image-1 and transcription
WAVESPEED_API_KEY=your_wavespeed_key      # For Flux image generation
ANTHROPIC_API_KEY=your_claude_api_key     # For Claude models
REPLICATE_API_KEY=your_replicate_key      # For video generation
TAVILY_API_KEY=your_tavily_api_key        # For web search
```

### Storage & Database (Optional)
```env
SUPABASE_URL=your_supabase_url            # For chat persistence
SUPABASE_API_KEY=your_supabase_anon_key   # For chat persistence
BLOB_READ_WRITE_TOKEN=your_vercel_token   # For image/video storage
```

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/ajwestfield/geminichatbotv4.git
cd geminichatbotv4
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Add your API keys to `.env.local`**
At minimum, you need:
- `GEMINI_API_KEY` for chat functionality

5. **Run the development server**
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting!

## 💾 Database Setup (Optional)

To enable chat persistence and history:

1. Create a [Supabase](https://supabase.com) project
2. Run the SQL schema from `DATABASE_SETUP.sql` in your Supabase SQL editor
3. Add your Supabase credentials to `.env.local`
4. Create a [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store for media storage
5. Run the setup script:
```bash
node setup-persistence.js
```

## 🎯 Usage Guide

### Image Generation
1. Type your prompt in the chat
2. Click the image icon or use natural language
3. Choose between HD (GPT-Image-1) or Standard (Flux) quality in settings
4. Images appear in the Images tab

### Video Generation
1. Generate or upload an image
2. Click the "Animate" button on any image
3. Choose video settings (duration, aspect ratio)
4. Monitor progress in real-time

### File Uploads
- Drag and drop files into the chat
- Supports multiple files at once
- HEIC images automatically convert to JPEG
- Audio files are transcribed automatically

### MCP Tools
1. Configure MCP servers in Settings → MCP tab
2. Available tool types:
   - File system access
   - GitHub integration
   - Database connections
   - Custom tools

## 🔧 Configuration

### Image Generation Settings
- **Quality**: HD (GPT-Image-1) or Standard (Flux)
- **Style**: Vivid or Natural
- **Size**: Square, Landscape, or Portrait
- **Auto-detect aspect ratio**: Automatic size selection based on prompts

### Video Generation Settings
- **Model**: Standard or Pro
- **Duration**: 5 or 10 seconds
- **Aspect Ratio**: 16:9, 9:16, or 1:1

## 🐛 Troubleshooting

### Images not generating?
- Check your API keys (OpenAI for HD, WaveSpeed for standard)
- Verify you have credits/quota available
- Check browser console for specific errors

### HEIC files not converting?
- Ensure the file is under 50MB
- Check server logs for conversion errors
- Try uploading the file again

### Videos stuck processing?
- Verify your Replicate API key
- Check you have available credits
- Video generation can take 2-5 minutes

### Chat history not saving?
- Verify Supabase credentials
- Run `node verify-persistence.js`
- Check database connection

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [Next.js 14](https://nextjs.org/) and React
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI integrations: Google (Gemini), OpenAI, Anthropic, Replicate
- Storage: Vercel Blob, Supabase
- Search: Tavily API

---

**Latest Update**: June 4, 2025 - Fixed image deletion persistence, enhanced features
