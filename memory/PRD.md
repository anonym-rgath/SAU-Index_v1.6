# Rheinzelmänner - Product Requirements Document

## Original Problem Statement
Entwicklung einer Full-Stack-Webanwendung für einen "Schützenzug" (später umbenannt zu "Rheinzelmänner"), um Mitglieder und deren Strafen zu verwalten und ein Ranking basierend auf Strafen zu erstellen.

## User Personas
- **Admin**: Vollzugriff auf alle Funktionen (CRUD für Mitglieder, Strafen, Strafarten, Benutzerverwaltung, Audit-Log)
- **Spiess**: Vollzugriff wie Admin, außer Benutzerverwaltung und Audit-Log
- **Vorstand**: Eingeschränkter Zugriff (Mitglieder CRUD, Statistiken anonymisiert, Strafenarten CRUD)
- **Mitglied**: Nur eigene Daten (Dashboard mit eigenen Strafen, Strafenübersicht nur eigene)

## Core Requirements
- Benutzerverwaltung mit Rollen (admin/spiess/vorstand/mitglied)
- Mitgliederverwaltung (Vorname, Nachname, Status aktiv/passiv/archiviert)
- Strafenverwaltung mit konfigurierbaren Strafarten
- Rückwirkende Strafenerfassung (nur auf Strafenübersicht-Seite)
- Ranking basierend auf Geschäftsjahr (01.08. - 31.07.)
- Mobile-First Design mit Drawer-Navigation
- Statistik-Seite mit Diagrammen und KPIs
- QR-Code System zur Mitglieder-Identifikation
- Persönliches Dashboard für Mitglieder (nur eigene Strafen/Rang)

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, lucide-react, recharts, html5-qrcode, qrcode.react
- **Backend**: Python FastAPI, slowapi (Rate Limiting)
- **Database**: MongoDB
- **Auth**: JWT mit bcrypt Passwort-Hashing
- **Security**: Rate Limiting (5 Login-Versuche/Minute), Audit Logging
- **Deployment**: Docker, Docker Compose, Nginx (Reverse Proxy)

## Login Credentials
- Admin: `admin` / `admin123`

*Weitere Benutzer können vom Admin über die Benutzerverwaltung angelegt werden.*

---

## Completed Features

### 2025-02-18 (Current Session)
- [x] **Spieß mit Mitglied-Verknüpfung**: 
  - Spieß-Benutzer können jetzt optional einem Mitglied zugeordnet werden
  - Benutzerverwaltung zeigt "Verknüpftes Mitglied (optional)" Dropdown für Spieß-Rolle
  - Dashboard für Spieß mit verlinktem Mitglied zeigt zusätzlich "Meine Strafen"-Bereich
  - Spieß behält vollen Admin-Dashboard-Zugriff (Sau, Lämmchen, Ranking, Letzte Strafen)
  - 10/10 Backend-Tests bestanden (`/app/backend/tests/test_spiess_member_link.py`)
- [x] **Rolle "Mitglied" implementiert**:
  - Neue Rolle "mitglied" im Backend und Frontend
  - Mitglieder-Benutzer werden mit einem Mitglied verknüpft (member_id)
  - Persönliches Dashboard zeigt nur eigene Strafen und Rang
  - Mitglieder sehen nur eigene Daten (Fines API gefiltert)
  - Neuer API-Endpoint `/api/statistics/personal` für persönliche Statistiken
  - Benutzerverwaltung zeigt verknüpftes Mitglied an
  - Navigation für Mitglieder eingeschränkt (nur Dashboard und Strafenübersicht)
- [x] **README.md überarbeitet**: Neue Struktur mit 10 Abschnitten, inkl. Berechtigungsmatrix mit 4 Rollen

### 2025-02-17 (Previous Session)
- [x] **Mobile-First UI Review abgeschlossen**: Alle Seiten auf mobile Responsiveness geprüft
  - Login-Seite: Responsive
  - Dashboard: Responsive, KPI-Cards in Grid-Layout
  - Mitglieder-Seite: Responsive, Buttons angepasst ("Neu" statt "Mitglied" auf Mobile)
  - Statistiken-Seite: Responsive, Charts und KPIs gut lesbar
  - Strafen-Seite: Responsive, Strafenliste übersichtlich
  - Strafenarten-Seite: Responsive
  - Benutzerverwaltung: Responsive
  - Audit-Log: Responsive, Suchfeld und Filter funktional
- [x] **HTTPS erzwungen**: Self-Signed SSL-Zertifikate standardmäßig aktiviert
  - Neue `nginx.ssl.conf` mit HTTP->HTTPS Redirect
  - `docker-compose.yml` aktualisiert für Ports 80 + 443
  - Automatische Zertifikatserstellung im `start.sh` Script
  - Neues `setup-https.sh` Script zum manuellen Erneuern
  - `HTTPS_SETUP.md` Anleitung bereits vorhanden

### 2025-12-14 (Previous Session)
- [x] **Docker Deployment für Raspberry Pi**: Vollständiges Setup
  - `docker-compose.yml` mit MongoDB, Backend, Frontend
  - ARM64-kompatible Images (Raspberry Pi 4/5)
  - Nginx Reverse Proxy integriert im Frontend-Container
  - Health-Checks für alle Services
  - Environment-Variablen über `.env` konfigurierbar
  - `start.sh`, `stop.sh`, `logs.sh` Scripts
  - Detaillierte Dokumentation in `DOCKER_DEPLOYMENT.md`
- [x] **Health-Check Endpoint**: `/health` im Backend für Docker-Monitoring

### 2025-02-12 (Previous Session)
- [x] **Benutzerverwaltung (Admin)**: Vollständige Benutzer-Administration
  - Neue Benutzer anlegen mit Benutzername, Passwort und Rolle
  - Benutzer löschen (mit Schutz für letzten Admin)
  - **Passwörter zurücksetzen** für alle Benutzer
  - Neue Seite `/users` nur für Admin sichtbar
