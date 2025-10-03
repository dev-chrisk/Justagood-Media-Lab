<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\MediaItem;
use App\Models\Collection;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get all users with statistics
     */
    public function users(): JsonResponse
    {
        $users = User::withCount(['mediaItems', 'collections'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }

    /**
     * Get user details with all data
     */
    public function userDetails($id): JsonResponse
    {
        $user = User::with(['mediaItems', 'collections'])
            ->withCount(['mediaItems', 'collections'])
            ->findOrFail($id);

        return response()->json($user);
    }

    /**
     * Update user admin status
     */
    public function updateUser(Request $request, $id): JsonResponse
    {
        $request->validate([
            'is_admin' => 'boolean',
        ]);

        $user = User::findOrFail($id);
        $user->update($request->only(['is_admin']));

        return response()->json([
            'success' => true,
            'user' => $user->fresh()
        ]);
    }

    /**
     * Delete user and all their data
     */
    public function deleteUser($id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        // Delete user's media items and collections (cascade should handle this)
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User and all associated data deleted successfully'
        ]);
    }

    /**
     * Get system statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_users' => User::count(),
            'admin_users' => User::where('is_admin', true)->count(),
            'regular_users' => User::where('is_admin', false)->count(),
            'total_media_items' => MediaItem::count(),
            'total_collections' => Collection::count(),
            'users_with_media' => User::has('mediaItems')->count(),
            'users_with_collections' => User::has('collections')->count(),
            'recent_registrations' => User::where('created_at', '>=', now()->subDays(30))->count(),
        ];

        // Get category distribution
        $categoryStats = MediaItem::select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->get();

        $stats['category_distribution'] = $categoryStats;

        // Get recent activity
        $recentActivity = MediaItem::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['id', 'title', 'category', 'user_id', 'created_at']);

        $stats['recent_activity'] = $recentActivity;

        return response()->json($stats);
    }

    /**
     * Get user activity for specific user
     */
    public function userActivity($id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        $activity = [
            'user' => $user->only(['id', 'name', 'email', 'created_at']),
            'media_items_count' => $user->mediaItems()->count(),
            'collections_count' => $user->collections()->count(),
            'recent_media_items' => $user->mediaItems()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(['id', 'title', 'category', 'created_at']),
            'recent_collections' => $user->collections()
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'name', 'created_at']),
            'total_playtime' => $user->mediaItems()->sum('spielzeit') ?? 0,
            'average_rating' => $user->mediaItems()->whereNotNull('rating')->avg('rating') ?? 0,
        ];

        return response()->json($activity);
    }

    /**
     * Get all media items (admin view - no user filtering)
     */
    public function allMediaItems(Request $request): JsonResponse
    {
        $query = MediaItem::with('user');

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Search by title
        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $mediaItems = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($mediaItems);
    }

    /**
     * Get all collections (admin view - no user filtering)
     */
    public function allCollections(): JsonResponse
    {
        $collections = Collection::with('user')
            ->withCount('mediaItems')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($collections);
    }
}