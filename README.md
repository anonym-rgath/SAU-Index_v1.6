# Rheinzelmänner Verwaltung

Ein modernes Verwaltungssystem für die Rheinzelmänner zur Erfassung und Verwaltung von Strafen und Mitglieder-Rankings.

## 🚀 Quick Start (Docker auf Raspberry Pi)

```bash
# 1. Code auf Raspberry Pi übertragen
git clone https://github.com/DEIN_USERNAME/rheinzelmaenner.git
cd rheinzelmaenner

# 2. Start-Script ausführen
chmod +x start.sh
./start.sh
```

Die App ist dann erreichbar unter:
- **URL:** https://RASPBERRY_PI_IP (Port 443, HTTPS)
- **Login:** admin / admin123

⚠️ Browser zeigt Sicherheitswarnung (selbstsigniertes Zertifikat) - einfach akzeptieren.

Detaillierte Anleitung: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

---

## Features

### Authentifizierung & Sicherheit
- JWT-Token basierte Session-Verwaltung
- Passwörter mit bcrypt gehasht
- **Passwort-Änderung** für angemeldete Benutzer (über Benutzermenü)
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
- **Passwörter zurücksetzen** für alle Benutzer

### Dashboard
- Übersichtliches Ranking aller Mitglieder nach Strafensumme
- KPI-Anzeige: "Sau" (höchster Betrag) und "Lämmchen" (niedrigster Betrag)
- Geschäftsjahr-Auswahl (01.08. - 31.07.)
- QR-Code Scanner zur schnellen Mitglieder-Identifikation

### QR-Code System
- Jedes Mitglied hat einen eindeutigen QR-Code
- QR-Codes können als PNG heruntergeladen werden
- Kamera-basierter Scanner mit manuellem Fallback
- Funktioniert auf allen Geräten (iPhone, Android, Desktop)

### Mitgliederverwaltung
- Mitglieder erstellen, bearbeiten und löschen
- Status: Aktiv / Passiv / Archiviert
- Archivierte Mitglieder werden aus Rankings ausgeschlossen
- QR-Code Generator für jedes Mitglied
- Sortierbare Liste (Name, Status, Erstellungsdatum)

### Strafenarten-Verwaltung
- Eigene Strafenarten definieren (z.B. "Zu spät", "Fehltermin")
- Feste oder variable Beträge pro Strafenart

### Strafen-Management
- Strafen für Mitglieder erfassen
- **Rückwirkende Erfassung**: Auf der Strafenübersicht-Seite kann ein optionales Datum angegeben werden
- Automatische Zuordnung zum korrekten Geschäftsjahr basierend auf Datum
- Bearbeiten und Löschen von Strafen

### Statistiken
- Detaillierte Auswertungen nach Geschäftsjahr
- Balkendiagramm: Top 10 Mitglieder
- Tortendiagramm: Strafen nach Art
- Verlaufsdiagramm: Monatliche Entwicklung
- Aktive vs. Passive Mitglieder Ranking

## Technologie-Stack

### Backend
- **FastAPI** - Python Web Framework
- **MongoDB** - NoSQL Datenbank
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

## Login-Daten

| Benutzer | Passwort | Rolle |
|----------|----------|-------|
| admin | admin123 | Admin (Vollzugriff) |

*Weitere Benutzer können über die Benutzerverwaltung angelegt werden.*

## API Endpoints

### Authentifizierung
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Aktueller Benutzer
- `PUT /api/auth/change-password` - Passwort ändern
  - Body: `{ current_password, new_password }`
  - Mindestlänge neues Passwort: 6 Zeichen

### Benutzerverwaltung (nur Admin)
- `GET /api/users` - Alle Benutzer
- `POST /api/users` - Benutzer erstellen
  - Body: `{ username, password, role }`
  - Rollen: `admin`, `spiess`, `vorstand`
- `DELETE /api/users/{id}` - Benutzer löschen
- `PUT /api/users/{id}/reset-password` - Passwort zurücksetzen
  - Body: `{ new_password }`

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
- `GET /api/fines` - Strafen abrufen (optional: `?fiscal_year=2025/2026`)
- `POST /api/fines` - Neue Strafe erstellen
  - Body: `{ member_id, fine_type_id, amount, date?, notes? }`
  - `date` (optional): ISO-Format für rückwirkende Einträge (z.B. "2024-10-15")
- `PUT /api/fines/{id}` - Strafe aktualisieren
- `DELETE /api/fines/{id}` - Strafe löschen

### Statistiken
- `GET /api/statistics?fiscal_year={year}` - Statistiken
- `GET /api/fiscal-years` - Verfügbare Geschäftsjahre

### Audit
- `GET /api/audit-logs` - Audit-Logs (nur Admin)

## Projektstruktur

```
/app
├── backend/
│   ├── server.py           # FastAPI Backend
│   ├── .env                # Umgebungsvariablen
│   └── requirements.txt    # Python Dependencies
├── frontend/
│   ├── public/
│   │   └── logo.png        # Vereinslogo
│   ├── src/
│   │   ├── components/     # React Komponenten
│   │   ├── pages/          # Seiten
│   │   ├── contexts/       # Auth Context
│   │   └── lib/            # Utils & API
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Geschäftsjahr-Logik

Die Anwendung arbeitet mit Geschäftsjahren (01.08. - 31.07.):
- Beispiel: GJ 2025/2026 = 01.08.2025 bis 31.07.2026
- Alle Strafen und Statistiken werden nach Geschäftsjahr gruppiert

## Design

- **Primärfarbe**: RGB 62/135/95 (#3E875F)
- **Akzentfarbe**: Orange (#F97316)
- **Mobile-First** Design
- **Drawer-Navigation** für mobile Geräte

---

**Erstellt für die Rheinzelmänner**
