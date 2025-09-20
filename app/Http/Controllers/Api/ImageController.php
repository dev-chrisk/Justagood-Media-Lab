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
     * Generate thumbnail (simplified - just return original image for now)
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

        // Try to find the actual image path
        $actualPath = null;
        $possiblePaths = [
            $path, // Direct path
            "images/{$path}", // In images subdirectory
            "images_downloads/{$path}", // In images_downloads subdirectory
        ];

        foreach ($possiblePaths as $testPath) {
            if (Storage::disk('public')->exists($testPath)) {
                $actualPath = $testPath;
                break;
            }
        }

        if (!$actualPath) {
            return response()->json(['success' => false, 'error' => 'Source not found', 'searched_paths' => $possiblePaths], 404);
        }

        // For now, just return the original image
        // TODO: Implement proper thumbnail generation
        return Storage::disk('public')->response($actualPath);
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

        foreach ($possiblePaths as $testPath) {
            if (Storage::disk('public')->exists($testPath)) {
                return Storage::disk('public')->response($testPath);
            }
        }

        return response()->json(['error' => 'Image not found', 'searched_paths' => $possiblePaths], 404);
    }
}
