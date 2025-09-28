# 📚 Justagood Media Lab - Anwenderbeschreibung

Eine umfassende Benutzeranleitung für das Justagood Media Lab - Ihre persönliche Medienbibliothek für Filme, Serien und Spiele.

## 🎯 Was ist das Justagood Media Lab?

Das Justagood Media Lab ist eine moderne Webanwendung zur Verwaltung Ihrer persönlichen Medien-Sammlung. Sie können:

- **Filme, Serien und Spiele** verwalten und kategorisieren
- **Sammlungen** erstellen und organisieren
- **Bilder** hochladen und verwalten
- **Bewertungen** und **Notizen** hinzufügen
- **Achievements** freischalten
- **Daten exportieren und importieren**

## 🚀 Schnellstart

### Systemanforderungen
- **PHP 8.1+** mit erforderlichen Erweiterungen
- **Composer** (für Abhängigkeiten)
- **MySQL 5.7+** oder **MariaDB 10.3+**
- **Moderner Webbrowser**

### Installation

#### Windows
```bash
# Setup-Script ausführen
setup.bat
```

#### Linux/Mac
```bash
# Script ausführbar machen und ausführen
chmod +x setup.sh
./setup.sh
```

#### Manuelle Installation
```bash
# Abhängigkeiten installieren
composer install --ignore-platform-req=ext-fileinfo

# Anwendungsschlüssel generieren
php artisan key:generate

# Datenbank-Migrationen ausführen
php artisan migrate

# Storage-Link erstellen
php artisan storage:link

# Daten importieren
php artisan import:json-data

# Bilder migrieren
php artisan migrate:images

# Server starten
php artisan serve
```

Die Anwendung ist dann unter `http://localhost:8000` erreichbar.

## 🎮 Hauptfunktionen

### 1. Medienverwaltung

#### Medien hinzufügen
- Klicken Sie auf "Neues Medium hinzufügen"
- Füllen Sie die Felder aus:
  - **Titel**: Name des Films/der Serie/des Spiels
  - **Kategorie**: Film, Serie, Spiel, etc.
  - **Erscheinungsdatum**: Wann wurde es veröffentlicht
  - **Bewertung**: Ihre persönliche Bewertung (0-10)
  - **Genre**: Welche Genres passen dazu
  - **Plattformen**: Wo ist es verfügbar
  - **Spielzeit**: Wie lange dauert es (bei Spielen/Serien)

#### Medien bearbeiten
- Klicken Sie auf ein Medium in der Liste
- Bearbeiten Sie die gewünschten Felder
- Speichern Sie Ihre Änderungen

#### Medien suchen und filtern
- **Suchfeld**: Geben Sie einen Begriff ein
- **Filter**: Filtern Sie nach Kategorie, Bewertung, etc.
- **Sortierung**: Sortieren Sie nach verschiedenen Kriterien

### 2. Sammlungen

#### Sammlung erstellen
1. Klicken Sie auf "Neue Sammlung"
2. Geben Sie einen Namen und eine Beschreibung ein
3. Fügen Sie Medien zur Sammlung hinzu

#### Sammlung verwalten
- **Medien hinzufügen**: Ziehen Sie Medien in die Sammlung
- **Medien entfernen**: Klicken Sie auf das X bei einem Medium
- **Sammlung bearbeiten**: Ändern Sie Name und Beschreibung
- **Sammlung löschen**: Vorsicht - dies kann nicht rückgängig gemacht werden

### 3. Bildverwaltung

#### Bilder hochladen
- Klicken Sie auf "Bild hochladen"
- Wählen Sie eine Datei aus (JPG, PNG, GIF)
- Das Bild wird automatisch verarbeitet und gespeichert

#### Bilder verwalten
- **Thumbnails**: Werden automatisch erstellt
- **Bilder löschen**: Klicken Sie auf das Papierkorb-Symbol
- **Bilder herunterladen**: Von externen URLs

### 4. Achievement-System

#### Verfügbare Achievements
- **Marvel Master** 🎬 (500 XP): Besitzen Sie alle Marvel-Filme
- **Serienjunkie** 📺 (300 XP): 50+ Serien in Ihrer Sammlung
- **Gaming Enthusiast** 🎮 (400 XP): 100+ Spiele besitzen
- **Perfektionist** ⭐ (600 XP): Alle Medien mit 8+ bewertet
- **Sammler** 📚 (200 XP): 10+ Sammlungen erstellt
- **Entdecker** 🔍 (150 XP): 5+ neue Medien in einer Woche
- **Zeitmeister** ⏰ (800 XP): 1000+ Stunden Spielzeit
- **Kategorien-Experte** 🏷️ (350 XP): Medien in 15+ Kategorien

