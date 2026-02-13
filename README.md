# Rheinzelmänner Verwaltung

Ein modernes Verwaltungssystem für die Rheinzelmänner zur Erfassung und Verwaltung von Strafen und Mitglieder-Rankings.

## Quick Start (Raspberry Pi 4)

```bash
# 1. Repository klonen
git clone https://github.com/DEIN_USERNAME/rheinzelmaenner.git
cd rheinzelmaenner

# 2. Scripts ausführbar machen und starten
chmod +x start.sh stop.sh logs.sh
./start.sh
```

Die App ist dann erreichbar unter:
- **URL:** http://RASPBERRY_PI_IP
- **Login:** admin / admin123

> **Wichtig:** Beim ersten Start wird automatisch ein Admin-Benutzer erstellt. Das Passwort kann über die `.env` Datei angepasst werden.

Detaillierte Anleitung: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

---

## Features

### Authentifizierung & Sicherheit
- JWT-Token basierte Session-Verwaltung
- Passwörter mit bcrypt gehasht
- Passwort-Änderung für angemeldete Benutzer
- Rate Limiting (max. 5 Login-Versuche/Minute)
- Audit-Logging aller Aktionen
- Rollenbasierte Zugriffskontrolle

### Rollen & Berechtigungen

| Rolle | Dashboard | Mitglieder | Statistiken | Strafen | Strafenarten | Benutzerverwaltung |
|-------|-----------|------------|-------------|---------|--------------|-------------------|
| **admin** | Vollzugriff | Vollzugriff | Vollzugriff | Vollzugriff | Vollzugriff | Vollzugriff |
| **spiess** | Vollzugriff | Vollzugriff | Vollzugriff | Vollzugriff | Vollzugriff | - |
| **vorstand** | - | Vollzugriff | Nur Lesen (anonym) | - | Vollzugriff | - |

### Benutzerverwaltung (nur Admin)
- Neue Benutzer anlegen mit Benutzername, Passwort und Rolle
- Benutzer löschen (außer sich selbst und letzter Admin)
- Passwörter zurücksetzen für alle Benutzer

### Dashboard
- Übersichtliches Ranking aller Mitglieder nach Strafensumme
- KPI-Anzeige: "Sau" (höchster Betrag) und "Lämmchen" (niedrigster Betrag)
- Geschäftsjahr-Auswahl (01.08. - 31.07.)
- QR-Code Scanner zur schnellen Mitglieder-Identifikation

### QR-Code System
- Jedes Mitglied hat einen eindeutigen QR-Code
- QR-Codes können als PNG heruntergeladen werden
- Kamera-basierter Scanner mit manuellem Fallback

### Mitgliederverwaltung
- Mitglieder erstellen, bearbeiten und löschen
- Status: Aktiv / Passiv / Archiviert
- Archivierte Mitglieder werden aus Rankings ausgeschlossen
- Sortierbare Liste (Name, Status, Erstellungsdatum)

### Strafenarten-Verwaltung
- Eigene Strafenarten definieren (z.B. "Zu spät", "Fehltermin")
- Feste oder variable Beträge pro Strafenart

### Strafen-Management
- Strafen für Mitglieder erfassen
- Rückwirkende Erfassung mit optionalem Datum (nur auf Strafenübersicht-Seite)
- Automatische Zuordnung zum korrekten Geschäftsjahr
- Bearbeiten und Löschen von Strafen

### Statistiken
- Detaillierte Auswertungen nach Geschäftsjahr
- Balkendiagramm: Top 10 Mitglieder
- Tortendiagramm: Strafen nach Art
- Verlaufsdiagramm: Monatliche Entwicklung

---

## Technologie-Stack

### Backend
- **FastAPI** - Python Web Framework
- **MongoDB 4.4** - NoSQL Datenbank (kompatibel mit Raspberry Pi 4)
- **Motor** - Async MongoDB Driver
- **JWT** - Token-basierte Authentifizierung
- **bcrypt** - Passwort-Hashing
- **slowapi** - Rate Limiting

