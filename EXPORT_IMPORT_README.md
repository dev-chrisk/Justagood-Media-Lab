# Export/Import System für Media Library

## Übersicht

Das Export/Import-System ermöglicht es, alle Daten der Media Library als ZIP-Package zu exportieren und wieder zu importieren. Dies ist besonders nützlich für:

- Backup der gesamten Datenbank
- Migration zwischen verschiedenen Installationen
- Datenaustausch zwischen Benutzern
- Wiederherstellung nach Systemfehlern

## Export-Funktion

### Was wird exportiert:

1. **Hauptdaten** (`media_data.json`):
   - Alle Media Items mit vollständigen Metadaten
   - Benutzereinstellungen (Animation, Anzeigeoptionen, Grid-Spalten, etc.)
   - Export-Version und Zeitstempel

2. **Kategorie-Listen** (Text-Dateien):
   - `games_list.txt` - Alle Game-Titel
   - `series_list.txt` - Alle Series-Titel  
   - `movie_list.txt` - Alle Movie-Titel
   - `games_new_list.txt` - Alle "Games New" Titel
   - `series_new_list.txt` - Alle "Series New" Titel
   - `movie_new_list.txt` - Alle "Movies New" Titel

3. **Bilder**:
   - `images/` - Alle Original-Bilder
   - `images_downloads/` - Alle heruntergeladenen Bilder

### Verwendung:

1. Klicken Sie auf den "📦 Export" Button
2. Das System erstellt automatisch ein ZIP-Package
3. Die Datei wird als `media-library-export-YYYY-MM-DD.zip` heruntergeladen

## Import-Funktion

### Was wird importiert:

- Alle Media Items werden in die aktuelle Datenbank importiert
- Benutzereinstellungen werden automatisch angewendet
- Bilder werden in die entsprechenden Verzeichnisse kopiert
- Die UI wird automatisch aktualisiert

### Verwendung:

1. Klicken Sie auf den "📥 Import" Button
2. Wählen Sie eine gültige ZIP-Datei aus
3. Das System extrahiert und importiert alle Daten
4. Die Anwendung wird automatisch aktualisiert

## ZIP-Package Struktur

```
media-library-export-YYYY-MM-DD.zip
├── media_data.json              # Hauptdaten und Einstellungen
├── games_list.txt              # Game-Titel Liste
├── series_list.txt             # Series-Titel Liste
├── movie_list.txt              # Movie-Titel Liste
├── games_new_list.txt          # Games New Titel Liste
├── series_new_list.txt         # Series New Titel Liste
├── movie_new_list.txt          # Movies New Titel Liste
├── images/                     # Original-Bilder
│   ├── games/
│   ├── movies/
│   └── series/
└── images_downloads/           # Heruntergeladene Bilder
    ├── games/
    ├── movies/
    └── series/
```

## Technische Details

### Backend (PHP/Laravel):
- `ExportImportController.php` - Hauptcontroller für Export/Import
- Verwendet `ZipArchive` für ZIP-Erstellung/-Extraktion
- Temporäre Verzeichnisse werden automatisch bereinigt
- Fehlerbehandlung mit detaillierten Meldungen

### Frontend (JavaScript):
- Asynchrone Export/Import-Funktionen
- Loading-States für bessere UX
- Toast-Notifications für Feedback
- Automatische UI-Aktualisierung nach Import

### Sicherheit:
- CSRF-Token werden für diese Routes deaktiviert (nur für Export/Import)
- Datei-Validierung (nur ZIP-Dateien)
- Temporäre Dateien werden nach Verarbeitung gelöscht

## Fehlerbehandlung

Das System behandelt verschiedene Fehlerfälle:

- **Ungültige Datei**: Nur ZIP-Dateien werden akzeptiert
- **Beschädigte ZIP**: Fehlermeldung bei nicht lesbaren Archiven
- **Fehlende Daten**: Warnung wenn `media_data.json` fehlt
- **Berechtigungen**: Fehler bei fehlenden Schreibrechten
- **Speicher**: Fehler bei unzureichendem Speicherplatz

## Kompatibilität

- **Export-Version**: 1.0
- **Unterstützte Formate**: ZIP-Archive
- **Maximale Dateigröße**: Abhängig von Server-Konfiguration
- **Unterstützte Browser**: Alle modernen Browser mit File API

## Wartung

- Temporäre Dateien werden automatisch bereinigt
- Bei Fehlern werden temporäre Verzeichnisse trotzdem gelöscht
- Logs werden in Laravel's Standard-Logging-System geschrieben





