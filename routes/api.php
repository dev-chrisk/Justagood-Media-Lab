<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\ImageController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DebugController;
use App\Http\Controllers\Api\BooksController;
use App\Http\Controllers\Api\GoogleBooksController;
use App\Http\Controllers\ExportImportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public search endpoint (no authentication required)
Route::get('search', [MediaController::class, 'search']);

// Debug endpoint to test basic API functionality
Route::get('debug/health', function () {
    try {
        // Test database connection
        $dbStatus = 'connected';
        $userCount = 0;
        try {
            $userCount = \App\Models\User::count();
        } catch (\Exception $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toISOString(),
            'environment' => app()->environment(),
            'debug' => config('app.debug'),
            'database' => $dbStatus,
            'user_count' => $userCount,
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'error' => $e->getMessage(),
            'timestamp' => now()->toISOString()
        ], 500);
    }
});

// Server-Sent Events for real-time updates
Route::get('events', [MediaController::class, 'events']);

// Public image serving routes (no authentication required)
Route::get('thumb', [ImageController::class, 'thumbnail']);
Route::get('images/{path}', [ImageController::class, 'serveImage'])->where('path', '.*');
Route::get('images_downloads/{path}', [ImageController::class, 'serveImage'])->where('path', '.*');

// Legacy routes for compatibility
Route::get('games/{filename}', [ImageController::class, 'serveImage']);
Route::get('movies/{filename}', [ImageController::class, 'serveImage']);
Route::get('series/{filename}', [ImageController::class, 'serveImage']);

// Authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Admin setup route (no authentication required)
Route::post('/admin-setup', [AuthController::class, 'adminSetup']);

// Google Books API configuration (no authentication required)
Route::get('/google-books-config', function () {
    $apiKey = config('services.google_books.api_key');
    return response()->json([
        'api_key' => $apiKey ?: null,
        'base_url' => 'https://www.googleapis.com/books/v1'
    ]);
});

// Google Books API search (no authentication required)
Route::get('/google-books/search', function (Request $request) {
    $query = $request->get('q');
    $maxResults = $request->get('maxResults', 10);
    
    if (!$query || trim($query) === '') {
        return response()->json([
            'success' => false,
            'error' => 'Query parameter is required'
        ], 400);
    }

    try {
        $apiKey = config('services.google_books.api_key');
        
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'error' => 'Google Books API key not configured'
            ], 500);
        }

        $url = 'https://www.googleapis.com/books/v1/volumes';
        $params = [
            'q' => $query,
            'key' => $apiKey,
            'maxResults' => min($maxResults, 40)
        ];

        \Log::info('📚 Google Books API Request', [
            'url' => $url,
            'api_key_length' => strlen($apiKey),
            'api_key_prefix' => substr($apiKey, 0, 10) . '...',
            'query' => $query,
            'maxResults' => $maxResults
        ]);

        $response = \Illuminate\Support\Facades\Http::timeout(10)->get($url, $params);

        if (!$response->successful()) {
            $errorBody = $response->body();
            $errorData = json_decode($errorBody, true);
            
            $errorMessage = 'Google Books API error: ' . $response->status();
            if (isset($errorData['error']['message'])) {
                $errorMessage .= ' - ' . $errorData['error']['message'];
            }
            
            return response()->json([
                'success' => false,
                'error' => $errorMessage,
                'details' => $errorBody,
                'debug' => [
                    'url' => $url,
                    'api_key_length' => strlen($apiKey),
                    'api_key_prefix' => substr($apiKey, 0, 10) . '...'
                ]
            ], 400);
        }

        $data = $response->json();
        
        // Format the data for frontend
        $formattedItems = array_map(function ($item) {
            $volumeInfo = $item['volumeInfo'] ?? [];
            $imageLinks = $volumeInfo['imageLinks'] ?? [];
            
            return [
                'id' => $item['id'] ?? '',
                'title' => $volumeInfo['title'] ?? 'Unknown Title',
                'authors' => $volumeInfo['authors'] ?? [],
                'author' => isset($volumeInfo['authors']) ? implode(', ', $volumeInfo['authors']) : '',
                'description' => $volumeInfo['description'] ?? '',
                'publishedDate' => $volumeInfo['publishedDate'] ?? '',
                'publisher' => $volumeInfo['publisher'] ?? '',
                'pageCount' => $volumeInfo['pageCount'] ?? null,
                'categories' => $volumeInfo['categories'] ?? [],
                'language' => $volumeInfo['language'] ?? '',
                'isbn10' => null,
                'isbn13' => null,
                'imageUrl' => $imageLinks['thumbnail'] ?? $imageLinks['smallThumbnail'] ?? null,
                'previewLink' => $volumeInfo['previewLink'] ?? null,
                'infoLink' => $volumeInfo['infoLink'] ?? null,
                'canonicalVolumeLink' => $volumeInfo['canonicalVolumeLink'] ?? null
            ];
        }, $data['items'] ?? []);

        return response()->json([
            'success' => true,
            'data' => $formattedItems,
            'totalItems' => $data['totalItems'] ?? 0
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => 'Failed to search books: ' . $e->getMessage()
        ], 500);
    }
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }
            return response()->json($user);
        } catch (\Exception $e) {
            \Log::error('Error in /user endpoint', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    });
    
    // Books API - Simple and clean
    Route::apiResource('books', BooksController::class);
    
    // Media items with user filtering
    Route::apiResource('media', MediaController::class);
    Route::post('media/batch-delete', [MediaController::class, 'batchDelete']);
    Route::get('media_relative.json', [MediaController::class, 'getMediaRelative']);
    Route::post('media_relative.json', [MediaController::class, 'saveMediaRelative']);
    
    // Collections with user filtering
    Route::apiResource('collections', CollectionController::class);
    Route::post('collections', [CollectionController::class, 'saveCollections']);
    Route::post('collections/{id}/add-media', [CollectionController::class, 'addMediaItem']);
    Route::post('collections/{id}/remove-media', [CollectionController::class, 'removeMediaItem']);
    
    // Image management (authenticated users only)
    Route::get('list-images', [ImageController::class, 'listImages']);
    Route::post('copy-image', [ImageController::class, 'copyImage']);
    Route::post('upload-image', [ImageController::class, 'uploadImage']);
    Route::post('delete-image', [ImageController::class, 'deleteImage']);
    Route::post('download-image', [ImageController::class, 'downloadImage']);
    
    // Fetch API endpoint
    Route::post('fetch-api', [MediaController::class, 'fetchApi']);
    
    // Duplicate check endpoints
    Route::get('media/check-duplicates', [MediaController::class, 'checkDuplicates']);
    Route::get('media/check-duplicates/{category}', [MediaController::class, 'checkCategoryDuplicates']);
    
    // Export/Import routes (authenticated)
    Route::post('export-data', [ExportImportController::class, 'exportData']);
    Route::post('import-data', [ExportImportController::class, 'importData']);
    Route::post('import-data-stream', [ExportImportController::class, 'importDataStream']);
    Route::post('download-api-images', [ExportImportController::class, 'downloadApiImages']);
});

