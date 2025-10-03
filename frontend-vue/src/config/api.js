// API Configuration
// Automatically detects environment and sets appropriate API base URL

function getApiBaseUrl() {
  // Check for custom API URL from environment variable first
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // Development mode - use localhost
    return 'http://localhost:8000/api'
  } else {
    // Production mode - use the production domain
    return 'https://teabubble.attrebi.ch/api'
  }
}

function getBaseUrl() {
  // Check for custom API URL from environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // Development mode - use localhost
    return 'http://localhost:8000'
  } else {
    // Production mode - use the production domain
    return 'https://teabubble.attrebi.ch'
  }
}

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  API_BASE_URL: getApiBaseUrl(),
  // Additional configuration can be added here
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
}

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    API_BASE_URL: API_CONFIG.API_BASE_URL,
    ENV: import.meta.env.MODE
  })
}
