#!/bin/bash

# Prebuild script - Format and lint before push
# Usage: ./prebuild.sh

set -e  # Exit on error

echo "🔧 Running prebuild checks..."
echo ""

# Backend
echo "📦 Backend: Linting and formatting..."
cd /var/www/mindverse/backend
npm run lint:fix
npm run format
echo "✅ Backend done"
echo ""

# Frontend
echo "🎨 Frontend: Linting and formatting..."
cd /var/www/mindverse/frontend
npm run lint:fix
npm run format
echo "✅ Frontend done"
echo ""

echo "✨ All prebuild checks completed successfully!"