#### Achievements freischalten
- Achievements werden automatisch freigeschaltet
- Überprüfen Sie Ihren Fortschritt in der Achievement-Übersicht
- Sammeln Sie XP und steigen Sie im Level auf

### 5. Export/Import

#### Daten exportieren
1. Klicken Sie auf "📦 Export"
2. Das System erstellt ein ZIP-Package
3. Laden Sie die Datei herunter

#### Daten importieren
1. Klicken Sie auf "📥 Import"
2. Wählen Sie eine gültige ZIP-Datei aus
3. Das System importiert alle Daten automatisch

## 🔧 Erweiterte Funktionen

### API-Integration
- **TMDB**: The Movie Database für Filmdaten
- **RAWG**: Video Games Database für Spieldaten
- Automatische Metadaten-Abfrage

### Kategorien-System
- **Automatische Duplikat-Prävention**
- **Normalisierte Kategorien-Tabelle**
- **Farbkodierung** für bessere Übersicht

### Suchfunktionen
- **Volltext-Suche** in allen Medien
- **Erweiterte Filter** nach verschiedenen Kriterien
- **Externe API-Suche** für neue Medien

## 📱 Benutzeroberfläche

### Hauptansicht
- **Grid-Ansicht**: Medien als Karten anzeigen
- **Listen-Ansicht**: Kompakte Tabellenansicht
- **Sammlungs-Ansicht**: Gruppiert nach Sammlungen

### Einstellungen
- **Animationen**: Ein-/Ausschalten von Übergängen
- **Anzeigeoptionen**: Grid-Spalten, Bildgrößen
- **Benutzerprofil**: Persönliche Einstellungen

## 🛠️ Wartung und Troubleshooting

### Häufige Probleme

#### 1. Bilder werden nicht angezeigt
- Überprüfen Sie die Storage-Berechtigungen
- Führen Sie `php artisan storage:link` aus
- Kontrollieren Sie die Bildpfade

#### 2. Import funktioniert nicht
- Überprüfen Sie die Dateigröße (max. 100MB)
- Stellen Sie sicher, dass es eine ZIP-Datei ist
- Kontrollieren Sie die Server-Konfiguration

#### 3. Achievements werden nicht freigeschaltet
- Überprüfen Sie die Datenbank-Verbindung
- Führen Sie die Migrationen aus: `php artisan migrate`
- Kontrollieren Sie die Logs: `storage/logs/laravel.log`

### Logs und Debugging
- **Laravel-Logs**: `storage/logs/laravel.log`
- **Debug-Modus**: In `.env` auf `APP_DEBUG=true` setzen
- **Fehlerbehebung**: Überprüfen Sie die Browser-Konsole

## 🔒 Sicherheit

### Datenbank
- **Verschlüsselte Passwörter**
- **CSRF-Schutz**
- **SQL-Injection-Schutz**

### Datei-Uploads
- **Dateityp-Validierung**
- **Größenbeschränkungen**
- **Sichere Speicherung**

## 📊 Performance-Optimierung

### Datenbank
- **Indizierte Abfragen**
- **Lazy Loading** für Beziehungen
- **Caching** für häufige Abfragen

### Bilder
- **Automatische Thumbnail-Erstellung**
- **Bildkomprimierung**
- **CDN-Unterstützung** (optional)

## 🆘 Support und Hilfe

### Dokumentation
- **API-Dokumentation**: Siehe `routes/api.php`
- **Datenbank-Schema**: Siehe `database/migrations/`
- **Model-Dokumentation**: Siehe `app/Models/`

### Kontakt
- **GitHub Issues**: Für Bug-Reports
- **Pull Requests**: Für Verbesserungen
- **Dokumentation**: Erweitern Sie diese Anleitung

## 📈 Roadmap und zukünftige Features

### Geplante Funktionen
- **Multi-User-Support**
- **Erweiterte Statistiken**
- **Mobile App**
- **Social Features**
- **Erweiterte API-Integrationen**

### Bekannte Einschränkungen
- **Einzelbenutzer-System** (aktuell)
- **Begrenzte Kategorien** (erweiterbar)
- **Lokale Speicherung** (Cloud-Sync geplant)

## 📄 Lizenz

Dieses Projekt ist Open Source und steht unter der [MIT-Lizenz](LICENSE).

---

**Hinweis**: Diese Anwendung wurde von Flask auf Laravel 10 migriert und behält die volle API-Kompatibilität mit dem bestehenden Frontend bei.

**Version**: 1.0.0  
**Letzte Aktualisierung**: $(date)  
**Entwickelt von**: Justagood Media Lab Team
