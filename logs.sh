#!/bin/bash

# Rheinzelmänner - Logs anzeigen
# ==============================

echo "Zeige Logs aller Services (STRG+C zum Beenden)..."
echo ""

docker compose logs -f
