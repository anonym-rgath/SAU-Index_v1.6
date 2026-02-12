# Rheinzelmänner - Product Requirements Document

## Original Problem Statement
Entwicklung einer Full-Stack-Webanwendung für einen "Schützenzug" (später umbenannt zu "Rheinzelmänner"), um Mitglieder und deren Strafen zu verwalten und ein Ranking basierend auf Strafen zu erstellen.

## User Personas
- **Admin**: Vollzugriff auf alle Funktionen (CRUD für Mitglieder, Strafen, Strafarten)
- **Vorstand**: Nur Lesezugriff auf alle Daten

## Core Requirements
- Benutzerverwaltung mit Rollen (admin/vorstand)
- Mitgliederverwaltung (Name, Status aktiv/passiv, NFC-ID)
- Strafenverwaltung mit konfigurierbaren Strafarten
- Ranking basierend auf Geschäftsjahr (01.08. - 31.07.)
- Mobile-First Design mit Drawer-Navigation
- Statistik-Seite mit Diagrammen und KPIs

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, lucide-react, recharts, html5-qrcode, qrcode.react
- **Backend**: Python FastAPI
- **Database**: MongoDB
- **Auth**: JWT

## Login Credentials
- Admin: `admin` / `admin123`
- Vorstand: `vorstand` / `vorstand`

---

## Completed Features

### 2025-02 (Current Session)
- [x] Icon-Änderung: TrendingUp für "Durchschnitt" auf Statistik-Seite
- [x] Icon-Änderung: Wallet für "Lämmchen" auf Dashboard
- [x] Icon-Änderung: Coins für "Gesamt" auf Statistik-Seite
- [x] Menü-Reihenfolge angepasst: Dashboard → Mitglieder → Statistiken → Strafen → Strafenarten
- [x] Test-Benutzer Hinweis von Login-Seite entfernt
- [x] Lämmchen-Logik korrigiert: Zeigt jetzt niedrigsten Betrag (statt zweithöchsten)
- [x] QR-Code Scanner implementiert (Kamera-basiert, mit manuellem Fallback)
- [x] QR-Code Generator für Mitglieder (Download als PNG)

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
- `/app/frontend/src/hooks/useAuth.js` - Auth-Hook

## API Endpoints
- `POST /api/auth/login` - Anmeldung
- `GET /api/fiscal-years` - Geschäftsjahre
- `GET /api/statistics` - Statistiken
- `/api/members` - Mitglieder CRUD
- `/api/fines` - Strafen CRUD
- `/api/fine-types` - Strafarten CRUD
