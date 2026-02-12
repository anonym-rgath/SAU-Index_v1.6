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

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose ist nicht installiert!"
    echo "Installiere mit: sudo apt install docker-compose -y"
    exit 1
fi

# Hole IP-Adresse
PI_IP=$(hostname -I | awk '{print $1}')
echo "📍 Raspberry Pi IP: $PI_IP"

# Erstelle SSL-Zertifikate falls nicht vorhanden
if [ ! -f nginx/certs/cert.pem ]; then
    echo ""
    echo "🔐 Erstelle selbstsigniertes SSL-Zertifikat..."
    mkdir -p nginx/certs
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/certs/key.pem \
        -out nginx/certs/cert.pem \
        -subj "/C=DE/ST=NRW/L=Stadt/O=Rheinzelmaenner/CN=$PI_IP"
    echo "✅ SSL-Zertifikat erstellt"
fi

# Prüfe ob backend/.env existiert
if [ ! -f backend/.env ]; then
    echo "MONGO_URL=mongodb://mongodb:27017" > backend/.env
    echo "DB_NAME=rheinzelmaenner" >> backend/.env
    echo "JWT_SECRET=$(openssl rand -hex 32)" >> backend/.env
    echo "✅ Backend .env erstellt"
fi

# Frontend .env für relativen API Pfad
echo "REACT_APP_BACKEND_URL=/api" > frontend/.env
echo "✅ Frontend .env erstellt"

# Baue und starte Container
echo ""
echo "🔨 Baue Docker Container (das kann einige Minuten dauern)..."
docker-compose up -d --build

echo ""
echo "⏳ Warte auf Container-Start..."
sleep 15

# Prüfe Status
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "=============================="
echo "✅ Rheinzelmänner läuft!"
echo ""
echo "🌐 App:     https://$PI_IP"
echo "🔒 HTTPS auf Port 443"
echo ""
echo "⚠️  Hinweis: Browser zeigt Sicherheitswarnung"
echo "   (selbstsigniertes Zertifikat) - einfach akzeptieren"
echo ""
echo "👤 Login: admin / admin123"
echo "=============================="
echo ""
echo "Nützliche Befehle:"
echo "  Logs anzeigen:    docker-compose logs -f"
echo "  Stoppen:          docker-compose down"
echo "  Neustarten:       docker-compose restart"
