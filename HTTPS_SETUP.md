# HTTPS Setup mit Cloudflare Origin Certificate

Die Rheinzelmänner-App verwendet ein Cloudflare Origin Certificate für die Domain **sau-index.de**.

---

## Zertifikat-Info

| Eigenschaft | Wert |
|-------------|------|
| Domain | sau-index.de, *.sau-index.de |
| Aussteller | Cloudflare Origin CA |
| Gültig bis | 15. Februar 2041 |
| Typ | Origin Certificate |

---

## Setup (bereits konfiguriert)

### Zertifikat-Dateien

Die Zertifikate befinden sich im `certs/` Ordner:

```
certs/
├── sau-index.de.crt   # SSL-Zertifikat
└── sau-index.de.key   # Privater Schlüssel
```

### Nginx-Konfiguration

Die Nginx-Konfiguration (`frontend/nginx.ssl.conf`) ist bereits für sau-index.de konfiguriert:

```nginx
server {
    listen 443 ssl;
    server_name sau-index.de *.sau-index.de;
    
    ssl_certificate /etc/nginx/certs/sau-index.de.crt;
    ssl_certificate_key /etc/nginx/certs/sau-index.de.key;
    
    # ...
}
```

---

## Deployment

### 1. Zertifikate kopieren

Stelle sicher, dass die Zertifikat-Dateien im `certs/` Ordner vorhanden sind:

```bash
ls -la certs/
# Erwartet:
# sau-index.de.crt
# sau-index.de.key
```

### 2. Starten

```bash
./start.sh
```

### 3. Zugriff

Die App ist erreichbar unter:

```
https://sau-index.de
```

---

## Cloudflare DNS-Einstellungen

Damit die Domain korrekt funktioniert, müssen in Cloudflare folgende Einstellungen vorgenommen werden:

### DNS-Eintrag

| Typ | Name | Inhalt | Proxy |
|-----|------|--------|-------|
| A | sau-index.de | [IP des Raspberry Pi] | Proxied (orange Wolke) |

### SSL/TLS-Modus

In Cloudflare Dashboard → SSL/TLS:

- **SSL/TLS encryption mode:** Full (strict)

Dies ist wichtig, da wir ein Origin Certificate verwenden.

---

## Zertifikat erneuern

Das aktuelle Zertifikat ist bis **2041** gültig. Falls ein neues Zertifikat benötigt wird:

1. Neues Origin Certificate in Cloudflare erstellen:
   - Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
   
2. Dateien ersetzen:
   ```bash
   # Alte Dateien sichern
   mv certs/sau-index.de.crt certs/sau-index.de.crt.backup
   mv certs/sau-index.de.key certs/sau-index.de.key.backup
   
   # Neue Dateien speichern (Inhalt aus Cloudflare)
   nano certs/sau-index.de.crt
   nano certs/sau-index.de.key
   ```

3. Nginx neu starten:
   ```bash
   docker compose restart frontend
   ```

---

## Troubleshooting

### "SSL certificate problem"

- Prüfen ob der SSL/TLS-Modus in Cloudflare auf "Full (strict)" steht
- Prüfen ob die Zertifikat-Dateien korrekt sind

### Zertifikat nicht gefunden

```bash
# Prüfen ob Dateien existieren
ls -la certs/

# Berechtigungen setzen
chmod 644 certs/sau-index.de.crt
chmod 600 certs/sau-index.de.key
```

### Nginx startet nicht

```bash
# Logs prüfen
docker compose logs frontend

# Zertifikat validieren
openssl x509 -in certs/sau-index.de.crt -text -noout
```
