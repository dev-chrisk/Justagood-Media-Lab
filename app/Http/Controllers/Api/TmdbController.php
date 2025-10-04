<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TmdbController extends Controller
{
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
}


