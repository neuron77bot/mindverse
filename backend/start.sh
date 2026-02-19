#!/bin/bash
# ── Mindverse Backend — start.sh ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔨 Compilando TypeScript..."
npx tsc

echo "🚀 Iniciando backend con pm2..."
pm2 start dist/index.js --name mindverse-backend --update-env

echo "✅ Backend corriendo. Logs: pm2 logs mindverse-backend"
pm2 save
