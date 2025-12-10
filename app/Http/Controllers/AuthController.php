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

            // Simple validation - only email required, no password needed
            if (empty($request->email)) {
                return response()->json([
                    'error' => 'Email is required'
                ], 400);
            }

            // Find user by email
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'error' => 'User not found with this email'
                ], 401);
            }

            // No password check - login with email only
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
     * Get all users with login data (email, username, password hash)
     * Public route for debugging purposes (only used in logged out state)
     */
    public function getAllUsersForCheck()
    {
        try {
            // Check database connection first
            try {
                \DB::connection()->getPdo();
            } catch (\Exception $dbError) {
                return response()->json([
                    'success' => false,
                    'error' => 'Database connection failed: ' . $dbError->getMessage(),
                    'hint' => 'Please check your database configuration in .env file'
                ], 500);
            }

            $users = User::all();
            
            $userData = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'email' => $user->email,
                    'username' => $user->username,
                    'password' => $user->password, // Gehashtes Passwort wie in DB gespeichert
                    'name' => $user->name,
                ];
            });

            return response()->json([
                'success' => true,
                'users' => $userData,
                'count' => $userData->count()
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage(),
                'hint' => 'The database might not exist or the connection is misconfigured. Check your .env file.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch users: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
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