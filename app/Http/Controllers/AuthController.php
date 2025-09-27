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
}