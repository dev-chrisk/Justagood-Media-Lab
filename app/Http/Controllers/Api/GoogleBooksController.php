<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleBooksController extends Controller
{
    /**
     * Search books using Google Books API
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q');
        $maxResults = $request->get('maxResults', 10);
        

        if (!$query || trim($query) === '') {
            return response()->json([
                'success' => false,
                'error' => 'Query parameter is required'
            ], 400);
        }

        try {
            $apiKey = config('services.google_books.api_key');
            
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'error' => 'Google Books API key not configured'
                ], 500);
            }

            $url = 'https://www.googleapis.com/books/v1/volumes';
            $params = [
                'q' => $query,
                'key' => $apiKey,
                'maxResults' => min($maxResults, 40) // Limit to 40 max
            ];


            $response = Http::timeout(10)->get($url, $params);


            if (!$response->successful()) {
                $errorBody = $response->body();

                // Try to parse error response
                $errorData = json_decode($errorBody, true);
                $errorMessage = 'Google Books API error: ' . $response->status();
                
                if (isset($errorData['error']['message'])) {
                    $errorMessage .= ' - ' . $errorData['error']['message'];
                }

                return response()->json([
                    'success' => false,
                    'error' => $errorMessage,
                    'details' => $errorBody,
                    'debug' => [
                        'url' => $url,
                        'params' => array_merge($params, ['key' => 'HIDDEN'])
                    ]
                ], 400); // Always return 400 for client errors
            }

            $data = $response->json();
            

            // Format the data for frontend
            $formattedItems = $this->formatBooksData($data['items'] ?? []);

            return response()->json([
                'success' => true,
                'data' => $formattedItems,
                'totalItems' => $data['totalItems'] ?? 0
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Failed to search books: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format books data for frontend
     */
    private function formatBooksData(array $items): array
    {
        return array_map(function ($item) {
            $volumeInfo = $item['volumeInfo'] ?? [];
            $imageLinks = $volumeInfo['imageLinks'] ?? [];
            
            return [
                'id' => $item['id'] ?? '',
                'title' => $volumeInfo['title'] ?? 'Unknown Title',
                'authors' => $volumeInfo['authors'] ?? [],
                'author' => isset($volumeInfo['authors']) ? implode(', ', $volumeInfo['authors']) : '',
                'description' => $volumeInfo['description'] ?? '',
                'publishedDate' => $volumeInfo['publishedDate'] ?? '',
                'publisher' => $volumeInfo['publisher'] ?? '',
                'pageCount' => $volumeInfo['pageCount'] ?? null,
                'categories' => $volumeInfo['categories'] ?? [],
                'language' => $volumeInfo['language'] ?? '',
                'isbn10' => $this->extractISBN($volumeInfo['industryIdentifiers'] ?? [], 'ISBN_10'),
                'isbn13' => $this->extractISBN($volumeInfo['industryIdentifiers'] ?? [], 'ISBN_13'),
                'imageUrl' => $imageLinks['thumbnail'] ?? $imageLinks['smallThumbnail'] ?? null,
                'previewLink' => $volumeInfo['previewLink'] ?? null,
                'infoLink' => $volumeInfo['infoLink'] ?? null,
                'canonicalVolumeLink' => $volumeInfo['canonicalVolumeLink'] ?? null
            ];
        }, $items);
    }

    /**
     * Extract ISBN from industry identifiers
     */
    private function extractISBN(array $identifiers, string $type): ?string
    {
        foreach ($identifiers as $identifier) {
            if (($identifier['type'] ?? '') === $type) {
                return $identifier['identifier'] ?? null;
            }
        }
        return null;
    }
}
