# State Persistence Implementation

## Übersicht
Die Anwendung persistiert jetzt wichtige UI-States über Browser-Sessions hinweg, um eine bessere Benutzererfahrung zu gewährleisten.

## Implementierte Persistierung

### Sidebar Store (`stores/sidebar.js`)
- **Collapsed State**: Der Zustand der Sidebar (eingeklappt/ausgeklappt) wird in `localStorage` gespeichert
- **Mobile Open State**: Wird nicht persistiert, da mobile Sidebars immer geschlossen starten sollten
- **Key**: `sidebarState`

### Media Store (`stores/media.js`)
- **Current Category**: Die aktuell ausgewählte Kategorie wird persistiert
- **Search Query**: Die Suchanfrage bleibt erhalten
- **Active Filters**: Alle aktiven Filter (Platform, Genre, Airing) werden gespeichert
- **Keys**: `currentCategory`, `searchQuery`, `activeFilters`

## Technische Details

### Automatische Persistierung
- Alle State-Änderungen werden automatisch über Vue's `watch` API in `localStorage` gespeichert
- Deep watching für komplexe Objekte (wie `activeFilters`)
- Fehlerbehandlung für localStorage-Operationen

### Initialisierung
- Beim Laden der Anwendung werden die gespeicherten States automatisch aus `localStorage` geladen
- Fallback-Werte für den Fall, dass keine gespeicherten Daten vorhanden sind

### Reset-Funktionen
- `resetSidebarState()`: Setzt Sidebar-State zurück und löscht localStorage
- `resetMediaState()`: Setzt Media-State zurück und löscht localStorage

## Verwendung

### Sidebar Store
```javascript
import { useSidebarStore } from '@/stores/sidebar'

const sidebarStore = useSidebarStore()

// State wird automatisch persistiert
sidebarStore.toggleSidebar()

// Manueller Reset
sidebarStore.resetSidebarState()
```

### Media Store
```javascript
import { useMediaStore } from '@/stores/media'

const mediaStore = useMediaStore()

// States werden automatisch persistiert
mediaStore.setCategory('series')
mediaStore.setSearchQuery('Breaking Bad')
mediaStore.addFilter({ type: 'platform', value: 'Netflix' })

// Manueller Reset
mediaStore.resetMediaState()
```

## Browser-Kompatibilität
- Verwendet `localStorage` API (unterstützt in allen modernen Browsern)
- Graceful degradation bei Fehlern (Anwendung funktioniert auch ohne localStorage)

## Vorteile
1. **Bessere UX**: Benutzer müssen ihre Einstellungen nicht bei jedem Besuch neu konfigurieren
2. **Konsistenz**: Sidebar und Filter bleiben über Sessions hinweg erhalten
3. **Performance**: Keine zusätzlichen API-Calls für State-Management
4. **Offline-fähig**: Funktioniert auch ohne Internetverbindung
