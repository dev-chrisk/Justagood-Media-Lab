@echo off
echo Starting image optimization process...
echo.

echo Clearing existing thumbnails...
php artisan images:clear-thumbnails

echo.
echo Optimizing all images (this may take a while)...
php artisan images:optimize

echo.
echo Image optimization complete!
echo.
echo Your images are now optimized for instant loading:
echo - Thumbnails are generated at 200px width with 75%% quality
echo - Images are converted to WebP format for better compression
echo - Thumbnails are cached for instant loading
echo - Original images remain unchanged
echo.
pause
