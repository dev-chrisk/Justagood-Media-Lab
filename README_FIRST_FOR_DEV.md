# README FIRST FOR DEV - WICHTIGE HINWEISE FÜR CURSOR AGENT

## ⚠️ KRITISCHE HINWEISE FÜR CURSOR AGENT

### 1. ENV FILE PROBLEM
- **CURSOR AGENT KANN DAS .env FILE NICHT LESEN**
- Das .env File existiert, aber ist für den Cursor Agent nicht zugänglich
- **NIEMALS** versuchen, das .env File zu lesen oder zu bearbeiten
- **NIEMALS** `php artisan key:generate` ausführen, da das .env File bereits existiert

### 2. DATENBANK KONFIGURATION
- **DIESES PROJEKT VERWENDET MYSQL MIT LARAGON**
- **NIEMALS** die Datenbankkonfiguration von MySQL auf SQLite ändern
- **NIEMALS** `config/database.php` bearbeiten
- Die Standard-Datenbank ist MySQL und muss es bleiben

### 3. LARAGON SETUP
- Das Projekt läuft mit Laragon (Windows)
- MySQL Server läuft über Laragon
- Datenbankname: `media_library`
- Standard MySQL Konfiguration verwenden

### 4. PROBLEM DIAGNOSE
- Bei 500 Fehlern: Laravel Logs in `storage/logs/laravel.log` prüfen
- Bei Datenbankfehlern: Laragon MySQL Service prüfen
- Bei API Fehlern: AuthController und Routes prüfen

### 5. VERBOTENE AKTIONEN
- ❌ .env File lesen/bearbeiten
- ❌ Datenbank von MySQL auf SQLite ändern
- ❌ `php artisan key:generate` ausführen
- ❌ `config/database.php` bearbeiten
- ❌ SQLite Installation oder Konfiguration

### 6. ERLAUBTE AKTIONEN
- ✅ Laravel Logs lesen
- ✅ Controllers und Routes prüfen
- ✅ Frontend Code bearbeiten
- ✅ Migrations prüfen (aber nicht ändern)
- ✅ Laragon Services prüfen

## AKTUELLES PROBLEM
- 500 Internal Server Error bei /api/login und /api/register
- Problem liegt wahrscheinlich in der MySQL Verbindung oder Laravel Konfiguration
- **NICHT** die Datenbankkonfiguration ändern!

---
**WICHTIG: Immer dieses README zuerst lesen, bevor Änderungen vorgenommen werden!**
