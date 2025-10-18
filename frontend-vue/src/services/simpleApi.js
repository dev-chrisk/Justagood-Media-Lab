/**
 * Simple API Service - Bypass CORS issues
 * Uses fetch with minimal configuration
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api'

export const simpleApi = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data
      
    } catch (error) {
      console.error('Simple API Error:', error)
      throw error
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      return result
      
    } catch (error) {
      console.error('Simple API Error:', error)
      throw error
    }
  }
}

// Google Books API with simple fetch
export const simpleGoogleBooksApi = {
  async getConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/google-books-config`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const config = await response.json()
      return config
      
    } catch (error) {
      console.error('Simple Google Books - Config failed:', error)
      throw error
    }
  },

  async searchBooks(query, maxResults = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/google-books/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data
      
    } catch (error) {
      console.error('Simple Google Books - Search failed:', error)
      throw error
    }
  }
}


