#!/bin/bash
# =============================================================================
# HTTPS Setup Script für Rheinzelmänner
# Erstellt ein selbstsigniertes SSL-Zertifikat
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"

echo "========================================"
echo "  Rheinzelmänner HTTPS Setup"
echo "========================================"
echo ""

# Ordner erstellen
mkdir -p "$CERTS_DIR"

# IP-Adresse ermitteln
IP_ADDR=$(hostname -I | awk '{print $1}')
if [ -z "$IP_ADDR" ]; then
    IP_ADDR="192.168.1.1"
    echo "WARNUNG: Konnte IP-Adresse nicht ermitteln. Verwende $IP_ADDR"
fi

echo "Erkannte IP-Adresse: $IP_ADDR"
echo ""

# Prüfen ob Zertifikat bereits existiert
if [ -f "$CERTS_DIR/server.crt" ] && [ -f "$CERTS_DIR/server.key" ]; then
    echo "Zertifikat existiert bereits in $CERTS_DIR"
    read -p "Überschreiben? (j/N): " OVERWRITE
    if [ "$OVERWRITE" != "j" ] && [ "$OVERWRITE" != "J" ]; then
        echo "Abgebrochen."
        exit 0
    fi
fi

echo ""
echo "Erstelle selbstsigniertes Zertifikat..."
echo ""

# Zertifikat erstellen (gültig für 365 Tage)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERTS_DIR/server.key" \
    -out "$CERTS_DIR/server.crt" \
    -subj "/CN=rheinzelmaenner/O=Rheinzelmaenner/C=DE" \
    -addext "subjectAltName=DNS:localhost,DNS:rheinzelmaenner,IP:127.0.0.1,IP:$IP_ADDR"

# Berechtigungen setzen
chmod 644 "$CERTS_DIR/server.crt"
chmod 600 "$CERTS_DIR/server.key"

echo ""
echo "========================================"
echo "  Zertifikat erfolgreich erstellt!"
echo "========================================"
echo ""
echo "Dateien:"
echo "  - $CERTS_DIR/server.crt"
echo "  - $CERTS_DIR/server.key"
echo ""
echo "Gültig bis: $(openssl x509 -in "$CERTS_DIR/server.crt" -noout -enddate | cut -d= -f2)"
echo ""
echo "Nächste Schritte:"
echo "  1. ./stop.sh"
echo "  2. ./start.sh"
echo "  3. Im Browser öffnen: https://$IP_ADDR"
echo ""
echo "HINWEIS: Der Browser zeigt eine Sicherheitswarnung."
echo "         Klicke auf 'Erweitert' -> 'Weiter zu ...' um fortzufahren."
echo ""
