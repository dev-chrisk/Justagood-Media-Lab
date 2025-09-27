<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use App\Models\MediaItem;

class ExportImportController extends Controller
{
    /**
     * Export all data as ZIP package
     */
    public function exportData(Request $request)
    {
        try {
            $data = $request->json()->all();
            $exportData = $data['exportData'] ?? [];
            $categoryLists = $data['categoryLists'] ?? [];
            
            // Create temporary directory for export
            $tempDir = storage_path('app/temp/export_' . uniqid());
            File::makeDirectory($tempDir, 0755, true);
            
            // Save main data file
            $dataFile = $tempDir . '/media_data.json';
            File::put($dataFile, json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            
            // Save category lists
            foreach ($categoryLists as $filename => $content) {
                $listFile = $tempDir . '/' . $filename;
                File::put($listFile, $content);
            }
            
            // Copy images if they exist
            $this->copyImagesToExport($tempDir, $exportData['data'] ?? []);
            
            // Create ZIP file using system command
            $zipPath = $tempDir . '/export.zip';
            $this->createZipArchive($tempDir, $zipPath);
            
            // Return ZIP file
            $zipContent = File::get($zipPath);
            
            // Cleanup
            File::deleteDirectory($tempDir);
            
            return response($zipContent, 200, [
                'Content-Type' => 'application/zip',
                'Content-Disposition' => 'attachment; filename="media-library-export.zip"',
                'Content-Length' => strlen($zipContent)
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Import data from ZIP package with progress updates
     */
    public function importData(Request $request): JsonResponse
    {
        try {
            \Log::info('Import started', ['user_id' => $request->user()?->id]);
            
            $file = $request->file('file');
            
            if (!$file || !$file->isValid()) {
                throw new \Exception('Invalid file uploaded');
            }
            
            if ($file->getClientOriginalExtension() !== 'zip') {
                throw new \Exception('File must be a ZIP archive');
            }
            
            // Check if user is authenticated
            if (!$request->user()) {
                throw new \Exception('Authentication required for import');
            }
            
            \Log::info('File validation passed', ['filename' => $file->getClientOriginalName(), 'size' => $file->getSize()]);
            
            // Create temporary directory for import
            $tempDir = storage_path('app/temp/import_' . uniqid());
            File::makeDirectory($tempDir, 0755, true);
            \Log::info('Created temp directory', ['path' => $tempDir]);
            
            // Extract ZIP file
            $zipPath = $file->storeAs('temp', 'import_' . uniqid() . '.zip');
            $fullZipPath = storage_path('app/' . $zipPath);
            \Log::info('ZIP file stored', ['path' => $fullZipPath]);
            
            \Log::info('Starting ZIP extraction...');
            $extractStartTime = microtime(true);
            $this->extractZipArchive($fullZipPath, $tempDir);
            $extractTime = microtime(true) - $extractStartTime;
            \Log::info('ZIP extracted successfully', ['extract_time' => round($extractTime, 2) . 's']);
            
            // Find and load data file
            $dataFile = $tempDir . '/media_data.json';
            if (!File::exists($dataFile)) {
                throw new \Exception('No media_data.json found in ZIP file');
            }
            
            \Log::info('Loading data file', ['size' => File::size($dataFile)]);
            $importData = json_decode(File::get($dataFile), true);
            
            if (!$importData || !isset($importData['data'])) {
                throw new \Exception('Invalid data format in ZIP file');
            }
            
            $mediaDataCount = count($importData['data'] ?? []);
            \Log::info('Data loaded', ['items_count' => $mediaDataCount]);
            
            // Skip image copying for now - images will be downloaded as needed
            \Log::info('Skipping image copy - images will be downloaded on demand');
            
            // Assign user_id to all imported data
            $userId = $request->user()->id;
            $mediaData = $importData['data'] ?? [];
            $totalItems = count($mediaData);
            
            \Log::info('Assigning user_id to data', ['user_id' => $userId, 'items_count' => $totalItems]);
            
            // Add user_id to each media item and save to database with progress
            $savedCount = 0;
            $errors = [];
            
            foreach ($mediaData as $index => $item) {
                try {
                    $item['user_id'] = $userId;
                    
                    // Add minimal delay for large imports to prevent timeout
                    if ($totalItems > 100) {
                        usleep(5000); // 5ms delay
                    }
                    
                    // Save to database
                    MediaItem::create($item);
                    $savedCount++;
                    
                    // Log progress every 25 items for better tracking
                    if (($index + 1) % 25 === 0) {
                        $percentage = round((($index + 1) / $totalItems) * 100, 1);
                        \Log::info('Import progress', [
                            'processed' => $index + 1,
                            'total' => $totalItems,
                            'percentage' => $percentage,
                            'current_item' => $item['title'] ?? 'Unknown'
                        ]);
                    }
                    
                } catch (\Exception $e) {
                    $errors[] = [
                        'item' => $item['title'] ?? 'Unknown',
                        'error' => $e->getMessage(),
                        'index' => $index
                    ];
                    \Log::error('Import item error', [
                        'item' => $item,
                        'error' => $e->getMessage(),
                        'index' => $index
                    ]);
                }
            }
            
            \Log::info('User assignment and database save completed', [
                'saved_count' => $savedCount,
                'total_items' => $totalItems,
                'errors_count' => count($errors)
            ]);
            
            // Cleanup immediately since we're not copying images
            \Log::info('Starting immediate cleanup');
            File::deleteDirectory($tempDir);
            File::delete($fullZipPath);
            \Log::info('Cleanup completed');
            
            // Identify items that might need API images
            $apiCandidates = [];
            foreach ($mediaData as $item) {
                // Check if item has no image or placeholder image
                $hasImage = !empty($item['path']) && 
                           !str_contains($item['path'], 'placeholder') && 
                           !str_contains($item['path'], 'default') &&
                           !str_contains($item['path'], 'no-image');
                
                if (!$hasImage && !empty($item['title'])) {
                    $apiCandidates[] = [
                        'id' => $item['id'] ?? null,
                        'title' => $item['title'],
                        'category' => $item['category'] ?? 'unknown',
                        'year' => $item['year'] ?? null
                    ];
                }
            }
            
            \Log::info('Import completed successfully', [
                'items_imported' => $savedCount,
                'total_items' => $totalItems,
                'errors_count' => count($errors),
                'api_candidates' => count($apiCandidates)
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $mediaData,
                'preferences' => $importData['preferences'] ?? null,
                'api_candidates' => $apiCandidates,
                'message' => "Import completed! {$savedCount} of {$totalItems} items imported successfully.",
                'debug' => [
                    'items_imported' => $savedCount,
                    'total_items' => $totalItems,
                    'errors_count' => count($errors),
                    'api_candidates_count' => count($apiCandidates),
                    'user_id' => $userId,
                    'temp_dir_cleaned' => true,
                    'errors' => $errors
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Import failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()?->id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'debug' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]
            ], 500);
        }
    }
    
    /**
     * Import data from ZIP package with Server-Sent Events progress updates
     */
    public function importDataStream(Request $request)
    {
        try {
            // Validate file upload before processing
            $request->validate([
                'file' => 'required|file|mimes:zip|max:102400' // 100MB max
            ], [
                'file.required' => 'Keine Datei hochgeladen',
                'file.file' => 'Ungültige Datei',
                'file.mimes' => 'Datei muss eine ZIP-Datei sein',
                'file.max' => 'Datei ist zu groß (max. 100MB)'
            ]);

            // Set headers for Server-Sent Events
            $response = response()->stream(function () use ($request) {
                $this->streamImportProgress($request);
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache',
                'Connection' => 'keep-alive',
                'X-Accel-Buffering' => 'no', // Disable nginx buffering
            ]);

            return $response;
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Import validation failed', [
                'errors' => $e->errors(),
                'user_id' => $request->user()?->id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Import stream failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()?->id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Stream import progress via Server-Sent Events
     */
    private function streamImportProgress(Request $request)
    {
        $this->sendProgressUpdate(5, 'Validating file...', 'Checking ZIP file format...');
        
        $file = $request->file('file');
        
        if (!$file || !$file->isValid()) {
            $this->sendProgressUpdate(0, 'Error', 'Invalid file uploaded');
            return;
        }
        
        if ($file->getClientOriginalExtension() !== 'zip') {
            $this->sendProgressUpdate(0, 'Error', 'File must be a ZIP archive');
            return;
        }
        
        // Check file size (100MB = 104857600 bytes)
        $maxSize = 100 * 1024 * 1024; // 100MB
        if ($file->getSize() > $maxSize) {
            $this->sendProgressUpdate(0, 'Error', 'File too large. Maximum size is 100MB');
            return;
        }
        
        if (!$request->user()) {
            $this->sendProgressUpdate(0, 'Error', 'Authentication required for import');
            return;
        }
        
        $this->sendProgressUpdate(10, 'File validated', 'ZIP file format is correct');
        
        // Create temporary directory for import
        $tempDir = storage_path('app/temp/import_' . uniqid());
        File::makeDirectory($tempDir, 0755, true);
        
        $this->sendProgressUpdate(15, 'Preparing extraction...', 'Creating temporary directory...');
        
        // Extract ZIP file
        $zipPath = $file->storeAs('temp', 'import_' . uniqid() . '.zip');
        $fullZipPath = storage_path('app/' . $zipPath);
        
        $this->sendProgressUpdate(20, 'Extracting ZIP file...', 'Decompressing archive...');
        
        $extractStartTime = microtime(true);
        $this->extractZipArchive($fullZipPath, $tempDir);
        $extractTime = microtime(true) - $extractStartTime;
        
        $this->sendProgressUpdate(30, 'ZIP extracted', "Extraction completed in " . round($extractTime, 2) . "s");
        
        // Find and load data file
        $dataFile = $tempDir . '/media_data.json';
        if (!File::exists($dataFile)) {
            $this->sendProgressUpdate(0, 'Error', 'No media_data.json found in ZIP file');
            return;
        }
        
        $this->sendProgressUpdate(35, 'Loading data file...', 'Reading media data...');
        
        $importData = json_decode(File::get($dataFile), true);
        
        if (!$importData || !isset($importData['data'])) {
            $this->sendProgressUpdate(0, 'Error', 'Invalid data format in ZIP file');
            return;
        }
        
        $mediaDataCount = count($importData['data'] ?? []);
        $this->sendProgressUpdate(40, 'Data loaded', "Found {$mediaDataCount} items to import");
        
        // Assign user_id to all imported data
        $userId = $request->user()->id;
        $mediaData = $importData['data'] ?? [];
        $totalItems = count($mediaData);
        
        $this->sendProgressUpdate(45, 'Preparing database import...', "Assigning user ID to {$totalItems} items");
        
        // Add user_id to each media item and save to database with progress
        $savedCount = 0;
        $errors = [];
        
        foreach ($mediaData as $index => $item) {
            try {
                $item['user_id'] = $userId;
                
                // Save to database
                MediaItem::create($item);
                $savedCount++;
                
                // Calculate progress (45% to 90% for database operations)
                $progress = 45 + (($index + 1) / $totalItems) * 45;
                
                // Send progress update every 10 items or at key milestones
                if (($index + 1) % 10 === 0 || $index === 0 || $index === $totalItems - 1) {
                    $this->sendProgressUpdate(
                        round($progress), 
                        'Importing to database...', 
                        "Imported {$savedCount} of {$totalItems} items"
                    );
                }
                
            } catch (\Exception $e) {
                $errors[] = [
                    'item' => $item['title'] ?? 'Unknown',
                    'error' => $e->getMessage(),
                    'index' => $index
                ];
            }
        }
        
        $this->sendProgressUpdate(90, 'Database import completed', "Successfully imported {$savedCount} of {$totalItems} items");
        
        // Cleanup
        File::deleteDirectory($tempDir);
        File::delete($fullZipPath);
        
        $this->sendProgressUpdate(95, 'Cleaning up...', 'Removing temporary files...');
        
        // Identify items that might need API images
        $apiCandidates = [];
        foreach ($mediaData as $item) {
            $hasImage = !empty($item['path']) && 
                       !str_contains($item['path'], 'placeholder') && 
                       !str_contains($item['path'], 'default') &&
                       !str_contains($item['path'], 'no-image');
            
            if (!$hasImage && !empty($item['title'])) {
                $apiCandidates[] = [
                    'id' => $item['id'] ?? null,
                    'title' => $item['title'],
                    'category' => $item['category'] ?? 'unknown',
                    'year' => $item['year'] ?? null
                ];
            }
        }
        
        $this->sendProgressUpdate(100, 'Import completed!', "Successfully imported {$savedCount} of {$totalItems} items", [
            'success' => true,
            'data' => $mediaData,
            'preferences' => $importData['preferences'] ?? null,
            'api_candidates' => $apiCandidates,
            'debug' => [
                'items_imported' => $savedCount,
                'total_items' => $totalItems,
                'errors_count' => count($errors),
                'api_candidates_count' => count($apiCandidates),
                'user_id' => $userId,
                'errors' => $errors
            ]
        ]);
        
        // Send final completion signal
        echo "data: " . json_encode(['type' => 'complete', 'success' => true]) . "\n\n";
        if (ob_get_level()) {
            ob_flush();
        }
        flush();
        
    }
    
    /**
     * Send progress update via Server-Sent Events
     */
    private function sendProgressUpdate($percentage, $status, $details, $data = null)
    {
        $update = [
            'percentage' => $percentage,
            'status' => $status,
            'details' => $details,
            'timestamp' => now()->toISOString()
        ];
        
        if ($data) {
            $update['data'] = $data;
        }
        
        echo "data: " . json_encode($update) . "\n\n";
        
        if (ob_get_level()) {
            ob_flush();
        }
        flush();
    }
    
    /**
     * Copy images to export directory
     */
    private function copyImagesToExport(string $tempDir, array $mediaData): void
    {
        $imagesDir = Storage::disk('public')->path('images');
        $imagesDownloadsDir = Storage::disk('public')->path('images_downloads');
        
        // Create images directories
        $exportImagesDir = $tempDir . '/images';
        $exportImagesDownloadsDir = $tempDir . '/images_downloads';
        File::makeDirectory($exportImagesDir, 0755, true);
        File::makeDirectory($exportImagesDownloadsDir, 0755, true);
        
        // Collect all unique image paths from media data
        $imagePaths = [];
        $downloadedImagePaths = [];
        
        foreach ($mediaData as $item) {
            if (isset($item['path']) && !empty($item['path'])) {
                $imagePaths[] = $item['path'];
                
                // Also check for downloaded images with same filename
                $filename = basename($item['path']);
                $category = dirname($item['path']);
                $downloadedPath = $category . '/' . $filename;
                if (File::exists($imagesDownloadsDir . '/' . $downloadedPath)) {
                    $downloadedImagePaths[] = $downloadedPath;
                }
            }
        }
        
        // Copy only referenced images
        foreach ($imagePaths as $imagePath) {
            $sourcePath = $imagesDir . '/' . $imagePath;
            $destPath = $exportImagesDir . '/' . $imagePath;
            
            if (File::exists($sourcePath)) {
                // Create directory structure if needed
                $destDir = dirname($destPath);
                if (!File::exists($destDir)) {
                    File::makeDirectory($destDir, 0755, true);
                }
                File::copy($sourcePath, $destPath);
            }
        }
        
        // Copy only referenced thumbnails
        foreach ($imagePaths as $imagePath) {
            $thumbnailPath = str_replace(['games/', 'movies/', 'series/'], '_thumbs/', $imagePath);
            $sourceThumbPath = $imagesDir . '/' . $thumbnailPath;
            $destThumbPath = $exportImagesDir . '/' . $thumbnailPath;
            
            if (File::exists($sourceThumbPath)) {
                $destThumbDir = dirname($destThumbPath);
                if (!File::exists($destThumbDir)) {
                    File::makeDirectory($destThumbDir, 0755, true);
                }
                File::copy($sourceThumbPath, $destThumbPath);
            }
        }
        
        // Copy only referenced downloaded images
        foreach ($downloadedImagePaths as $downloadedPath) {
            $sourcePath = $imagesDownloadsDir . '/' . $downloadedPath;
            $destPath = $exportImagesDownloadsDir . '/' . $downloadedPath;
            
            if (File::exists($sourcePath)) {
                $destDir = dirname($destPath);
                if (!File::exists($destDir)) {
                    File::makeDirectory($destDir, 0755, true);
                }
                File::copy($sourcePath, $destPath);
            }
        }
    }
    
    /**
     * Download API images for items without images
     */
    public function downloadApiImages(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            $candidates = $request->input('candidates', []);
            
            if (empty($candidates)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No candidates provided'
                ], 400);
            }
            
            $downloadedCount = 0;
            $errors = [];
            
            foreach ($candidates as $candidate) {
                try {
                    $mediaItem = MediaItem::where('user_id', $userId)
                        ->where('id', $candidate['id'])
                        ->first();
                    
                    if (!$mediaItem) {
                        continue;
                    }
                    
                    // Use existing fetchApi logic
                    $apiData = $this->fetchApiData($candidate['title'], $candidate['category']);
                    
                    if ($apiData && !empty($apiData['image'])) {
                        // Download and save image
                        $imagePath = $this->downloadAndSaveImage($apiData['image'], $candidate['category']);
                        
                        if ($imagePath) {
                            $mediaItem->update([
                                'path' => $imagePath,
                                'rating' => $apiData['rating'] ?? $mediaItem->rating,
                                'overview' => $apiData['overview'] ?? $mediaItem->overview
                            ]);
                            $downloadedCount++;
                        }
                    }
                } catch (\Exception $e) {
                    $errors[] = [
                        'title' => $candidate['title'],
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'downloaded_count' => $downloadedCount,
                'total_candidates' => count($candidates),
                'errors' => $errors,
                'message' => "Successfully downloaded {$downloadedCount} images"
            ]);
            
        } catch (\Exception $e) {
            \Log::error('API image download failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()?->id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Fetch API data for a title
     */
    private function fetchApiData(string $title, string $category): ?array
    {
        try {
            if ($category === 'game') {
                // RAWG API
                $rawgApiKey = config('services.rawg.api_key');
                $url = "https://api.rawg.io/api/games?key={$rawgApiKey}&search=" . urlencode($title);
                $response = json_decode(file_get_contents($url), true);
                
                if (!empty($response['results'])) {
                    $item = $response['results'][0];
                    return [
                        'title' => $item['name'],
                        'image' => $item['background_image'] ?? '',
                        'rating' => round($item['rating'] ?? 0, 1),
                        'overview' => $item['description_raw'] ?? ''
                    ];
                }
            } else {
                // TMDB API
                $tmdbApiKey = config('services.tmdb.api_key');
                $searchType = in_array($category, ['series', 'tv']) ? 'tv' : 'movie';
                $url = "https://api.themoviedb.org/3/search/{$searchType}?api_key={$tmdbApiKey}&query=" . urlencode($title);
                $response = json_decode(file_get_contents($url), true);
                
                if (!empty($response['results'])) {
                    $item = $response['results'][0];
                    return [
                        'title' => $item['title'] ?? $item['name'],
                        'image' => $item['poster_path'] ? "https://image.tmdb.org/t/p/w500{$item['poster_path']}" : '',
                        'rating' => round($item['vote_average'] ?? 0, 1),
                        'overview' => $item['overview'] ?? ''
                    ];
                }
            }
        } catch (\Exception $e) {
            \Log::error("API fetch error for {$title}: " . $e->getMessage());
        }
        
        return null;
    }
    
    /**
     * Download and save image
     */
    private function downloadAndSaveImage(string $imageUrl, string $category): ?string
    {
        try {
            $imageData = file_get_contents($imageUrl);
            if (!$imageData) {
                return null;
            }
            
            $filename = basename(parse_url($imageUrl, PHP_URL_PATH));
            $extension = pathinfo($filename, PATHINFO_EXTENSION) ?: 'jpg';
            $filename = uniqid() . '.' . $extension;
            
            $categoryDir = in_array($category, ['series', 'tv']) ? 'series' : 
                          (in_array($category, ['game', 'games']) ? 'games' : 'movies');
            
            $imagePath = "{$categoryDir}/{$filename}";
            $fullPath = base_path("data/images/{$imagePath}");
            
            // Create directory if needed
            $dir = dirname($fullPath);
            if (!File::exists($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
            
            File::put($fullPath, $imageData);
            
            return $imagePath;
        } catch (\Exception $e) {
            \Log::error("Image download failed: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Schedule cleanup after delay
     */
    private function scheduleCleanup(string $tempDir, string $zipPath): void
    {
        // Schedule cleanup in 30 seconds
        $command = "timeout 30 && php -r \"
            if (file_exists('$tempDir')) { 
                system('rmdir /s /q $tempDir'); 
                echo 'Temp directory cleaned'; 
            }
            if (file_exists('$zipPath')) { 
                unlink('$zipPath'); 
                echo 'ZIP file cleaned'; 
            }
        \" > /dev/null 2>&1 &";
        
        if (PHP_OS_FAMILY === 'Windows') {
            exec("start /B cmd /c \"$command\"");
        } else {
            exec($command);
        }
        
        \Log::info('Cleanup scheduled for 30 seconds from now');
    }
    
    /**
     * Copy images from import directory
     */
    private function copyImagesFromImport(string $tempDir, array $mediaData = []): void
    {
        \Log::info('Starting image copy process', ['temp_dir' => $tempDir]);
        
        $imagesSourceDir = $tempDir . '/images';
        $imagesDownloadsSourceDir = $tempDir . '/images_downloads';
        
        $imagesDestDir = Storage::disk('public')->path('images');
        $imagesDownloadsDestDir = Storage::disk('public')->path('images_downloads');
        
        // Ensure destination directories exist
        if (!File::exists($imagesDestDir)) {
            File::makeDirectory($imagesDestDir, 0755, true);
            \Log::info('Created images destination directory', ['path' => $imagesDestDir]);
        }
        if (!File::exists($imagesDownloadsDestDir)) {
            File::makeDirectory($imagesDownloadsDestDir, 0755, true);
            \Log::info('Created images_downloads destination directory', ['path' => $imagesDownloadsDestDir]);
        }
        
        // Copy main images directory
        if (File::exists($imagesSourceDir)) {
            \Log::info('Copying main images directory', ['source' => $imagesSourceDir, 'dest' => $imagesDestDir]);
            
            try {
                $this->copyDirectoryWithProgress($imagesSourceDir, $imagesDestDir);
                \Log::info('Main images directory copied successfully');
            } catch (\Exception $e) {
                \Log::error('Failed to copy main images directory', ['error' => $e->getMessage()]);
                throw $e;
            }
        } else {
            \Log::info('No main images directory found in import');
        }
        
        // Copy downloaded images directory
        if (File::exists($imagesDownloadsSourceDir)) {
            \Log::info('Copying downloaded images directory', ['source' => $imagesDownloadsSourceDir, 'dest' => $imagesDownloadsDestDir]);
            
            try {
                $this->copyDirectoryWithProgress($imagesDownloadsSourceDir, $imagesDownloadsDestDir);
                \Log::info('Downloaded images directory copied successfully');
            } catch (\Exception $e) {
                \Log::error('Failed to copy downloaded images directory', ['error' => $e->getMessage()]);
                throw $e;
            }
        } else {
            \Log::info('No downloaded images directory found in import');
        }
        
        \Log::info('Image copy process completed');
    }
    
    /**
     * Copy directory with progress logging
     */
    private function copyDirectoryWithProgress(string $source, string $dest): void
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );
        
        $totalFiles = 0;
        $copiedFiles = 0;
        
        // Count total files first
        foreach ($iterator as $item) {
            if ($item->isFile()) {
                $totalFiles++;
            }
        }
        
        \Log::info('Starting to copy files', ['total_files' => $totalFiles]);
        
        // Reset iterator
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );
        
        foreach ($iterator as $item) {
            $target = $dest . DIRECTORY_SEPARATOR . $iterator->getSubPathName();
            
            if ($item->isDir()) {
                if (!File::exists($target)) {
                    File::makeDirectory($target, 0755, true);
                }
            } else {
                try {
                    File::copy($item->getPathname(), $target);
                    $copiedFiles++;
                    
                    // Log progress every 10 files or at 25%, 50%, 75%
                    if ($copiedFiles % 10 === 0 || 
                        $copiedFiles === (int)($totalFiles * 0.25) || 
                        $copiedFiles === (int)($totalFiles * 0.5) || 
                        $copiedFiles === (int)($totalFiles * 0.75)) {
                        $progress = round(($copiedFiles / $totalFiles) * 100, 1);
                        \Log::info('Image copy progress', [
                            'copied' => $copiedFiles,
                            'total' => $totalFiles,
                            'progress' => $progress . '%'
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Failed to copy file', [
                        'source' => $item->getPathname(),
                        'target' => $target,
                        'error' => $e->getMessage()
                    ]);
                    // Continue with other files
                }
            }
        }
        
        \Log::info('File copy completed', ['copied_files' => $copiedFiles, 'total_files' => $totalFiles]);
    }
    
    /**
     * Create ZIP archive using system command
     */
    private function createZipArchive(string $sourceDir, string $zipPath): void
    {
        // Try different ZIP commands based on OS
        $commands = [
            'zip -r "' . $zipPath . '" *',  // Linux/Mac
            'powershell Compress-Archive -Path "' . $sourceDir . '\*" -DestinationPath "' . $zipPath . '"',  // Windows PowerShell
            '7z a "' . $zipPath . '" "' . $sourceDir . '\*"',  // 7-Zip
        ];
        
        $success = false;
        foreach ($commands as $command) {
            $output = [];
            $returnCode = 0;
            exec($command . ' 2>&1', $output, $returnCode);
            
            if ($returnCode === 0 && File::exists($zipPath)) {
                $success = true;
                break;
            }
        }
        
        if (!$success) {
            throw new \Exception('Cannot create ZIP file. Please ensure zip, PowerShell, or 7-Zip is available.');
        }
    }
    
    /**
     * Extract ZIP archive using system command
     */
    private function extractZipArchive(string $zipPath, string $extractDir): void
    {
        \Log::info('Attempting ZIP extraction', ['zip_path' => $zipPath, 'extract_dir' => $extractDir]);
        
        // Try different extraction commands based on OS
        $commands = [];
        
        if (PHP_OS_FAMILY === 'Windows') {
            $commands = [
                'powershell Expand-Archive -Path "' . $zipPath . '" -DestinationPath "' . $extractDir . '" -Force',
                '7z x "' . $zipPath . '" -o"' . $extractDir . '" -y',
                'unzip -o "' . $zipPath . '" -d "' . $extractDir . '"'
            ];
        } else {
            $commands = [
                'unzip -o "' . $zipPath . '" -d "' . $extractDir . '"',
                'powershell Expand-Archive -Path "' . $zipPath . '" -DestinationPath "' . $extractDir . '" -Force',
                '7z x "' . $zipPath . '" -o"' . $extractDir . '" -y'
            ];
        }
        
        $success = false;
        $lastError = '';
        
        foreach ($commands as $index => $command) {
            \Log::info('Trying extraction command ' . ($index + 1), ['command' => $command]);
            
            $output = [];
            $returnCode = 0;
            exec($command . ' 2>&1', $output, $returnCode);
            
            \Log::info('Command result', ['return_code' => $returnCode, 'output' => implode("\n", $output)]);
            
            if ($returnCode === 0) {
                $success = true;
                \Log::info('ZIP extraction successful with command ' . ($index + 1));
                break;
            } else {
                $lastError = implode("\n", $output);
            }
        }
        
        if (!$success) {
            \Log::error('All extraction commands failed', ['last_error' => $lastError]);
            throw new \Exception('Cannot extract ZIP file. Last error: ' . $lastError);
        }
    }
    
    /**
     * Handle chunked file upload for large files
     */
    public function uploadChunk(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'chunk' => 'required|file',
                'chunk_index' => 'required|integer|min:0',
                'total_chunks' => 'required|integer|min:1',
                'upload_id' => 'required|string',
                'file_name' => 'required|string'
            ]);

            $chunk = $request->file('chunk');
            $chunkIndex = $request->input('chunk_index');
            $totalChunks = $request->input('total_chunks');
            $uploadId = $request->input('upload_id');
            $fileName = $request->input('file_name');

            // Create upload directory
            $uploadDir = storage_path('app/temp/chunked_uploads/' . $uploadId);
            if (!File::exists($uploadDir)) {
                File::makeDirectory($uploadDir, 0755, true);
            }

            // Save chunk
            $chunkPath = $uploadDir . '/chunk_' . $chunkIndex;
            $chunk->move($uploadDir, 'chunk_' . $chunkIndex);

            \Log::info('Chunk uploaded', [
                'upload_id' => $uploadId,
                'chunk_index' => $chunkIndex,
                'total_chunks' => $totalChunks,
                'file_name' => $fileName
            ]);

            return response()->json([
                'success' => true,
                'chunk_index' => $chunkIndex,
                'message' => 'Chunk uploaded successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Chunk upload failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Finalize chunked upload and process the complete file
     */
    public function finalizeChunkedUpload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload_id' => 'required|string',
                'file_name' => 'required|string',
                'total_chunks' => 'required|integer|min:1'
            ]);

            $uploadId = $request->input('upload_id');
            $fileName = $request->input('file_name');
            $totalChunks = $request->input('total_chunks');

            $uploadDir = storage_path('app/temp/chunked_uploads/' . $uploadId);
            $finalFilePath = $uploadDir . '/' . $fileName;

            // Combine all chunks into final file
            $finalFile = fopen($finalFilePath, 'wb');
            if (!$finalFile) {
                throw new \Exception('Cannot create final file');
            }

            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkPath = $uploadDir . '/chunk_' . $i;
                if (!File::exists($chunkPath)) {
                    throw new \Exception("Missing chunk {$i}");
                }

                $chunkData = File::get($chunkPath);
                fwrite($finalFile, $chunkData);
                File::delete($chunkPath);
            }

            fclose($finalFile);

            \Log::info('Chunked upload finalized', [
                'upload_id' => $uploadId,
                'file_name' => $fileName,
                'file_size' => File::size($finalFilePath)
            ]);

            // Now process the file as a regular import
            $file = new \Illuminate\Http\UploadedFile(
                $finalFilePath,
                $fileName,
                'application/zip',
                null,
                true
            );

            // Create a new request with the file
            $newRequest = new Request();
            $newRequest->files->set('file', $file);
            $newRequest->setUserResolver($request->getUserResolver());

            // Process the import
            $result = $this->importData($newRequest);

            // Cleanup
            File::deleteDirectory($uploadDir);

            return $result;

        } catch (\Exception $e) {
            \Log::error('Chunked upload finalization failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
