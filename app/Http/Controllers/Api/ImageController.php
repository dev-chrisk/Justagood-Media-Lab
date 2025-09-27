<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageController extends Controller
{
    /**
     * List all images from storage
     */
    public function listImages(): JsonResponse
    {
        $images = [];
        
        // List images from storage/app/public/images
        $imageFiles = Storage::disk('public')->allFiles('images');
        foreach ($imageFiles as $file) {
            if (preg_match('/\.(jpg|jpeg|png|webp)$/i', $file)) {
                $images[] = "images/{$file}";
            }
        }
        
        // List images from storage/app/public/images_downloads
        $downloadFiles = Storage::disk('public')->allFiles('images_downloads');
        foreach ($downloadFiles as $file) {
            if (preg_match('/\.(jpg|jpeg|png|webp)$/i', $file)) {
                $images[] = "images_downloads/{$file}";
            }
        }
        
        sort($images);
        
        return response()->json(['success' => true, 'images' => $images]);
    }

    /**
     * Copy image from source to destination
     */
    public function copyImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'src' => 'required|string',
            'dst' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $src = $request->src;
        $dst = $request->dst;

        if (!Storage::disk('public')->exists($src)) {
            return response()->json(['success' => false, 'error' => 'Source file not found'], 404);
        }

        try {
            Storage::disk('public')->copy($src, $dst);
            return response()->json(['success' => true, 'saved' => $dst]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Upload image file
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB max
            'dst' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $file = $request->file('file');
        $dst = $request->get('dst', 'images_downloads/uploads/' . $file->getClientOriginalName());

        try {
            $path = $file->storeAs('', $dst, 'public');
            return response()->json(['success' => true, 'saved' => $path]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete image
     */
    public function deleteImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'path' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $path = $request->path;

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'error' => 'File not found'], 404);
    }

    /**
     * Download image from URL
     */
    public function downloadImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'url' => 'required|url',
            'path' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $url = $request->url;
        $path = $request->path;

        try {
            $content = file_get_contents($url);
            
            if (!$content || strlen($content) < 200) {
                return response()->json(['success' => false, 'error' => 'Empty or invalid image content'], 400);
            }

            // Validate image
            $manager = new ImageManager(new Driver());
            $image = $manager->read($content);

            // Determine file extension
            $extension = $image->extension ?: 'jpg';
            if (!str_contains($path, '.')) {
                $path .= '.' . $extension;
            }

            Storage::disk('public')->put($path, $content);
            $size = Storage::disk('public')->size($path);

            return response()->json(['success' => true, 'saved' => $path, 'bytes' => $size]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate optimized thumbnail with caching
     */
    public function thumbnail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'path' => 'required|string',
            'w' => 'nullable|integer|min:1|max:2000',
            'h' => 'nullable|integer|min:1|max:2000',
            'q' => 'nullable|integer|min:1|max:100',
            'fmt' => 'nullable|string|in:jpg,jpeg,webp',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $path = $request->path;
        $width = $request->get('w', 300);
        $height = $request->get('h', null);
        $quality = $request->get('q', 85);
        $format = $request->get('fmt', 'webp');
        
        // Set proper cache headers for better performance
        $cacheTime = 60 * 60 * 24 * 30; // 30 days

        // Try to find the actual image path
        $actualPath = null;
        
        // The path from database is already relative to storage/app/public
        // So we check it directly first
        if (Storage::disk('public')->exists($path)) {
            $actualPath = $path;
        } else {
            // Fallback: try different path variations
            $possiblePaths = [
                "images/{$path}", // In images subdirectory
                "images_downloads/{$path}", // In images_downloads subdirectory
                $path, // Direct path as fallback
            ];

            foreach ($possiblePaths as $testPath) {
                if (Storage::disk('public')->exists($testPath)) {
                    $actualPath = $testPath;
                    break;
                }
            }
        }


        if (!$actualPath) {
            return response()->json(['success' => false, 'error' => 'Source not found', 'searched_paths' => $possiblePaths], 404);
        }

        // Generate cache key
        $cacheKey = 'thumb_' . md5($actualPath . '_' . $width . '_' . $height . '_' . $quality . '_' . $format);
        $cachePath = "thumbnails/{$cacheKey}.{$format}";

        // Check if thumbnail already exists
        if (Storage::disk('public')->exists($cachePath)) {
            $response = Storage::disk('public')->response($cachePath);
            $response->headers->set('Cache-Control', "public, max-age={$cacheTime}");
            $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $cacheTime) . ' GMT');
            return $response;
        }

        try {
            // Create thumbnails directory if it doesn't exist
            if (!Storage::disk('public')->exists('thumbnails')) {
                Storage::disk('public')->makeDirectory('thumbnails');
            }

            // Load original image
            $manager = new ImageManager(new Driver());
            
            // Load image from storage
            $imageContent = Storage::disk('public')->get($actualPath);
            
            $image = $manager->read($imageContent);

            // Resize image maintaining aspect ratio
            if ($height) {
                $image->resize($width, $height);
            } else {
                $image->resize($width, null, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
            }

            // Encode with specified format and quality
            if ($format === 'webp') {
                $encoded = $image->toWebp($quality);
            } elseif ($format === 'jpg' || $format === 'jpeg') {
                $encoded = $image->toJpeg($quality);
            } else {
                $encoded = $image->toPng();
            }

            // Save thumbnail
            Storage::disk('public')->put($cachePath, $encoded);

            // Return the thumbnail with cache headers
            $response = Storage::disk('public')->response($cachePath);
            $response->headers->set('Cache-Control', "public, max-age={$cacheTime}");
            $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $cacheTime) . ' GMT');
            return $response;

        } catch (\Exception $e) {
            // Fallback to original image if thumbnail generation fails
            return Storage::disk('public')->response($actualPath);
        }
    }

    /**
     * Serve image file
     */
    public function serveImage($path)
    {
        // Try different possible paths
        $possiblePaths = [
            $path, // Direct path
            "images/{$path}", // In images subdirectory
            "images_downloads/{$path}", // In images_downloads subdirectory
        ];

        // First check in storage/app/public
        foreach ($possiblePaths as $testPath) {
            if (Storage::disk('public')->exists($testPath)) {
                return Storage::disk('public')->response($testPath);
            }
        }

        return response()->json(['error' => 'Image not found', 'searched_paths' => $possiblePaths], 404);
    }
}
