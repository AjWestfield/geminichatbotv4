# MCP Natural Language Management Guide

## Overview
You can now manage MCP (Model Context Protocol) servers through natural language conversations with the AI assistant. Simply tell the assistant what you want to do, and it will handle the technical details.

## Features

### 1. Install MCP Servers
The AI can automatically find, configure, and install MCP servers based on your request.

**Example Prompts:**
- "Install the GitHub MCP server"
- "Add the filesystem MCP"
- "Set up the Brave search server"
- "Install npx @modelcontextprotocol/server-sqlite"
- "Add the calculator MCP server"
- "I want to browse the web, what MCP should I install?"

### 2. Remove MCP Servers
Remove servers you no longer need.

**Example Prompts:**
- "Remove the calculator server"
- "Uninstall the GitHub MCP"
- "Delete the filesystem server"

### 3. List Configured Servers
See what's currently installed.

**Example Prompts:**
- "Show me my MCP servers"
- "What servers do I have installed?"
- "List all MCP configurations"

### 4. Install from GitHub URLs
Provide a GitHub repository URL and the AI will analyze it to find the MCP configuration.

**Example Prompts:**
- "Install this MCP server: https://github.com/modelcontextprotocol/servers/tree/main/src/github"
- "Add the MCP from https://github.com/some-user/mcp-server-example"
- "Set up https://github.com/anthropics/mcp-servers/tree/main/calculator"

### 5. Install from JSON Configuration
Paste JSON configuration directly in the chat.

**Example Prompts:**
```
Add this MCP server:
{
  "my-server": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-filesystem"]
  }
}
```

## How It Works

### The Agentic Workflow
When you request to install an MCP server, the AI follows these steps:

1. **Parse Request** - Understands what server you want
2. **Search for Configuration** - Uses Exa or Context7 to find official docs
3. **Validate Configuration** - Ensures the JSON is correct
4. **Backup Current Config** - Saves your existing configuration
5. **Add to Configuration** - Updates the mcp.config.json file
6. **Connect to Server** - Attempts to establish connection
7. **Test Functionality** - Verifies the server is working
8. **Report Results** - Shows you what tools are available

### Search Integration
The AI uses available search tools (Exa or Context7) to:
- Find official MCP documentation
- Locate NPM packages
- Discover GitHub repositories
- Get the latest configuration formats

## Common MCP Servers

### Official Servers (NPX)
- **filesystem** - File system operations
- **github** - GitHub API access
- **gitlab** - GitLab API access
- **google-drive** - Google Drive access
- **postgres** - PostgreSQL database
- **sqlite** - SQLite database
- **puppeteer** - Browser automation
- **brave-search** - Web search
- **fetch** - HTTP requests

### Community Servers
- **exa** - AI-powered search
- **context7** - Enhanced browsing
- **calculator** - Math operations

## Tips for Best Results

1. **Be Specific**: "Install the GitHub MCP server" works better than "add GitHub"
2. **Use Official Names**: Use the exact server names when possible
3. **Provide Context**: "I need to search the web" helps the AI suggest the right server
4. **Include URLs**: When installing from GitHub, provide the full URL
5. **Check Status**: Ask "What MCP servers do I have?" to see current setup

## Troubleshooting

### If Installation Fails
- Ensure you have Node.js installed for NPX servers
- Check if you need API keys (the AI will tell you)
- Verify the server name is correct
- Make sure search tools (Exa/Context7) are available

### If Server Won't Connect
- Check environment variables are set
- Ensure the command exists on your system
- Verify network connectivity
- Review the error message for specifics

## Example Conversation

**User**: "I want to analyze GitHub repositories"

**AI**: "I'll help you install the GitHub MCP server. Let me search for its configuration..."
*[Executes search, finds configuration, installs server]*
"Successfully installed the GitHub MCP server! It provides 15 tools including:
- get-repository-info
- search-repositories
- create-issue
Would you like me to show you how to use these tools?"

**User**: "Show me info about the anthropic/claude-desktop repo"

**AI**: *[Uses the GitHub MCP tool to fetch repository information]*
"Here's the information about anthropic/claude-desktop..."

## Advanced Features

### Batch Installation
You can install multiple servers at once:
```json
{
  "filesystem": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-filesystem"]
  },
  "github": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": "your-token"
    }
  }
}
```

### Custom Configurations
The AI understands various configuration formats:
- Claude Desktop format
- NPX shortcuts
- Direct command configurations
- Python server setups

## Security Notes

- The AI will never expose or log secrets
- API keys should be set as environment variables
- Configuration files are backed up before changes
- You can review all changes in mcp.config.json

## Getting Started

1. Make sure you have search tools available (Exa or Context7)
2. Simply tell the AI what MCP server you need
3. Follow any prompts for API keys or configuration
4. Start using the newly installed tools!

Remember: The AI handles all the technical details - just describe what you want to accomplish!