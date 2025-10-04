<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecureCookieMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Set secure cookie headers for all responses
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        
        // Set SameSite cookie attributes
        $response->headers->set('Set-Cookie', $this->buildSecureCookieHeader($request));

        return $response;
    }

    /**
     * Build secure cookie header with proper SameSite attributes
     */
    private function buildSecureCookieHeader(Request $request): string
    {
        $isSecure = $request->isSecure();
        $isLocalhost = in_array($request->getHost(), ['localhost', '127.0.0.1']);
        
        // For localhost development, we can be more permissive
        if ($isLocalhost) {
            $sameSite = 'Lax';
            $secure = false; // Allow HTTP on localhost
        } else {
            $sameSite = 'Strict';
            $secure = true; // Require HTTPS in production
        }

        return sprintf(
            'SameSite=%s; Secure=%s; HttpOnly',
            $sameSite,
            $secure ? 'true' : 'false'
        );
    }
}


