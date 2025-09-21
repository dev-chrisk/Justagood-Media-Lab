<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\ImageController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// API Routes for frontend compatibility (without /api prefix) - exclude CSRF
Route::get('media_relative.json', [MediaController::class, 'getMediaRelative'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::post('media_relative.json', [MediaController::class, 'saveMediaRelative'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::get('api/search', [MediaController::class, 'search'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// Collections API
Route::get('collections', [CollectionController::class, 'index'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::post('collections', [CollectionController::class, 'saveCollections'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// Image API
Route::get('list-images', [ImageController::class, 'listImages'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::post('copy-image', [ImageController::class, 'copyImage'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::post('upload-image', [ImageController::class, 'uploadImage'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::post('delete-image', [ImageController::class, 'deleteImage'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::post('download-image', [ImageController::class, 'downloadImage'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::get('thumb', [ImageController::class, 'thumbnail'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::get('images/{path}', [ImageController::class, 'serveImage'])->where('path', '.*')->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::get('images_downloads/{path}', [ImageController::class, 'serveImage'])->where('path', '.*')->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// Legacy image routes
Route::get('games/{filename}', [ImageController::class, 'serveImage'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::get('movies/{filename}', [ImageController::class, 'serveImage'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::get('series/{filename}', [ImageController::class, 'serveImage'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// Fetch API endpoint (from Flask app)
Route::post('fetch-api', [MediaController::class, 'fetchApi'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// Serve the frontend files
Route::get('/', function () {
    $frontendPath = base_path('public/frontend/index.html');
    if (File::exists($frontendPath)) {
        return File::get($frontendPath);
    }
    return view('welcome');
});

// Serve static frontend files (only for specific file extensions)
Route::get('/{path}', function ($path) {
    // Only serve files with specific extensions to avoid interfering with API routes
    $allowedExtensions = ['css', 'js', 'html', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'];
    $extension = pathinfo($path, PATHINFO_EXTENSION);
    
    if (!in_array($extension, $allowedExtensions)) {
        return response('File not found', 404);
    }
    
    $frontendPath = base_path("public/frontend/{$path}");
    if (File::exists($frontendPath)) {
        $mimeType = match ($extension) {
            'css' => 'text/css',
            'js' => 'application/javascript',
            'html' => 'text/html',
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject',
            default => 'text/plain',
        };
        
        return response(File::get($frontendPath), 200, [
            'Content-Type' => $mimeType,
        ]);
    }
    
    return response('File not found', 404);
})->where('path', '[a-zA-Z0-9_/.-]+\\.(css|js|html|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$');
