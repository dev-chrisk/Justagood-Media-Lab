// API Configuration
// Automatically detects environment and sets appropriate API base URL

function getApiBaseUrl() {
  // FORCE localhost for debugging
  console.log('🔧 API Config Debug:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE,
    NODE_ENV: import.meta.env.NODE_ENV
  })
  
  // FORCE localhost - ignore everything else
  return 'http://127.0.0.1:8000/api'
}

function getBaseUrl() {
  // FORCE localhost for debugging
  return 'http://127.0.0.1:8000'
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
