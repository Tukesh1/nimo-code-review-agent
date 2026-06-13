#!/bin/bash
set -e

echo "Starting AI Code Review Agent..."
echo "Provider: $AI_PROVIDER"

npx tsc
node dist/action-entry.js
