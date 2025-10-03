# API Configuration

Das Frontend unterstützt automatisch sowohl die lokale Entwicklungsumgebung als auch die Produktionsumgebung.

## Automatische Erkennung

Das System erkennt automatisch die Umgebung:

- **Development Mode** (`npm run dev`): Verwendet `http://localhost:8000`
- **Production Mode** (`npm run build`): Verwendet `https://teabubble.attrebi.ch`

## Manuelle Konfiguration

Falls eine andere API-URL verwendet werden soll, kann eine `.env` Datei erstellt werden:

```bash
# .env
VITE_API_URL=http://localhost:8000
```

## Unterstützte Umgebungen

1. **Lokale Entwicklung**: `http://localhost:8000`
2. **Produktion**: `https://teabubble.attrebi.ch`
3. **Custom**: Über `VITE_API_URL` Umgebungsvariable

## Verwendung

Die API-Konfiguration wird automatisch in allen Services verwendet:

- `src/services/api.js` - Haupt-API Service
- `src/services/adminService.js` - Admin-API Service

Keine manuellen Änderungen in den Service-Dateien erforderlich.
