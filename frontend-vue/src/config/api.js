// API Configuration
// Automatically detects environment and sets appropriate API base URL

function getApiBaseUrl() {
  // Check for custom API URL from environment variable FIRST (highest priority)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'null' && import.meta.env.VITE_API_URL !== 'undefined') {
    return `${import.meta.env.VITE_API_URL}/api`
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000/api'
  }
  
  // Check if we're running on localhost AND in development mode
  if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && import.meta.env.DEV) {
    return 'http://127.0.0.1:8000/api'
  }
  
  // Default to current origin (production)
  return `${window.location.origin}/api`
}

function getBaseUrl() {
  // Check for custom API URL from environment variable FIRST (highest priority)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'null' && import.meta.env.VITE_API_URL !== 'undefined') {
    return import.meta.env.VITE_API_URL
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000'
  }
  
  // Check if we're running on localhost AND in development mode
  if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && import.meta.env.DEV) {
    return 'http://127.0.0.1:8000'
  }
  
  // Default to current origin (production)
  return window.location.origin
}

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  API_BASE_URL: getApiBaseUrl(),
  // Additional configuration can be added here
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
}

