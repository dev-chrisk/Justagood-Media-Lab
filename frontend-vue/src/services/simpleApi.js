/**
 * Simple API Service - Bypass CORS issues
 * Uses fetch with minimal configuration
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api'

export const simpleApi = {
  async get(endpoint) {
    try {
      console.log('🔍 Simple API GET:', `${API_BASE_URL}${endpoint}`)
      
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
      console.log('✅ Simple API Success:', data)
      return data
      
    } catch (error) {
      console.error('❌ Simple API Error:', error)
      throw error
    }
  },

  async post(endpoint, data) {
    try {
      console.log('🔍 Simple API POST:', `${API_BASE_URL}${endpoint}`, data)
      
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
      console.log('✅ Simple API Success:', result)
      return result
      
    } catch (error) {
      console.error('❌ Simple API Error:', error)
      throw error
    }
  }
}

// Google Books API with simple fetch
export const simpleGoogleBooksApi = {
  async getConfig() {
    try {
      console.log('📚 Simple Google Books - Getting config...')
      
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
      console.log('📚 Simple Google Books - Config loaded:', config)
      return config
      
    } catch (error) {
      console.error('📚 Simple Google Books - Config failed:', error)
      throw error
    }
  },

  async searchBooks(query, maxResults = 10) {
    try {
      console.log('📚 Simple Google Books - Searching:', query)
      
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
      console.log('📚 Simple Google Books - Search success:', data)
      return data
      
    } catch (error) {
      console.error('📚 Simple Google Books - Search failed:', error)
      throw error
    }
  }
}


