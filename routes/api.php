<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\ImageController;

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

// Media Items API
Route::apiResource('media', MediaController::class);
Route::get('media_relative.json', [MediaController::class, 'getMediaRelative']);
Route::post('media_relative.json', [MediaController::class, 'saveMediaRelative']);
Route::get('api/search', [MediaController::class, 'search']);

// Collections API
Route::apiResource('collections', CollectionController::class);
Route::post('collections', [CollectionController::class, 'saveCollections']);
Route::post('collections/{id}/add-media', [CollectionController::class, 'addMediaItem']);
Route::post('collections/{id}/remove-media', [CollectionController::class, 'removeMediaItem']);

// Image API
Route::get('list-images', [ImageController::class, 'listImages']);
Route::post('copy-image', [ImageController::class, 'copyImage']);
Route::post('upload-image', [ImageController::class, 'uploadImage']);
Route::post('delete-image', [ImageController::class, 'deleteImage']);
Route::post('download-image', [ImageController::class, 'downloadImage']);
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
    Route::get('search', [MediaController::class, 'search']);
    
    // Collections with user filtering
    Route::apiResource('collections', CollectionController::class);
    Route::get('collections', [CollectionController::class, 'index']);
    Route::post('collections', [CollectionController::class, 'saveCollections']);
    
    // Images
    Route::get('list-images', [ImageController::class, 'listImages']);
    Route::post('copy-image', [ImageController::class, 'copyImage']);
    Route::post('upload-image', [ImageController::class, 'uploadImage']);
    Route::post('delete-image', [ImageController::class, 'deleteImage']);
    Route::post('download-image', [ImageController::class, 'downloadImage']);
    Route::get('thumb', [ImageController::class, 'thumbnail']);
    Route::get('images/{path}', [ImageController::class, 'serveImage'])->where('path', '.*');
    Route::get('images_downloads/{path}', [ImageController::class, 'serveImage'])->where('path', '.*');
    
    // Legacy image routes
    Route::get('games/{filename}', [ImageController::class, 'serveImage']);
    Route::get('movies/{filename}', [ImageController::class, 'serveImage']);
    Route::get('series/{filename}', [ImageController::class, 'serveImage']);
    
    // Fetch API endpoint
    Route::post('fetch-api', [MediaController::class, 'fetchApi']);
});
