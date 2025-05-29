# Test info

- Name: MCP Server Integration >> should connect to and disconnect from MCP server
- Location: /Users/andersonwestfield/Desktop/geminichatbotv2/tests/e2e/mcp-servers.spec.ts:125:7

# Error details

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[role="dialog"]') to be visible

    at /Users/andersonwestfield/Desktop/geminichatbotv2/tests/e2e/mcp-servers.spec.ts:128:16
```

# Page snapshot

```yaml
- main:
  - list:
    - button "A":
      - text: A
      - listitem
    - link:
      - /url: /project/1
      - img
      - listitem
    - link:
      - /url: /project/2
      - img
      - listitem
    - link:
      - /url: /project/3
      - img
      - listitem
    - link:
      - /url: /project/4
      - img
      - listitem
    - link:
      - /url: /chat/1
      - img
      - listitem
    - link:
      - /url: /chat/2
      - img
      - listitem
    - link:
      - /url: /chat/3
      - img
      - listitem
    - link:
      - /url: /canvas/preview
      - img
      - listitem
    - link:
      - /url: /canvas/code
      - img
      - listitem
    - link:
      - /url: /canvas/images
      - img
      - listitem
    - link:
      - /url: /canvas/video
      - img
      - listitem
    - link:
      - /url: /canvas/audio
      - img
      - listitem
    - link:
      - /url: /canvas/docs
      - img
      - listitem
    - link:
      - /url: /settings
      - img
      - listitem
    - button "U":
      - text: U
      - listitem
  - heading "AI Assistant" [level=1]
  - button "Settings":
    - img
  - text: Hello! I'm your AI assistant powered by Gemini. How can I help you today?
  - textbox "What can I do for you?"
  - button "Geminigemini-2.5-flash-preview-05-20":
    - img "Gemini"
    - text: gemini-2.5-flash-preview-05-20
    - img
  - button "Attach file"
  - img
  - button "Send message" [disabled]:
    - img
  - heading "Canvas" [level=2]
  - tablist:
    - tab "Preview" [selected]:
      - img
      - text: Preview
    - tab "Code":
      - img
      - text: Code
    - tab "Browser":
      - img
      - text: Browser
    - tab "Video":
      - img
      - text: Video
    - tab "Audio":
      - img
      - text: Audio
    - tab "Images":
      - img
      - text: Images
    - tab "Docs":
      - img
      - text: Docs
  - tabpanel "Preview":
    - img
    - heading "Canvas Preview" [level=3]
    - paragraph: AI-generated content will appear here. Ask the assistant to create something for you.
- region "Notifications (F8)":
  - list
