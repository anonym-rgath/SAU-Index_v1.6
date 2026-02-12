# ============================================
# Rheinzelmänner - Docker Deployment Anleitung
# ============================================

## Voraussetzungen auf dem Raspberry Pi

1. Raspberry Pi 4 (empfohlen) mit 64-bit Raspberry Pi OS
2. Docker und Docker Compose installiert

### Docker installieren:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Neu einloggen oder: newgrp docker
```

Docker Compose V2 ist in Docker bereits integriert (`docker compose` statt `docker-compose`).

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
- Erstellt automatisch SSL-Zertifikate (selbstsigniert)
- Konfiguriert alle Umgebungsvariablen
- Baut und startet alle Docker Container

### 3. App aufrufen

- **URL:** https://RASPBERRY_PI_IP (Port 443)
- **Login:** admin / admin123

⚠️ **Hinweis:** Der Browser zeigt eine Sicherheitswarnung wegen des selbstsignierten Zertifikats. 
Klicke auf "Erweitert" → "Weiter zu [IP] (unsicher)" um fortzufahren.

---

## Architektur

```
                    ┌─────────────────┐
                    │   Browser       │
                    └────────┬────────┘
                             │ HTTPS (443)
                    ┌────────▼────────┐
                    │  Nginx Proxy    │
                    │  (SSL/TLS)      │
                    └───┬─────────┬───┘
                        │         │
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
docker compose logs -f nginx
docker compose logs -f backend

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

## SSL-Zertifikate

### Selbstsigniertes Zertifikat (Standard)
Wird automatisch vom start.sh Script erstellt. Browser zeigt Warnung - für lokale Nutzung OK.

### Let's Encrypt (für öffentliche Domain)
Falls du eine Domain hast und die App öffentlich erreichbar machen willst:

```bash
# Certbot installieren
sudo apt install certbot -y

# Zertifikat erstellen (Port 80 muss erreichbar sein)
sudo certbot certonly --standalone -d deine-domain.de

# Zertifikate kopieren
sudo cp /etc/letsencrypt/live/deine-domain.de/fullchain.pem nginx/certs/cert.pem
sudo cp /etc/letsencrypt/live/deine-domain.de/privkey.pem nginx/certs/key.pem

# Container neustarten
docker compose restart nginx
```

---

## Troubleshooting

### Container startet nicht:
```bash
docker-compose logs nginx
docker-compose logs backend
```

### SSL-Fehler:
- Prüfe ob Zertifikate existieren: `ls -la nginx/certs/`
- Neu erstellen: `rm -rf nginx/certs && ./start.sh`

### MongoDB Verbindungsfehler:
- Warte 30 Sekunden nach Start
- Prüfe: `docker compose ps` - alle Container "Up"?

### Zu wenig Speicher:
- Raspberry Pi 4 mit min. 2GB RAM empfohlen
- `docker system prune -a` um alte Images zu löschen
