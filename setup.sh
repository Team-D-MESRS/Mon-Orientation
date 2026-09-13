#!/bin/bash
set -e

echo "🚀 Setup Complet - Mon Orientation"
echo "==================================="
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé."
    exit 1
fi
echo "✅ Docker $(docker --version)"

# Lancer PostgreSQL et Redis
echo ""
echo "🐳 Démarrage des services (PostgreSQL, Redis)..."
docker-compose up -d

echo "⏳ Attente de PostgreSQL..."
sleep 5
until docker exec mo-postgres pg_isready -U mo_user -d mon_orientation > /dev/null 2>&1; do
    sleep 1
done
echo "✅ PostgreSQL prêt (port 5434)"
echo "✅ Redis prêt (port 6381)"

# Backend
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 BACKEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend
bash setup.sh
cd ..

# Frontend
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend
echo "📦 Installation des dépendances..."
npm install
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP TERMINÉ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Pour tout lancer :"
echo "  bash start.sh"
echo ""
echo "Ou séparément :"
echo "  Terminal 1 : cd backend && npm run start:dev"
echo "  Terminal 2 : cd frontend && npm run dev"
