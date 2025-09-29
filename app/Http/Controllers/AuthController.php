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
        
        // Korrigiere Bildpfade beim Login (nur wenn nötig)
        $this->fixImagePathsIfNeeded();

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
     * Fix image paths from old structure to new merged structure (only if needed)
     */
    private function fixImagePathsIfNeeded(): void
    {
        try {
            // Prüfe ob überhaupt Korrekturen nötig sind
            $needsFix = MediaItem::whereNotNull('path')
                ->where(function($query) {
                    $query->where('path', 'like', 'images_downloads/%')
                          ->orWhere('path', 'like', 'images/%')
                          ->orWhere('path', 'like', 'games/%')
                          ->orWhere('path', 'like', 'movies/%')
                          ->orWhere('path', 'like', 'series/%');
                })
                ->where('path', 'not like', 'merged_images/%')
                ->exists();
            
            if (!$needsFix) {
                \Log::info('Image paths already correct, skipping fix');
                return;
            }
            
            \Log::info('Image paths need fixing, starting correction');
            
            // Nur eine kleine Batch verarbeiten, um den Login nicht zu blockieren
            $items = MediaItem::whereNotNull('path')
                ->where(function($query) {
                    $query->where('path', 'like', 'images_downloads/%')
                          ->orWhere('path', 'like', 'images/%')
                          ->orWhere('path', 'like', 'games/%')
                          ->orWhere('path', 'like', 'movies/%')
                          ->orWhere('path', 'like', 'series/%');
                })
                ->where('path', 'not like', 'merged_images/%')
                ->limit(50) // Nur 50 Einträge pro Login
                ->get();
            
            \Log::info('Processing image path fix batch', ['count' => $items->count()]);
            
            $updatedCount = 0;
            $errors = [];
            
            foreach ($items as $item) {
                try {
                    $oldPath = $item->path;
                    $newPath = null;
                    
                    if (strpos($oldPath, 'images_downloads/') === 0) {
                        $newPath = str_replace('images_downloads/', 'merged_images/', $oldPath);
                    } elseif (strpos($oldPath, 'images/') === 0) {
                        $newPath = str_replace('images/', 'merged_images/', $oldPath);
                    } elseif (strpos($oldPath, 'games/') === 0) {
                        $newPath = 'merged_images/' . $oldPath;
                    } elseif (strpos($oldPath, 'movies/') === 0) {
                        $newPath = 'merged_images/' . $oldPath;
                    } elseif (strpos($oldPath, 'series/') === 0) {
                        $newPath = 'merged_images/' . $oldPath;
                    }
                    
                    if ($newPath && $newPath !== $oldPath) {
                        $item->path = $newPath;
                        $item->save();
                        $updatedCount++;
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
            
            \Log::info('Image path fix batch completed', [
                'updated' => $updatedCount,
                'errors' => count($errors)
            ]);
            
            if (!empty($errors)) {
                \Log::warning('Image path fix batch errors', ['errors' => $errors]);
            }
            
        } catch (\Exception $e) {
            \Log::error('Failed to fix image paths during login', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}