#!/bin/bash

# Test MCP Tool Analysis Fix

echo "🧪 Testing MCP Tool Analysis Fix..."
echo "================================="

# Skip server check for now
echo "⚠️  Server check skipped (please ensure server is running for manual testing)"
echo ""

# Test 1: Check if MCPAnalysisEnforcer exists
echo "1. Checking MCPAnalysisEnforcer implementation..."
if [ -f "lib/mcp/mcp-analysis-enforcer.ts" ]; then
    echo "✅ MCPAnalysisEnforcer file exists"
    if grep -q "createAnalysisRequest" lib/mcp/mcp-analysis-enforcer.ts; then
        echo "✅ createAnalysisRequest method found"
    else
        echo "❌ createAnalysisRequest method not found"
    fi
else
    echo "❌ MCPAnalysisEnforcer file not found"
fi

echo ""

# Test 2: Check if chat route has feedback loop
echo "2. Checking feedback loop in chat route..."
if grep -q "MANDATORY ANALYSIS SECTION" app/api/chat/route.ts; then
    echo "✅ Feedback loop implementation found"
    if grep -q "continuationResult = await chat.sendMessageStream" app/api/chat/route.ts; then
        echo "✅ Continuation stream implementation found"
    else
        echo "❌ Continuation stream not implemented"
    fi
else
    echo "❌ Feedback loop not implemented"
fi

echo ""

# Test 3: Check system prompt updates
echo "3. Checking system prompt updates..."
if grep -q "CRITICAL ANALYSIS REQUIREMENT" lib/mcp/mcp-tools-context.ts; then
    echo "✅ Updated system prompt found"
    if grep -q "MANDATORY ANALYSIS SECTION" lib/mcp/mcp-tools-context.ts; then
        echo "✅ System prompt includes analysis instructions"
    else
        echo "❌ Analysis instructions missing from system prompt"
    fi
else
    echo "❌ System prompt not updated"
fi

echo ""

# Test 4: Check content stripping updates
echo "4. Checking content stripping..."
if grep -q "MANDATORY ANALYSIS - BEGIN IMMEDIATELY" hooks/use-chat-with-tools.ts; then
    echo "✅ Content stripping includes analysis markers"
else
    echo "❌ Content stripping not updated for analysis markers"
fi

echo ""
echo "================================="
echo "📊 Test Summary"
echo "================================="
echo ""
echo "To manually test the implementation:"
echo "1. Open http://localhost:3000"
echo "2. Navigate to the MCP tab and ensure you have tools available"
echo "3. Ask a question that requires tool usage, such as:"
echo "   - 'Search for the latest AI news'"
echo "   - 'Find information about React hooks'"
echo "   - 'Calculate 25 * 37 + 12'"
echo ""
echo "Expected behavior:"
echo "✅ Tool executes with loading animation"
echo "✅ Results display in collapsible card"
echo "✅ AI provides detailed analysis immediately after"
echo "✅ Analysis includes summary, insights, and recommendations"
echo ""
echo "Debug logs to watch for in console:"
echo "- [ANALYSIS] Sending analysis request to AI"
echo "- [ANALYSIS] Analysis prompt: ..."
echo "- [ANALYSIS] Analysis response received"