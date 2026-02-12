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

# Docker Compose installieren
sudo apt install docker-compose -y
```

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

### 2. Umgebungsvariablen anpassen

Backend (.env):
```bash
nano backend/.env
```
Inhalt:
```
MONGO_URL=mongodb://mongodb:27017
DB_NAME=rheinzelmaenner
JWT_SECRET=dein-geheimer-schluessel-hier-aendern
```

Frontend (.env):
```bash
nano frontend/.env
```
Inhalt (RASPBERRY_IP durch die IP deines Pi ersetzen):
```
REACT_APP_BACKEND_URL=http://RASPBERRY_IP:8001
```

### 3. Docker Container bauen und starten

```bash
# Im Hauptverzeichnis (wo docker-compose.yml liegt):
docker-compose up -d --build

# Logs anzeigen:
docker-compose logs -f

# Status prüfen:
docker-compose ps
```

### 4. App aufrufen

- Frontend: http://RASPBERRY_IP:3000
- Backend API: http://RASPBERRY_IP:8001/api

Login: admin / admin123

---

## Nützliche Befehle

```bash
# Container stoppen:
docker-compose down

# Container neustarten:
docker-compose restart

# Logs anzeigen:
docker-compose logs -f backend
docker-compose logs -f frontend

# Datenbank-Backup:
docker exec mongodb mongodump --out /backup
docker cp mongodb:/backup ./backup

# Alles löschen und neu bauen:
docker-compose down -v
docker-compose up -d --build
```

---

## Autostart nach Reboot

Docker-Container starten automatisch neu (restart: unless-stopped).
Falls nicht, aktiviere den Docker-Service:

```bash
sudo systemctl enable docker
```

---

## Troubleshooting

### Container startet nicht:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### MongoDB Verbindungsfehler:
- Warte 30 Sekunden nach Start (MongoDB braucht Zeit)
- Prüfe: `docker-compose ps` - alle Container "Up"?

### Frontend zeigt nichts an:
- Prüfe REACT_APP_BACKEND_URL in frontend/.env
- Muss die IP des Raspberry Pi sein, nicht localhost!

### Zu wenig Speicher:
- Raspberry Pi 4 mit min. 2GB RAM empfohlen
- `docker system prune` um alte Images zu löschen
