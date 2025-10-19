#!/bin/bash

# Laravel deployment script for Forge
# This script should be run after each deployment

echo "Starting Laravel deployment..."

# Clear and cache configuration
php artisan config:clear
php artisan config:cache

# Clear and cache routes
php artisan route:clear
php artisan route:cache

# Clear and cache views
php artisan view:clear
php artisan view:cache

# Clear application cache
php artisan cache:clear

# Create storage symlink
php artisan storage:link

# Set proper permissions for storage
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# Clear opcache if available
if command -v php &> /dev/null; then
    php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'OPcache cleared'; } else { echo 'OPcache not available'; }"
fi

echo "Deployment completed successfully!"
