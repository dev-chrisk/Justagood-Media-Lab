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

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Media items with user filtering
    Route::apiResource('media', MediaController::class);
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
    
    // Export/Import routes (authenticated)
    Route::post('export-data', [ExportImportController::class, 'exportData']);
    Route::post('import-data', [ExportImportController::class, 'importData']);
    Route::post('import-data-stream', [ExportImportController::class, 'importDataStream']);
    Route::post('download-api-images', [ExportImportController::class, 'downloadApiImages']);
    
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
        Route::get('/system-info', [DebugController::class, 'systemInfo']);
        Route::post('/clear-cache', [DebugController::class, 'clearCache']);
        Route::get('/recent-errors', [DebugController::class, 'recentErrors']);
    });
});
