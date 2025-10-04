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
        try {
            \Log::info('Login attempt started', [
                'email' => $request->email,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'environment' => app()->environment(),
                'url' => $request->fullUrl()
            ]);

            // Simple validation without Laravel validation to avoid issues
            if (empty($request->email) || empty($request->password)) {
                \Log::warning('Missing credentials', ['email' => $request->email]);
                return response()->json([
                    'error' => 'Email and password are required'
                ], 400);
            }

            if (!filter_var($request->email, FILTER_VALIDATE_EMAIL)) {
                \Log::warning('Invalid email format', ['email' => $request->email]);
                return response()->json([
                    'error' => 'Invalid email format'
                ], 400);
            }

            \Log::info('Validation passed, searching for user');

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                \Log::warning('User not found', ['email' => $request->email]);
                return response()->json([
                    'error' => 'Invalid credentials'
                ], 401);
            }

            \Log::info('User found', ['user_id' => $user->id, 'email' => $user->email]);

            if (!Hash::check($request->password, $user->password)) {
                \Log::warning('Invalid password', ['email' => $request->email]);
                return response()->json([
                    'error' => 'Invalid credentials'
                ], 401);
            }

            \Log::info('Password verified, creating token');

            $token = $user->createToken('auth-token')->plainTextToken;

            \Log::info('Token created successfully');

            // Prüfe und bereinige Duplikate beim Login
            $duplicateInfo = $this->checkAndCleanupDuplicates($user->id);

            \Log::info('Login successful', [
                'user_id' => $user->id,
                'email' => $user->email,
                'token_length' => strlen($token)
            ]);

            return response()->json([
                'user' => $user,
                'token' => $token,
                'duplicate_check' => $duplicateInfo,
            ]);

        } catch (ValidationException $e) {
            \Log::warning('Login validation failed', [
                'email' => $request->email,
                'errors' => $e->errors()
            ]);
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Login failed with exception', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
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
            \Log::error('Error in logout endpoint', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function checkDatabase(Request $request)
    {
        try {
            \Log::info('Database check requested', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now()
            ]);

            // Test database connection
            $dbStatus = 'connected';
            $userCount = 0;
            $error = null;
            
            try {
                \DB::connection()->getPdo();
                $userCount = User::count();
                \Log::info('Database check successful', [
                    'user_count' => $userCount,
                    'connection' => config('database.default'),
                    'host' => config('database.connections.mysql.host'),
                    'database' => config('database.connections.mysql.database')
                ]);
            } catch (\Exception $e) {
                $dbStatus = 'error';
                $error = $e->getMessage();
                \Log::error('Database check failed', [
                    'error' => $e->getMessage(),
                    'connection' => config('database.default'),
                    'host' => config('database.connections.mysql.host'),
                    'database' => config('database.connections.mysql.database')
                ]);
            }

            // Get current DB config for debugging
            $dbConfig = [
                'connection' => config('database.default'),
                'host' => config('database.connections.mysql.host'),
                'port' => config('database.connections.mysql.port'),
                'database' => config('database.connections.mysql.database'),
                'username' => config('database.connections.mysql.username'),
                'password_length' => strlen(config('database.connections.mysql.password')),
                'environment' => app()->environment()
            ];

            return response()->json([
                'success' => $dbStatus === 'connected',
                'status' => $dbStatus,
                'user_count' => $userCount,
                'error' => $error,
                'config' => $dbConfig,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            \Log::error('Database check endpoint failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Database check failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteAllUsers(Request $request)
    {
        try {
            \Log::info('Delete all users requested', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now()
            ]);

            $userCount = User::count();
            
            // Delete all users
            User::truncate();
            
            \Log::info('All users deleted', [
                'deleted_count' => $userCount,
                'timestamp' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => "Deleted {$userCount} users",
                'deleted_count' => $userCount,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            \Log::error('Delete all users failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Delete failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function adminSetup(Request $request)
    {
        try {
            \Log::info('Admin setup requested', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now()
            ]);

            // Check if any admin users exist
            $adminCount = User::where('is_admin', true)->count();
            \Log::info('Current admin count', ['count' => $adminCount]);

            if ($adminCount > 0) {
                \Log::info('Admin users already exist, skipping setup');
                return response()->json([
                    'success' => false,
                    'message' => 'Admin users already exist',
                    'admin_count' => $adminCount,
                    'debug' => [
                        'timestamp' => now()->toISOString(),
                        'admin_exists' => true
                    ]
                ], 200);
            }

            // Create admin user
            $adminUser = User::create([
                'name' => 'System Administrator',
                'email' => 'admin@teabubble.attrebi.ch',
                'password' => Hash::make('admin123'),
                'is_admin' => true,
            ]);

            \Log::info('Admin user created successfully', [
                'user_id' => $adminUser->id,
                'email' => $adminUser->email
            ]);

            // Generate token for immediate login
            $token = $adminUser->createToken('admin-setup-token')->plainTextToken;

            \Log::info('Admin setup completed successfully', [
                'user_id' => $adminUser->id,
                'token_generated' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Admin user created and logged in successfully',
                'user' => $adminUser,
                'token' => $token,
                'debug' => [
                    'timestamp' => now()->toISOString(),
                    'admin_created' => true,
                    'user_id' => $adminUser->id,
                    'is_admin' => $adminUser->is_admin
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Admin setup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Admin setup failed: ' . $e->getMessage(),
                'debug' => [
                    'timestamp' => now()->toISOString(),
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
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