# Gemini Chatbot v3 🚀

A next-generation multimodal AI chatbot with advanced MCP (Model Context Protocol) integration, intelligent tool execution, and comprehensive media support powered by Google Gemini, GPT-Image-1, and WaveSpeed AI.

![Gemini Chatbot v3](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-green?style=for-the-badge)

## ✨ Features

### 🤖 AI Chat
- **Multiple Gemini Models**: Gemini 2.5 Flash, Gemini Pro, Gemini 2.0 Flash
- **Real-time Streaming**: Smooth, responsive chat experience with tool execution
- **File Attachments**: Support for images, PDFs, documents, audio, and video
- **Smart Context**: Maintains conversation history with MCP tool awareness

### 🔧 MCP (Model Context Protocol) Integration
- **Extensible Tool System**: Connect any MCP-compatible server
- **Intelligent Context**: AI automatically uses available tools
- **Multiple Transports**: stdio and HTTP transport support
- **Smart Discovery**: Natural language server addition with AI assistance
- **GitHub Intelligence**: Automatic MCP configuration from GitHub repos
- **Visual Feedback**: Tool execution animations and result displays

### 🎨 Image Generation
- **Dual Model System**:
  - **HD Quality**: GPT-Image-1 for photorealistic, detailed images
  - **Standard Quality**: WaveSpeed AI (Flux Dev Ultra Fast) for quick generation
- **Advanced Features**:
  - Image editing capabilities
  - Gallery view with search and filtering
  - Download and management tools
  - Smart storage management
  - Real-time generation progress

### 📱 Multimodal Support
- **Image Analysis**: Upload and analyze images with AI
- **Audio Transcription**: Automatic transcription via Whisper with timestamps
- **Video Analysis**: Full video analysis with transcription and thumbnails
- **Document Processing**: PDF and document analysis
- **Enhanced File Preview**: Modal with transcription tabs and segments

### 🎯 UI/UX Improvements
- **Three-Panel Layout**: MCP panel, chat interface, and canvas view
- **Resizable Panels**: Adjustable panels for optimal workflow
- **Dark Theme**: Modern, eye-friendly interface
- **Toast Notifications**: Visual feedback for all actions
- **Progress Tracking**: Real-time upload and generation progress
- **Responsive Design**: Works seamlessly on all devices
- **Professional Animations**: Smooth transitions and loading states

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- API keys for various services

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ajwestfield/geminichatbotv3.git
cd geminichatbotv3
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Image Generation
OPENAI_API_KEY=your_openai_api_key
WAVESPEED_API_KEY=your_wavespeed_api_key

# Optional Services
ANTHROPIC_API_KEY=your_anthropic_api_key
REPLICATE_API_KEY=your_replicate_api_key
TAVILY_API_KEY=your_tavily_api_key

# Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Database (optional)
POSTGRES_URL=your_postgres_url
REDIS_URL=your_redis_url
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **AI Models**: 
  - Google Gemini (2.5 Flash, Pro, 2.0 Flash)
  - OpenAI GPT-Image-1
  - WaveSpeed AI (Flux Dev)
  - OpenAI Whisper (Audio transcription)
- **Protocols**: MCP (Model Context Protocol)
- **State Management**: React Hooks + Context
- **Animation**: Framer Motion
- **Storage**: LocalStorage with smart quota management
- **Real-time**: Server-Sent Events for streaming

## 📊 Model Comparison

| Feature | GPT-Image-1 (HD) | WaveSpeed AI (Standard) |
|---------|-----------------|------------------------|
| Quality | Photorealistic, detailed | Good quality, fast |
| Speed | 30-45 seconds | 3-5 seconds |
| Text Rendering | Excellent | Good |
| Best For | Professional work, text | Quick iterations |

## 🔧 Key Improvements in v3

### MCP Integration
- ✅ Full Model Context Protocol support
- ✅ Intelligent tool discovery and execution
- ✅ GitHub repository analysis for auto-configuration
- ✅ Natural language server management
- ✅ Visual tool execution feedback

### Performance
- ✅ Optimized localStorage management (auto-cleanup, size limits)
- ✅ Efficient image gallery with lazy loading
- ✅ Smart caching strategies
- ✅ Just-in-time MCP connections

### Reliability
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Automatic fallback systems
- ✅ Graceful degradation
- ✅ Connection retry logic for all services

### User Experience
- ✅ Three-panel responsive layout
- ✅ Enhanced file preview with transcription tabs
- ✅ Professional animations and transitions
- ✅ Toast notifications for all actions
- ✅ Real-time progress indicators

### Code Quality
- ✅ TypeScript throughout
- ✅ Clean component architecture
- ✅ Comprehensive error boundaries
- ✅ Proper state management
- ✅ Modular MCP system

## 📝 Usage Examples

### Chat with Gemini
```
"Explain quantum computing in simple terms"
"Write a Python script to analyze CSV files"
"Help me plan a trip to Japan"
```

### Generate Images
**HD Quality (GPT-Image-1)**:
```
"Create a photorealistic portrait of a cyberpunk astronaut"
"Design a modern logo with the text 'FUTURE TECH'"
```

**Standard Quality (WaveSpeed)**:
```
"Simple cartoon cat illustration"
"Abstract geometric pattern"
```

### Use MCP Tools
```
"Use the weather tool to check the forecast for San Francisco"
"Search the web for the latest AI news"
"Calculate the compound interest on $10,000 at 5% for 10 years"
```

### Add MCP Servers
```
"Add the filesystem MCP server"
"Add MCP server from https://github.com/owner/repo"
"Connect to the sequential thinking server"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini team for the amazing AI models
- OpenAI for GPT-Image-1
- WaveSpeed AI for fast image generation
- shadcn/ui for the beautiful components
- All contributors and testers

## 📧 Contact

Anderson Westfield - [@ajwestfield](https://github.com/ajwestfield)

Project Link: [https://github.com/ajwestfield/geminichatbotv3](https://github.com/ajwestfield/geminichatbotv3)

---

Built with ❤️ by Anderson Westfield
