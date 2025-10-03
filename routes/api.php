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
    return response()->json([
        'api_key' => config('services.google_books.api_key'),
        'base_url' => 'https://www.googleapis.com/books/v1'
    ]);
});

// Google Books API search (no authentication required)
Route::get('/google-books/search', [GoogleBooksController::class, 'search']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
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
