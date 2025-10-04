<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Category;
use Illuminate\Support\Facades\Log;

class CheckCategoryDuplicates
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Führe die ursprüngliche Anfrage aus
        $response = $next($request);

        // Überprüfe Duplikate nur bei erfolgreichen POST/PUT/PATCH Anfragen
        if ($this->shouldCheckDuplicates($request, $response)) {
            $this->checkAndCleanupDuplicates();
        }

        return $response;
    }

    /**
     * Determine if we should check for duplicates
     */
    private function shouldCheckDuplicates(Request $request, Response $response): bool
    {
        // Nur bei erfolgreichen Anfragen prüfen
        if (!$response->isSuccessful()) {
            return false;
        }

        // Prüfe bei Login, Registrierung und Datenoperationen
        $checkRoutes = [
            'login',
            'register',
            'media.store',
            'media.update',
            'collections.store',
            'collections.update',
            'import-data',
            'import-data-stream'
        ];

        $currentRoute = $request->route()?->getName();
        
        return in_array($currentRoute, $checkRoutes) || 
               $request->is('api/login') || 
               $request->is('api/register') ||
               $request->is('api/media*') ||
               $request->is('api/collections*') ||
               $request->is('api/import*');
    }

    /**
     * Check for and cleanup duplicate categories
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

                // Bereinige Duplikate
                Category::cleanupDuplicates();
                
            }
        } catch (\Exception $e) {
        }
    }
}
