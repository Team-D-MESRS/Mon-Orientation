#!/bin/bash
set -e

echo "🚀 Setup Backend - Mon Orientation"
echo "=================================="

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé."
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Installer les dépendances
echo ""
echo "📦 Installation des dépendances..."
npm install

# Copier .env
if [ ! -f .env ]; then
    echo "📋 Copie de .env.example → .env"
    cp .env.example .env
fi

# Prisma
echo ""
echo "🔧 Génération du client Prisma..."
npx prisma generate

echo ""
echo "🗄️  Migration de la base de données..."
npx prisma migrate dev --name init

echo ""
echo "🌱 Insertion des données de test..."
npx ts-node prisma/seed.ts

echo ""
echo "✅ Backend prêt !"
echo "  npm run start:dev  →  http://localhost:8080"
echo "  Swagger            →  http://localhost:8080/api/docs"
