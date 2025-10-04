// API Configuration
// Automatically detects environment and sets appropriate API base URL

function getApiBaseUrl() {
  console.log('🔍 getApiBaseUrl Debug:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE
  })
  
  // Check for custom API URL from environment variable first
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'null') {
    console.log('📍 Using VITE_API_URL:', import.meta.env.VITE_API_URL)
    return `${import.meta.env.VITE_API_URL}/api`
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    console.log('📍 Using development mode - proxy')
    // Development mode - use relative URL for Vite proxy
    return '/api'
  } else {
    console.log('📍 Using production mode')
    // Production mode - use the production domain
    return 'https://teabubble.attrebi.ch/api'
  }
}

function getBaseUrl() {
  // Check for custom API URL from environment variable first
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'null') {
    return import.meta.env.VITE_API_URL
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // Development mode - use relative URL for Vite proxy
    return ''
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
console.log('🔧 API Configuration Debug:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  NODE_ENV: import.meta.env.NODE_ENV,
  BASE_URL: API_CONFIG.BASE_URL,
  API_BASE_URL: API_CONFIG.API_BASE_URL
})
