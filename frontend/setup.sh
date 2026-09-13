#!/bin/bash
set -e

echo "🚀 Setup Frontend - Mon Orientation"
echo "==================================="

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Installez-le depuis https://nodejs.org"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Installer les dépendances
echo ""
echo "📦 Installation des dépendances..."
npm install

# Vérifier le backend
if [ ! -f ../backend/.env ]; then
    echo ""
    echo "⚠️  Le fichier backend/.env n'existe pas."
    echo "   Lancez d'abord : cd ../backend && bash setup.sh"
fi

echo ""
echo "✅ Frontend prêt !"
echo ""
echo "Pour lancer :"
echo "  npm run dev"
echo ""
echo "Frontend : http://localhost:3000"
