#!/bin/bash
# ── Mindverse Backend — stop.sh ───────────────────────────────────────────────
echo "🛑 Deteniendo backend..."
pm2 stop mindverse-backend 2>/dev/null && echo "✅ Backend detenido." || echo "⚠️  El proceso no estaba corriendo."
pm2 save
