# MCP GitHub Intelligence System

This document describes the advanced GitHub-based MCP server discovery and configuration system.

## Overview

The system can automatically analyze GitHub repositories to extract MCP server configurations, using multiple strategies:

1. **Direct GitHub Analysis**: Fetches README and package.json files
2. **MCP Tool Search**: Uses context7/exa to find installation instructions
3. **AI-Powered Extraction**: Uses Gemini to understand documentation
4. **Smart Inference**: Infers configuration from repository structure

## How It Works

### 1. GitHub URL Detection

When a user provides a GitHub URL in chat:
```
User: Add this MCP server: https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking
```

The system:
- Detects the GitHub URL pattern
- Extracts owner, repo, and path information
- Initiates the analysis process

### 2. Multi-Strategy Analysis

#### Strategy 1: MCP Tool Search
```javascript
// Uses context7 or exa to search for:
"modelcontextprotocol/servers" MCP server "sequentialthinking" installation configuration npm install command
```

#### Strategy 2: Direct GitHub API
- Fetches README.md from the specific path
- Fetches package.json to understand dependencies
- Analyzes both with AI to extract configuration

#### Strategy 3: Smart Inference
If no clear instructions found:
- Infers from repository structure
- Checks common patterns (npx, npm install -g, etc.)
- Provides lower confidence suggestion

### 3. Configuration Extraction

The AI analyzes documentation looking for:
- NPM install commands
- NPX usage examples
- Environment variable requirements
- Transport type (stdio/http)
- Any special arguments

### 4. Automatic Installation

Once configuration is found:
```json
{
  "name": "sequentialthinking",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sequentialthinking"],
  "transportType": "stdio",
  "description": "Sequential thinking and reasoning server",
  "confidence": 0.9
}
```

## Usage Examples

### Simple GitHub URL
```
User: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem

AI: 🎉 Successfully analyzed and added MCP server!
Server: filesystem
Source: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
Confidence: 90%
Description: File system operations server

Configuration:
{
  "name": "filesystem",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem"],
  "transportType": "stdio"
}
```

### Complex Repository
```
User: Add the MCP server from https://github.com/some-org/custom-mcp-server

AI: I'm analyzing the GitHub repository to find the MCP server configuration. Let me search for more details using available tools.
[Executes web_search tool]
[Analyzes results]
[Builds configuration]
```

### With Natural Language
```
User: I want to use the sequential thinking server from https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking

AI: [Analyzes repository]
[Extracts configuration]
[Adds server automatically]
```

## Technical Implementation

### Enhanced MCPServerIntelligence

```typescript
static async analyzeGitHubRepository(
  githubUrl: string,
  mcpManager?: MCPServerManager
): Promise<MCPServerSuggestion | null>
```

Features:
- Parses GitHub URLs to extract components
- Uses MCP tools for enhanced search
- Falls back to direct API access
- AI-powered documentation analysis
- Confidence scoring based on source

### Chat Integration

The chat API now:
1. Detects GitHub URLs in messages
2. Triggers automatic analysis
3. Provides step-by-step feedback
4. Adds servers without manual configuration

### Search Enhancement

When initial analysis fails:
1. Triggers web search with specific queries
2. Analyzes search results for installation instructions
3. Extracts configuration from various sources
4. Builds configuration with confidence scores

## Benefits

1. **Zero Configuration**: Just paste a GitHub URL
2. **Intelligent Analysis**: Understands various documentation formats
3. **Multi-Source**: Combines GitHub, search, and AI analysis
4. **Confidence Scoring**: Shows reliability of configuration
5. **Automatic Setup**: No manual JSON editing required
6. **Error Handling**: Graceful fallbacks and clear feedback

## Supported Patterns

### NPM Packages
- `npx @modelcontextprotocol/server-name`
- `npx -y server-name`
- `npm install -g server && server`

### GitHub Repositories
- Official MCP servers: `/modelcontextprotocol/servers/`
- Custom implementations: Any GitHub repo with MCP server
- Monorepos: Handles path-based server locations

### Documentation Formats
- README.md with installation instructions
- package.json with bin entries
- Code examples showing usage
- NPM registry information

## Future Enhancements

1. **NPM Registry Integration**: Direct package.json analysis from NPM
2. **Smithery Integration**: Automatic detection of Smithery-hosted servers
3. **Version Management**: Handle specific versions and updates
4. **Dependency Resolution**: Automatic environment variable detection
5. **Testing Integration**: Verify server works before adding