<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class MigrateImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:images {--source=../backend/images} {--downloads=../backend/images_downloads}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate images from Flask backend to Laravel storage';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sourcePath = $this->option('source');
        $downloadsPath = $this->option('downloads');
        
        $this->info('Starting image migration...');
        
        // Migrate main images directory
        $this->migrateDirectory($sourcePath, 'images');
        
        // Migrate downloads directory
        $this->migrateDirectory($downloadsPath, 'images_downloads');
        
        $this->info('Image migration completed!');
    }
    
    private function migrateDirectory($sourcePath, $targetPath)
    {
        if (!File::exists($sourcePath)) {
            $this->warn("Source directory not found: {$sourcePath}");
            return;
        }
        
        $this->info("Migrating {$sourcePath} to storage/app/public/{$targetPath}...");
        
        $files = File::allFiles($sourcePath);
        $imageFiles = array_filter($files, function($file) {
            return preg_match('/\.(jpg|jpeg|png|webp)$/i', $file->getFilename());
        });
        
        $bar = $this->output->createProgressBar(count($imageFiles));
        $bar->start();
        
        foreach ($imageFiles as $file) {
            try {
                $relativePath = str_replace($sourcePath . DIRECTORY_SEPARATOR, '', $file->getPathname());
                $relativePath = str_replace('\\', '/', $relativePath);
                
                $targetFilePath = "{$targetPath}/{$relativePath}";
                
                // Create directory if it doesn't exist
                $targetDir = dirname($targetFilePath);
                if (!Storage::disk('public')->exists($targetDir)) {
                    Storage::disk('public')->makeDirectory($targetDir);
                }
                
                // Copy file
                Storage::disk('public')->put($targetFilePath, File::get($file));
                
            } catch (\Exception $e) {
                $this->error("Error migrating file {$file->getFilename()}: " . $e->getMessage());
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info("Migrated " . count($imageFiles) . " images to {$targetPath}");
    }
}
