<?php

namespace App\Console\Commands;

use App\Models\MediaItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupGenreData extends Command
{
    protected $signature = 'media:cleanup-genre-data {--dry-run : Show what would be cleaned without making changes}';
    protected $description = 'Clean up corrupted genre data where descriptions were saved as genres';

    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        
        $this->info('🔍 Searching for corrupted genre data...');
        
        // Find entries where genre field contains description-like content
        // Look for patterns that suggest descriptions rather than genres
        $corruptedItems = MediaItem::whereNotNull('genre')
            ->where('genre', '!=', '')
            ->where(function($query) {
                $query->where('genre', 'like', '%...%') // Contains ellipsis
                      ->orWhere('genre', 'like', '%|%') // Contains pipe separator
                      ->orWhere('genre', 'like', '%description%') // Contains word "description"
                      ->orWhere('genre', 'like', '%overview%') // Contains word "overview"
                      ->orWhere('genre', 'like', '%plot%') // Contains word "plot"
                      ->orWhere('genre', 'like', '%story%') // Contains word "story"
                      ->orWhere('genre', 'like', '%summary%') // Contains word "summary"
                      ->orWhereRaw('LENGTH(genre) > 100'); // Very long genre (likely description)
            })
            ->get();
        
        if ($corruptedItems->isEmpty()) {
            $this->info('✅ No corrupted genre data found!');
            return;
        }
        
        $this->warn("Found {$corruptedItems->count()} potentially corrupted entries:");
        
        foreach ($corruptedItems as $item) {
            $this->line("ID: {$item->id} | Title: {$item->title} | Category: {$item->category}");
            $this->line("Current Genre: " . substr($item->genre, 0, 100) . (strlen($item->genre) > 100 ? '...' : ''));
            $this->line('---');
        }
        
        if ($isDryRun) {
            $this->info('🔍 Dry run completed. Use without --dry-run to clean up the data.');
            return;
        }
        
        if (!$this->confirm('Do you want to clean up these entries? This will clear the genre field for these items.')) {
            $this->info('Operation cancelled.');
            return;
        }
        
        $this->info('🧹 Cleaning up corrupted genre data...');
        
        $cleanedCount = 0;
        foreach ($corruptedItems as $item) {
            $item->genre = null;
            $item->save();
            $cleanedCount++;
        }
        
        $this->info("✅ Successfully cleaned {$cleanedCount} entries!");
        $this->info('The genre field has been cleared for these items. You can now re-enter the correct genre data manually.');
    }
}

