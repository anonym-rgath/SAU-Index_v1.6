#!/bin/bash

# Rheinzelmänner - Start Script für Raspberry Pi
# ==============================================

set -e

echo "============================================"
echo "   Rheinzelmänner Verwaltung"
echo "   Raspberry Pi Setup"
echo "============================================"
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Prüfe ob Docker installiert ist
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Fehler: Docker ist nicht installiert!${NC}"
    echo ""
    echo "Bitte installiere Docker mit:"
    echo "  curl -fsSL https://get.docker.com | sh"
    echo "  sudo usermod -aG docker \$USER"
    echo ""
    exit 1
fi

# Prüfe ob Docker Compose Plugin vorhanden ist
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Fehler: Docker Compose Plugin ist nicht installiert!${NC}"
    echo ""
    echo "Bitte installiere es mit:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install docker-compose-plugin"
    echo ""
    exit 1
fi

# Erstelle .env Datei falls nicht vorhanden
if [ ! -f .env ]; then
    echo -e "${YELLOW}Erstelle .env Datei mit Standardwerten...${NC}"
    cat > .env << EOF
# Rheinzelmänner Konfiguration
# ============================

# Port auf dem die App läuft (Standard: 80)
APP_PORT=80

# JWT Secret für Token-Verschlüsselung (ÄNDERN!)
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-key-$(date +%s)")

# Admin Passwort (ÄNDERN!)
ADMIN_PASSWORD=admin123
EOF
    echo -e "${GREEN}[OK] .env Datei erstellt${NC}"
    echo ""
    echo -e "${YELLOW}WICHTIG: Bitte aendere JWT_SECRET und ADMIN_PASSWORD in .env!${NC}"
    echo ""
fi

# Stoppe eventuell laufende Container
echo "Stoppe eventuell laufende Container..."
docker compose down 2>/dev/null || true

# Baue und starte die Container
echo ""
echo "Baue Docker Images (kann beim ersten Mal 5-10 Minuten dauern)..."
echo ""

docker compose build --no-cache

echo ""
echo "Starte alle Services..."
docker compose up -d

# Warte auf Start
echo ""
echo "Warte auf Service-Start..."
sleep 10

# Prüfe Status
echo ""
echo "Service Status:"
echo "==============="
docker compose ps

# Hole IP-Adresse
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Setup abgeschlossen!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Die App ist erreichbar unter:"
echo ""
echo -e "  ${GREEN}http://${IP_ADDRESS}${NC}"
echo ""
echo "Login-Daten:"
echo "  Benutzer: admin"
echo "  Passwort: admin123 (oder wie in .env konfiguriert)"
echo ""
echo "Nuetzliche Befehle:"
echo "  ./stop.sh         - Stoppe alle Services"
echo "  ./logs.sh         - Zeige Logs"
echo "  docker compose ps - Status anzeigen"
echo ""
