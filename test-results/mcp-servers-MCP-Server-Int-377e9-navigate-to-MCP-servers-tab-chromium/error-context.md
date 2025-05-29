# Test info

- Name: MCP Server Integration >> should open settings dialog and navigate to MCP servers tab
- Location: /Users/andersonwestfield/Desktop/geminichatbotv2/tests/e2e/mcp-servers.spec.ts:13:7

# Error details

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[role="dialog"]') to be visible

    at /Users/andersonwestfield/Desktop/geminichatbotv2/tests/e2e/mcp-servers.spec.ts:18:16
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
   1 | import { test, expect } from '@playwright/test';
   2 | import path from 'path';
   3 |
   4 | test.describe('MCP Server Integration', () => {
   5 |   test.beforeEach(async ({ page }) => {
   6 |     // Navigate to the app
   7 |     await page.goto('/');
   8 |     
   9 |     // Wait for the app to load
   10 |     await page.waitForSelector('text=AI Assistant', { timeout: 10000 });
   11 |   });
   12 |
   13 |   test('should open settings dialog and navigate to MCP servers tab', async ({ page }) => {
   14 |     // Click settings button by title attribute
   15 |     await page.click('button[title="Settings"]');
   16 |     
   17 |     // Wait for dialog
>  18 |     await page.waitForSelector('[role="dialog"]');
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
   19 |     
   20 |     // Click MCP Servers tab
   21 |     await page.click('button:has-text("MCP Servers")');
   22 |     
   23 |     // Verify MCP import section is visible
   24 |     await expect(page.locator('text=Import MCP Configuration')).toBeVisible();
   25 |     await expect(page.locator('text=Add Server Manually')).toBeVisible();
   26 |   });
   27 |
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
```