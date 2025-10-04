# Production 500 Error Fix Guide

## Problem
The live version is experiencing 500 Internal Server Error on API endpoints `/user` and `/logout`.

## Root Cause Analysis
The issue is likely caused by one or more of the following:

1. **Sanctum Stateful Domains Configuration** - Production domain not included
2. **Missing Environment Variables** - Production server lacks proper configuration
3. **Database Connection Issues** - Production database not accessible

## Fixes Applied

### 1. Sanctum Configuration Fix
Updated `config/sanctum.php` to include the production domain:
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1,teabubble.attrebi.ch',
    Sanctum::currentApplicationUrlWithPort()
))),
```

### 2. Enhanced Error Handling
Added comprehensive error handling to:
- `/user` endpoint in `routes/api.php`
- `logout` method in `AuthController.php`

### 3. Debug Endpoint
Added a health check endpoint at `/api/debug/health` for testing.

## Deployment Steps

### 1. Update Production Environment Variables
Ensure the production server has these environment variables set:

```bash
# Required for Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1,teabubble.attrebi.ch

# Required for CORS
APP_URL=https://teabubble.attrebi.ch

# Database configuration
DB_CONNECTION=sqlite
DB_DATABASE=/path/to/your/database.sqlite

# Application configuration
APP_ENV=production
APP_DEBUG=false
```

### 2. Clear Application Cache
After updating environment variables, clear the application cache:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 3. Test the Fix
1. Test the health endpoint: `GET https://teabubble.attrebi.ch/api/debug/health`
2. Test authentication: Try logging in through the frontend
3. Check logs: `tail -f storage/logs/laravel.log`

## Verification Steps

### 1. Check Sanctum Configuration
```bash
php artisan tinker
>>> config('sanctum.stateful')
```

Should include `teabubble.attrebi.ch` in the array.

### 2. Check CORS Configuration
```bash
php artisan tinker
>>> config('cors.allowed_origins')
```

Should include `https://teabubble.attrebi.ch`.

### 3. Test Database Connection
```bash
php artisan tinker
>>> \DB::connection()->getPdo()
```

Should return a PDO object without errors.

## Additional Troubleshooting

### If 500 errors persist:

1. **Check Laravel logs** for specific error messages:
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Check web server logs** (Apache/Nginx) for additional error details

3. **Verify file permissions** on storage and bootstrap/cache directories:
   ```bash
   chmod -R 775 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

4. **Check PHP error logs** for any PHP-level errors

### Common Issues:

1. **Missing .env file** - Ensure the production server has a proper .env file
2. **Database permissions** - Ensure the web server can read/write the SQLite database
3. **File permissions** - Ensure proper permissions on storage directories
4. **PHP extensions** - Ensure required PHP extensions are installed (PDO, SQLite, etc.)

## Monitoring

After deployment, monitor:
- API response times
- Error rates in logs
- Frontend authentication flow
- Database query performance

## Rollback Plan

If issues persist, you can rollback by:
1. Reverting the Sanctum configuration changes
2. Removing the enhanced error handling
3. Checking the original error logs for the root cause