- [x] **Passwort-Änderung**: Angemeldete Benutzer können ihr Passwort ändern
  - Backend: PUT /api/auth/change-password mit Validierung
  - Frontend: Benutzeranzeige im Drawer-Menü (unten)
  - Benutzernamen werden großgeschrieben angezeigt
- [x] **Rückwirkende Strafenerfassung**: Optionales Datumsfeld beim Erstellen von Strafen
  - Backend: POST /api/fines akzeptiert optionales `date` (ISO-Format)
  - Geschäftsjahr wird automatisch basierend auf Datum berechnet
  - Frontend: AddFineDialog mit Datumsfeld "Datum (optional)" - **nur auf Strafenübersicht-Seite**
  - Dashboard: Schnelle Erfassung ohne Datumsfeld (nutzt aktuelles Datum)

### 2025-02 (Previous Updates)
- [x] Icon-Änderung: TrendingUp für "Durchschnitt" auf Statistik-Seite
- [x] Icon-Änderung: Wallet für "Lämmchen" auf Dashboard
- [x] Icon-Änderung: Coins für "Gesamt" auf Statistik-Seite
- [x] Menü-Reihenfolge angepasst: Dashboard → Mitglieder → Statistiken → Strafen → Strafenarten
- [x] Test-Benutzer Hinweis von Login-Seite entfernt
- [x] Lämmchen-Logik korrigiert: Zeigt jetzt niedrigsten Betrag (statt zweithöchsten)
- [x] QR-Code Scanner implementiert (Kamera-basiert, mit manuellem Fallback)
- [x] QR-Code Generator für Mitglieder (Download als PNG)
- [x] NFC-Referenzen entfernt
- [x] Neue Rolle "spiess" hinzugefügt
- [x] Vorstand-Berechtigungen angepasst (nur Mitglieder, Statistiken anonym, Strafenarten)
- [x] Statistik-Seite für Vorstand anonymisiert (keine Namen sichtbar)
- [x] Security-Upgrade: Rate Limiting, Audit Logging, sichere JWT-Konfiguration
- [x] Mitglieder-Archivierungssystem (Status "archiviert", ausgeschlossen von Rankings)
- [x] Strafen von Strafenübersicht-Seite erstellen

### Previous Sessions
- [x] Vollständige Full-Stack-Anwendung aufgebaut
- [x] JWT-Authentifizierung mit admin/vorstand Rollen
- [x] CRUD für Mitglieder, Strafen, Strafarten
- [x] Mobile-First Redesign mit Drawer-Navigation
- [x] Geschäftsjahr-Logik (01.08. - 31.07.)
- [x] Statistik-Seite mit recharts Diagrammen
- [x] Mitglieder-Sortierung (Name, Status, Erstellungsdatum)
- [x] Rebranding zu "Rheinzelmänner"

---

## Backlog

### P2 - Future Tasks
- [ ] **Automatisches Datenbank-Backup** - Wöchentliches Backup der MongoDB
- [ ] Daten-Export (CSV/PDF)

### P3 - Potential Improvements
- [ ] Backend-Refactoring: `server.py` in Module aufteilen (APIRouter für users, fines, members)
- [ ] Komponentenrefactoring (Dashboard.js, Members.js aufteilen)
- [ ] Offline-Unterstützung / PWA

---

## Key Files
- `/app/backend/server.py` - Backend API
- `/app/docker-compose.yml` - Docker Compose Konfiguration
- `/app/backend/Dockerfile` - Backend Docker Image
- `/app/frontend/Dockerfile` - Frontend Docker Image
- `/app/frontend/nginx.conf` - Nginx Reverse Proxy Config
- `/app/start.sh` - Start-Script für Raspberry Pi
- `/app/DOCKER_DEPLOYMENT.md` - Deployment Anleitung
- `/app/frontend/src/pages/Dashboard.js` - Dashboard mit Ranking
- `/app/frontend/src/pages/Statistics.js` - Statistik-Seite
- `/app/frontend/src/pages/Members.js` - Mitgliederverwaltung
- `/app/frontend/src/pages/Fines.js` - Strafenübersicht
- `/app/frontend/src/pages/UserManagement.js` - Benutzerverwaltung (nur Admin)
- `/app/frontend/src/components/AddFineDialog.js` - Dialog zur Strafenerfassung
- `/app/frontend/src/components/ChangePasswordDialog.js` - Dialog zur Passwortänderung
- `/app/frontend/src/components/TopBar.js` - Navigation mit Benutzermenü
- `/app/frontend/src/hooks/useAuth.js` - Auth-Hook
- `/app/frontend/src/contexts/AuthContext.js` - Auth Context mit Rollenlogik

## API Endpoints
- `POST /api/auth/login` - Anmeldung (Rate Limited: 5/min)
- `PUT /api/auth/change-password` - Eigenes Passwort ändern
- `GET /api/users` - Alle Benutzer (nur Admin)
- `POST /api/users` - Benutzer erstellen (nur Admin)
- `DELETE /api/users/{id}` - Benutzer löschen (nur Admin)
- `PUT /api/users/{id}/reset-password` - Passwort zurücksetzen (nur Admin)
- `GET /api/fiscal-years` - Geschäftsjahre
- `GET /api/statistics?fiscal_year=YYYY/YYYY` - Statistiken
- `/api/members` - Mitglieder CRUD
- `/api/fines` - Strafen CRUD (POST akzeptiert optionales `date` für rückwirkende Einträge)
- `/api/fine-types` - Strafarten CRUD
- `/api/audit-logs` - Audit-Logs (nur Admin)
