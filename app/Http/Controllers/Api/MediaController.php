<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaItem;
use App\Events\MediaUpdated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class MediaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MediaItem::query();

        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        // Filter by category
        if ($request->has('category')) {
            $category = $request->category;
            // Filter by both category_id and category field for compatibility
            $query->where(function($q) use ($category) {
                $q->where('category', $category)
                  ->orWhereHas('categoryRelation', function($subQ) use ($category) {
                      $subQ->where('name', $category);
                  });
            });
        }

        // Search by title
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Filter by rating range
        if ($request->has('rating_min') && $request->has('rating_max')) {
            $query->ratingRange($request->rating_min, $request->rating_max);
        }

        // Filter by playtime range
        if ($request->has('playtime_min') && $request->has('playtime_max')) {
            $query->playtimeRange($request->playtime_min, $request->playtime_max);
        }

        // Filter by airing status
        if ($request->has('is_airing')) {
            $query->where('is_airing', $request->boolean('is_airing'));
        }

        // Filter by date (for polling)
        if ($request->has('since')) {
            $since = $request->get('since');
            try {
                $sinceDate = \Carbon\Carbon::parse($since);
                $query->where('updated_at', '>', $sinceDate);
            } catch (\Exception $e) {
                // Invalid date format, ignore
            }
        }

        // Sorting
        $sortBy = $request->get('sort', 'id');
        $sortOrder = $request->get('order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $mediaItems = $query->get();

        // Debug logging
        \Log::info('Media API Debug', [
            'user_id' => $request->user()?->id,
            'category' => $request->get('category'),
            'total_items' => $mediaItems->count(),
            'categories' => $mediaItems->groupBy('category')->map->count()
        ]);

        return response()->json($mediaItems);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'category' => 'required|string|in:game,series,movie,watchlist',
            'watchlist_type' => 'nullable|string|in:game,series,movie',
            'release' => 'nullable|date',
            'rating' => 'nullable|integer|min:0|max:10',
            'count' => 'required|integer|min:0',
            'platforms' => 'nullable|string',
            'genre' => 'nullable|string',
            'link' => 'nullable|url',
            'path' => 'nullable|string',
            'discovered' => 'nullable|date',
            'spielzeit' => 'nullable|integer|min:0',
            'is_airing' => 'required|boolean',
            'next_season' => 'nullable|integer|min:1',
            'next_season_release' => 'nullable|date',
            'external_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $data = $request->all();
        // Add user_id if user is authenticated
        if ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        $mediaItem = MediaItem::create($data);

        // Dispatch event for real-time updates
        event(new MediaUpdated($mediaItem, 'created', $request->user()?->id));

        return response()->json(['success' => true, 'data' => $mediaItem], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $mediaItem = $query->find($id);

        if (!$mediaItem) {
            return response()->json(['success' => false, 'error' => 'Media item not found'], 404);
        }

        return response()->json($mediaItem);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $mediaItem = $query->find($id);

        if (!$mediaItem) {
            return response()->json(['success' => false, 'error' => 'Media item not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|in:game,series,movie,watchlist',
            'watchlist_type' => 'nullable|string|in:game,series,movie',
            'release' => 'nullable|date',
            'rating' => 'nullable|integer|min:0|max:10',
            'count' => 'sometimes|integer|min:0',
            'platforms' => 'nullable|string',
            'genre' => 'nullable|string',
            'link' => 'nullable|url',
            'path' => 'nullable|string',
            'discovered' => 'nullable|date',
            'spielzeit' => 'nullable|integer|min:0',
            'is_airing' => 'sometimes|boolean',
            'next_season' => 'nullable|integer|min:1',
            'next_season_release' => 'nullable|date',
            'external_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $mediaItem->update($request->all());

        // Dispatch event for real-time updates
        event(new MediaUpdated($mediaItem, 'updated', $request->user()?->id));

        return response()->json(['success' => true, 'data' => $mediaItem]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $mediaItem = $query->find($id);

        if (!$mediaItem) {
            return response()->json(['success' => false, 'error' => 'Media item not found'], 404);
        }

        $mediaItem->delete();

        // Dispatch event for real-time updates
        event(new MediaUpdated($mediaItem, 'deleted', $request->user()?->id));

        return response()->json(['success' => true]);
    }

    /**
     * Get media items with relative paths (for compatibility with existing frontend)
     */
    public function getMediaRelative(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $mediaItems = $query->get();
        return response()->json($mediaItems);
    }

    /**
     * Save media items (for compatibility with existing frontend)
     */
    public function saveMediaRelative(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            '*.title' => 'required|string|max:255',
            '*.category' => 'required|string|in:game,series,movie,watchlist',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        // Only process data if user is authenticated
        if ($request->user()) {
            $userId = $request->user()->id;
            $incomingData = $request->all();
            
            // Get existing data for comparison
            $existingItems = MediaItem::forUser($userId)->get()->keyBy('id');
            $incomingItems = collect($incomingData)->keyBy('id');
            
            $stats = [
                'created' => 0,
                'updated' => 0,
                'deleted' => 0,
                'unchanged' => 0
            ];
            
            // Process incoming items
            foreach ($incomingItems as $itemId => $itemData) {
                $itemData['user_id'] = $userId;
                
                if ($existingItems->has($itemId)) {
                    // Check if item has actually changed
                    $existingItem = $existingItems->get($itemId);
                    $hasChanges = false;
                    
                    foreach ($itemData as $key => $value) {
                        if ($key !== 'user_id' && $existingItem->$key != $value) {
                            $hasChanges = true;
                            break;
                        }
                    }
                    
                    if ($hasChanges) {
                        $existingItem->update($itemData);
                        $stats['updated']++;
                    } else {
                        $stats['unchanged']++;
                    }
                } else {
                    // New item
                    MediaItem::create($itemData);
                    $stats['created']++;
                }
            }
            
            // Delete items that are no longer in incoming data
            $incomingIds = $incomingItems->keys();
            $deletedCount = MediaItem::forUser($userId)
                ->whereNotIn('id', $incomingIds)
                ->delete();
            $stats['deleted'] = $deletedCount;
            
            return response()->json([
                'success' => true,
                'stats' => $stats,
                'message' => "Sync completed: {$stats['created']} created, {$stats['updated']} updated, {$stats['deleted']} deleted, {$stats['unchanged']} unchanged"
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Add multiple media items in batch
     */
    public function batchAdd(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.title' => 'required|string|max:255',
            'items.*.category' => 'required|string|in:game,series,movie,watchlist',
            'items.*.rating' => 'nullable|integer|min:0|max:10',
            'items.*.count' => 'required|integer|min:0',
            'items.*.platforms' => 'nullable|string',
            'items.*.genre' => 'nullable|string',
            'items.*.link' => 'nullable|url',
            'items.*.path' => 'nullable|string',
            'items.*.discovered' => 'nullable|date',
            'items.*.spielzeit' => 'required|integer|min:0',
            'items.*.is_airing' => 'required|boolean',
            'items.*.next_season' => 'nullable|integer|min:1',
            'items.*.next_season_release' => 'nullable|date',
            'items.*.external_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            \Log::error('Batch add validation failed', [
                'errors' => $validator->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        if (!$request->user()) {
            return response()->json(['success' => false, 'error' => 'Authentication required'], 401);
        }

        $userId = $request->user()->id;
        $items = $request->get('items', []);
        
        $stats = [
            'created' => 0,
            'failed' => 0,
            'errors' => []
        ];
        
        foreach ($items as $index => $itemData) {
            try {
                $itemData['user_id'] = $userId;
                
                // Ensure required fields are set (validation should catch missing ones)
                $itemData['count'] = (int) ($itemData['count'] ?? 0);
                $itemData['is_airing'] = (bool) ($itemData['is_airing'] ?? false);
                $itemData['spielzeit'] = (int) ($itemData['spielzeit'] ?? 0);
                
                // Download image if path is provided and it's a URL
                if (!empty($itemData['path']) && filter_var($itemData['path'], FILTER_VALIDATE_URL)) {
                    try {
                        $itemData['path'] = $this->downloadImageFromUrl($itemData['path'], $itemData['title']);
                    } catch (\Exception $e) {
                        \Log::warning("Failed to download image for {$itemData['title']}: " . $e->getMessage());
                        $itemData['path'] = null; // Continue without image
                    }
                }
                
                $newItem = MediaItem::create($itemData);
                $stats['created']++;
                
                // Dispatch event for real-time updates
                event(new MediaUpdated($newItem, 'created', $userId));
                
            } catch (\Exception $e) {
                $stats['failed']++;
                $stats['errors'][] = [
                    'index' => $index,
                    'title' => $itemData['title'] ?? 'Unknown',
                    'error' => $e->getMessage()
                ];
                
                \Log::error('Bulk add item error', [
                    'item' => $itemData,
                    'error' => $e->getMessage(),
                    'index' => $index
                ]);
            }
        }
        
        return response()->json([
            'success' => true,
            'stats' => $stats,
            'message' => "Bulk add completed: {$stats['created']} created, {$stats['failed']} failed"
        ]);
    }

    /**
     * Delete multiple media items in batch
     */
    public function batchDelete(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:media_items,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $ids = $request->get('ids', []);
        $deletedItems = $query->whereIn('id', $ids)->get();
        $deletedCount = $query->whereIn('id', $ids)->delete();

        // Dispatch events for real-time updates
        foreach ($deletedItems as $item) {
            event(new MediaUpdated($item, 'deleted', $request->user()?->id));
        }

        return response()->json([
            'success' => true,
            'deleted_count' => $deletedCount,
            'message' => "Successfully deleted {$deletedCount} items"
        ]);
    }

    /**
     * Search for media items via external APIs
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        $limit = (int) $request->get('limit', 10);
        $category = $request->get('category', '');

        if (empty($query) || strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];

        // Search TMDB for movies and TV shows (only if category is not specified or is movie/series)
        if (empty($category) || in_array($category, ['movie', 'series'])) {
            try {
                $tmdbApiKey = config('services.tmdb.api_key');
                
                // Search movies (only if category is not specified or is movie)
                if (empty($category) || $category === 'movie') {
                    $movieUrl = "https://api.themoviedb.org/3/search/movie?api_key={$tmdbApiKey}&query=" . urlencode($query) . "&page=1";
                    $movieResponse = json_decode(file_get_contents($movieUrl), true);
                    
                    $movieLimit = empty($category) ? $limit / 2 : $limit;
                    foreach (array_slice($movieResponse['results'] ?? [], 0, $movieLimit) as $item) {
                        $results[] = [
                            'id' => "tmdb_movie_{$item['id']}",
                            'title' => $item['title'],
                            'release' => $item['release_date'] ?? '',
                            'image' => $item['poster_path'] ? "https://image.tmdb.org/t/p/w200{$item['poster_path']}" : '',
                            'category' => 'movie',
                            'overview' => $item['overview'] ?? '',
                            'rating' => round($item['vote_average'] ?? 0, 1),
                            'api_source' => 'tmdb'
                        ];
                    }
                }
                
                // Search TV shows (only if category is not specified or is series)
                if (empty($category) || $category === 'series') {
                    $tvUrl = "https://api.themoviedb.org/3/search/tv?api_key={$tmdbApiKey}&query=" . urlencode($query) . "&page=1";
                    $tvResponse = json_decode(file_get_contents($tvUrl), true);
                    
                    $tvLimit = empty($category) ? $limit / 2 : $limit;
                    foreach (array_slice($tvResponse['results'] ?? [], 0, $tvLimit) as $item) {
                        $results[] = [
                            'id' => "tmdb_tv_{$item['id']}",
                            'title' => $item['name'],
                            'release' => $item['first_air_date'] ?? '',
                            'image' => $item['poster_path'] ? "https://image.tmdb.org/t/p/w200{$item['poster_path']}" : '',
                            'category' => 'series',
                            'overview' => $item['overview'] ?? '',
                            'rating' => round($item['vote_average'] ?? 0, 1),
                            'api_source' => 'tmdb'
                        ];
                    }
                }
            } catch (\Exception $e) {
                \Log::error("TMDB search error: " . $e->getMessage());
            }
        }

        // Search RAWG for games (only if category is not specified or is game)
        if (empty($category) || $category === 'game') {
            try {
                $rawgApiKey = config('services.rawg.api_key');
                $gameLimit = empty($category) ? $limit / 3 : $limit;
                $gameUrl = "https://api.rawg.io/api/games?key={$rawgApiKey}&search=" . urlencode($query) . "&page_size=" . $gameLimit;
                $gameResponse = json_decode(file_get_contents($gameUrl), true);
                
                foreach (array_slice($gameResponse['results'] ?? [], 0, $gameLimit) as $item) {
                    $results[] = [
                        'id' => "rawg_game_{$item['id']}",
                        'title' => $item['name'],
                        'release' => $item['released'] ?? '',
                        'image' => $item['background_image'] ?? '',
                        'category' => 'game',
                        'overview' => $item['description_raw'] ?? '',
                        'rating' => round($item['rating'] ?? 0, 1),
                        'api_source' => 'rawg'
                    ];
                }
            } catch (\Exception $e) {
                \Log::error("RAWG search error: " . $e->getMessage());
            }
        }

        // Sort by relevance (rating) and limit results
        usort($results, fn($a, $b) => $b['rating'] <=> $a['rating']);
        return response()->json(array_slice($results, 0, $limit));
    }

    /**
     * Fetch data from external APIs (TMDB/RAWG)
     */
    public function fetchApi(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string',
            'category' => 'required|string|in:game,series,movie',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => 'Title or category missing'], 400);
        }

        $titleOrId = $request->title;
        $category = $request->category;

        try {
            if ($category === 'game') {
                // RAWG API
                $rawgApiKey = config('services.rawg.api_key');
                $url = "https://api.rawg.io/api/games?key={$rawgApiKey}&search=" . urlencode($titleOrId);
                $response = json_decode(file_get_contents($url), true);
                
                if (empty($response['results'])) {
                    return response()->json(['success' => false, 'error' => 'No game found'], 404);
                }

                $game = $response['results'][0];
                $safeName = $this->sanitizeFilename($game['name']);
                $relBase = "images_downloads/games/{$safeName}";
                
                $result = [
                    'title' => $game['name'],
                    'release' => $game['released'] ?? null,
                    'platforms' => implode(', ', array_map(fn($p) => $p['platform']['name'], $game['platforms'] ?? [])),
                    'genre' => implode(', ', array_map(fn($g) => $g['name'], $game['genres'] ?? [])),
                    'link' => "https://rawg.io/games/{$game['slug']}",
                    'path' => $relBase
                ];

                if (!empty($game['background_image'])) {
                    try {
                        $result['path'] = $this->saveImageFromUrl($game['background_image'], $relBase);
                    } catch (\Exception $e) {
                        \Log::error("RAWG image download error: " . $e->getMessage());
                    }
                }

                $debug = [
                    'source' => 'rawg',
                    'raw' => $game,
                    'extra' => [
                        'metacritic' => $game['metacritic'] ?? null,
                        'esrb_rating' => $game['esrb_rating']['name'] ?? null,
                        'ratings_count' => $game['ratings_count'] ?? null,
                    ]
                ];

            } else {
                // TMDB API
                $tmdbApiKey = config('services.tmdb.api_key');
                $searchType = $category === 'movie' ? 'movie' : 'tv';
                $tmdbId = null;

                // Check if input is numeric (ID) or string (title)
                if (is_numeric($titleOrId)) {
                    $tmdbId = $titleOrId;
                } else {
                    // Search by title
                    $searchUrl = "https://api.themoviedb.org/3/search/{$searchType}?api_key={$tmdbApiKey}&query=" . urlencode($titleOrId);
                    $searchResponse = json_decode(file_get_contents($searchUrl), true);
                    
                    if (!empty($searchResponse['results'])) {
                        // Prefer exact name match
                        $exact = collect($searchResponse['results'])->first(function ($item) use ($titleOrId) {
                            return strtolower($item['title'] ?? $item['name'] ?? '') === strtolower($titleOrId);
                        });
                        $chosen = $exact ?? $searchResponse['results'][0];
                        $tmdbId = $chosen['id'];
                    }
                }

                if (!$tmdbId) {
                    return response()->json(['success' => false, 'error' => 'TMDB ID could not be determined'], 404);
                }

                // Get details
                $detailsUrl = "https://api.themoviedb.org/3/{$searchType}/{$tmdbId}?api_key={$tmdbApiKey}";
                $details = json_decode(file_get_contents($detailsUrl), true);
                
                $name = $details['title'] ?? $details['name'];
                $safeName = $this->sanitizeFilename($name);
                $relBase = "images_downloads/" . ($category === 'movie' ? 'movies' : 'series') . "/{$safeName}";
                
                $result = [
                    'title' => $name,
                    'release' => $details['release_date'] ?? $details['first_air_date'] ?? null,
                    'platforms' => '',
                    'genre' => implode(', ', array_map(fn($g) => $g['name'], $details['genres'] ?? [])),
                    'link' => "https://www.themoviedb.org/{$searchType}/{$tmdbId}",
                    'path' => $relBase
                ];

                if (!empty($details['poster_path'])) {
                    $imgUrl = "https://image.tmdb.org/t/p/w500{$details['poster_path']}";
                    try {
                        $result['path'] = $this->saveImageFromUrl($imgUrl, $relBase);
                    } catch (\Exception $e) {
                        \Log::error("TMDB image download error: " . $e->getMessage());
                    }
                }

                $debug = [
                    'source' => 'tmdb',
                    'details' => $details
                ];
            }

            $payload = ['success' => true, 'data' => $result];
            if (isset($debug)) {
                $payload['debug'] = $debug;
            }

            return response()->json($payload);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Sanitize filename for storage
     */
    private function sanitizeFilename($name)
    {
        $safe = preg_replace('/[^a-zA-Z0-9\s\-_\.]/', '', $name);
        return trim($safe) ?: 'item';
    }

    /**
     * Save image from URL to storage
     */
    private function saveImageFromUrl($url, $relBase)
    {
        $content = file_get_contents($url);
        
        if (!$content || strlen($content) < 200) {
            throw new \Exception('Empty or invalid image content');
        }

        // Determine file extension
        $extension = 'jpg';
        if (strpos($url, '.png') !== false) {
            $extension = 'png';
        } elseif (strpos($url, '.webp') !== false) {
            $extension = 'webp';
        }

        $path = $relBase . '.' . $extension;
        \Storage::disk('public')->put($path, $content);

        return $path;
    }

    /**
     * Download image from URL and save to storage (for bulk add)
     */
    private function downloadImageFromUrl($url, $title)
    {
        $content = file_get_contents($url);
        
        if (!$content || strlen($content) < 200) {
            throw new \Exception('Empty or invalid image content');
        }

        // Sanitize title for filename
        $safeTitle = preg_replace('/[^a-zA-Z0-9\s\-_\.]/', '', $title);
        $safeTitle = trim($safeTitle) ?: 'item';
        
        // Determine file extension
        $extension = 'jpg';
        if (strpos($url, '.png') !== false) {
            $extension = 'png';
        } elseif (strpos($url, '.webp') !== false) {
            $extension = 'webp';
        }

        // Create unique filename
        $filename = $safeTitle . '_' . time() . '.' . $extension;
        $path = 'images_downloads/bulk/' . $filename;
        
        \Storage::disk('public')->put($path, $content);

        return $path;
    }

    /**
     * Server-Sent Events endpoint for real-time updates
     */
    public function events(Request $request)
    {
        // Set headers for SSE
        $response = response()->stream(function () use ($request) {
            // Set SSE headers
            echo "data: " . json_encode(['type' => 'connected', 'timestamp' => now()->toISOString()]) . "\n\n";
            
            // Keep connection alive and send periodic updates
            $lastUpdate = now();
            $userId = $request->user()?->id;
            $heartbeatCount = 0;
            
            while (true) {
                // Check for new media items or updates
                $query = MediaItem::query();
                if ($userId) {
                    $query->forUser($userId);
                }
                
                $recentItems = $query->where('updated_at', '>', $lastUpdate)->get();
                
                if ($recentItems->count() > 0) {
                    $updateData = [
                        'type' => 'media_updated',
                        'timestamp' => now()->toISOString(),
                        'items' => $recentItems->toArray(),
                        'count' => $recentItems->count()
                    ];
                    
                    echo "data: " . json_encode($updateData) . "\n\n";
                    $lastUpdate = now();
                }
                
                // Send heartbeat every 10 seconds
                $heartbeatCount++;
                if ($heartbeatCount >= 10) {
                    echo "data: " . json_encode(['type' => 'heartbeat', 'timestamp' => now()->toISOString()]) . "\n\n";
                    $heartbeatCount = 0;
                }
                
                // Flush output
                if (ob_get_level()) {
                    ob_flush();
                }
                flush();
                
                // Sleep for 1 second before next check
                sleep(1);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Headers' => 'Cache-Control',
            'X-Accel-Buffering' => 'no', // Disable nginx buffering
        ]);

        return $response;
    }
}
