<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Models\Category;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Prüfe und bereinige Duplikate beim Login
        $this->checkAndCleanupDuplicates();
        
        // Korrigiere Bildpfade beim Login
        $this->fixImagePaths();

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Check and cleanup duplicate categories
     */
    private function checkAndCleanupDuplicates(): void
    {
        try {
            // Prüfe auf Duplikate
            $duplicates = Category::select('name', \DB::raw('COUNT(*) as count'))
                ->groupBy('name')
                ->having('count', '>', 1)
                ->get();

            if ($duplicates->count() > 0) {
                \Log::info('Category duplicates detected during login', [
                    'duplicates' => $duplicates->pluck('name')->toArray(),
                    'count' => $duplicates->count()
                ]);

                // Bereinige Duplikate
                Category::cleanupDuplicates();
                
                \Log::info('Category duplicates cleaned up during login');
            }
        } catch (\Exception $e) {
            \Log::error('Failed to check/cleanup category duplicates during login', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Fix image paths from old structure to new merged structure
     */
    private function fixImagePaths(): void
    {
        try {
            \Log::info('Starting image path fix during login');
            
            // Alle Media Items mit Pfaden abrufen
            $items = MediaItem::whereNotNull('path')->get();
            
            \Log::info('Found media items with paths', ['count' => $items->count()]);
            
            $updatedCount = 0;
            $skippedCount = 0;
            $errors = [];
            
            foreach ($items as $item) {
                try {
                    $oldPath = $item->path;
                    
                    // Prüfe ob der Pfad bereits korrekt ist
                    if (strpos($oldPath, 'merged_images/') === 0) {
                        $skippedCount++;
                        continue; // Bereits korrekt
                    }
                    
                    // Konvertiere alte Pfade zu neuen Pfaden
                    $newPath = null;
                    
                    if (strpos($oldPath, 'images_downloads/') === 0) {
                        // images_downloads/games/... -> merged_images/games/...
                        $newPath = str_replace('images_downloads/', 'merged_images/', $oldPath);
                    } elseif (strpos($oldPath, 'images/') === 0) {
                        // images/games/... -> merged_images/games/...
                        $newPath = str_replace('images/', 'merged_images/', $oldPath);
                    } elseif (strpos($oldPath, 'games/') === 0) {
                        // games/... -> merged_images/games/...
                        $newPath = 'merged_images/' . $oldPath;
                    } elseif (strpos($oldPath, 'movies/') === 0) {
                        // movies/... -> merged_images/movies/...
                        $newPath = 'merged_images/' . $oldPath;
                    } elseif (strpos($oldPath, 'series/') === 0) {
                        // series/... -> merged_images/series/...
                        $newPath = 'merged_images/' . $oldPath;
                    }
                    
                    if ($newPath && $newPath !== $oldPath) {
                        $item->path = $newPath;
                        $item->save();
                        $updatedCount++;
                        
                        if ($updatedCount % 100 == 0) {
                            \Log::info('Image path fix progress', ['updated' => $updatedCount]);
                        }
                    }
                } catch (\Exception $e) {
                    $errors[] = [
                        'item_id' => $item->id,
                        'title' => $item->title,
                        'old_path' => $item->path,
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            // Log Ergebnisse
            \Log::info('Image path fix completed', [
                'updated' => $updatedCount,
                'skipped' => $skippedCount,
                'errors' => count($errors)
            ]);
            
            if (!empty($errors)) {
                \Log::warning('Image path fix errors', ['errors' => $errors]);
            }
            
            // Statistiken loggen
            $pathStats = MediaItem::selectRaw('SUBSTRING_INDEX(path, "/", 1) as path_prefix, COUNT(*) as count')
                ->whereNotNull('path')
                ->groupBy('path_prefix')
                ->get();
            
            \Log::info('Image path statistics after fix', [
                'statistics' => $pathStats->pluck('count', 'path_prefix')->toArray()
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to fix image paths during login', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}