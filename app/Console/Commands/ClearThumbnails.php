<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ClearThumbnails extends Command
{
    protected $signature = 'images:clear-thumbnails';
    protected $description = 'Clear all generated thumbnails to free up space';

    public function handle()
    {
        $this->info('Clearing thumbnails...');
        
        if (Storage::disk('public')->exists('thumbnails')) {
            $files = Storage::disk('public')->allFiles('thumbnails');
            $count = count($files);
            
            Storage::disk('public')->deleteDirectory('thumbnails');
            
            $this->info("Deleted {$count} thumbnail files");
        } else {
            $this->info('No thumbnails directory found');
        }
        
        $this->info('Thumbnail cleanup complete!');
    }
}
