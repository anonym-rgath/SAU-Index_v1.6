# Schützenzug Manager

Ein modernes Verwaltungssystem für Schützenvereine zur Erfassung und Verwaltung von Strafen und Mitglieder-Rankings.

## 🎯 Features

### Authentifizierung
- Einfache Passwort-basierte Anmeldung
- JWT-Token basierte Session-Verwaltung
- Geschützte Routen

### Dashboard
- Übersichtliches Ranking aller Mitglieder nach Strafensumme
- KPI-Anzeige: "Sau" (höchster Betrag) und "Lämmchen" (zweithöchster Betrag)
- Jahres-/Saison-Auswahl
- Liste der letzten Strafen
- Schnellzugriff zum Hinzufügen von Strafen

### Mitgliederverwaltung
- Mitglieder erstellen, bearbeiten und löschen
- Übersichtliche Liste aller Mitglieder

### Strafenarten-Verwaltung
- Eigene Strafenarten definieren (z.B. "Zu spät", "Fehltermin")
- Feste oder variable Beträge pro Strafenart
- Bearbeiten und Löschen von Strafenarten

### Strafen-Management
- Strafen für Mitglieder erfassen
- Automatische Zuordnung zu Mitglied und Jahr
- Bearbeiten und Löschen von Strafen
- Optionale Notizen zu jeder Strafe
- NFC/QR-Scan Simulation (Demo)

### Multi-Jahr Unterstützung
- Separate Verwaltung für verschiedene Jahre/Saisons
- Historische Daten bleiben erhalten
- Jahreswechsel-fähig

## 🚀 Technologie-Stack

### Backend
- **FastAPI** - Modernes Python Web Framework
- **MongoDB** - NoSQL Datenbank
- **Motor** - Async MongoDB Driver
- **JWT** - Token-basierte Authentifizierung
- **Pydantic** - Datenvalidierung

### Frontend
- **React 19** - UI Framework
- **React Router v7** - Navigation
- **Tailwind CSS** - Utility-First CSS
- **Shadcn/UI** - UI Component Library
- **Axios** - HTTP Client
- **Sonner** - Toast Notifications
- **Lucide React** - Icons

## 🎨 Design

- **Helles, modernes Design** mit Emerald/Orange/Stone Farbschema
- **Typografie**: Outfit (Headings) + Manrope (Body)
- **Responsive Layout** für Desktop und Tablet
- **Bento-Grid** Design für Dashboard
- **Smooth Animations** und Micro-Interactions

## 📦 Installation & Setup

### Voraussetzungen
- Python 3.9+
- Node.js 18+
- MongoDB

### Backend Setup
```bash
cd /app/backend
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd /app/frontend
yarn install
```

### Demo-Daten laden
```bash
python3 /app/scripts/seed_demo_data.py
```

## 🔐 Login-Daten

**Passwort**: `admin123`

(Kann in `/app/backend/.env` unter `ADMIN_PASSWORD` geändert werden)

## 🌐 API Endpoints

### Authentifizierung
- `POST /api/auth/login` - Login mit Passwort

### Mitglieder
- `GET /api/members` - Alle Mitglieder abrufen
- `POST /api/members` - Neues Mitglied erstellen
- `PUT /api/members/{id}` - Mitglied aktualisieren
- `DELETE /api/members/{id}` - Mitglied löschen

### Strafenarten
- `GET /api/fine-types` - Alle Strafenarten abrufen
- `POST /api/fine-types` - Neue Strafenart erstellen
- `PUT /api/fine-types/{id}` - Strafenart aktualisieren
- `DELETE /api/fine-types/{id}` - Strafenart löschen

### Strafen
- `GET /api/fines?year={year}` - Strafen abrufen (optional nach Jahr)
- `POST /api/fines` - Neue Strafe erstellen
- `PUT /api/fines/{id}` - Strafe aktualisieren
- `DELETE /api/fines/{id}` - Strafe löschen

### Statistiken
- `GET /api/statistics/{year}` - Statistiken und Ranking für ein Jahr
- `GET /api/years` - Liste aller verfügbaren Jahre

## 📁 Projektstruktur

```
/app
├── backend/
│   ├── server.py           # FastAPI Backend
│   ├── .env               # Umgebungsvariablen
│   └── requirements.txt   # Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/    # React Komponenten
│   │   ├── pages/         # Seiten-Komponenten
│   │   ├── contexts/      # React Contexts
│   │   ├── lib/           # Utils & API
│   │   └── App.js         # Haupt-App
│   ├── package.json       # Node Dependencies
│   └── tailwind.config.js # Tailwind Config
├── scripts/
│   └── seed_demo_data.py  # Demo-Daten Script
└── README.md
```

## 🔧 Umgebungsvariablen

### Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
JWT_SECRET="schuetzenzug-secret-key-change-in-production"
ADMIN_PASSWORD="admin123"
CORS_ORIGINS="*"
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-app-url.com
```

## 🎯 Verwendung

1. **Login**: Melden Sie sich mit dem Admin-Passwort an
2. **Dashboard**: Sehen Sie das aktuelle Ranking und die KPIs
3. **Strafen hinzufügen**: Klicken Sie auf "+ STRAFE" oder nutzen Sie die NFC/QR-Scan Demo
4. **Mitglieder verwalten**: Navigieren Sie zu "Mitglieder" um Vereinsmitglieder zu verwalten
5. **Strafenarten anpassen**: Unter "Strafenarten" können Sie den Strafenkatalog bearbeiten
6. **Strafen bearbeiten**: Auf der "Strafen"-Seite können Sie alle Einträge einsehen und bearbeiten

## 🎨 Design-Highlights

- **Sau & Lämmchen KPIs**: Spielerische Darstellung der Top-2 "Sünder"
- **Live-Ranking**: Automatische Sortierung nach Gesamtsumme
- **Jahres-Navigation**: Einfacher Wechsel zwischen Saisons
- **Responsive Cards**: Moderne Card-basierte UI mit Hover-Effekten
- **Toast Notifications**: Feedback bei allen Aktionen

## 🚧 Zukünftige Features (Vorschläge)

- Excel/PDF Export des Rankings
- Echte NFC/QR-Code Integration für Mitglieder-Karten
- Statistik-Dashboard mit Charts (Recharts Integration)
- Email-Benachrichtigungen
- Multi-User mit Rollen (Admin, Mitglied)
- Mobile App Version
- Zahlungs-Tracking (wer hat bezahlt?)

## 📝 Lizenz

Private Verwendung für Schützenvereine.

## 🤝 Support

Bei Fragen oder Problemen wenden Sie sich an den Administrator.

---

**Erstellt mit ❤️ für Schützenvereine**
