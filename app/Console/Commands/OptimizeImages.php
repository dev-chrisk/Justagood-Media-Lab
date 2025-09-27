<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class OptimizeImages extends Command
{
    protected $signature = 'images:optimize {--force : Force re-optimization of existing thumbnails}';
    protected $description = 'Optimize all images by generating thumbnails and compressing originals';

    public function handle()
    {
        $this->info('Starting image optimization...');
        
        $manager = new ImageManager(new Driver());
        $optimizedCount = 0;
        $totalSize = 0;
        $originalSize = 0;

        // Create thumbnails directory
        if (!Storage::disk('public')->exists('thumbnails')) {
            Storage::disk('public')->makeDirectory('thumbnails');
        }

        // Process images directory
        $this->info('Processing images directory...');
        $imageFiles = Storage::disk('public')->allFiles('images');
        
        foreach ($imageFiles as $file) {
            if (preg_match('/\.(jpg|jpeg|png)$/i', $file)) {
                $result = $this->optimizeImage($manager, $file, $originalSize, $totalSize);
                if ($result) {
                    $optimizedCount++;
                }
            }
        }

        // Process images_downloads directory
        $this->info('Processing images_downloads directory...');
        $downloadFiles = Storage::disk('public')->allFiles('images_downloads');
        
        foreach ($downloadFiles as $file) {
            if (preg_match('/\.(jpg|jpeg|png)$/i', $file)) {
                $result = $this->optimizeImage($manager, $file, $originalSize, $totalSize);
                if ($result) {
                    $optimizedCount++;
                }
            }
        }

        $savedBytes = $originalSize - $totalSize;
        $savedMB = round($savedBytes / 1024 / 1024, 2);
        $originalMB = round($originalSize / 1024 / 1024, 2);
        $totalMB = round($totalSize / 1024 / 1024, 2);

        $this->info("Optimization complete!");
        $this->info("Processed: {$optimizedCount} images");
        $this->info("Original size: {$originalMB} MB");
        $this->info("Optimized size: {$totalMB} MB");
        $this->info("Space saved: {$savedMB} MB");
    }

    private function optimizeImage($manager, $file, &$originalSize, &$totalSize)
    {
        try {
            $originalSize += Storage::disk('public')->size($file);
            
            // Generate different thumbnail sizes
            $sizes = [
                ['w' => 200, 'q' => 75, 'name' => 'thumb'],
                ['w' => 400, 'q' => 80, 'name' => 'medium'],
                ['w' => 800, 'q' => 85, 'name' => 'large']
            ];

            foreach ($sizes as $size) {
                $cacheKey = 'thumb_' . md5($file . '_' . $size['w'] . '_' . $size['q'] . '_webp');
                $cachePath = "thumbnails/{$cacheKey}.webp";

                // Skip if thumbnail exists and not forcing
                if (Storage::disk('public')->exists($cachePath) && !$this->option('force')) {
                    continue;
                }

                $image = $manager->read(Storage::disk('public')->get($file));
                
                // Resize maintaining aspect ratio
                $image->resize($size['w'], null, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });

                // Encode as WebP with specified quality
                $encoded = $image->toWebp($size['q']);
                Storage::disk('public')->put($cachePath, $encoded);
                
                $totalSize += strlen($encoded);
            }

            return true;
        } catch (\Exception $e) {
            $this->error("Failed to optimize {$file}: " . $e->getMessage());
            return false;
        }
    }
}
