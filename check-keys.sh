#!/bin/bash

# Simple script to verify API keys are configured

echo "Checking API Keys Configuration..."
echo "================================="

# Check GEMINI_API_KEY
if [ -n "$GEMINI_API_KEY" ]; then
    echo "✓ GEMINI_API_KEY: Configured"
else
    echo "✗ GEMINI_API_KEY: Missing"
fi

# Check OPENAI_API_KEY
if [ -n "$OPENAI_API_KEY" ]; then
    echo "✓ OPENAI_API_KEY: Configured"
else
    echo "✗ OPENAI_API_KEY: Missing (Optional - needed for audio/video transcription)"
fi

# Check WAVESPEED_API_KEY
if [ -n "$WAVESPEED_API_KEY" ]; then
    echo "✓ WAVESPEED_API_KEY: Configured"
else
    echo "✗ WAVESPEED_API_KEY: Missing (Optional - needed for image generation)"
fi

echo "================================="
echo "Note: Run 'source .env.local' to load the keys into your current session"