### Frontend
- **React 19** - UI Framework
- **Tailwind CSS** - Utility-First CSS
- **Shadcn/UI** - UI Component Library
- **Recharts** - Diagramme
- **html5-qrcode** - QR-Code Scanner
- **qrcode.react** - QR-Code Generator
- **Lucide React** - Icons

### Deployment
- **Docker & Docker Compose** - Containerisierung
- **Nginx** - Reverse Proxy (integriert im Frontend-Container)

---

## Systemanforderungen

| Komponente | Minimum | Empfohlen |
|------------|---------|-----------|
| Raspberry Pi | Pi 4 (2GB) | Pi 4 (4GB) oder Pi 5 |
| OS | Raspberry Pi OS 64-bit | Raspberry Pi OS Bookworm 64-bit |
| Speicher | 16GB SD-Karte | 32GB SD-Karte |
| Docker | 20.10+ | Aktuellste Version |

> **Hinweis:** Raspberry Pi 3 und ältere 32-bit Modelle werden nicht unterstützt (MongoDB-Einschränkung).

---

## Projektstruktur

```
rheinzelmaenner/
├── backend/
│   ├── Dockerfile
│   ├── requirements.prod.txt
│   └── server.py
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── public/
│   │   └── logo.png
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       └── pages/
├── docker-compose.yml
├── start.sh
├── stop.sh
├── logs.sh
├── .env.example
├── README.md
└── DOCKER_DEPLOYMENT.md
```

---

## Konfiguration

Erstellen Sie eine `.env` Datei im Hauptverzeichnis (wird automatisch beim ersten Start erstellt):

```env
# Port auf dem die App läuft (Standard: 80)
APP_PORT=80

# JWT Secret für Token-Verschlüsselung (ÄNDERN!)
JWT_SECRET=ihr-geheimer-schluessel

# Admin Passwort beim ersten Start (ÄNDERN!)
ADMIN_PASSWORD=admin123
```

---

## Nützliche Befehle

```bash
# App starten
./start.sh

# App stoppen
./stop.sh

# Logs anzeigen
./logs.sh

# Status prüfen
docker compose ps

# Einzelnen Service neustarten
docker compose restart backend

# Alles löschen und neu starten
docker compose down -v
./start.sh
```

---

## API Endpoints

### Authentifizierung
- `POST /api/auth/login` - Login (Rate Limited)
- `GET /api/auth/me` - Aktueller Benutzer
- `PUT /api/auth/change-password` - Passwort ändern

### Benutzerverwaltung (nur Admin)
- `GET /api/users` - Alle Benutzer
- `POST /api/users` - Benutzer erstellen
- `DELETE /api/users/{id}` - Benutzer löschen
- `PUT /api/users/{id}/reset-password` - Passwort zurücksetzen

### Mitglieder
- `GET /api/members` - Alle Mitglieder
- `POST /api/members` - Neues Mitglied
- `PUT /api/members/{id}` - Mitglied aktualisieren
- `DELETE /api/members/{id}` - Mitglied löschen

### Strafenarten
- `GET /api/fine-types` - Alle Strafenarten
- `POST /api/fine-types` - Neue Strafenart
- `PUT /api/fine-types/{id}` - Strafenart aktualisieren
- `DELETE /api/fine-types/{id}` - Strafenart löschen

### Strafen
- `GET /api/fines` - Strafen abrufen
- `POST /api/fines` - Neue Strafe
- `PUT /api/fines/{id}` - Strafe aktualisieren
- `DELETE /api/fines/{id}` - Strafe löschen

### Statistiken
- `GET /api/statistics?fiscal_year={year}` - Statistiken
- `GET /api/fiscal-years` - Verfügbare Geschäftsjahre

### System
- `GET /health` - Health Check

---

## Geschäftsjahr-Logik

Die Anwendung arbeitet mit Geschäftsjahren (01.08. - 31.07.):
- Beispiel: GJ 2025/2026 = 01.08.2025 bis 31.07.2026
- Alle Strafen und Statistiken werden nach Geschäftsjahr gruppiert

---

## Design

- **Primärfarbe:** #3E875F (Grün)
- **Akzentfarbe:** #F97316 (Orange)
- **Mobile-First** Design
- **Drawer-Navigation** für mobile Geräte

---

## Lizenz

Erstellt für die Rheinzelmänner.