// Admin routes (require admin access)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [App\Http\Controllers\AdminController::class, 'users']);
    Route::get('/users/{id}', [App\Http\Controllers\AdminController::class, 'userDetails']);
    Route::put('/users/{id}', [App\Http\Controllers\AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [App\Http\Controllers\AdminController::class, 'deleteUser']);
    Route::get('/statistics', [App\Http\Controllers\AdminController::class, 'statistics']);
    Route::get('/user-activity/{id}', [App\Http\Controllers\AdminController::class, 'userActivity']);
    Route::get('/media-items', [App\Http\Controllers\AdminController::class, 'allMediaItems']);
    Route::get('/collections', [App\Http\Controllers\AdminController::class, 'allCollections']);
});

// Public TMDb API routes (no authentication required)
Route::prefix('tmdb')->group(function () {
    Route::get('movie/{id}', [App\Http\Controllers\Api\TmdbController::class, 'getMovie']);
    Route::get('collection/{id}', [App\Http\Controllers\Api\TmdbController::class, 'getCollection']);
});

// Additional routes
Route::group([], function () {
    // Chunked upload routes for large files
    Route::post('upload-chunk', [ExportImportController::class, 'uploadChunk']);
    Route::post('finalize-chunked-upload', [ExportImportController::class, 'finalizeChunkedUpload']);
    
    // Statistics routes
    Route::prefix('statistics')->group(function () {
        Route::get('total', [StatisticsController::class, 'total']);
        Route::get('categories', [StatisticsController::class, 'categories']);
        Route::get('ratings', [StatisticsController::class, 'ratings']);
        Route::get('platforms', [StatisticsController::class, 'platforms']);
        Route::get('genres', [StatisticsController::class, 'genres']);
        Route::get('recent', [StatisticsController::class, 'recent']);
        Route::get('airing', [StatisticsController::class, 'airing']);
        Route::get('release-years', [StatisticsController::class, 'releaseYears']);
        Route::get('discovery-timeline', [StatisticsController::class, 'discoveryTimeline']);
        Route::get('playtime-by-category', [StatisticsController::class, 'playtimeByCategory']);
        Route::get('user-activity', [StatisticsController::class, 'userActivity']);
    });

    // Category management routes
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::get('/statistics', [CategoryController::class, 'statistics']);
        Route::post('/find-or-create', [CategoryController::class, 'findOrCreate']);
        Route::post('/cleanup-duplicates', [CategoryController::class, 'cleanupDuplicates']);
        Route::post('/migrate-from-media-items', [CategoryController::class, 'migrateFromMediaItems']);
        Route::get('/{category}', [CategoryController::class, 'show']);
        Route::put('/{category}', [CategoryController::class, 'update']);
        Route::delete('/{category}', [CategoryController::class, 'destroy']);
    });


    // Debug routes (authenticated users only)
    Route::prefix('debug')->group(function () {
        Route::get('/items-without-images', [DebugController::class, 'itemsWithoutImages']);
        Route::get('/database-stats', [DebugController::class, 'databaseStats']);
        Route::get('/image-paths-check', [DebugController::class, 'imagePathsCheck']);
        Route::get('/check-duplicates', [DebugController::class, 'checkDuplicates']);
        Route::get('/check-duplicates-in-category', [DebugController::class, 'checkDuplicatesInCategory']);
        Route::get('/duplicate-check-status', [DebugController::class, 'getDuplicateCheckStatus']);
        Route::delete('/delete-duplicate', [DebugController::class, 'deleteDuplicate']);
        Route::get('/duplicate-group-details', [DebugController::class, 'getDuplicateGroupDetails']);
        Route::get('/get-all-duplicates', [DebugController::class, 'getAllDuplicatesForCategory']);
        Route::post('/auto-delete-duplicates', [DebugController::class, 'autoDeleteDuplicates']);
        Route::get('/system-info', [DebugController::class, 'systemInfo']);
        Route::post('/clear-cache', [DebugController::class, 'clearCache']);
        Route::get('/recent-errors', [DebugController::class, 'recentErrors']);
    });
});
