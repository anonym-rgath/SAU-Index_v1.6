# Rheinzelmänner - Docker Deployment Guide

Detaillierte Anleitung zur Installation auf einem Raspberry Pi.

## Voraussetzungen

- **Raspberry Pi 4** (4GB+ RAM empfohlen) oder **Raspberry Pi 5**
- **Raspberry Pi OS** (64-bit, Bookworm empfohlen)
- **SD-Karte** mit min. 16GB
- **Netzwerk-Zugang** (LAN oder WLAN)

> **Hinweis:** Raspberry Pi 3 oder ältere 32-bit Modelle werden aufgrund von MongoDB-Einschränkungen nicht unterstützt.

---

## Architektur

```
                    +------------------+
                    |     Browser      |
                    +--------+---------+
                             |
                        Port 80
                             |
              +--------------v--------------+
              |   Frontend Container        |
              |   (React + Nginx)           |
              |   - Statische Dateien       |
              |   - API Proxy -> Backend    |
              +--------------+--------------+
                             |
                      /api/* Requests
                             |
              +--------------v--------------+
              |   Backend Container         |
              |   (FastAPI + Python)        |
              +--------------+--------------+
                             |
              +--------------v--------------+
              |   MongoDB Container         |
              |   (Datenbank)               |
              +-----------------------------+
```

---

## Installation

### 1. Docker installieren

```bash
# Docker installieren
curl -fsSL https://get.docker.com | sh

# Benutzer zur Docker-Gruppe hinzufügen
sudo usermod -aG docker $USER

# Abmelden und neu anmelden (wichtig!)
exit
# Dann erneut per SSH verbinden
```

### 2. Docker Compose Plugin installieren

```bash
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Prüfen ob es funktioniert
docker compose version
```

### 3. Projekt herunterladen

**Option A - Git Clone (empfohlen):**
```bash
cd ~
git clone https://github.com/DEIN_USERNAME/rheinzelmaenner.git
cd rheinzelmaenner
```

**Option B - ZIP übertragen:**
```bash
# Auf deinem PC:
scp rheinzelmaenner.zip pi@RASPBERRY_PI_IP:/home/pi/

# Auf dem Raspberry Pi:
cd ~
unzip rheinzelmaenner.zip
cd rheinzelmaenner
```

### 4. Konfiguration anpassen (optional aber empfohlen)

Erstelle eine `.env` Datei im Projektordner:

```bash
nano .env
```

Inhalt:

```env
# Port auf dem die App läuft
APP_PORT=80

# JWT Secret (UNBEDINGT ÄNDERN für Produktion!)
JWT_SECRET=dein-sehr-langer-geheimer-schluessel-hier

# Admin Passwort (UNBEDINGT ÄNDERN!)
ADMIN_PASSWORD=dein-sicheres-passwort
```

> **Tipp:** Ein sicheres JWT_SECRET kannst du so generieren:
> ```bash
> openssl rand -hex 32
> ```

### 5. App starten

```bash
# Scripts ausführbar machen
chmod +x start.sh stop.sh logs.sh

# App starten
./start.sh
```

**Hinweis:** Der erste Start dauert 5-10 Minuten, da alle Docker Images gebaut werden müssen.

---

## Zugriff auf die App

Nach erfolgreichem Start:

1. **IP-Adresse des Raspberry Pi herausfinden:**
   ```bash
   hostname -I
   ```

2. **App im Browser öffnen:**
   ```
   http://[IP-ADRESSE]
   ```
   Beispiel: `http://192.168.1.100`

3. **Login:**
   - Benutzer: `admin`
   - Passwort: `admin123` (oder wie in `.env` konfiguriert)

---

## Verfügbare Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `./start.sh` | App starten (baut bei Bedarf neu) |
| `./stop.sh` | App stoppen |
| `./logs.sh` | Logs aller Services anzeigen |
| `docker compose ps` | Status aller Container |
| `docker compose restart` | Alle Services neu starten |
| `docker compose down -v` | Alles löschen inkl. Datenbank |

---

## Troubleshooting

### Container starten nicht

```bash
# Alle Logs prüfen
./logs.sh

# Nur Backend-Logs
docker compose logs backend

# Nur MongoDB-Logs
docker compose logs mongodb
```

### Port 80 bereits belegt

Falls ein anderer Dienst (z.B. Apache) Port 80 nutzt:

```bash
# Option 1: Apache deaktivieren
sudo systemctl stop apache2
sudo systemctl disable apache2

# Option 2: Anderen Port nutzen
# In .env Datei: APP_PORT=8080
# Dann: ./start.sh
```

### MongoDB startet nicht (Speicher)

```bash
# Speicher prüfen
free -h

# Swap erhöhen falls nötig
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Setze: CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Alles zurücksetzen

```bash
# ACHTUNG: Löscht alle Daten!
docker compose down -v
./start.sh
```

---

## Automatischer Start beim Booten

Damit die App nach einem Neustart des Raspberry Pi automatisch startet:

```bash
# Systemd Service erstellen
sudo nano /etc/systemd/system/rheinzelmaenner.service
```

Inhalt (passe den Pfad an deinen Benutzernamen an):

```ini
[Unit]
Description=Rheinzelmaenner Verwaltung
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/rheinzelmaenner
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=pi

[Install]
WantedBy=multi-user.target
```

Aktivieren:

```bash
sudo systemctl daemon-reload
sudo systemctl enable rheinzelmaenner.service

# Testen (optional)
sudo systemctl start rheinzelmaenner.service
sudo systemctl status rheinzelmaenner.service
```

---

## Backup & Restore

### Datenbank sichern

```bash
# Backup erstellen
docker compose exec mongodb mongodump --out /data/backup

# Backup aus Container kopieren
docker cp rheinzel-mongodb:/data/backup ./backup_$(date +%Y%m%d)

# Backup archivieren
tar -czvf backup_$(date +%Y%m%d).tar.gz backup_$(date +%Y%m%d)
```

### Datenbank wiederherstellen

```bash
# Backup entpacken (falls archiviert)
tar -xzvf backup_20241215.tar.gz

# Backup in Container kopieren
docker cp ./backup_20241215 rheinzel-mongodb:/data/backup

# Wiederherstellen
docker compose exec mongodb mongorestore /data/backup
```

---

## Updates

```bash
# Neueste Version holen (bei Git Clone)
git pull

# Neu bauen und starten
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Sicherheitshinweise

1. **Admin-Passwort ändern:** Nach der ersten Anmeldung unbedingt ein sicheres Passwort setzen
2. **JWT_SECRET:** Verwende einen zufälligen String mit min. 32 Zeichen
3. **Lokales Netzwerk:** Die App ist standardmäßig nur im lokalen Netzwerk erreichbar
4. **Firewall:** Bei Bedarf Port 80 in der Router-Firewall für externen Zugriff freigeben

---

## Technische Details

- **Frontend:** React 19 mit Nginx als Webserver und Reverse Proxy
- **Backend:** FastAPI (Python) auf Port 8001 (intern)
- **Datenbank:** MongoDB 6
- **Alle Services:** ARM64-kompatibel für Raspberry Pi
