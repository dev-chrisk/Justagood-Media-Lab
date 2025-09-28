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
     * Check for duplicate entries in specific category with progress
     */
    public function checkDuplicatesInCategory(Request $request)
    {
        try {
            $category = $request->get('category');
            $chunkSize = 100; // Process in chunks to avoid memory issues
            $offset = $request->get('offset', 0);
            
            if (!$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category parameter is required'
                ], 400);
            }

            // Get total count for progress calculation
            $totalItems = MediaItem::where('category', $category)->count();
            
            if ($totalItems === 0) {
                return response()->json([
                    'success' => true,
                    'category' => $category,
                    'total_items' => 0,
                    'processed' => 0,
                    'progress' => 100,
                    'duplicates' => [],
                    'is_complete' => true
                ]);
            }

            // Get items in current chunk
            $items = MediaItem::where('category', $category)
                ->select('id', 'title', 'category', 'release', 'rating', 'platforms', 'genre', 'link', 'path')
                ->offset($offset)
                ->limit($chunkSize)
                ->get();

            $duplicates = [];
            $processed = $offset + $items->count();
            $progress = min(100, round(($processed / $totalItems) * 100, 2));

            // Check for duplicates within this chunk and against all items in category
            foreach ($items as $item) {
                // Check for exact duplicates
                $exactDuplicates = MediaItem::where('category', $category)
                    ->where('id', '!=', $item->id)
                    ->where('title', $item->title)
                    ->where('release', $item->release)
                    ->where('rating', $item->rating)
                    ->where('platforms', $item->platforms)
                    ->where('genre', $item->genre)
                    ->where('link', $item->link)
                    ->where('path', $item->path)
                    ->select('id', 'title')
                    ->get();

                if ($exactDuplicates->count() > 0) {
                    $duplicates[] = [
                        'type' => 'exact',
                        'item' => [
                            'id' => $item->id,
                            'title' => $item->title
                        ],
                        'duplicates' => $exactDuplicates->toArray(),
                        'total_count' => $exactDuplicates->count() + 1
                    ];
                }

                // Check for title duplicates (same title, different other fields)
                $titleDuplicates = MediaItem::where('category', $category)
                    ->where('id', '!=', $item->id)
                    ->where('title', $item->title)
                    ->select('id', 'title', 'release', 'rating')
                    ->get();

                if ($titleDuplicates->count() > 0) {
                    $duplicates[] = [
                        'type' => 'title',
                        'item' => [
                            'id' => $item->id,
                            'title' => $item->title
                        ],
                        'duplicates' => $titleDuplicates->toArray(),
                        'total_count' => $titleDuplicates->count() + 1
                    ];
                }
            }

            // Remove duplicate entries (same item appearing multiple times)
            $uniqueDuplicates = collect($duplicates)->unique(function ($item) {
                return $item['item']['id'] . '_' . $item['type'];
            })->values();

            return response()->json([
                'success' => true,
                'category' => $category,
                'total_items' => $totalItems,
                'processed' => $processed,
                'progress' => $progress,
                'duplicates' => $uniqueDuplicates->toArray(),
                'is_complete' => $processed >= $totalItems
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error checking for duplicates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get duplicate check status for a category
     */
    public function getDuplicateCheckStatus(Request $request)
    {
        try {
            $category = $request->get('category');
            
            if (!$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category parameter is required'
                ], 400);
            }

            $totalItems = MediaItem::where('category', $category)->count();
            
            // Check for existing duplicates in the category
            $duplicateTitles = MediaItem::select('title', DB::raw('COUNT(*) as count'))
                ->where('category', $category)
                ->groupBy('title')
                ->having('count', '>', 1)
                ->get();

            $exactDuplicates = MediaItem::select('title', 'release', 'rating', 'platforms', 'genre', 'link', 'path', DB::raw('COUNT(*) as count'))
                ->where('category', $category)
                ->groupBy('title', 'release', 'rating', 'platforms', 'genre', 'link', 'path')
                ->having('count', '>', 1)
                ->get();

            return response()->json([
                'success' => true,
                'category' => $category,
                'total_items' => $totalItems,
                'duplicate_titles_count' => $duplicateTitles->sum('count') - $duplicateTitles->count(),
                'exact_duplicates_count' => $exactDuplicates->sum('count') - $exactDuplicates->count(),
                'duplicate_titles' => $duplicateTitles->toArray(),
                'exact_duplicates' => $exactDuplicates->toArray()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error getting duplicate check status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check for duplicate entries (legacy method - kept for backward compatibility)
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
                'summary' => [
                    'total_items' => MediaItem::count(),
                    'duplicate_titles_count' => $duplicateTitles->sum('count') - $duplicateTitles->count(),
                    'exact_duplicates_count' => $exactDuplicates->sum('count') - $exactDuplicates->count()
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
     * Delete a specific duplicate entry by ID
     */
    public function deleteDuplicate(Request $request)
    {
        try {
            $duplicateId = $request->get('id');
            $category = $request->get('category');
            
            if (!$duplicateId || !$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID and category parameters are required'
                ], 400);
            }

            // Find the item to delete
            $item = MediaItem::where('id', $duplicateId)
                ->where('category', $category)
                ->first();

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item not found or not in specified category'
                ], 404);
            }

            // Get the item details for logging
            $itemDetails = [
                'id' => $item->id,
                'title' => $item->title,
                'category' => $item->category,
                'release' => $item->release,
                'rating' => $item->rating
            ];

            // Check if there are other items with the same title in the same category
            $remainingItems = MediaItem::where('category', $category)
                ->where('title', $item->title)
                ->where('id', '!=', $duplicateId)
                ->count();

            // Only allow deletion if there are other items with the same title
            // This prevents deleting the last/only item of a title
            if ($remainingItems === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete the last remaining item with this title. At least one item must remain.'
                ], 400);
            }

            // Delete the item
            $item->delete();

            return response()->json([
                'success' => true,
                'message' => 'Duplicate item deleted successfully',
                'deleted_item' => $itemDetails,
                'remaining_items_with_same_title' => $remainingItems
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting duplicate: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed information about a specific duplicate group
     */
    public function getDuplicateGroupDetails(Request $request)
    {
        try {
            $title = $request->get('title');
            $category = $request->get('category');
            $type = $request->get('type', 'title'); // 'title' or 'exact'
            
            if (!$title || !$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Title and category parameters are required'
                ], 400);
            }

            $query = MediaItem::where('category', $category)
                ->where('title', $title);

            if ($type === 'exact') {
                // For exact duplicates, we need to get the first item's details to match against
                $firstItem = $query->first();
                if (!$firstItem) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No items found with this title'
                    ], 404);
                }

                $query = MediaItem::where('category', $category)
                    ->where('title', $title)
                    ->where('release', $firstItem->release)
                    ->where('rating', $firstItem->rating)
                    ->where('platforms', $firstItem->platforms)
                    ->where('genre', $firstItem->genre)
                    ->where('link', $firstItem->link)
                    ->where('path', $firstItem->path);
            }

            $items = $query->select('id', 'title', 'category', 'release', 'rating', 'platforms', 'genre', 'link', 'path', 'created_at')
                ->orderBy('id', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'category' => $category,
                'title' => $title,
                'type' => $type,
                'count' => $items->count(),
                'items' => $items->toArray()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error getting duplicate group details: ' . $e->getMessage()
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
