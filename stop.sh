#!/bin/bash

# Rheinzelmänner - Stop Script
# ============================

echo "Stoppe alle Rheinzelmänner Services..."
docker compose down

echo ""
echo "Alle Services wurden gestoppt."
echo ""
echo "Die Datenbank-Daten bleiben erhalten."
echo "Zum Löschen aller Daten: docker volume rm rheinzelmaenner_mongodb_data"
