# Development Environment Setup

Dieses Repository enthält verschiedene Skripte, um die Media Library Development Environment zu starten.

## Verfügbare Skripte

### 1. `start-dev.bat` (Einfach)
- Startet Laravel Backend auf Port 8050
- Startet Vue.js Frontend
- Einfache Batch-Datei für Windows

### 2. `start-dev-advanced.bat` (Erweitert)
- Erweiterte Fehlerbehandlung
- Farbige Ausgabe
- Prüfung aller Abhängigkeiten
- Bessere Benutzerführung

### 3. `start-dev.ps1` (PowerShell)
- PowerShell-Skript für bessere Kompatibilität
- Parallele Ausführung von Backend und Frontend
- Automatische Bereinigung beim Beenden

## Verwendung

### Option 1: Batch-Datei (Empfohlen für Windows)
```cmd
start-dev.bat
```

### Option 2: Erweiterte Batch-Datei
```cmd
start-dev-advanced.bat
```

### Option 3: PowerShell
```powershell
.\start-dev.ps1
```

## Voraussetzungen

- **Node.js** (https://nodejs.org/)
- **PHP** (https://www.php.net/downloads.php)
- **Composer** (https://getcomposer.org/) - Optional, aber empfohlen

## URLs nach dem Start

- **Backend (Laravel)**: http://127.0.0.1:8050
- **Frontend (Vue.js)**: http://localhost:5173

## Troubleshooting

### Node.js nicht gefunden
- Installiere Node.js von https://nodejs.org/
- Stelle sicher, dass Node.js im PATH ist

### PHP nicht gefunden
- Installiere PHP von https://www.php.net/downloads.php
- Füge PHP zum PATH hinzu

### Port bereits belegt
- Ändere den Port in der entsprechenden Skript-Datei
- Oder beende andere Anwendungen, die Port 8050 verwenden

### Frontend startet nicht
- Führe `npm install` im `frontend-vue` Verzeichnis aus
- Prüfe, ob alle Abhängigkeiten installiert sind

## Entwicklung

### Backend (Laravel)
- Port: 8050
- Host: 127.0.0.1
- Befehl: `php artisan serve --host=127.0.0.1 --port=8050`

### Frontend (Vue.js)
- Port: 5173 (Standard Vite Port)
- Befehl: `npm run dev`

## Beenden

- **Frontend**: Ctrl+C im Terminal
- **Backend**: Schließe das Backend-Terminal oder verwende Ctrl+C
- **PowerShell**: Automatische Bereinigung beim Beenden
