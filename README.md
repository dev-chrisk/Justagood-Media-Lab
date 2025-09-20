# Media Library - Laravel 10 Application

A modern media library application built with Laravel 10, featuring movie, TV series, and game management with image storage and external API integration.

## 🚀 Quick Start

### Prerequisites
- PHP 8.1+ with required extensions
- Composer
- MySQL 5.7+ or MariaDB 10.3+
- Node.js (optional, for frontend assets)

### Installation

#### Windows
```bash
# Run the setup script
setup.bat
```

#### Linux/Mac
```bash
# Make script executable and run
chmod +x setup.sh
./setup.sh
```

#### Manual Installation
```bash
# Install dependencies
composer install --ignore-platform-req=ext-fileinfo

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Create storage link
php artisan storage:link

# Import data
php artisan import:json-data

# Migrate images
php artisan migrate:images

# Start server
php artisan serve
```

## 📁 Project Structure

```
media-library-laravel/
├── app/
│   ├── Console/Commands/          # Custom Artisan commands
│   ├── Http/Controllers/Api/      # API controllers
│   └── Models/                    # Eloquent models
├── database/migrations/           # Database migrations
├── routes/
│   ├── api.php                   # API routes
│   └── web.php                   # Web routes (frontend)
├── storage/app/public/           # Image storage
├── setup.bat                     # Windows setup script
├── setup.sh                      # Linux/Mac setup script
└── MIGRATION_GUIDE.md           # Detailed migration guide
```

## 🎯 Features

- **Media Management**: Movies, TV series, and games
- **Collections**: Organize media into custom collections
- **Image Storage**: Upload, download, and manage images
- **Thumbnail Generation**: Automatic thumbnail creation with caching
- **External APIs**: Integration with TMDB and RAWG APIs
- **Search**: Full-text search across media items
- **Filtering**: Filter by category, rating, playtime, etc.
- **Responsive UI**: Modern, mobile-friendly interface

## 🔧 API Endpoints

### Media Items
- `GET /api/media` - List all media items
- `POST /api/media` - Create new media item
- `GET /api/media/{id}` - Get specific media item
- `PUT /api/media/{id}` - Update media item
- `DELETE /api/media/{id}` - Delete media item
- `GET /api/api/search` - Search external APIs

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
- `GET /api/images/{path}` - Serve image

## 🗄️ Database Schema

### Media Items
- `id` - Primary key
- `title` - Media title
- `category` - Type (game, series, movie, etc.)
- `release` - Release date
- `rating` - User rating (0-10)
- `count` - View count
- `platforms` - Available platforms
- `genre` - Genres
- `link` - External link
- `path` - Image path
- `discovered` - Discovery date
- `spielzeit` - Playtime in minutes
- `is_airing` - Currently airing (for series)
- `next_season` - Next season number
- `next_season_release` - Next season release date
- `external_id` - External API ID

### Collections
- `id` - Primary key
- `name` - Collection name
- `description` - Collection description
- `media_item_ids` - JSON array of media item IDs

## 🛠️ Commands

### Data Import
```bash
# Import from default path
php artisan import:json-data

# Import from custom path
php artisan import:json-data --path=/path/to/data
```

### Image Migration
```bash
# Migrate from default paths
php artisan migrate:images

# Migrate from custom paths
php artisan migrate:images --source=/path/to/images --downloads=/path/to/downloads
```

## 🔧 Configuration

### Environment Variables
- `DB_DATABASE` - Database name
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `TMDB_API_KEY` - The Movie Database API key
- `RAWG_API_KEY` - RAWG Video Games Database API key

### Storage
Images are stored in `storage/app/public/` and accessible via `/storage/` URL.

## 🚀 Production Deployment

1. Set `APP_ENV=production` and `APP_DEBUG=false`
2. Configure proper database credentials
3. Set up web server (Nginx/Apache) with PHP-FPM
4. Configure SSL certificates
5. Set up database backups
6. Enable caching (Redis recommended)

## 📚 Documentation

- [Migration Guide](MIGRATION_GUIDE.md) - Detailed migration from Flask
- [Laravel Documentation](https://laravel.com/docs) - Official Laravel docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For issues or questions:
1. Check the logs: `storage/logs/laravel.log`
2. Review the migration guide
3. Check Laravel documentation

---

**Note**: This application was migrated from a Flask backend to Laravel 10 while maintaining full API compatibility with the existing frontend.