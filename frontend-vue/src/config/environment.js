/**
 * Environment Configuration
 * Centralized configuration for different environments
 */

// Environment detection
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD
const mode = import.meta.env.MODE

// Base URLs for different environments
const ENVIRONMENTS = {
  development: {
    apiUrl: 'http://127.0.0.1:8000',
    apiBaseUrl: 'http://127.0.0.1:8000/api',
    googleBooksUrl: 'http://127.0.0.1:8000/api/google-books',
    debug: true
  },
  production: {
    apiUrl: 'https://teabubble.attrebi.ch',
    apiBaseUrl: 'https://teabubble.attrebi.ch/api',
    googleBooksUrl: 'https://teabubble.attrebi.ch/api/google-books',
    debug: false
  }
}

// Get current environment configuration
function getEnvironmentConfig() {
  // Check for explicit environment variable override
  if (import.meta.env.VITE_API_URL) {
    const customUrl = import.meta.env.VITE_API_URL
    return {
      apiUrl: customUrl,
      apiBaseUrl: `${customUrl}/api`,
      googleBooksUrl: `${customUrl}/api/google-books`,
      debug: isDevelopment
    }
  }
  
  // Auto-detect based on build mode
  if (isDevelopment) {
    return ENVIRONMENTS.development
  } else {
    return ENVIRONMENTS.production
  }
}

// Export current configuration
export const config = getEnvironmentConfig()

// Debug logging
if (config.debug) {
  console.log('🔧 [Environment] Configuration loaded:', {
    mode,
    isDevelopment,
    isProduction,
    apiUrl: config.apiUrl,
    apiBaseUrl: config.apiBaseUrl,
    googleBooksUrl: config.googleBooksUrl
  })
}

// Utility functions
export const getApiUrl = () => config.apiUrl
export const getApiBaseUrl = () => config.apiBaseUrl
export const getGoogleBooksUrl = () => config.googleBooksUrl
export const isDebugMode = () => config.debug

export default config


