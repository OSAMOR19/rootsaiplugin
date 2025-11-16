#!/usr/bin/env bash

# Cleanup script for legacy BPM libraries
# Removes old BPM detection dependencies and files

set -e

echo "🧹 Cleaning up legacy BPM detection libraries..."

# Remove old BPM libraries if they exist (non-fatal)
echo "📦 Removing old npm packages..."
npm uninstall beatdetect music-tempo realtime-bpm-analyzer 2>/dev/null || true
yarn remove beatdetect music-tempo realtime-bpm-analyzer 2>/dev/null || true

# Remove old backend-related markdown files (already done, but keeping for reference)
echo "📄 Removing old documentation files..."
rm -f BACKEND_BPM_MIGRATION.md
rm -f BACKEND_CONNECTION_VERIFIED.md
rm -f TEST_BACKEND.md
rm -f AUDIO_OPTIMIZATION_FIX.md
rm -f FORMDATA_RETRY_BUG_FIX.md
rm -f TIMEOUT_AND_RETRY_IMPROVEMENTS.md

# Remove old API route if it exists
echo "🗑️  Removing old API routes..."
rm -rf app/api/get-bpm
rm -rf app/test-bpm-api
rm -f app/api/test-soundstat/route.ts

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm install' to install Essentia.js"
echo "  2. Test the new API: POST /api/analyze"
echo ""

