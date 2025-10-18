# Debug-Anleitung für Bild-Upload Problem

## Debug-Logs hinzugefügt

Ich habe umfassende Debug-Logs in den folgenden Komponenten hinzugefügt:

### Frontend (Browser Console)
- **EditModal.vue**: `handleImageUpload` und `getImagePreviewUrl` Funktionen
- **api.js**: `uploadImage` Funktion

### Backend (Laravel Logs)
- **ImageController.php**: `uploadImage` und `serveImage` Funktionen

## So überprüfen Sie die Debug-Logs

### 1. Frontend Debug-Logs (Browser)
1. Öffnen Sie die Browser-Entwicklertools (F12)
2. Gehen Sie zum "Console" Tab
3. Versuchen Sie ein Bild hochzuladen
4. Schauen Sie nach den Debug-Meldungen mit Emojis:
   - 🖼️ = Image upload started
   - 📁 = File details
   - ✅ = Success messages
   - ❌ = Error messages
   - 🌐 = API calls
   - 🔗 = URL generation

### 2. Backend Debug-Logs (Laravel)
1. SSH in Ihren Live-Server
2. Überprüfen Sie die Laravel-Logs:
   ```bash
   tail -f storage/logs/laravel.log
   ```
3. Oder schauen Sie in die neuesten Log-Dateien:
   ```bash
   ls -la storage/logs/
   tail -f storage/logs/laravel-$(date +%Y-%m-%d).log
   ```

### 3. Was zu suchen ist

**Frontend Logs sollten zeigen:**
- Datei-Details (Name, Größe, Typ)
- Generierter Pfad für das Bild
- API-Aufruf-Details
- Upload-Response
- Generierte Bild-URL

**Backend Logs sollten zeigen:**
- Upload-Request-Details
- Datei-Validierung
- Speicherort-Erstellung
- Datei-Speicherung
- Bild-Serving-Versuche

## Mögliche Probleme die wir finden könnten

1. **Storage-Symlink fehlt**: Backend kann Datei speichern, aber nicht über HTTP servieren
2. **Pfad-Probleme**: Datei wird an falschem Ort gespeichert
3. **Berechtigungen**: Datei kann nicht gelesen werden
4. **URL-Generierung**: Frontend generiert falsche URL
5. **API-Response**: Backend gibt falsche Pfad-Information zurück

## Nächste Schritte

1. Testen Sie das Bild-Upload auf dem Live-Server
2. Überprüfen Sie beide Log-Quellen (Browser + Server)
3. Teilen Sie die relevanten Log-Meldungen mit mir
4. Basierend auf den Logs können wir das genaue Problem identifizieren

Die Debug-Logs werden uns genau zeigen, wo im Prozess das Problem auftritt!
