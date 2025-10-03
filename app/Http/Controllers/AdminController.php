<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\MediaItem;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * Get all users with their statistics
     */
    public function users(): JsonResponse
    {
        try {
            $users = User::withCount(['mediaItems', 'collections'])
                ->select('id', 'name', 'email', 'is_admin', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch users'], 500);
        }
    }

    /**
     * Get detailed information about a specific user
     */
    public function userDetails($id): JsonResponse
    {
        try {
            $user = User::withCount(['mediaItems', 'collections'])
                ->with(['mediaItems' => function($query) {
                    $query->select('id', 'user_id', 'title', 'category', 'created_at')
                          ->orderBy('created_at', 'desc')
                          ->limit(10);
                }])
                ->with(['collections' => function($query) {
                    $query->select('id', 'user_id', 'name', 'description', 'created_at')
                          ->orderBy('created_at', 'desc')
                          ->limit(5);
                }])
                ->findOrFail($id);

            return response()->json($user);
        } catch (\Exception $e) {
            return response()->json(['error' => 'User not found'], 404);
        }
    }

    /**
     * Update user information
     */
    public function updateUser(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($id)],
                'is_admin' => 'sometimes|boolean',
                'password' => 'sometimes|string|min:8|confirmed'
            ]);

            // Update user data
            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $user->update($validated);

            return response()->json([
                'message' => 'User updated successfully',
                'user' => $user->fresh(['mediaItems', 'collections'])
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update user'], 500);
        }
    }

    /**
     * Delete a user
     */
    public function deleteUser($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // Prevent deleting the last admin
            if ($user->is_admin) {
                $adminCount = User::where('is_admin', true)->count();
                if ($adminCount <= 1) {
                    return response()->json(['error' => 'Cannot delete the last admin user'], 400);
                }
            }

            // Delete user and related data
            DB::transaction(function() use ($user) {
                $user->mediaItems()->delete();
                $user->collections()->delete();
                $user->delete();
            });

            return response()->json(['message' => 'User deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete user'], 500);
        }
    }

    /**
     * Get admin statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'admin_users' => User::where('is_admin', true)->count(),
                'total_media_items' => MediaItem::count(),
                'total_collections' => Collection::count(),
                'recent_registrations' => User::where('created_at', '>=', now()->subDays(30))->count(),
                'media_by_category' => MediaItem::select('category', DB::raw('count(*) as count'))
                    ->groupBy('category')
                    ->get()
                    ->pluck('count', 'category'),
                'users_by_month' => User::select(DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'), DB::raw('count(*) as count'))
                    ->where('created_at', '>=', now()->subMonths(12))
                    ->groupBy('month')
                    ->orderBy('month')
                    ->get()
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch statistics'], 500);
        }
    }

    /**
     * Get user activity (recent media items and collections)
     */
    public function userActivity($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            $activity = [
                'recent_media_items' => $user->mediaItems()
                    ->select('id', 'title', 'category', 'created_at')
                    ->orderBy('created_at', 'desc')
                    ->limit(20)
                    ->get(),
                'recent_collections' => $user->collections()
                    ->select('id', 'name', 'description', 'created_at')
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get(),
                'media_by_category' => $user->mediaItems()
                    ->select('category', DB::raw('count(*) as count'))
                    ->groupBy('category')
                    ->get()
                    ->pluck('count', 'category')
            ];

            return response()->json($activity);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch user activity'], 500);
        }
    }

    /**
     * Get all media items across all users
     */
    public function allMediaItems(Request $request): JsonResponse
    {
        try {
            $query = MediaItem::with('user:id,name,email')
                ->select('id', 'user_id', 'title', 'category', 'created_at', 'updated_at');

            // Add search functionality
            if ($request->has('search')) {
                $query->where('title', 'like', '%' . $request->search . '%');
            }

            // Add category filter
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            // Add user filter
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            $mediaItems = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 20));

            return response()->json($mediaItems);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch media items'], 500);
        }
    }

    /**
     * Get all collections across all users
     */
    public function allCollections(Request $request): JsonResponse
    {
        try {
            $query = Collection::with('user:id,name,email')
                ->withCount('mediaItems')
                ->select('id', 'user_id', 'name', 'description', 'created_at', 'updated_at');

            // Add search functionality
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            // Add user filter
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            $collections = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 20));

            return response()->json($collections);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch collections'], 500);
        }
    }
}