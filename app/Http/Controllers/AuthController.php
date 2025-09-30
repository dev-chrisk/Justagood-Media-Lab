<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Models\Category;
use App\Models\MediaItem;

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
        $duplicateInfo = $this->checkAndCleanupDuplicates($user->id);

        return response()->json([
            'user' => $user,
            'token' => $token,
            'duplicate_check' => $duplicateInfo,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Check and cleanup duplicate categories and media items
     */
    private function checkAndCleanupDuplicates($userId): array
    {
        $result = [
            'categories' => ['found' => 0, 'cleaned' => false],
            'media_items' => ['found' => 0, 'cleaned' => false]
        ];

        try {
            // Prüfe auf Kategorie-Duplikate
            $categoryDuplicates = Category::select('name', \DB::raw('COUNT(*) as count'))
                ->groupBy('name')
                ->having('count', '>', 1)
                ->get();

            if ($categoryDuplicates->count() > 0) {
                $result['categories']['found'] = $categoryDuplicates->count();
                \Log::info('Category duplicates detected during login', [
                    'duplicates' => $categoryDuplicates->pluck('name')->toArray(),
                    'count' => $categoryDuplicates->count()
                ]);

                // Bereinige Duplikate
                Category::cleanupDuplicates();
                $result['categories']['cleaned'] = true;
                
                \Log::info('Category duplicates cleaned up during login');
            }

            // Prüfe auf MediaItem-Duplikate
            $mediaDuplicates = MediaItem::getAllDuplicatesForUser($userId);
            if ($mediaDuplicates->count() > 0) {
                $result['media_items']['found'] = $mediaDuplicates->count();
                \Log::info('Media item duplicates detected during login', [
                    'user_id' => $userId,
                    'duplicate_groups' => $mediaDuplicates->count()
                ]);
            }

        } catch (\Exception $e) {
            \Log::error('Failed to check/cleanup duplicates during login', [
                'error' => $e->getMessage(),
                'user_id' => $userId
            ]);
        }

        return $result;
    }
}