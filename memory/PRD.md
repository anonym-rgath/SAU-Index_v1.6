# Rheinzelmänner - Product Requirements Document

## Original Problem Statement
Entwicklung einer Full-Stack-Webanwendung für einen "Schützenzug" (später umbenannt zu "Rheinzelmänner"), um Mitglieder und deren Strafen zu verwalten und ein Ranking basierend auf Strafen zu erstellen.

## User Personas
- **Admin**: Vollzugriff auf alle Funktionen (CRUD für Mitglieder, Strafen, Strafarten, Benutzerverwaltung)
- **Spiess**: Vollzugriff wie Admin, außer Benutzerverwaltung
- **Vorstand**: Eingeschränkter Zugriff (Mitglieder verwalten, Statistiken anonym, Strafenarten ansehen)

## Core Requirements
- Benutzerverwaltung mit Rollen (admin/spiess/vorstand)
- Mitgliederverwaltung (Name, Status aktiv/passiv/archiviert)
- Strafenverwaltung mit konfigurierbaren Strafarten
- Rückwirkende Strafenerfassung (nur auf Strafenübersicht-Seite)
- Ranking basierend auf Geschäftsjahr (01.08. - 31.07.)
- Mobile-First Design mit Drawer-Navigation
- Statistik-Seite mit Diagrammen und KPIs
- QR-Code System zur Mitglieder-Identifikation

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, lucide-react, recharts, html5-qrcode, qrcode.react
- **Backend**: Python FastAPI, slowapi (Rate Limiting)
- **Database**: MongoDB
- **Auth**: JWT mit bcrypt Passwort-Hashing
- **Security**: Rate Limiting (5 Login-Versuche/Minute), Audit Logging

## Login Credentials
- Admin: `admin` / `admin123`
- Spiess: `Henrik Dinslage` / `rheinzel2025`
- Vorstand: `Marius Geduldig` / `rheinzel2025`

---

## Completed Features

### 2025-02-12 (Current Session)
- [x] **Benutzerverwaltung (Admin)**: Vollständige Benutzer-Administration
  - Neue Benutzer anlegen mit Benutzername, Passwort und Rolle
  - Benutzer löschen (mit Schutz für letzten Admin)
  - **Passwörter zurücksetzen** für alle Benutzer
  - Neue Seite `/users` nur für Admin sichtbar
- [x] **Echte Benutzerkonten**: Personalisierte Accounts erstellt
  - Henrik Dinslage (Spieß)
  - Marius Geduldig (Vorstand)
  - Alte generische Accounts (spiess, vorstand) entfernt
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

### P1 - Future Tasks
- [ ] Daten-Export (CSV/PDF) - vom Benutzer vorerst zurückgestellt

### P2 - Potential Improvements
- [ ] Komponentenrefactoring (Dashboard.js, Members.js aufteilen)
- [ ] Offline-Unterstützung / PWA

---

## Key Files
- `/app/backend/server.py` - Backend API
- `/app/frontend/src/pages/Dashboard.js` - Dashboard mit Ranking
- `/app/frontend/src/pages/Statistics.js` - Statistik-Seite
- `/app/frontend/src/pages/Members.js` - Mitgliederverwaltung
- `/app/frontend/src/pages/Fines.js` - Strafenübersicht
- `/app/frontend/src/components/AddFineDialog.js` - Dialog zur Strafenerfassung
- `/app/frontend/src/hooks/useAuth.js` - Auth-Hook
- `/app/frontend/src/contexts/AuthContext.js` - Auth Context mit Rollenlogik

## API Endpoints
- `POST /api/auth/login` - Anmeldung (Rate Limited: 5/min)
- `GET /api/fiscal-years` - Geschäftsjahre
- `GET /api/statistics?fiscal_year=YYYY/YYYY` - Statistiken
- `/api/members` - Mitglieder CRUD
- `/api/fines` - Strafen CRUD (POST akzeptiert optionales `date` für rückwirkende Einträge)
- `/api/fine-types` - Strafarten CRUD
- `/api/audit-logs` - Audit-Logs (nur Admin)
