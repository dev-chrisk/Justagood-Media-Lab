# Justagood Media Lab - Laravel 10 Application

A modern media library application built with Laravel 10, featuring movie, TV series, and game management with image storage and external API integration.

## 📚 Documentation

- **[Anwenderbeschreibung](ANWENDERBESCHREIBUNG.md)** - Complete user manual (German)
- **[Migration Guide](MIGRATION_GUIDE.md)** - Detailed migration from Flask
- **[Achievement System](ACHIEVEMENT_SYSTEM_README.md)** - Achievement system documentation
- **[Export/Import System](EXPORT_IMPORT_README.md)** - Data export/import functionality
- **[Category Duplicate Prevention](CATEGORY_DUPLICATE_PREVENTION.md)** - Category management system

## 🚀 Quick Start

### Prerequisites
- PHP 8.1+ with required extensions
- Composer
- MySQL 5.7+ or MariaDB 10.3+

### Installation

#### Windows
```bash
setup.bat
```

#### Linux/Mac
```bash
chmod +x setup.sh
./setup.sh
```

#### Manual Installation
```bash
composer install --ignore-platform-req=ext-fileinfo
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan import:json-data
php artisan migrate:images
php artisan serve
```

## 🎯 Features

- **Media Management**: Movies, TV series, and games
- **Collections**: Organize media into custom collections
- **Achievement System**: Unlock achievements based on your collection
- **Image Storage**: Upload, download, and manage images with thumbnails
- **External APIs**: Integration with TMDB and RAWG APIs
- **Export/Import**: Full data backup and restore functionality
- **Category Management**: Automatic duplicate prevention
- **Search & Filtering**: Full-text search across media items

## 🔧 API Endpoints

### Media Items
- `GET /api/media` - List all media items
- `POST /api/media` - Create new media item
- `GET /api/media/{id}` - Get specific media item
- `PUT /api/media/{id}` - Update media item
- `DELETE /api/media/{id}` - Delete media item

### Collections
- `GET /api/collections` - List all collections
- `POST /api/collections` - Create new collection
- `GET /api/collections/{id}` - Get specific collection
- `PUT /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection

### Images
- `GET /api/list-images` - List all images
- `POST /api/upload-image` - Upload image
- `POST /api/delete-image` - Delete image
- `GET /api/thumb` - Generate thumbnail

### Achievements
- `GET /api/achievements` - List all achievements
- `POST /api/achievements` - Create new achievement
- `GET /api/achievements/user/{id}` - Get user achievements

### Export/Import
- `POST /api/export` - Export all data as ZIP
- `POST /api/import` - Import data from ZIP file

## 🗄️ Database Schema

### Core Tables
- `media_items` - Main media items (movies, series, games)
- `collections` - User-created collections
- `categories` - Normalized category system
- `achievements` - Available achievements
- `user_achievements` - User achievement progress
- `users` - User accounts

## 🛠️ Commands

```bash
# Data management
php artisan import:json-data
php artisan migrate:images

# Category management
php artisan categories:cleanup
php artisan media:link-categories

# Database
php artisan migrate
php artisan db:seed
```

## 🔧 Configuration

### Environment Variables
- `DB_DATABASE` - Database name
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `TMDB_API_KEY` - The Movie Database API key
- `RAWG_API_KEY` - RAWG Video Games Database API key

## 🚀 Production Deployment

1. Set `APP_ENV=production` and `APP_DEBUG=false`
2. Configure proper database credentials
3. Set up web server (Nginx/Apache) with PHP-FPM
4. Configure SSL certificates
5. Set up database backups
6. Enable caching (Redis recommended)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Note**: This application was migrated from a Flask backend to Laravel 10 while maintaining full API compatibility with the existing frontend.
