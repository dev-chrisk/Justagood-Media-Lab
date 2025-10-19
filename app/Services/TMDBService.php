<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TMDBService
{
    private $apiKey;
    private $baseUrl;
    private $imageBaseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.tmdb.api_key');
        $this->baseUrl = 'https://api.themoviedb.org/3';
        $this->imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
        
        Log::info('TMDB Service initialized', [
            'api_key_configured' => !empty($this->apiKey),
            'api_key_length' => $this->apiKey ? strlen($this->apiKey) : 0,
            'base_url' => $this->baseUrl
        ]);
    }

    /**
     * Search for a TV series by title
     */
    public function searchSeries(string $title): array
    {
        try {
            $response = Http::get("{$this->baseUrl}/search/tv", [
                'api_key' => $this->apiKey,
                'query' => $title,
                'language' => 'en-US'
            ]);

            if (!$response->successful()) {
                Log::error('TMDB API search failed', [
                    'title' => $title,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                return [];
            }

            $data = $response->json();
            return $data['results'] ?? [];
        } catch (\Exception $e) {
            Log::error('TMDB API search exception', [
                'title' => $title,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Get detailed information about a TV series
     */
    public function getSeriesDetails(int $tmdbId): ?array
    {
        try {
            $response = Http::get("{$this->baseUrl}/tv/{$tmdbId}", [
                'api_key' => $this->apiKey,
                'language' => 'en-US',
                'append_to_response' => 'seasons'
            ]);

            if (!$response->successful()) {
                Log::error('TMDB API series details failed', [
                    'tmdb_id' => $tmdbId,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                return null;
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('TMDB API series details exception', [
                'tmdb_id' => $tmdbId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get series information formatted for our application
     */
    public function getSeriesInfo(string $title): ?array
    {
        Log::info('TMDB Service: Getting series info for title', ['title' => $title]);
        
        // First search for the series
        $searchResults = $this->searchSeries($title);
        
        if (empty($searchResults)) {
            Log::warning('TMDB Service: No search results found', ['title' => $title]);
            return null;
        }

        Log::info('TMDB Service: Found search results', [
            'title' => $title,
            'results_count' => count($searchResults),
            'first_result' => $searchResults[0]['name'] ?? 'Unknown'
        ]);

        // Get the first result (most relevant)
        $series = $searchResults[0];
        $tmdbId = $series['id'];

        // Get detailed information
        $details = $this->getSeriesDetails($tmdbId);
        
        if (!$details) {
            Log::warning('TMDB Service: No details found for series', ['tmdb_id' => $tmdbId]);
            return null;
        }
        
        Log::info('TMDB Service: Got series details', [
            'tmdb_id' => $tmdbId,
            'name' => $details['name'] ?? 'Unknown',
            'status' => $details['status'] ?? 'Unknown'
        ]);

        // Determine if series is airing
        $isAiring = $details['status'] === 'Returning Series' || 
                   ($details['status'] === 'In Production' && isset($details['next_episode_to_air']));

        // Calculate days until next episode
        $daysLeft = null;
        if (isset($details['next_episode_to_air']) && $details['next_episode_to_air']['air_date']) {
            $nextAirDate = new \DateTime($details['next_episode_to_air']['air_date']);
            $today = new \DateTime();
            $interval = $today->diff($nextAirDate);
            $daysLeft = $interval->invert ? -$interval->days : $interval->days;
        }

        // Format the data for our application
        $formattedData = [
            'tmdb_id' => $tmdbId,
            'title' => $details['name'],
            'status' => $details['status'],
            'is_airing' => $isAiring,
            'first_air_date' => $details['first_air_date'],
            'last_air_date' => $details['last_air_date'],
            'number_of_seasons' => $details['number_of_seasons'],
            'number_of_episodes' => $details['number_of_episodes'],
            'next_episode' => $details['next_episode_to_air'] ? [
                'season_number' => $details['next_episode_to_air']['season_number'],
                'episode_number' => $details['next_episode_to_air']['episode_number'],
                'air_date' => $details['next_episode_to_air']['air_date'],
                'name' => $details['next_episode_to_air']['name'],
                'overview' => $details['next_episode_to_air']['overview'] ?? null
            ] : null,
            'overview' => $details['overview'],
            'poster_path' => $details['poster_path'] ? $this->imageBaseUrl . $details['poster_path'] : null,
            'backdrop_path' => $details['backdrop_path'] ? $this->imageBaseUrl . $details['backdrop_path'] : null,
            'genres' => array_column($details['genres'], 'name'),
            'created_by' => array_column($details['created_by'], 'name'),
            'networks' => array_column($details['networks'], 'name'),
            'production_countries' => array_column($details['production_countries'], 'name'),
            'seasons' => $details['seasons'] ?? [],
            'days_left' => $daysLeft
        ];
        
        Log::info('TMDB Service: Formatted data for frontend', [
            'tmdb_id' => $formattedData['tmdb_id'],
            'title' => $formattedData['title'],
            'is_airing' => $formattedData['is_airing'],
            'next_episode' => $formattedData['next_episode'],
            'networks' => $formattedData['networks']
        ]);
        
        return $formattedData;
    }

    /**
     * Get next season information for a series
     */
    public function getNextSeasonInfo(array $seriesInfo): ?array
    {
        if (!$seriesInfo['next_episode']) {
            return null;
        }

        $nextEpisode = $seriesInfo['next_episode'];
        
        return [
            'next_season' => $nextEpisode['season_number'],
            'next_season_release' => $nextEpisode['air_date'],
            'next_season_name' => $nextEpisode['name'],
            'days_left' => $seriesInfo['days_left']
        ];
    }

    /**
     * Check if API key is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }
}
