<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MediaItem;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class LinkMediaItemsToCategories extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:link-categories 
                            {--dry-run : Show what would be done without making changes}
                            {--force : Force linking without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Link existing media items to their corresponding categories';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting media items to categories linking process...');

        // Get all media items that don't have category_id set
        $mediaItems = MediaItem::whereNull('category_id')
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->get();

        if ($mediaItems->isEmpty()) {
            $this->info('No media items found that need category linking.');
            return;
        }

        $this->info("Found {$mediaItems->count()} media items that need category linking.");

        if ($this->option('dry-run')) {
            $this->showDryRunResults($mediaItems);
            return;
        }

        if (!$this->option('force') && !$this->confirm('Do you want to link these media items to their categories?')) {
            $this->info('Linking cancelled.');
            return;
        }

        $linkedCount = 0;
        $skippedCount = 0;
        $errorCount = 0;

        foreach ($mediaItems as $mediaItem) {
            try {
                $category = Category::where('name', $mediaItem->category)->first();
                
                if ($category) {
                    $mediaItem->category_id = $category->id;
                    $mediaItem->save();
                    $linkedCount++;
                    $this->line("Linked '{$mediaItem->title}' to category '{$category->name}'");
                } else {
                    $skippedCount++;
                    $this->warn("Category '{$mediaItem->category}' not found for '{$mediaItem->title}'");
                }
            } catch (\Exception $e) {
                $errorCount++;
                $this->error("Error linking '{$mediaItem->title}': {$e->getMessage()}");
            }
        }

        $this->info("Linking completed: {$linkedCount} linked, {$skippedCount} skipped, {$errorCount} errors.");
    }

    /**
     * Show dry run results
     */
    private function showDryRunResults($mediaItems)
    {
        $this->info('Dry run results:');
        
        $categoryGroups = $mediaItems->groupBy('category');
        
        foreach ($categoryGroups as $categoryName => $items) {
            $category = Category::where('name', $categoryName)->first();
            $status = $category ? '✓ Will link' : '✗ Category not found';
            
            $this->line("Category: {$categoryName} ({$status})");
            $this->line("  Items: {$items->count()}");
            
            if ($items->count() <= 5) {
                foreach ($items as $item) {
                    $this->line("    - {$item->title}");
                }
            } else {
                $this->line("    - {$items->first()->title} (and " . ($items->count() - 1) . " more)");
            }
            $this->line('');
        }
    }
}
