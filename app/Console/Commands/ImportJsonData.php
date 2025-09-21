<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MediaItem;
use App\Models\Collection;
use Illuminate\Support\Facades\File;

class ImportJsonData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:json-data {--path=data}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import media items and collections from JSON files';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dataPath = $this->option('path');
        
        $this->info('Starting JSON data import...');
        
        // Import media items
        $this->importMediaItems($dataPath);
        
        // Import collections
        $this->importCollections($dataPath);
        
        $this->info('JSON data import completed!');
    }
    
    private function importMediaItems($dataPath)
    {
        $mediaFile = $dataPath . '/media.json';
        
        if (!File::exists($mediaFile)) {
            $this->warn("Media file not found: {$mediaFile}");
            return;
        }
        
        $this->info('Importing media items...');
        
        $mediaData = json_decode(File::get($mediaFile), true);
        
        if (!is_array($mediaData)) {
            $this->error('Invalid media.json format');
            return;
        }
        
        // Clear existing data
        MediaItem::truncate();
        
        $bar = $this->output->createProgressBar(count($mediaData));
        $bar->start();
        
        foreach ($mediaData as $item) {
            try {
                // Normalize the data to match our database schema
                $normalizedItem = [
                    'title' => $item['title'] ?? '',
                    'category' => $item['category'] ?? 'game',
                    'release' => $item['release'] ?? null,
                    'rating' => $item['rating'] ?? null,
                    'count' => $item['count'] ?? 0,
                    'platforms' => $item['platforms'] ?? null,
                    'genre' => $item['genre'] ?? null,
                    'link' => $item['link'] ?? null,
                    'path' => $item['path'] ?? null,
                    'discovered' => !empty($item['discovered']) ? $item['discovered'] : null,
                    'spielzeit' => $item['spielzeit'] ?? null,
                    'is_airing' => $item['isAiring'] ?? false,
                    'next_season' => $item['nextSeason'] ?? null,
                    'next_season_release' => !empty($item['nextSeasonRelease']) ? $item['nextSeasonRelease'] : null,
                    'external_id' => $item['id'] ?? null,
                ];
                
                MediaItem::create($normalizedItem);
            } catch (\Exception $e) {
                $this->error("Error importing item: " . $e->getMessage());
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info('Media items imported successfully!');
    }
    
    private function importCollections($dataPath)
    {
        $collectionsFile = $dataPath . '/collections.json';
        
        if (!File::exists($collectionsFile)) {
            $this->warn("Collections file not found: {$collectionsFile}");
            return;
        }
        
        $this->info('Importing collections...');
        
        $collectionsData = json_decode(File::get($collectionsFile), true);
        
        if (!is_array($collectionsData) || !isset($collectionsData['collections'])) {
            $this->error('Invalid collections.json format');
            return;
        }
        
        // Clear existing collections
        Collection::truncate();
        
        $bar = $this->output->createProgressBar(count($collectionsData['collections']));
        $bar->start();
        
        foreach ($collectionsData['collections'] as $collection) {
            try {
                Collection::create([
                    'name' => $collection['name'] ?? 'Unnamed Collection',
                    'description' => $collection['description'] ?? null,
                    'media_item_ids' => $collection['media_item_ids'] ?? [],
                ]);
            } catch (\Exception $e) {
                $this->error("Error importing collection: " . $e->getMessage());
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info('Collections imported successfully!');
    }
}
