# Media Library Migration Guide: Flask to Laravel

This guide provides comprehensive instructions for migrating your Flask media library application to Laravel 10 with MySQL.

## Overview

The migration includes:
- ✅ Laravel 10 project setup
- ✅ MySQL database configuration
- ✅ Database migrations for media items and collections
- ✅ Eloquent models with relationships
- ✅ API controllers replacing Flask routes
- ✅ Image storage and thumbnail generation
- ✅ Data migration scripts
- ✅ Frontend compatibility

## Prerequisites

### Required Software
- **PHP 8.1+** (with required extensions)
- **Composer** (for dependency management)
- **MySQL 5.7+** or **MariaDB 10.3+**
- **Node.js** (for frontend assets, optional)

### Required PHP Extensions
- `ext-fileinfo` (for image processing)
- `ext-gd` or `ext-imagick` (for image manipulation)
- `ext-mbstring`
- `ext-openssl`
- `ext-pdo`
- `ext-pdo_mysql`
- `ext-tokenizer`
- `ext-xml`

## Installation Steps

### 1. Database Setup

Create a MySQL database for the application:

```sql
CREATE DATABASE media_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Environment Configuration

The `.env` file is already configured with:
- Database: `media_library`
- API Keys: TMDB and RAWG (from original Flask app)

### 3. Install Dependencies

```bash
cd media-library-laravel
composer install --ignore-platform-req=ext-fileinfo
```

### 4. Generate Application Key

```bash
php artisan key:generate
```

### 5. Run Database Migrations

```bash
php artisan migrate
```

### 6. Create Storage Link

```bash
php artisan storage:link
```

### 7. Import Data from JSON Files

```bash
php artisan import:json-data
```

### 8. Migrate Images

```bash
php artisan migrate:images
```

### 9. Start the Development Server

```bash
php artisan serve
```

The application will be available at `http://localhost:8000`

## API Endpoints

### Media Items
- `GET /api/media` - List all media items
- `POST /api/media` - Create new media item
- `GET /api/media/{id}` - Get specific media item
- `PUT /api/media/{id}` - Update media item
- `DELETE /api/media/{id}` - Delete media item
- `GET /api/media_relative.json` - Get all media (compatibility)
- `POST /api/media_relative.json` - Save all media (compatibility)
- `GET /api/api/search` - Search external APIs

### Collections
- `GET /api/collections` - List all collections
- `POST /api/collections` - Create new collection
- `GET /api/collections/{id}` - Get specific collection
- `PUT /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection
- `POST /api/collections/{id}/add-media` - Add media to collection
- `POST /api/collections/{id}/remove-media` - Remove media from collection

### Images
- `GET /api/list-images` - List all images
- `POST /api/copy-image` - Copy image
- `POST /api/upload-image` - Upload image
- `POST /api/delete-image` - Delete image
- `POST /api/download-image` - Download image from URL
- `GET /api/thumb` - Generate thumbnail
- `GET /api/images/{path}` - Serve image
- `GET /api/images_downloads/{path}` - Serve downloaded image

## Database Schema

### Media Items Table
```sql
CREATE TABLE media_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    release DATE NULL,
    rating INT NULL,
    count INT DEFAULT 0,
    platforms VARCHAR(255) NULL,
    genre TEXT NULL,
    link VARCHAR(255) NULL,
    path VARCHAR(255) NULL,
    discovered DATE NULL,
    spielzeit INT NULL,
    is_airing BOOLEAN DEFAULT FALSE,
    next_season INT NULL,
    next_season_release DATE NULL,
    external_id VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_category (category),
    INDEX idx_title (title),
    INDEX idx_rating (rating),
    INDEX idx_release (release)
);
```

### Collections Table
```sql
CREATE TABLE collections (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    media_item_ids JSON NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_name (name)
);
```

## File Structure

```
media-library-laravel/
├── app/
│   ├── Console/Commands/
│   │   ├── ImportJsonData.php      # Import JSON data
│   │   └── MigrateImages.php       # Migrate images
│   ├── Http/Controllers/Api/
│   │   ├── MediaController.php     # Media items API
│   │   ├── CollectionController.php # Collections API
│   │   └── ImageController.php     # Image handling API
│   └── Models/
│       ├── MediaItem.php           # Media item model
│       └── Collection.php          # Collection model
├── database/migrations/
│   ├── create_media_items_table.php
│   └── create_collections_table.php
├── routes/
│   ├── api.php                     # API routes
│   └── web.php                     # Web routes (frontend)
└── storage/app/public/             # Image storage
    ├── images/                     # Main images
    ├── images_downloads/           # Downloaded images
    └── thumbnails/                 # Generated thumbnails
```

## Configuration

### API Keys
The following API keys are configured in `.env`:
- `TMDB_API_KEY` - The Movie Database API
- `RAWG_API_KEY` - RAWG Video Games Database API

### Storage Configuration
Images are stored in `storage/app/public/` and accessible via `/storage/` URL.

## Troubleshooting

### Common Issues

1. **Fileinfo Extension Missing**
   ```bash
   composer install --ignore-platform-req=ext-fileinfo
   ```

2. **Database Connection Issues**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

3. **Image Upload Issues**
   - Check storage permissions
   - Verify storage link exists: `php artisan storage:link`

4. **API Search Not Working**
   - Verify API keys in `.env`
   - Check internet connectivity
   - Review logs: `storage/logs/laravel.log`

### Performance Optimization

1. **Database Indexing**
   - Indexes are already created for common queries
   - Consider adding more based on usage patterns

2. **Image Optimization**
   - Thumbnails are cached automatically
   - Consider using a CDN for production

3. **Caching**
   - Enable Redis for better performance
   - Use Laravel's built-in caching

## Production Deployment

### Environment Setup
1. Set `APP_ENV=production` in `.env`
2. Set `APP_DEBUG=false` in `.env`
3. Configure proper database credentials
4. Set up SSL certificates

### Web Server Configuration
- Use Nginx or Apache with PHP-FPM
- Configure proper document root to `public/` directory
- Set up proper caching headers

### Database Optimization
- Run `php artisan optimize` for production
- Consider database replication for high traffic
- Set up proper backup procedures

## Migration Commands

### Import Data
```bash
# Import from default path (../backend/data)
php artisan import:json-data

# Import from custom path
php artisan import:json-data --path=/path/to/data
```

### Migrate Images
```bash
# Migrate from default paths
php artisan migrate:images

# Migrate from custom paths
php artisan migrate:images --source=/path/to/images --downloads=/path/to/downloads
```

## Support

For issues or questions:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Review this migration guide
3. Check Laravel documentation: https://laravel.com/docs

## Changelog

- **v1.0.0** - Initial migration from Flask to Laravel 10
- Complete API compatibility with original Flask application
- Image storage and thumbnail generation
- Database migration with proper indexing
- Command-line tools for data migration

