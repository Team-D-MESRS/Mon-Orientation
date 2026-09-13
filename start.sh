#!/bin/bash

echo "🚀 Démarrage - Mon Orientation"
echo "==============================="
echo ""

# Vérifier que les containers tournent
if ! docker ps --format '{{.Names}}' | grep -q mo-postgres; then
    echo "🐳 Démarrage des containers..."
    docker-compose up -d
    sleep 5
fi

# Lancer le backend en arrière-plan
echo "📦 Backend → http://localhost:8080"
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
for i in {1..20}; do
    if curl -s http://localhost:8080/api/docs > /dev/null 2>&1; then
        echo "✅ Backend prêt"
        break
    fi
    sleep 1
done

# Lancer le frontend
echo "📦 Frontend → http://localhost:3000"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Mon Orientation est lancé !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  • Frontend  → http://localhost:3000"
echo "  • Backend   → http://localhost:8080"
echo "  • Swagger   → http://localhost:8080/api/docs"
echo ""
echo "Ctrl+C pour tout arrêter"

trap "echo ''; echo '🛑 Arrêt...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
