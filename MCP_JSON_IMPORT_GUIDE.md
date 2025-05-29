# MCP JSON Import - Intelligent Parser Guide

## Overview

The MCP integration now features an intelligent JSON parser that automatically detects and imports various MCP configuration formats. No more manual configuration errors!

## Key Features

### 🎯 Auto-Detection & Import
- Automatically detects configuration format
- Parses multiple format types
- Auto-connects servers after import
- Shows real-time status indicators

### 🔍 Visual Status Indicators
- **Green checkmark**: Server connected successfully
- **Yellow spinner**: Server connecting
- **Red alert**: Connection error
- **Tool badge**: Shows number of available tools
- **Expandable tool list**: Click to see all available tools

### 📋 Supported Formats

#### 1. Claude Desktop Format
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
    }
  }
}
```

#### 2. Array Format
```json
[
  {
    "name": "Calculator",
    "command": "node",
    "args": ["calculator.js"]
  },
  {
    "name": "File System",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem"]
  }
]
```

#### 3. Single Server
```json
{
  "name": "GitHub API",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": "your-token"
  }
}
```

#### 4. NPX Shortcuts
```json
{
  "name": "GitHub",
  "package": "@modelcontextprotocol/server-github",
  "env": {
    "GITHUB_TOKEN": "your-token"
  }
}
```

#### 5. Language-Specific Shortcuts
```json
{
  "name": "Python Server",
  "python": "server.py",
  "args": ["--port", "3000"]
}
```

## How to Use

1. **Open Settings**: Click the settings icon (⚙️) in the chat header
2. **Navigate to MCP Servers**: Click the "MCP Servers" tab
3. **Paste Configuration**: Paste any supported JSON format
4. **Import & Connect**: Click "Import & Connect" - servers will be added and automatically connected
5. **View Status**: See real-time connection status and available tools

## Visual Feedback

### During Import
- Loading spinner shows import progress
- Success toast shows number of servers added
- Error alerts show specific issues

### Server Cards
- **Status Icons**:
  - 🟢 Connected (green checkmark)
  - 🟡 Connecting (yellow spinner)
  - 🔴 Error (red alert)
  - 🔧 Tools available (wrench badge)

### Tool Display
- Click the tool badge to expand and see all available tools
- Each tool shows its name and description
- Tools are displayed in a clean, readable format

## Error Handling

The parser provides clear error messages:
- Invalid JSON syntax
- Missing required fields
- Connection failures
- Permission issues

## Examples

### Quick Start - Calculator
```json
{
  "name": "Calculator",
  "command": "node",
  "args": ["example-servers/calculator/dist/index.js"]
}
```

### File System Access
```json
{
  "name": "File System",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/Documents"]
}
```

### Multiple Servers at Once
```json
{
  "servers": [
    {
      "name": "Calculator",
      "node": "calculator.js"
    },
    {
      "name": "SQLite",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "database.db"]
    }
  ]
}
```

## Tips

1. **Use "Show Example"**: Click the info button to see example configurations
2. **Auto-Connect**: Servers are automatically connected after import
3. **Expandable Tools**: Click tool badges to see what each server can do
4. **Bulk Import**: Import multiple servers at once using array format
5. **Environment Variables**: Include API keys and settings in the `env` field

## Troubleshooting

### Import Fails
- Check JSON syntax is valid
- Ensure required fields (name, command) are present
- Verify file paths are correct

### Connection Fails
- Check the command exists on your system
- Verify Node.js/Python is installed for respective servers
- Check file permissions

### No Tools Showing
- Wait for server to fully connect
- Some servers may not expose tools immediately
- Check server logs for errors

The intelligent parser makes MCP server setup effortless - just paste and go!