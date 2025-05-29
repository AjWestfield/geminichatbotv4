# Intelligent MCP Context Awareness

This document describes the intelligent MCP (Model Context Protocol) server management system that provides automatic configuration correction, natural language server addition, and smart server discovery.

## Features

### 1. Intelligent JSON Analysis & Correction

When users provide MCP server configuration JSON, the system:

- **Automatically detects format**: Claude Desktop, HTTP servers, simple arrays, NPX shorthand
- **Validates configuration**: Checks required fields, transport types, URLs
- **Auto-corrects common issues**:
  - Missing `https://` prefixes
  - Converting package names to NPX commands
  - Adding required transport type fields
  - Cleaning up malformed JSON using AI

#### Example:
```json
// User provides:
{
  "name": "filesystem",
  "command": "npx"
}

// System corrects to:
{
  "name": "filesystem",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem"],
  "transportType": "stdio"
}
```

### 2. Natural Language Server Addition

Users can add servers using natural language:

- "Add the filesystem MCP server"
- "Install the github server for me"
- "Setup context7 MCP server"

The system will:
1. Detect the intent and server name
2. Search known configurations
3. Use context7/exa to find unknown servers
4. Automatically add and configure the server

### 3. Chat Integration

In the chat interface, the system detects MCP-related requests:

- JSON configuration blocks are automatically analyzed
- Natural language requests trigger server searches
- Malformed configs are corrected and applied
- Success/failure feedback is provided

### 4. Smart Server Discovery

For unknown servers, the system:
1. Searches using available MCP tools (context7, exa)
2. Extracts configuration from search results
3. Infers configuration from naming patterns
4. Provides confidence scores for suggestions

## Usage Examples

### Adding Server via JSON in Chat:

```
User: Here's my MCP server config:
{
  "name": "github",
  "env": {"GITHUB_TOKEN": "ghp_xxx"}
}

AI: I've analyzed and added the following MCP server: github. 
Notes: Added default command for github server. 
The server is now available for use. Would you like me to test it or show you what tools it provides?
```

### Adding Server via Natural Language:

```
User: Add the filesystem MCP server

AI: I've added the filesystem MCP server with 100% confidence. 
This server provides: File system operations (read, write, search). 
The server is now available for use. Would you like me to connect to it and show you what tools it provides?
```

### Adding Unknown Server with Search:

```
User: Add the weather MCP server

AI: I'll help you add the weather MCP server. Let me search for its configuration using available tools.
[Executes web_search tool]
[Finds and adds configuration]
```

### Importing from Claude Desktop Config:

```json
User: Import this config:
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}

AI: Configuration Notes: Added 2 servers from Claude Desktop format.
The servers are now available for use.
```

## Technical Implementation

### Components:

1. **MCPServerIntelligence** (`lib/mcp/mcp-server-intelligence.ts`):
   - JSON analysis and correction
   - Natural language processing
   - Server discovery and search
   - Configuration validation

2. **API Endpoint** (`app/api/mcp/analyze/route.ts`):
   - Handles JSON and natural language analysis
   - Manages server addition/removal
   - Returns corrected configurations

3. **Chat Integration** (`app/api/chat/route.ts`):
   - Detects MCP server requests
   - Triggers intelligent analysis
   - Provides immediate feedback

4. **Settings Dialog** (`components/settings-dialog.tsx`):
   - Uses intelligent analysis for JSON imports
   - Shows correction suggestions
   - Auto-connects added servers

## Known Servers

The system has built-in knowledge of common MCP servers:

- **filesystem**: File system operations
- **git**: Git repository operations
- **github**: GitHub API (requires GITHUB_TOKEN)
- **postgres**: PostgreSQL database
- **sqlite**: SQLite database
- **slack**: Slack workspace (requires SLACK_TOKEN)
- **memory**: Knowledge graph memory
- **puppeteer**: Browser automation
- **everything**: Everything search
- **aws-kb**: AWS knowledge base
- **context7**: Web search (HTTP, requires API key)
- **exa**: Exa search API (requires EXA_API_KEY)
- **smithery**: Smithery AI platform (HTTP, requires API key)

## Benefits

1. **User-Friendly**: No need to remember exact JSON formats
2. **Error-Tolerant**: Automatically fixes common mistakes
3. **Discoverable**: Finds configurations for unknown servers
4. **Integrated**: Works seamlessly in chat and settings
5. **Intelligent**: Uses AI for complex corrections
6. **Extensible**: Easy to add new server definitions