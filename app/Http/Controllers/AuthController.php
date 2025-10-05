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
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
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
        try {

            // Simple validation without Laravel validation to avoid issues
            if (empty($request->username) || empty($request->password)) {
                return response()->json([
                    'error' => 'Username and password are required'
                ], 400);
            }

            // Find user by username
            $user = User::where('username', $request->username)->first();

            if (!$user) {
                return response()->json([
                    'error' => 'Invalid credentials'
                ], 401);
            }

            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'error' => 'Invalid credentials'
                ], 401);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            // Prüfe und bereinige Duplikate beim Login
            $duplicateInfo = $this->checkAndCleanupDuplicates($user->id);

            return response()->json([
                'user' => $user,
                'token' => $token,
                'duplicate_check' => $duplicateInfo,
            ]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            
            return response()->json([
                'error' => 'Login failed: ' . $e->getMessage(),
                'debug' => [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'User not authenticated'], 401);
            }
            
            $user->currentAccessToken()->delete();

            return response()->json(['message' => 'Logged out successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Internal server error'], 500);
        }
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

                // Bereinige Duplikate
                Category::cleanupDuplicates();
                $result['categories']['cleaned'] = true;
                
            }

            // Prüfe auf MediaItem-Duplikate
            $mediaDuplicates = MediaItem::getAllDuplicatesForUser($userId);
            if ($mediaDuplicates->count() > 0) {
                $result['media_items']['found'] = $mediaDuplicates->count();
            }

        } catch (\Exception $e) {
        }

        return $result;
    }
}