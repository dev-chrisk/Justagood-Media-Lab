<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MediaItem;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class ImportMediaData extends Command
{
    protected $signature = 'media:import {--user-id=1 : ID des Benutzers, dem die Daten zugewiesen werden sollen}';
    protected $description = 'Importiert Media-Daten aus der bereinigten JSON-Datei';

    public function handle()
    {
        $this->info('=== Media Data Import ===');
        
        $userId = $this->option('user-id');
        
        // Prüfen ob User existiert
        $user = User::find($userId);
        if (!$user) {
            $this->error("User mit ID {$userId} nicht gefunden!");
            return 1;
        }
        
        $this->info("Importiere Daten für User: {$user->name} (ID: {$userId})");
        
        // JSON-Datei laden
        $jsonPath = base_path('media-library-export-2025-09-21 (1)/media_data_cleaned.json');
        if (!file_exists($jsonPath)) {
            $this->error("JSON-Datei nicht gefunden: {$jsonPath}");
            return 1;
        }
        
        $jsonData = json_decode(file_get_contents($jsonPath), true);
        $items = $jsonData['data'] ?? [];
        
        $this->info("Gefunden: " . count($items) . " Einträge");
        
        // Kategorien erstellen
        $this->info("Erstelle Kategorien...");
        $categoryMap = $this->createCategories($items);
        
        // Bilder kopieren
        $this->info("Kopiere Bilder...");
        $this->copyImages($items);
        
        // Media Items importieren
        $this->info("Importiere Media Items...");
        $importedCount = $this->importMediaItems($items, $userId, $categoryMap);
        
        $this->info("✅ Import abgeschlossen!");
        $this->info("Importiert: {$importedCount} Einträge");
        
        return 0;
    }
    
    private function createCategories($items)
    {
        $categoryMap = [];
        $uniqueCategories = collect($items)->pluck('category')->unique();
        
        foreach ($uniqueCategories as $categoryName) {
            if (empty($categoryName)) continue;
            
            $category = Category::findOrCreateByName($categoryName);
            $categoryMap[$categoryName] = $category->id;
            
            $this->line("  Kategorie: {$categoryName} (ID: {$category->id})");
        }
        
        return $categoryMap;
    }
    
    private function copyImages($items)
    {
        $sourceDir = base_path('media-library-export-2025-09-21 (1)/merged_images');
        $targetDir = storage_path('app/public');
        
        // Stelle sicher, dass das Zielverzeichnis existiert
        if (!File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }
        
        $copiedCount = 0;
        $skippedCount = 0;
        
        foreach ($items as $item) {
            if (empty($item['path'])) continue;
            
            $sourcePath = $sourceDir . '/' . $item['path'];
            $targetPath = $targetDir . '/' . $item['path'];
            
            // Erstelle Zielverzeichnis falls nötig
            $targetDirPath = dirname($targetPath);
            if (!File::exists($targetDirPath)) {
                File::makeDirectory($targetDirPath, 0755, true);
            }
            
            if (File::exists($sourcePath)) {
                if (!File::exists($targetPath)) {
                    File::copy($sourcePath, $targetPath);
                    $copiedCount++;
                } else {
                    $skippedCount++;
                }
            }
        }
        
        $this->line("  Kopiert: {$copiedCount} Bilder");
        $this->line("  Übersprungen: {$skippedCount} Bilder (bereits vorhanden)");
    }
    
    private function importMediaItems($items, $userId, $categoryMap)
    {
        $importedCount = 0;
        $skippedCount = 0;
        
        foreach ($items as $item) {
            // Prüfe ob Eintrag bereits existiert (basierend auf external_id oder title)
            $existingItem = MediaItem::where('external_id', $item['external_id'] ?? null)
                ->orWhere('title', $item['title'])
                ->first();
            
            if ($existingItem) {
                $skippedCount++;
                continue;
            }
            
            // Erstelle neuen MediaItem
            $mediaItem = new MediaItem();
            $mediaItem->title = $item['title'];
            $mediaItem->category = $item['category']; // Legacy field
            $mediaItem->category_id = $categoryMap[$item['category']] ?? null;
            $mediaItem->release = $item['release'];
            $mediaItem->rating = $item['rating'];
            $mediaItem->count = $item['count'] ?? 0;
            $mediaItem->platforms = $item['platforms'];
            $mediaItem->genre = $item['genre'];
            $mediaItem->link = $item['link'];
            $mediaItem->path = $item['path'];
            $mediaItem->discovered = $item['discovered'];
            $mediaItem->spielzeit = $item['spielzeit'];
            $mediaItem->is_airing = $item['is_airing'] ?? false;
            $mediaItem->next_season = $item['next_season'];
            $mediaItem->next_season_release = $item['next_season_release'];
            $mediaItem->external_id = $item['external_id'];
            $mediaItem->user_id = $userId;
            
            $mediaItem->save();
            $importedCount++;
            
            if ($importedCount % 100 == 0) {
                $this->line("  Importiert: {$importedCount} Einträge...");
            }
        }
        
        $this->line("  Importiert: {$importedCount} Einträge");
        $this->line("  Übersprungen: {$skippedCount} Einträge (bereits vorhanden)");
        
        return $importedCount;
    }
}

