# HTTPS Setup mit selbstsigniertem Zertifikat

Anleitung zur Einrichtung von HTTPS für die Rheinzelmänner-App auf dem Raspberry Pi.

> **Hinweis:** Bei selbstsignierten Zertifikaten zeigt der Browser eine Sicherheitswarnung. Diese muss einmalig bestätigt werden.

---

## Schnell-Setup (empfohlen)

### 1. Zertifikat erstellen

Auf dem Raspberry Pi ausführen:

```bash
cd ~/SAU-Index_v1.4_docker

# Ordner für Zertifikate erstellen
mkdir -p certs

# Selbstsigniertes Zertifikat erstellen (gültig für 1 Jahr)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/server.key \
  -out certs/server.crt \
  -subj "/CN=rheinzelmaenner/O=Rheinzelmaenner/C=DE" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$(hostname -I | awk '{print $1}')"
```

### 2. Nginx-Konfiguration für HTTPS

Erstelle eine neue Nginx-Konfiguration:

```bash
nano frontend/nginx.ssl.conf
```

Inhalt:

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name _;
    
    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Gzip Komprimierung
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # Frontend (React SPA)
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy zum Backend
    location /api/ {
        proxy_pass http://backend:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Docker Compose anpassen

Bearbeite `docker-compose.yml`:

```bash
nano docker-compose.yml
```

Ersetze den `frontend` Service mit:

```yaml
  # React Frontend mit Nginx (HTTPS)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: rheinzel-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./certs:/etc/nginx/certs:ro
      - ./frontend/nginx.ssl.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
    networks:
      - rheinzel-network
```

### 4. Neu starten

```bash
docker compose down
docker compose up -d
```

### 5. Im Browser öffnen

```
https://192.168.x.x
```

Bei der Sicherheitswarnung:
- **Chrome:** "Erweitert" → "Weiter zu ... (unsicher)"
- **Firefox:** "Erweitert" → "Risiko akzeptieren und fortfahren"
- **Safari:** "Details anzeigen" → "Diese Website besuchen"

---

## Zertifikat auf Geräten vertrauen (optional)

Um die Browserwarnung dauerhaft zu vermeiden:

### iPhone/iPad

1. Zertifikat herunterladen: `http://192.168.x.x:8080/server.crt` (separaten Server starten, siehe unten)
2. Einstellungen → "Profil geladen" → Installieren
3. Einstellungen → Allgemein → Info → Zertifikatsvertrauenseinstellungen → Aktivieren

### Android

1. Zertifikat auf Gerät kopieren
2. Einstellungen → Sicherheit → Zertifikate installieren

### Windows

1. Doppelklick auf `server.crt`
2. "Zertifikat installieren" → "Lokaler Computer" → "Vertrauenswürdige Stammzertifizierungsstellen"

### macOS

1. Doppelklick auf `server.crt`
2. Schlüsselbund öffnet sich → "Hinzufügen"
3. Zertifikat suchen → Doppelklick → "Vertrauen" → "Immer vertrauen"

---

## Zertifikat zum Download bereitstellen

Temporären Server starten um das Zertifikat herunterzuladen:

```bash
cd ~/SAU-Index_v1.4_docker/certs
python3 -m http.server 8080
```

Dann im Browser: `http://192.168.x.x:8080/server.crt`

Nach dem Download Server mit `STRG+C` beenden.

---

## Zertifikat erneuern

Nach einem Jahr läuft das Zertifikat ab. Erneuern mit:

```bash
cd ~/SAU-Index_v1.4_docker

# Altes Zertifikat löschen
rm certs/server.key certs/server.crt

# Neues erstellen
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/server.key \
  -out certs/server.crt \
  -subj "/CN=rheinzelmaenner/O=Rheinzelmaenner/C=DE" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$(hostname -I | awk '{print $1}')"

# Nginx neu starten
docker compose restart frontend
```

---

## Zurück zu HTTP

Falls HTTPS nicht benötigt wird:

```bash
# docker-compose.yml zurücksetzen (Port 443 und volumes entfernen)
nano docker-compose.yml

# Nur Port 80 und ohne volumes:
#   frontend:
#     ...
#     ports:
#       - "80:80"
#     # volumes: entfernen

docker compose down
docker compose up -d
```

---

## Troubleshooting

### "NET::ERR_CERT_INVALID"

Normal bei selbstsignierten Zertifikaten. Warnung bestätigen.

### Kamera funktioniert immer noch nicht

1. Prüfen ob HTTPS aktiv: URL muss mit `https://` beginnen
2. Browser-Berechtigung prüfen: Kamera-Symbol in der Adressleiste
3. Seite neu laden nach Zertifikatsbestätigung

### Zertifikat nicht gefunden

```bash
# Prüfen ob Dateien existieren
ls -la certs/

# Berechtigungen setzen
chmod 644 certs/server.crt
chmod 600 certs/server.key
```
