# Gemini Chatbot v4

A powerful, feature-rich AI chatbot application with advanced image and video generation capabilities, persistence, and multi-modal support.

## 🚀 Key Features

### 💬 Chat Capabilities
- **Multi-Model Support**: Gemini, GPT-4, Claude, and more
- **Real-time Streaming**: Smooth, responsive chat experience
- **Chat Persistence**: Save and reload conversations with Supabase
- **File Uploads**: Support for images, PDFs, and documents
- **Voice Input**: Built-in speech-to-text functionality

### 🎨 Image Generation & Editing
- **Multiple Image Models**: DALL-E 3, Recraft V3, Ideogram, and more
- **Advanced Editing**: Edit uploaded and generated images
- **HEIC Support**: Automatic conversion of HEIC images to JPEG
- **Aspect Ratio Detection**: Automatic and manual aspect ratio options
- **Background Generation**: AI-powered background creation for images
- **Persistent Storage**: Images saved to Vercel Blob Storage
- **Fixed Deletion**: Deleted images now stay deleted after refresh

### 🎬 Video Generation
- **Kling Video Integration**: Generate videos from images
- **Multiple Quality Options**: Standard and Pro quality settings
- **Progress Tracking**: Real-time video generation status
- **Video Gallery**: Organized view of all generated videos
- **Persistence**: Videos saved to database and storage

### 🔧 Advanced Features
- **MCP (Model Context Protocol) Integration**: 
  - GitHub integration for code analysis
  - Web search capabilities with Tavily
  - File system access via Desktop Commander
  - Sequential thinking for complex tasks
- **Enhanced Search**: AI-powered search across chats
- **Tool Usage Tracking**: Monitor AI tool usage in real-time
- **Auto-save**: Automatic saving of chats and media

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/ajwestfield/geminichatbotv4.git
cd geminichatbotv4
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Configure your API keys in `.env.local`**
```env
# Required
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Optional but recommended
ANTHROPIC_API_KEY=your_claude_key
REPLICATE_API_KEY=your_replicate_key
TAVILY_API_KEY=your_tavily_key

# For persistence (optional)
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

5. **Set up database (optional)**
```bash
node setup-persistence.js
```

6. **Run the development server**
```bash
npm run dev
```

## 📊 Database Setup

If you want to enable persistence:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `DATABASE_SETUP.sql`
3. Add your Supabase credentials to `.env.local`
4. Create a Vercel Blob store for image storage
5. Run `node setup-persistence.js` to verify configuration

## 🎯 Recent Updates (v4)

### Image Management Improvements
- ✅ Fixed image deletion persistence - deleted images no longer reappear
- ✅ Automatic localStorage cleanup when persistence is enabled
- ✅ Database as source of truth for image storage
- ✅ Enhanced image editing with background generation
- ✅ HEIC to JPEG conversion support

### Video Generation
- ✅ Kling AI video generation from images
- ✅ Real-time progress tracking
- ✅ Video persistence and gallery view
- ✅ Quality selection (Standard/Pro)

### UI/UX Enhancements
- ✅ Auto-detection of image aspect ratios
- ✅ Inline image options for quick actions
- ✅ Improved error handling and user feedback
- ✅ Enhanced search functionality
- ✅ Better file upload experience

### Technical Improvements
- ✅ Fixed infinite loop issues
- ✅ Improved streaming performance
- ✅ Better error handling for quota limits
- ✅ Enhanced MCP tool integration
- ✅ Optimized localStorage usage

## 🤝 MCP (Model Context Protocol) Setup

To enable MCP features:

1. Edit `mcp.config.json` with your server configurations
2. Available servers:
   - GitHub integration for code analysis
   - Web search via Tavily
   - Desktop Commander for file access
   - Sequential thinking for complex reasoning

## 🎨 Image Models Available

- **DALL-E 3**: High-quality, creative images
- **Recraft V3**: Artistic and stylized images
- **Ideogram**: Text-accurate image generation
- **Flux Schnell**: Fast, efficient generation
- **Flux Pro**: Professional quality images
- **Stable Diffusion XL**: Open-source alternative

## 🔐 Security Notes

- API keys are stored locally in `.env.local`
- Never commit your `.env.local` file
- Use environment variables for production
- Enable RLS (Row Level Security) in Supabase

## 📝 Usage Tips

1. **Chat Persistence**: Click on any chat in the sidebar to reload it
2. **Image Editing**: Click the edit button on any image
3. **Video Generation**: Use the "Animate" button on images
4. **Search**: Use the search box to find past conversations
5. **Tool Usage**: Watch the tool indicator to see AI reasoning

## 🐛 Troubleshooting

### Images not persisting?
- Check your Supabase and Blob Storage credentials
- Run `node verify-persistence.js` to test configuration

### HEIC images not displaying?
- The app automatically converts HEIC to JPEG
- Check the console for conversion errors

### Videos stuck in processing?
- Check your Replicate API key
- Verify you have credits available

## 🚧 Known Issues

- Large file uploads may be slow
- Some video generations may timeout
- Search results are limited to recent chats

## 🤖 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with Next.js 14 and React
- UI components from shadcn/ui
- Powered by various AI APIs
- MCP protocol by Anthropic

---

**Latest Update**: June 4, 2025 - Fixed image deletion persistence issue
