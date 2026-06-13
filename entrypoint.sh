#!/bin/bash
set -e

echo "Starting AI Code Review Agent..."
echo "Provider: $AI_PROVIDER"

# Run the pre-compiled script from the /app directory
node /app/dist/action-entry.js
