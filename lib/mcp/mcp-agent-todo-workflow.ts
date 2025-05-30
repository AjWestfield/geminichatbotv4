export const MCP_AGENT_TODO_WORKFLOW = `
## MCP Server Management with Todo-Based Workflow

### CRITICAL: ALWAYS USE TODO LISTS FOR MCP OPERATIONS

When performing ANY MCP server operation (add, remove, update), you MUST:

1. **CREATE A TODO LIST IMMEDIATELY** with all required steps
2. **MARK TASKS AS IN-PROGRESS** when starting them
3. **VERIFY COMPLETION** after each step
4. **MARK TASKS AS COMPLETE/FAILED** based on verification
5. **RETRY FAILED TASKS** or explain why they cannot be completed
6. **PERFORM FINAL VERIFICATION** to ensure the overall goal was achieved

### TODO WORKFLOW FOR REMOVING AN MCP SERVER:

When user requests to remove an MCP server, create this todo list:

\`\`\`
TODO LIST: Remove [Server Name] MCP Server
1. ☐ Read current mcp.config.json file
2. ☐ Verify the server exists in configuration
3. ☐ Create backup of current configuration
4. ☐ Remove server entry from configuration
5. ☐ Write updated configuration back to file
6. ☐ Verify server was removed from file
7. ☐ Confirm removal to user
\`\`\`

### STEP-BY-STEP EXECUTION:

**Step 1: Read Configuration**
- Mark as in-progress: "1. 🔄 Read current mcp.config.json file"
- Use DesktopCommander: \`read_file\` on \`/Users/andersonwestfield/Desktop/geminichatbotv3/mcp.config.json\`
- Verify: Check if file was read successfully
- Mark complete: "1. ✅ Read current mcp.config.json file"

**Step 2: Verify Server Exists**
- Mark as in-progress: "2. 🔄 Verify the server exists in configuration"
- Parse JSON and check if server with matching name/id exists
- If not found: Mark failed and stop
- Mark complete: "2. ✅ Verified server exists"

**Step 3: Create Backup**
- Mark as in-progress: "3. 🔄 Create backup of current configuration"
- Store current config in memory or note the content
- Mark complete: "3. ✅ Backup created"

**Step 4: Remove Server Entry**
- Mark as in-progress: "4. 🔄 Remove server entry from configuration"
- Filter out the server from the servers array
- Update lastModified timestamp
- Mark complete: "4. ✅ Server entry removed from config object"

**Step 5: Write Updated Configuration**
- Mark as in-progress: "5. 🔄 Write updated configuration back to file"
- Use DesktopCommander: \`write_file\` with the updated JSON
- Check for write errors
- Mark complete: "5. ✅ Updated configuration written to file"

**Step 6: Verify Removal**
- Mark as in-progress: "6. 🔄 Verify server was removed from file"
- Use DesktopCommander: \`read_file\` again
- Parse JSON and confirm server is no longer present
- If still present: Mark failed and retry from step 4
- Mark complete: "6. ✅ Confirmed server removed from file"

**Step 7: Confirm to User**
- Mark as in-progress: "7. 🔄 Confirm removal to user"
- Provide clear success message
- Mark complete: "7. ✅ User notified of successful removal"

### TODO WORKFLOW FOR ADDING AN MCP SERVER:

When user requests to add an MCP server, create this todo list:

\`\`\`
TODO LIST: Add [Server Name] MCP Server
1. ☐ Search for server configuration online
2. ☐ Extract configuration details from search results
3. ☐ Check if API key is required
4. ☐ Read current mcp.config.json file
5. ☐ Check for duplicate servers
6. ☐ Add new server to configuration
7. ☐ Write updated configuration to file
8. ☐ Verify server was added correctly
9. ☐ Provide setup instructions to user
\`\`\`

### VERIFICATION PATTERNS:

**After Reading Files:**
- Check if content was returned
- Verify JSON is valid
- Confirm expected structure exists

**After Writing Files:**
- Read the file again
- Compare with expected content
- Ensure changes were persisted

**After Searching:**
- Verify search returned results
- Check if configuration was found
- Validate configuration format

### RETRY LOGIC:

If a step fails:
1. Mark it as failed with reason
2. Attempt to fix the issue
3. Retry the step (max 3 attempts)
4. If still failing, explain to user and ask for guidance

### EXAMPLE CONVERSATION FLOW:

User: "Remove the sequential thinking server"

Assistant Response:

I'll help you remove the Sequential Thinking MCP server. Let me create a todo list to ensure this is done correctly.

**TODO LIST: Remove Sequential Thinking MCP Server**
1. ☐ Read current mcp.config.json file
2. ☐ Verify the server exists in configuration
3. ☐ Create backup of current configuration
4. ☐ Remove server entry from configuration
5. ☐ Write updated configuration back to file
6. ☐ Verify server was removed from file
7. ☐ Confirm removal to user

Starting the removal process...

1. 🔄 Read current mcp.config.json file
[Executes DesktopCommander read_file]
1. ✅ Read current mcp.config.json file

2. 🔄 Verify the server exists in configuration
[Checks for "sequential-thinking" in servers array]
2. ✅ Verified server exists

3. 🔄 Create backup of current configuration
[Stores configuration in memory]
3. ✅ Backup created

4. 🔄 Remove server entry from configuration
[Filters out sequential-thinking server]
4. ✅ Server entry removed from config object

5. 🔄 Write updated configuration back to file
[Executes DesktopCommander write_file]
5. ✅ Updated configuration written to file

6. 🔄 Verify server was removed from file
[Executes DesktopCommander read_file again]
[Confirms sequential-thinking is not in servers array]
6. ✅ Confirmed server removed from file

7. 🔄 Confirm removal to user
7. ✅ User notified of successful removal

✅ **Successfully removed the Sequential Thinking MCP server!** The server has been removed from your configuration file. If it was connected, it will be disconnected on the next reload.

### KEY PRINCIPLES:

1. **Always Show Progress**: Display the todo list and update statuses in real-time
2. **Always Verify**: Never assume an operation succeeded - always verify
3. **Handle Failures**: If verification fails, retry or ask for help
4. **Be Transparent**: Show what you're doing at each step
5. **Complete the Loop**: Always perform final verification

`;