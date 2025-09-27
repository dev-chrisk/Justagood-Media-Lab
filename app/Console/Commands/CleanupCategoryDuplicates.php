<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Category;
use App\Models\MediaItem;
use Illuminate\Support\Facades\DB;

class CleanupCategoryDuplicates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'categories:cleanup 
                            {--migrate : Migrate existing categories from media_items table}
                            {--duplicates : Clean up duplicate categories}
                            {--dry-run : Show what would be done without making changes}
                            {--force : Force cleanup without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up duplicate categories and migrate existing data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting category cleanup process...');

        if ($this->option('migrate')) {
            $this->migrateCategoriesFromMediaItems();
        }

        if ($this->option('duplicates')) {
            $this->cleanupDuplicates();
        }

        if (!$this->option('migrate') && !$this->option('duplicates')) {
            $this->migrateCategoriesFromMediaItems();
            $this->cleanupDuplicates();
        }

        $this->info('Category cleanup completed!');
    }

    /**
     * Migrate categories from media_items table
     */
    private function migrateCategoriesFromMediaItems()
    {
        $this->info('Migrating categories from media_items table...');

        $categoryNames = Category::getUniqueCategoryNamesFromMediaItems();
        
        if ($categoryNames->isEmpty()) {
            $this->warn('No categories found in media_items table.');
            return;
        }

        $this->info("Found {$categoryNames->count()} unique categories in media_items table.");

        if ($this->option('dry-run')) {
            $this->table(['Category Name'], $categoryNames->map(fn($name) => [$name])->toArray());
            return;
        }

        if (!$this->option('force') && !$this->confirm('Do you want to migrate these categories?')) {
            $this->info('Migration cancelled.');
            return;
        }

        $createdCount = 0;
        $skippedCount = 0;

        foreach ($categoryNames as $categoryName) {
            if (!Category::where('name', $categoryName)->exists()) {
                Category::create(['name' => $categoryName]);
                $createdCount++;
                $this->line("Created category: {$categoryName}");
            } else {
                $skippedCount++;
                $this->line("Skipped existing category: {$categoryName}");
            }
        }

        $this->info("Migration completed: {$createdCount} created, {$skippedCount} skipped.");
    }

    /**
     * Clean up duplicate categories
     */
    private function cleanupDuplicates()
    {
        $this->info('Checking for duplicate categories...');

        $duplicates = Category::select('name', DB::raw('COUNT(*) as count'))
            ->groupBy('name')
            ->having('count', '>', 1)
            ->get();

        if ($duplicates->isEmpty()) {
            $this->info('No duplicate categories found.');
            return;
        }

        $this->warn("Found {$duplicates->count()} duplicate category groups:");
        
        foreach ($duplicates as $duplicate) {
            $categories = Category::where('name', $duplicate->name)->get();
            $this->table(
                ['ID', 'Name', 'Created At', 'Media Items Count'],
                $categories->map(fn($cat) => [
                    $cat->id,
                    $cat->name,
                    $cat->created_at->format('Y-m-d H:i:s'),
                    $cat->mediaItems()->count()
                ])->toArray()
            );
        }

        if ($this->option('dry-run')) {
            $this->info('Dry run completed. No changes made.');
            return;
        }

        if (!$this->option('force') && !$this->confirm('Do you want to merge these duplicate categories?')) {
            $this->info('Cleanup cancelled.');
            return;
        }

        $beforeCount = Category::count();
        Category::cleanupDuplicates();
        $afterCount = Category::count();
        $removedCount = $beforeCount - $afterCount;

        $this->info("Cleanup completed: {$removedCount} duplicate categories removed.");
        $this->info("Remaining categories: {$afterCount}");
    }
}
