<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TMDBService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TmdbController extends Controller
{
    protected $tmdbService;

    public function __construct(TMDBService $tmdbService)
    {
        $this->tmdbService = $tmdbService;
    }
    /**
     * Get movie details from TMDb
     */
    public function getMovie(Request $request, $id): JsonResponse
    {
        try {
            $tmdbApiKey = config('services.tmdb.api_key');
            
            if (!$tmdbApiKey) {
                return response()->json(['error' => 'TMDb API key not configured'], 500);
            }

            $url = "https://api.themoviedb.org/3/movie/{$id}?api_key={$tmdbApiKey}";
            $response = file_get_contents($url);
            
            if ($response === false) {
                return response()->json(['error' => 'Failed to fetch movie details'], 500);
            }

            $data = json_decode($response, true);
            
            if (isset($data['status_code'])) {
                return response()->json(['error' => $data['status_message']], 404);
            }

            return response()->json($data);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch movie details'], 500);
        }
    }

    /**
     * Get collection details from TMDb
     */
    public function getCollection(Request $request, $id): JsonResponse
    {
        try {
            $tmdbApiKey = config('services.tmdb.api_key');
            
            if (!$tmdbApiKey) {
                return response()->json(['error' => 'TMDb API key not configured'], 500);
            }

            $url = "https://api.themoviedb.org/3/collection/{$id}?api_key={$tmdbApiKey}";
            $response = file_get_contents($url);
            
            if ($response === false) {
                return response()->json(['error' => 'Failed to fetch collection details'], 500);
            }

            $data = json_decode($response, true);
            
            if (isset($data['status_code'])) {
                return response()->json(['error' => $data['status_message']], 404);
            }

            return response()->json($data);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch collection details'], 500);
        }
    }

    /**
     * Search for TV series
     */
    public function searchSeries(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|min:2|max:255'
        ]);

        if (!$this->tmdbService->isConfigured()) {
            return response()->json(['error' => 'TMDB API key not configured'], 500);
        }

        $seriesInfo = $this->tmdbService->getSeriesInfo($request->title);

        if (!$seriesInfo) {
            return response()->json(['error' => 'Series not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $seriesInfo
        ]);
    }

    /**
     * Get series details by TMDB ID
     */
    public function getSeries(Request $request, $id): JsonResponse
    {
        if (!$this->tmdbService->isConfigured()) {
            return response()->json(['error' => 'TMDB API key not configured'], 500);
        }

        $seriesInfo = $this->tmdbService->getSeriesDetails($id);

        if (!$seriesInfo) {
            return response()->json(['error' => 'Series not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $seriesInfo
        ]);
    }

    /**
     * Get next season information for a series
     */
    public function getNextSeasonInfo(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|min:2|max:255'
        ]);

        Log::info('TMDB Controller: getNextSeasonInfo called', [
            'title' => $request->title,
            'api_configured' => $this->tmdbService->isConfigured()
        ]);

        if (!$this->tmdbService->isConfigured()) {
            Log::error('TMDB Controller: API key not configured');
            return response()->json(['error' => 'TMDB API key not configured'], 500);
        }

        $seriesInfo = $this->tmdbService->getSeriesInfo($request->title);

        if (!$seriesInfo) {
            Log::warning('TMDB Controller: Series not found', ['title' => $request->title]);
            return response()->json(['error' => 'Series not found'], 404);
        }

        $nextSeasonInfo = $this->tmdbService->getNextSeasonInfo($seriesInfo);

        Log::info('TMDB Controller: Returning series info', [
            'title' => $request->title,
            'has_series_info' => !empty($seriesInfo),
            'has_next_season' => !empty($nextSeasonInfo)
        ]);

        return response()->json([
            'success' => true,
            'data' => $seriesInfo
        ]);
    }
}


