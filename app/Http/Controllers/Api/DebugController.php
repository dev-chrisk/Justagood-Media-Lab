<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaItem;
use App\Models\Collection;
use App\Models\User;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DebugController extends Controller
{
    /**
     * Get items without images report
     */
    public function itemsWithoutImages(Request $request)
    {
        try {
            // Get all items first to debug
            $allItems = MediaItem::select('id', 'title', 'category', 'path')->get();
            
            // More comprehensive check for items without images
            $itemsWithoutImages = MediaItem::where(function($query) {
                $query->whereNull('path')
                      ->orWhere('path', '')
                      ->orWhere('path', 'null')
                      ->orWhere('path', 'NULL')
                      ->orWhere('path', '0')
                      ->orWhere('path', 'false')
                      ->orWhereRaw('TRIM(path) = ""')
                      ->orWhereRaw('LENGTH(path) = 0');
            })->select('id', 'title', 'category', 'path')->get();

            // Also get some sample items to see what paths look like
            $sampleItems = MediaItem::select('id', 'title', 'category', 'path')
                ->whereNotNull('path')
                ->where('path', '!=', '')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'count' => $itemsWithoutImages->count(),
                'total_items' => $allItems->count(),
                'items' => $itemsWithoutImages->toArray(),
                'sample_items_with_paths' => $sampleItems->toArray(),
                'debug_info' => [
                    'null_paths' => MediaItem::whereNull('path')->count(),
                    'empty_paths' => MediaItem::where('path', '')->count(),
                    'null_string_paths' => MediaItem::where('path', 'null')->count(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving items without images: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get database statistics
     */
    public function databaseStats(Request $request)
    {
        try {
        $stats = [
            'total_items' => MediaItem::count(),
            'items_with_images' => MediaItem::whereNotNull('path')
                ->where('path', '!=', '')
                ->where('path', '!=', 'null')
                ->count(),
            'items_without_images' => MediaItem::where(function($query) {
                $query->whereNull('path')
                      ->orWhere('path', '')
                      ->orWhere('path', 'null');
            })->count(),
                'categories' => MediaItem::select('category', DB::raw('count(*) as count'))
                    ->groupBy('category')
                    ->pluck('count', 'category')
                    ->toArray(),
                'collections' => Collection::count(),
                'users' => User::count()
            ];

            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving database statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check image paths validity
     */
    public function imagePathsCheck(Request $request)
    {
        try {
        $items = MediaItem::whereNotNull('path')
            ->where('path', '!=', '')
            ->where('path', '!=', 'null')
            ->select('id', 'title', 'path')
            ->get();

            $validPaths = 0;
            $invalidPaths = 0;
            $missingFiles = 0;
            $issues = [];

        foreach ($items as $item) {
            $imagePath = $item->path;
                
                // Check if path is valid format
                if (empty($imagePath) || $imagePath === 'null') {
                    $invalidPaths++;
                    $issues[] = "Item {$item->id} ({$item->title}): Empty or null path";
                    continue;
                }

                // Check if file exists
                $fullPath = public_path($imagePath);
                if (file_exists($fullPath)) {
                    $validPaths++;
                } else {
                    $missingFiles++;
                    $issues[] = "Item {$item->id} ({$item->title}): File not found - {$imagePath}";
                }
            }

            return response()->json([
                'success' => true,
                'valid_paths' => $validPaths,
                'invalid_paths' => $invalidPaths,
                'missing_files' => $missingFiles,
                'total_checked' => $items->count(),
                'issues' => $issues
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error checking image paths: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get system information
     */
    public function systemInfo(Request $request)
    {
        try {
            $info = [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'database_driver' => config('database.default'),
                'storage_disk' => config('filesystems.default'),
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size'),
                'disk_free_space' => disk_free_space(storage_path()),
                'disk_total_space' => disk_total_space(storage_path())
            ];

            return response()->json([
                'success' => true,
                'info' => $info
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving system information: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear application cache
     */
    public function clearCache(Request $request)
    {
        try {
            \Artisan::call('cache:clear');
            \Artisan::call('config:clear');
            \Artisan::call('route:clear');
            \Artisan::call('view:clear');

            return response()->json([
                'success' => true,
                'message' => 'Application cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error clearing cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check for duplicate entries
     */
    public function checkDuplicates(Request $request)
    {
        try {
            // Check for duplicate titles within same category
            $duplicateTitles = MediaItem::select('title', 'category', DB::raw('COUNT(*) as count'))
                ->groupBy('title', 'category')
                ->having('count', '>', 1)
                ->orderBy('count', 'desc')
                ->get();

            // Check for exact duplicates (all fields match)
            $exactDuplicates = MediaItem::select('title', 'category', 'release', 'rating', 'platforms', 'genre', 'link', 'path', DB::raw('COUNT(*) as count'))
                ->groupBy('title', 'category', 'release', 'rating', 'platforms', 'genre', 'link', 'path')
                ->having('count', '>', 1)
                ->orderBy('count', 'desc')
                ->get();

            // Check for similar titles (fuzzy matching)
            $allItems = MediaItem::select('id', 'title', 'category')->get();
            $similarTitles = [];
            
            foreach ($allItems as $item) {
                $similar = $allItems->filter(function($other) use ($item) {
                    if ($other->id === $item->id) return false;
                    if ($other->category !== $item->category) return false;
                    
                    // Check for similar titles (case insensitive, ignoring special characters)
                    $title1 = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $item->title));
                    $title2 = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $other->title));
                    
                    return $title1 === $title2 || 
                           levenshtein($title1, $title2) <= 2 ||
                           strpos($title1, $title2) !== false ||
                           strpos($title2, $title1) !== false;
                });
                
                if ($similar->count() > 0) {
                    $similarTitles[] = [
                        'title' => $item->title,
                        'category' => $item->category,
                        'id' => $item->id,
                        'similar_count' => $similar->count(),
                        'similar_items' => $similar->map(function($s) {
                            return ['id' => $s->id, 'title' => $s->title];
                        })->toArray()
                    ];
                }
            }

            // Remove duplicates from similar titles
            $similarTitles = collect($similarTitles)->unique('id')->values();

            return response()->json([
                'success' => true,
                'duplicate_titles' => [
                    'count' => $duplicateTitles->count(),
                    'items' => $duplicateTitles->toArray()
                ],
                'exact_duplicates' => [
                    'count' => $exactDuplicates->count(),
                    'items' => $exactDuplicates->toArray()
                ],
                'similar_titles' => [
                    'count' => $similarTitles->count(),
                    'items' => $similarTitles->toArray()
                ],
                'summary' => [
                    'total_items' => MediaItem::count(),
                    'duplicate_titles_count' => $duplicateTitles->sum('count') - $duplicateTitles->count(),
                    'exact_duplicates_count' => $exactDuplicates->sum('count') - $exactDuplicates->count(),
                    'similar_titles_count' => $similarTitles->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error checking for duplicates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent errors from logs
     */
    public function recentErrors(Request $request)
    {
        try {
            $logFile = storage_path('logs/laravel.log');
            $errors = [];

            if (file_exists($logFile)) {
                $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                $recentLines = array_slice($lines, -100); // Get last 100 lines

                foreach ($recentLines as $line) {
                    if (strpos($line, 'ERROR') !== false || strpos($line, 'CRITICAL') !== false) {
                        $errors[] = $line;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'errors' => array_slice($errors, -20), // Return last 20 errors
                'total_errors' => count($errors)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving recent errors: ' . $e->getMessage()
            ], 500);
        }
    }
}
