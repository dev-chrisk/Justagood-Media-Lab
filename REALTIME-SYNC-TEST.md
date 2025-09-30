# Real-time Multi-Tab Synchronisation Test

## Übersicht
Die Anwendung unterstützt jetzt Echtzeit-Synchronisation zwischen mehreren Tabs. Wenn ein Benutzer in einem Tab (Host) Änderungen vornimmt, werden diese automatisch in anderen Tabs (Join) aktualisiert.

## Implementierte Features

### Backend
- **Server-Sent Events (SSE) Endpoint**: `/api/events` für Echtzeit-Updates
- **Polling-System**: Alternative zu SSE für bessere Kompatibilität
- **Event Broadcasting**: MediaUpdated Events werden bei CRUD-Operationen ausgelöst
- **Date Filtering**: API unterstützt `since` Parameter für Polling

### Frontend
- **RealtimeService**: Polling-basierter Service für Echtzeit-Updates
- **Media Store Integration**: Automatische Updates der lokalen Daten
- **Test-Komponente**: RealtimeTest.vue für einfaches Testen

## Test-Anleitung

### 1. Server starten
```bash
# Backend (Terminal 1)
php artisan serve --host=127.0.0.1 --port=8050

# Frontend (Terminal 2)
cd frontend-vue
npm run dev
```

### 2. Multi-Tab Test durchführen

1. **Tab 1 (Host) öffnen**:
   - Gehe zu `http://localhost:5173`
   - Logge dich ein (falls noch nicht geschehen)
   - Du siehst die "Real-time Sync Test" Komponente oben

2. **Tab 2 (Join) öffnen**:
   - Öffne einen neuen Tab mit `http://localhost:5173`
   - Logge dich mit demselben Account ein
   - Du siehst dieselbe Test-Komponente

3. **Synchronisation testen**:
   - **Test 1**: Klicke in Tab 1 auf "Add Test Item"
   - **Erwartung**: Tab 2 sollte automatisch das neue Item anzeigen (innerhalb von 2 Sekunden)
   - **Test 2**: Klicke in Tab 2 auf "Add Test Item"
   - **Erwartung**: Tab 1 sollte das neue Item anzeigen
   - **Test 3**: Bearbeite ein Item in Tab 1
   - **Erwartung**: Änderungen erscheinen in Tab 2
   - **Test 4**: Lösche ein Item in Tab 1
   - **Erwartung**: Item verschwindet aus Tab 2

### 3. Test-Komponente Features

Die RealtimeTest-Komponente zeigt:
- **Status**: Connected/Disconnected
- **Last Update**: Zeit der letzten Aktualisierung
- **Update Count**: Anzahl empfangener Updates
- **Test Buttons**: Add Test Item, Clear Test Items

### 4. Debugging

Falls die Synchronisation nicht funktioniert:

1. **Browser Console prüfen**:
   - Öffne Developer Tools (F12)
   - Schaue in die Console nach Fehlermeldungen
   - Suche nach "Polling found updates" oder "Processing real-time update"

2. **Network Tab prüfen**:
   - Schaue nach API-Calls zu `/api/media?since=...`
   - Prüfe, ob die Calls erfolgreich sind (Status 200)

3. **Backend Logs prüfen**:
   - Schaue in die Laravel Logs nach Fehlern
   - Prüfe, ob Events korrekt dispatched werden

## Technische Details

### Polling-Intervall
- **Standard**: 2 Sekunden
- **Konfigurierbar**: In `frontend-vue/src/services/realtime.js`

### API-Endpoints
- **GET /api/media**: Standard Media-Liste
- **GET /api/media?since=ISO_DATE**: Nur Updates seit dem angegebenen Datum
- **POST /api/media**: Neues Media Item erstellen
- **PUT /api/media/{id}**: Media Item aktualisieren
- **DELETE /api/media/{id}**: Media Item löschen

### Event Flow
1. Benutzer macht Änderung in Tab 1
2. API-Call wird an Backend gesendet
3. Backend speichert Änderung und dispatched MediaUpdated Event
4. Tab 2 pollt alle 2 Sekunden nach Updates
5. Backend gibt neue/geänderte Items zurück
6. Tab 2 aktualisiert lokale Daten automatisch

## Bekannte Einschränkungen

1. **Nur für eingeloggte Benutzer**: Polling funktioniert nur mit Authentifizierung
2. **Polling-basiert**: Nicht so effizient wie WebSockets, aber stabiler
3. **2-Sekunden Verzögerung**: Updates können bis zu 2 Sekunden dauern
4. **Browser-Kompatibilität**: Funktioniert in allen modernen Browsern

## Zukünftige Verbesserungen

1. **WebSockets**: Für echte Echtzeit-Updates
2. **Optimistic Updates**: Sofortige UI-Updates vor Server-Bestätigung
3. **Conflict Resolution**: Behandlung von gleichzeitigen Änderungen
4. **Offline Support**: Lokale Synchronisation bei Netzwerkproblemen
