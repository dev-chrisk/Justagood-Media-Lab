# Kategorie-Duplikat-Prävention

## Übersicht

Dieses System verhindert automatisch Duplikate in den Kategorien der Media Library Anwendung. Es wurde implementiert, um sicherzustellen, dass es in den Kategorien keine doppelten Einträge gibt, besonders beim Login und bei Datenoperationen.

## Implementierte Features

### 1. Normalisierte Kategorien-Tabelle
- **Tabelle**: `categories`
- **Felder**: 
  - `id` (Primary Key)
  - `name` (Eindeutig)
  - `slug` (URL-freundlich, eindeutig)
  - `description` (Optional)
  - `color` (Hex-Farbe für UI)
  - `is_active` (Boolean)
  - `sort_order` (Integer)
  - `created_at`, `updated_at`

### 2. MediaItem-Kategorie-Beziehung
- **Neue Spalte**: `category_id` in `media_items` Tabelle
- **Legacy-Support**: Alte `category` Spalte bleibt erhalten für Rückwärtskompatibilität
- **Automatische Verknüpfung**: Beim Speichern wird automatisch die richtige Kategorie-ID gesetzt

### 3. Duplikat-Prävention
- **Middleware**: `CheckCategoryDuplicates` überprüft bei jeder API-Anfrage
- **Login-Integration**: Duplikat-Prüfung beim Login
- **Automatische Bereinigung**: Duplikate werden automatisch erkannt und zusammengeführt

### 4. Artisan Commands

#### Kategorien bereinigen
```bash
php artisan categories:cleanup [--migrate] [--duplicates] [--dry-run] [--force]
```

#### MediaItems mit Kategorien verknüpfen
```bash
php artisan media:link-categories [--dry-run] [--force]
```

### 5. API-Endpunkte

#### Kategorien verwalten
- `GET /api/categories` - Alle Kategorien auflisten
- `POST /api/categories` - Neue Kategorie erstellen
- `GET /api/categories/{id}` - Kategorie anzeigen
- `PUT /api/categories/{id}` - Kategorie aktualisieren
- `DELETE /api/categories/{id}` - Kategorie löschen

#### Kategorien-Utilities
- `POST /api/categories/find-or-create` - Kategorie finden oder erstellen
- `POST /api/categories/cleanup-duplicates` - Duplikate bereinigen
- `POST /api/categories/migrate-from-media-items` - Migration von MediaItems
- `GET /api/categories/statistics` - Kategorie-Statistiken

## Verwendung

### 1. Migration ausführen
```bash
php artisan migrate
```

### 2. Bestehende Daten migrieren
```bash
# Kategorien aus MediaItems erstellen
php artisan categories:cleanup --migrate --force

# MediaItems mit Kategorien verknüpfen
php artisan media:link-categories --force
```

### 3. Duplikate bereinigen
```bash
# Trockenlauf (zeigt was passieren würde)
php artisan categories:cleanup --duplicates --dry-run

# Duplikate tatsächlich bereinigen
php artisan categories:cleanup --duplicates --force
```

## Automatische Duplikat-Prävention

### Middleware
Das `CheckCategoryDuplicates` Middleware wird automatisch bei folgenden Aktionen ausgeführt:
- Login (`/api/login`)
- Registrierung (`/api/register`)
- MediaItem-Operationen (`/api/media/*`)
- Collection-Operationen (`/api/collections/*`)
- Import-Operationen (`/api/import*`)

### Login-Integration
Beim erfolgreichen Login wird automatisch eine Duplikat-Prüfung durchgeführt und bei Bedarf eine Bereinigung vorgenommen.

## Model-Features

### Category Model
- **findOrCreateByName()**: Findet oder erstellt Kategorie (verhindert Duplikate)
- **cleanupDuplicates()**: Bereinigt Duplikate durch Zusammenführung
- **getUniqueCategoryNamesFromMediaItems()**: Holt alle Kategorienamen aus MediaItems

### MediaItem Model
- **setCategoryByName()**: Setzt Kategorie über Namen (erstellt bei Bedarf)
- **Automatische Verknüpfung**: Beim Speichern wird automatisch die richtige Kategorie-ID gesetzt
- **Rückwärtskompatibilität**: Alte `category` Spalte wird weiterhin unterstützt

## Logging

Alle Duplikat-Erkennungen und -Bereinigungen werden in den Laravel-Logs protokolliert:
- `storage/logs/laravel.log`

## Sicherheit

- **Validierung**: Alle Kategorie-Operationen werden validiert
- **Eindeutigkeit**: Datenbank-Constraints verhindern Duplikate auf DB-Ebene
- **Transaktionen**: Bereinigungsoperationen laufen in Transaktionen

## Performance

- **Indizes**: Optimierte Indizes für schnelle Abfragen
- **Lazy Loading**: Beziehungen werden nur bei Bedarf geladen
- **Caching**: Kategorien können gecacht werden

## Wartung

### Regelmäßige Bereinigung
```bash
# Wöchentlich ausführen
php artisan categories:cleanup --duplicates --force
```

### Monitoring
- Logs überwachen auf Duplikat-Erkennungen
- Kategorie-Statistiken regelmäßig prüfen

## Troubleshooting

### Duplikate trotz Prävention
1. Prüfen Sie die Logs auf Fehler
2. Führen Sie manuelle Bereinigung durch
3. Überprüfen Sie die Datenbank-Constraints

### Performance-Probleme
1. Indizes überprüfen
2. Logs auf häufige Duplikat-Erkennungen prüfen
3. Middleware-Konfiguration anpassen

## Migration von bestehenden Systemen

1. **Backup erstellen**
2. **Migrationen ausführen**
3. **Daten migrieren**
4. **Testen**
5. **Alte Spalten entfernen** (optional)

```bash
# Schritt-für-Schritt Migration
php artisan migrate
php artisan categories:cleanup --migrate --dry-run  # Prüfen
php artisan categories:cleanup --migrate --force    # Ausführen
php artisan media:link-categories --dry-run         # Prüfen
php artisan media:link-categories --force           # Ausführen
php artisan categories:cleanup --duplicates --force # Bereinigen
```