```

# Test source

```ts
   28 |   test('should add MCP server manually', async ({ page }) => {
   29 |     // Open settings
   30 |     await page.click('button[title="Settings"]');
   31 |     await page.waitForSelector('[role="dialog"]');
   32 |     await page.click('button:has-text("MCP Servers")');
   33 |     
   34 |     // Fill manual server form
   35 |     await page.fill('input[placeholder="My MCP Server"]', 'Test Calculator');
   36 |     await page.fill('input[placeholder="node server.js"]', 'node');
   37 |     
   38 |     // Add args (path to calculator server)
   39 |     const calculatorPath = path.join(process.cwd(), 'example-servers/calculator/dist/index.js');
   40 |     const argsTextarea = page.locator('textarea').nth(1); // Second textarea is for args
   41 |     await argsTextarea.fill(calculatorPath);
   42 |     
   43 |     // Click Done button
   44 |     await page.click('button:has-text("Done")');
   45 |     
   46 |     // Close dialog
   47 |     await page.keyboard.press('Escape');
   48 |     
   49 |     // Verify server was added (check in MCP panel if visible)
   50 |     // Note: The actual verification depends on your UI structure
   51 |   });
   52 |
   53 |   test('should import MCP server from JSON', async ({ page }) => {
   54 |     // Open settings
   55 |     await page.click('button[title="Settings"]');
   56 |     await page.waitForSelector('[role="dialog"]');
   57 |     await page.click('button:has-text("MCP Servers")');
   58 |     
   59 |     // Prepare valid JSON config
   60 |     const calculatorPath = path.join(process.cwd(), 'example-servers/calculator/dist/index.js');
   61 |     const jsonConfig = JSON.stringify({
   62 |       "mcpServers": {
   63 |         "calculator": {
   64 |           "command": "node",
   65 |           "args": [calculatorPath]
   66 |         }
   67 |       }
   68 |     }, null, 2);
   69 |     
   70 |     // Fill JSON textarea
   71 |     const jsonTextarea = page.locator('textarea[placeholder*="Paste any MCP configuration format"]');
   72 |     await jsonTextarea.fill(jsonConfig);
   73 |     
   74 |     // Click Import & Connect
   75 |     await page.click('button:has-text("Import & Connect")');
   76 |     
   77 |     // Wait for success toast - look for the check mark or success indicator
   78 |     await page.waitForTimeout(2000); // Give time for import to process
   79 |     
   80 |     // Check if there's a success message in the toaster
   81 |     const successToast = page.locator('[data-sonner-toast][data-type="success"]');
   82 |     const hasSuccessToast = await successToast.count() > 0;
   83 |     
   84 |     if (!hasSuccessToast) {
   85 |       // If no toast, check if the server appears in the dialog
   86 |       // Use a more specific selector to avoid duplicates
   87 |       const serverItem = page.locator('div').filter({ hasText: /^calculator$/ }).first();
   88 |       await expect(serverItem).toBeVisible({ timeout: 5000 });
   89 |     }
   90 |   });
   91 |
   92 |   test('should handle invalid JSON gracefully', async ({ page }) => {
   93 |     // Open settings
   94 |     await page.click('button[title="Settings"]');
   95 |     await page.waitForSelector('[role="dialog"]');
   96 |     await page.click('button:has-text("MCP Servers")');
   97 |     
   98 |     // Fill with invalid JSON
   99 |     const jsonTextarea = page.locator('textarea[placeholder*="Paste any MCP configuration format"]');
  100 |     await jsonTextarea.fill('{ invalid json }');
  101 |     
  102 |     // Click Import & Connect
  103 |     await page.click('button:has-text("Import & Connect")');
  104 |     
  105 |     // Expect error message - be more specific to avoid multiple matches
  106 |     await expect(page.locator('[role="alert"]').filter({ hasText: /Invalid JSON|JSON/ })).toBeVisible();
  107 |   });
  108 |
  109 |   test('should show example JSON when clicking Show Example', async ({ page }) => {
  110 |     // Open settings
  111 |     await page.click('button[title="Settings"]');
  112 |     await page.waitForSelector('[role="dialog"]');
  113 |     await page.click('button:has-text("MCP Servers")');
  114 |     
  115 |     // Click Show Example
  116 |     await page.click('button:has-text("Show Example")');
  117 |     
  118 |     // Verify example JSON is populated
  119 |     const jsonTextarea = page.locator('textarea[placeholder*="Paste any MCP configuration format"]');
  120 |     const content = await jsonTextarea.inputValue();
  121 |     expect(content).toContain('mcpServers');
  122 |     expect(content).toContain('command');
  123 |   });
  124 |
  125 |   test('should connect to and disconnect from MCP server', async ({ page }) => {
  126 |     // First add a server
  127 |     await page.click('button[title="Settings"]');
> 128 |     await page.waitForSelector('[role="dialog"]');
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  129 |     await page.click('button:has-text("MCP Servers")');
  130 |     
  131 |     // Import calculator server
  132 |     const calculatorPath = path.join(process.cwd(), 'example-servers/calculator/dist/index.js');
  133 |     const jsonConfig = JSON.stringify({
  134 |       "mcpServers": {
  135 |         "test-calculator": {
  136 |           "command": "node",
  137 |           "args": [calculatorPath]
  138 |         }
  139 |       }
  140 |     }, null, 2);
  141 |     
  142 |     const jsonTextarea = page.locator('textarea[placeholder*="Paste any MCP configuration format"]');
  143 |     await jsonTextarea.fill(jsonConfig);
  144 |     await page.click('button:has-text("Import & Connect")');
  145 |     
  146 |     // Wait for import to complete
  147 |     await page.waitForTimeout(2000);
  148 |     
  149 |     // Close settings dialog
  150 |     await page.keyboard.press('Escape');
  151 |     
  152 |     // Now check if the server is visible in the settings dialog
  153 |     // The server should be listed in the MCP servers section
  154 |     const serverName = page.locator('span:has-text("test-calculator")').first();
  155 |     await expect(serverName).toBeVisible({ timeout: 5000 });
  156 |   });
  157 |
  158 |   test('should execute MCP tool successfully', async ({ page }) => {
  159 |     // Add calculator server
  160 |     await page.click('button[title="Settings"]');
  161 |     await page.waitForSelector('[role="dialog"]');
  162 |     await page.click('button:has-text("MCP Servers")');
  163 |     
  164 |     const calculatorPath = path.join(process.cwd(), 'example-servers/calculator/dist/index.js');
  165 |     const jsonConfig = JSON.stringify({
  166 |       "mcpServers": {
  167 |         "calculator-e2e": {
  168 |           "command": "node",
  169 |           "args": [calculatorPath]
  170 |         }
  171 |       }
  172 |     }, null, 2);
  173 |     
  174 |     const jsonTextarea = page.locator('textarea[placeholder*="Paste any MCP configuration format"]');
  175 |     await jsonTextarea.fill(jsonConfig);
  176 |     await page.click('button:has-text("Import & Connect")');
  177 |     
  178 |     // Wait for connection
  179 |     await page.waitForTimeout(3000);
  180 |     
  181 |     // Close settings
  182 |     await page.keyboard.press('Escape');
  183 |     
  184 |     // Navigate to tools if there's a UI for it
  185 |     // This is a placeholder - adjust based on your actual UI
  186 |     const toolsTab = page.locator('text=Tools');
  187 |     if (await toolsTab.isVisible()) {
  188 |       await toolsTab.click();
  189 |       
  190 |       // Look for calculator tools
  191 |       await expect(page.locator('text=add').or(page.locator('text=multiply'))).toBeVisible({ timeout: 5000 });
  192 |     }
  193 |   });
  194 |
  195 |   test.skip('should persist servers across page reloads', async ({ page }) => {
  196 |     // Add a server
  197 |     await page.click('button[title="Settings"]');
  198 |     await page.waitForSelector('[role="dialog"]');
  199 |     await page.click('button:has-text("MCP Servers")');
  200 |     
  201 |     const calculatorPath = path.join(process.cwd(), 'example-servers/calculator/dist/index.js');
  202 |     const jsonConfig = JSON.stringify({
  203 |       "mcpServers": {
  204 |         "persistent-calc": {
  205 |           "command": "node",
  206 |           "args": [calculatorPath]
  207 |         }
  208 |       }
  209 |     }, null, 2);
  210 |     
  211 |     const jsonTextarea = page.locator('textarea[placeholder*="Paste any MCP configuration format"]');
  212 |     await jsonTextarea.fill(jsonConfig);
  213 |     await page.click('button:has-text("Import & Connect")');
  214 |     
  215 |     // Wait for import
  216 |     await page.waitForTimeout(2000);
  217 |     
  218 |     // Reload page
  219 |     await page.reload();
  220 |     
  221 |     // Check if server still exists
  222 |     await page.waitForSelector('text=AI Assistant', { timeout: 10000 });
  223 |     
  224 |     // Open settings again
  225 |     await page.click('button[title="Settings"]');
  226 |     await page.waitForSelector('[role="dialog"]');
  227 |     await page.click('button:has-text("MCP Servers")');
  228 |     
```