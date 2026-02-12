# ============================================
# Rheinzelmänner - Docker Deployment Anleitung
# ============================================

## Voraussetzungen auf dem Raspberry Pi

1. Raspberry Pi 4 (empfohlen) mit 64-bit Raspberry Pi OS
2. Docker installiert

### Docker installieren:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Neu einloggen oder: newgrp docker
```

Docker Compose V2 ist in Docker bereits integriert (`docker compose`).

---

## Deployment Schritte

### 1. Code auf den Raspberry Pi übertragen

Option A - Git Clone (wenn auf Github gespeichert):
```bash
git clone https://github.com/DEIN_USERNAME/rheinzelmaenner.git
cd rheinzelmaenner
```

Option B - ZIP übertragen:
```bash
# ZIP auf Pi kopieren (von deinem PC aus):
scp rheinzelmaenner.zip pi@RASPBERRY_IP:/home/pi/

# Auf dem Pi entpacken:
unzip rheinzelmaenner.zip
cd rheinzelmaenner
```

### 2. Start-Script ausführen

```bash
chmod +x start.sh
./start.sh
```

Das Script:
- Konfiguriert alle Umgebungsvariablen
- Baut und startet alle Docker Container

### 3. App aufrufen

- **Frontend:** http://RASPBERRY_PI_IP:3000
- **Backend API:** http://RASPBERRY_PI_IP:8001/api
- **Login:** admin / admin123

---

## Architektur

```
                    ┌─────────────────┐
                    │   Browser       │
                    └───┬─────────┬───┘
                        │         │
              Port 3000 │         │ Port 8001
              ┌─────────▼─┐   ┌───▼─────────┐
              │ Frontend  │   │  Backend    │
              │ (React)   │   │  (FastAPI)  │
              └───────────┘   └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │  MongoDB    │
                              └─────────────┘
```

---

## Nützliche Befehle

```bash
# Container stoppen:
docker compose down

# Container neustarten:
docker compose restart

# Logs anzeigen:
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Status prüfen:
docker compose ps

# Datenbank-Backup:
docker exec rheinzel-mongodb mongodump --out /backup
docker cp rheinzel-mongodb:/backup ./backup

# Alles löschen und neu bauen:
docker compose down -v
docker compose up -d --build
```

---

## Troubleshooting

### Container startet nicht:
```bash
docker compose logs backend
docker compose logs frontend
```

### MongoDB Verbindungsfehler:
- Warte 30 Sekunden nach Start
- Prüfe: `docker compose ps` - alle Container "Up"?

### Frontend zeigt nichts an:
- Prüfe REACT_APP_BACKEND_URL in frontend/.env
- Muss die IP des Raspberry Pi sein, nicht localhost!

### Zu wenig Speicher:
- Raspberry Pi 4 mit min. 2GB RAM empfohlen
- `docker system prune -a` um alte Images zu löschen
