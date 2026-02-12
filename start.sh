#!/bin/bash
# ============================================
# Rheinzelmänner - Quick Start Script
# ============================================
# Dieses Script startet die App auf dem Raspberry Pi

set -e

echo "🍺 Rheinzelmänner Docker Setup"
echo "=============================="

# Prüfe ob Docker installiert ist
if ! command -v docker &> /dev/null; then
    echo "❌ Docker ist nicht installiert!"
    echo "Installiere Docker mit: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Hole IP-Adresse
PI_IP=$(hostname -I | awk '{print $1}')
echo "📍 Raspberry Pi IP: $PI_IP"

# Erstelle/Update .env für Frontend mit korrekter IP
echo "REACT_APP_BACKEND_URL=http://$PI_IP:8001" > frontend/.env
echo "✅ Frontend .env erstellt mit Backend-URL: http://$PI_IP:8001"

# Prüfe ob backend/.env existiert
if [ ! -f backend/.env ]; then
    echo "MONGO_URL=mongodb://mongodb:27017" > backend/.env
    echo "DB_NAME=rheinzelmaenner" >> backend/.env
    echo "JWT_SECRET=$(openssl rand -hex 32)" >> backend/.env
    echo "✅ Backend .env erstellt"
fi

# Baue und starte Container
echo ""
echo "🔨 Baue Docker Container (das kann einige Minuten dauern)..."
docker compose up -d --build

echo ""
echo "⏳ Warte auf Container-Start..."
sleep 15

# Prüfe Status
echo ""
echo "📊 Container Status:"
docker compose ps

echo ""
echo "=============================="
echo "✅ Rheinzelmänner läuft!"
echo ""
echo "🌐 Frontend: http://$PI_IP:3000"
echo "🔧 Backend:  http://$PI_IP:8001/api"
echo ""
echo "👤 Login: admin / admin123"
echo "=============================="
echo ""
echo "Nützliche Befehle:"
echo "  Logs anzeigen:    docker compose logs -f"
echo "  Stoppen:          docker compose down"
echo "  Neustarten:       docker compose restart"
