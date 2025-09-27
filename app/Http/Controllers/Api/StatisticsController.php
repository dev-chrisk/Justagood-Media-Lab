<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaItem;
use App\Models\Collection;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    /**
     * Get total statistics
     */
    public function total(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $totalItems = $query->count();
        $totalPlaytime = $query->sum('spielzeit') ?? 0;
        $avgRating = $query->whereNotNull('rating')->avg('rating') ?? 0;
        
        $collectionsQuery = Collection::query();
        if ($request->user()) {
            $collectionsQuery->forUser($request->user()->id);
        }
        $totalCollections = $collectionsQuery->count();

        return response()->json([
            'totalItems' => $totalItems,
            'totalCollections' => $totalCollections,
            'totalPlaytime' => $totalPlaytime,
            'avgRating' => round($avgRating, 1)
        ]);
    }

    /**
     * Get category distribution statistics
     */
    public function categories(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $categories = $query->select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->get();

        return response()->json($categories);
    }

    /**
     * Get rating distribution statistics
     */
    public function ratings(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $ratings = $query->select('rating', DB::raw('count(*) as count'))
            ->whereNotNull('rating')
            ->groupBy('rating')
            ->orderBy('rating', 'asc')
            ->get();

        return response()->json($ratings);
    }

    /**
     * Get platform distribution statistics
     */
    public function platforms(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $platforms = $query->select('platforms')
            ->whereNotNull('platforms')
            ->where('platforms', '!=', '')
            ->get()
            ->pluck('platforms')
            ->flatMap(function ($platformString) {
                return array_map('trim', explode(',', $platformString));
            })
            ->filter()
            ->countBy()
            ->map(function ($count, $platform) {
                return ['platform' => $platform, 'count' => $count];
            })
            ->values()
            ->sortByDesc('count')
            ->values();

        return response()->json($platforms);
    }

    /**
     * Get genre distribution statistics
     */
    public function genres(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $genres = $query->select('genre')
            ->whereNotNull('genre')
            ->where('genre', '!=', '')
            ->get()
            ->pluck('genre')
            ->flatMap(function ($genreString) {
                return array_map('trim', explode(',', $genreString));
            })
            ->filter()
            ->countBy()
            ->map(function ($count, $genre) {
                return ['genre' => $genre, 'count' => $count];
            })
            ->values()
            ->sortByDesc('count')
            ->values();

        return response()->json($genres);
    }

    /**
     * Get recent activity (recently discovered items)
     */
    public function recent(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $recent = $query->select('title', 'discovered', 'category')
            ->whereNotNull('discovered')
            ->orderBy('discovered', 'desc')
            ->limit(10)
            ->get();

        return response()->json($recent);
    }

    /**
     * Get currently airing series
     */
    public function airing(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $airing = $query->select('title', 'next_season', 'next_season_release', 'category')
            ->where('is_airing', true)
            ->where('category', 'series')
            ->orderBy('next_season_release', 'asc')
            ->get();

        return response()->json($airing);
    }

    /**
     * Get release year distribution
     */
    public function releaseYears(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $years = $query->select(DB::raw('YEAR(release) as year'), DB::raw('count(*) as count'))
            ->whereNotNull('release')
            ->groupBy(DB::raw('YEAR(release)'))
            ->orderBy('year', 'desc')
            ->get();

        return response()->json($years);
    }

    /**
     * Get discovery timeline (items added per month)
     */
    public function discoveryTimeline(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $timeline = $query->select(
                DB::raw('YEAR(discovered) as year'),
                DB::raw('MONTH(discovered) as month'),
                DB::raw('count(*) as count')
            )
            ->whereNotNull('discovered')
            ->groupBy(DB::raw('YEAR(discovered)'), DB::raw('MONTH(discovered)'))
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();

        return response()->json($timeline);
    }

    /**
     * Get playtime statistics by category
     */
    public function playtimeByCategory(Request $request): JsonResponse
    {
        $query = MediaItem::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }

        $playtime = $query->select('category', DB::raw('SUM(spielzeit) as total_playtime'), DB::raw('AVG(spielzeit) as avg_playtime'), DB::raw('count(*) as count'))
            ->whereNotNull('spielzeit')
            ->groupBy('category')
            ->orderBy('total_playtime', 'desc')
            ->get();

        return response()->json($playtime);
    }

    /**
     * Get user activity statistics
     */
    public function userActivity(Request $request): JsonResponse
    {
        if (!$request->user()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $userId = $request->user()->id;
        
        $userStats = [
            'total_items' => MediaItem::forUser($userId)->count(),
            'total_collections' => Collection::forUser($userId)->count(),
            'items_this_month' => MediaItem::forUser($userId)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'items_this_year' => MediaItem::forUser($userId)
                ->whereYear('created_at', now()->year)
                ->count(),
            'favorite_category' => MediaItem::forUser($userId)
                ->select('category', DB::raw('count(*) as count'))
                ->groupBy('category')
                ->orderBy('count', 'desc')
                ->first(),
            'total_playtime' => MediaItem::forUser($userId)->sum('spielzeit') ?? 0,
            'avg_rating' => MediaItem::forUser($userId)->whereNotNull('rating')->avg('rating') ?? 0
        ];

        return response()->json($userStats);
    }
}
