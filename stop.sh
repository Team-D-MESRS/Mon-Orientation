#!/bin/bash

echo "🛑 Arrêt de Mon Orientation"
echo "==========================="

# Arrêter les processus Node.js
echo "Arrêt du backend et frontend..."
pkill -f "nest start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

echo "✅ Arrêté"
