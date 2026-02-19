#!/bin/bash
# =============================================================================
# HTTPS Setup Script für Rheinzelmänner (sau-index.de)
# Verwendet Cloudflare Origin Certificate
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"

echo "========================================"
echo "  Rheinzelmänner HTTPS Setup"
echo "  Domain: sau-index.de"
echo "========================================"
echo ""

# Prüfen ob Zertifikate existieren
if [ -f "$CERTS_DIR/sau-index.de.crt" ] && [ -f "$CERTS_DIR/sau-index.de.key" ]; then
    echo "Cloudflare Origin Certificate gefunden:"
    echo "  - $CERTS_DIR/sau-index.de.crt"
    echo "  - $CERTS_DIR/sau-index.de.key"
    echo ""
    echo "Zertifikat-Info:"
    openssl x509 -in "$CERTS_DIR/sau-index.de.crt" -noout -subject -dates
    echo ""
    echo "Status: BEREIT"
    echo ""
    echo "Nächste Schritte (falls Container neu gestartet werden müssen):"
    echo "  1. ./stop.sh"
    echo "  2. ./start.sh"
    echo ""
else
    echo "FEHLER: Zertifikat-Dateien nicht gefunden!"
    echo ""
    echo "Benötigte Dateien:"
    echo "  - $CERTS_DIR/sau-index.de.crt"
    echo "  - $CERTS_DIR/sau-index.de.key"
    echo ""
    echo "Bitte das Cloudflare Origin Certificate in den certs/ Ordner kopieren."
    exit 1
fi
