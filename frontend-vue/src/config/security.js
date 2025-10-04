/**
 * Security Configuration
 * Handles CORS, cookies, and privacy settings
 */

// Security headers for API requests
export const SECURITY_CONFIG = {
  // Default headers for all API requests
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  
  // CORS settings
  cors: {
    credentials: 'same-origin', // Don't send credentials to third-party domains
    mode: 'cors'
  },
  
  // Cookie settings
  cookies: {
    sameSite: 'Lax', // Allow cookies for same-site requests
    secure: false, // Allow HTTP in development
    httpOnly: true // Prevent JavaScript access to cookies
  }
}

// Environment-specific security settings
export function getSecurityConfig() {
  const isDevelopment = import.meta.env.DEV
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1'
  
  return {
    ...SECURITY_CONFIG,
    cookies: {
      ...SECURITY_CONFIG.cookies,
      secure: !isDevelopment && !isLocalhost, // HTTPS only in production
      sameSite: isLocalhost ? 'Lax' : 'Strict'
    },
    cors: {
      ...SECURITY_CONFIG.cors,
      credentials: isLocalhost ? 'include' : 'same-origin'
    }
  }
}

// Helper function to create secure fetch requests
export function createSecureFetch(baseUrl) {
  const config = getSecurityConfig()
  
  return async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
    
    const secureOptions = {
      ...options,
      headers: {
        ...config.defaultHeaders,
        ...options.headers
      },
      credentials: config.cors.credentials,
      mode: config.cors.mode
    }
    
    return fetch(fullUrl, secureOptions)
  }
}

// Debug logging for security issues
export function logSecurityInfo() {
  if (import.meta.env.DEV) {
    console.log('🔒 Security Configuration:', {
      isDevelopment: import.meta.env.DEV,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      sameSite: getSecurityConfig().cookies.sameSite,
      secure: getSecurityConfig().cookies.secure
    })
  }
}


