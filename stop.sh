#!/bin/bash

echo "🛑 Arrêt de Mon Orientation"
echo "==========================="

# Motifs limités aux processus de ce projet (chemins absolus) pour ne pas toucher aux autres projets
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Arrêt du backend et frontend..."
pkill -f "$ROOT/backend/node_modules/.bin/nest start" 2>/dev/null || true
pkill -f "$ROOT/backend/dist/main" 2>/dev/null || true
pkill -f "$ROOT/frontend/node_modules/.bin/next dev" 2>/dev/null || true

echo "✅ Arrêté"
