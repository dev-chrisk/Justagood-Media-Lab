#!/bin/bash

echo "Setting up Media Library Laravel Application..."
echo

echo "Installing dependencies..."
composer install --ignore-platform-req=ext-fileinfo
if [ $? -ne 0 ]; then
    echo "Error installing dependencies!"
    exit 1
fi

echo
echo "Generating application key..."
php artisan key:generate

echo
echo "Running database migrations..."
php artisan migrate
if [ $? -ne 0 ]; then
    echo "Error running migrations! Please check your database configuration."
    exit 1
fi

echo
echo "Creating storage link..."
php artisan storage:link

echo
echo "Importing JSON data..."
php artisan import:json-data

echo
echo "Migrating images..."
php artisan migrate:images

echo
echo "Setup completed successfully!"
echo
echo "To start the development server, run:"
echo "php artisan serve"
echo
echo "The application will be available at http://localhost:8000"
echo

