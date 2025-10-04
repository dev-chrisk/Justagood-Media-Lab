/**
 * NEW Google Books API Service - Clean Implementation
 * Handles all Google Books API interactions with proper error handling
 */

// Configuration
const API_CONFIG = {
  BASE_URL: 'https://www.googleapis.com/books/v1',
  TIMEOUT: 10000,
  MAX_RESULTS: 40
}

class GoogleBooksApiService {
  constructor() {
    this.apiKey = null
    this.isInitialized = false
    this.initializeConfig()
  }

  /**
   * Initialize API configuration from backend
   */
  async initializeConfig() {
    try {
      console.log('📚 [GoogleBooks] Initializing configuration...')
      
      // Get base URL based on environment
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/google-books-config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const config = await response.json()
      this.apiKey = config.api_key
      this.isInitialized = true

      console.log('📚 [GoogleBooks] Configuration loaded:', {
        hasApiKey: !!this.apiKey,
        apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'MISSING',
        baseUrl: config.base_url
      })

      return true
    } catch (error) {
      console.error('📚 [GoogleBooks] Failed to initialize:', error)
      this.isInitialized = false
      return false
    }
  }

  /**
   * Get base URL based on environment
   */
  getBaseUrl() {
    // Check for environment variable first
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL
    }
    
    // Auto-detect based on environment
    if (import.meta.env.DEV) {
      return 'http://127.0.0.1:8000'
    } else {
      return 'https://teabubble.attrebi.ch'
    }
  }

  /**
   * Search for books using Google Books API
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @returns {Promise<Object>} Search results
   */
  async searchBooks(query, maxResults = 10) {
    console.log('📚 [GoogleBooks] Searching books:', { query, maxResults })

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.warn('📚 [GoogleBooks] Invalid query provided')
      return {
        success: false,
        error: 'Search query is required',
        data: []
      }
    }

    // Ensure API is initialized
    if (!this.isInitialized) {
      console.log('📚 [GoogleBooks] API not initialized, attempting to initialize...')
      const initialized = await this.initializeConfig()
      if (!initialized) {
        return {
          success: false,
          error: 'Failed to initialize Google Books API',
          data: []
        }
      }
    }

    // Check if API key is available
    if (!this.apiKey) {
      console.error('📚 [GoogleBooks] No API key available')
      return {
        success: false,
        error: 'Google Books API key not configured',
        data: []
      }
    }

    try {
      // Try backend API first
      const backendResult = await this.searchViaBackend(query, maxResults)
      if (backendResult.success) {
        console.log('📚 [GoogleBooks] Backend search successful')
        return backendResult
      }

      // Fallback to direct API call
      console.log('📚 [GoogleBooks] Backend failed, trying direct API...')
      return await this.searchDirect(query, maxResults)

    } catch (error) {
      console.error('📚 [GoogleBooks] Search failed:', error)
      return {
        success: false,
        error: `Search failed: ${error.message}`,
        data: []
      }
    }
  }

  /**
   * Search via backend API
   */
  async searchViaBackend(query, maxResults) {
    try {
      const baseUrl = this.getBaseUrl()
      const url = `${baseUrl}/api/google-books/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
      
      console.log('📚 [GoogleBooks] Backend request:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        mode: 'cors',
        credentials: 'include',
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
      })

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        return {
          success: true,
          data: data.data,
          source: 'backend'
        }
      } else {
        throw new Error(data.error || 'Backend API returned unsuccessful response')
      }

    } catch (error) {
      console.warn('📚 [GoogleBooks] Backend search failed:', error.message)
      throw error
    }
  }

  /**
   * Search via direct Google Books API
   */
  async searchDirect(query, maxResults) {
    try {
      const url = `${API_CONFIG.BASE_URL}/volumes?q=${encodeURIComponent(query)}&key=${this.apiKey}&maxResults=${Math.min(maxResults, API_CONFIG.MAX_RESULTS)}`
      
      console.log('📚 [GoogleBooks] Direct API request:', url.substring(0, 100) + '...')

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        mode: 'cors',
        credentials: 'include',
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Google Books API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      
      if (data.items && Array.isArray(data.items)) {
        const formattedResults = this.formatBooksData(data.items)
        return {
          success: true,
          data: formattedResults,
          source: 'direct'
        }
      } else {
        return {
          success: true,
          data: [],
          source: 'direct'
        }
      }

    } catch (error) {
      console.error('📚 [GoogleBooks] Direct API search failed:', error)
      throw error
    }
  }

  /**
   * Format Google Books API data for our application
   */
  formatBooksData(items) {
    if (!Array.isArray(items)) {
      return []
    }

    return items.map(item => {
      const volumeInfo = item.volumeInfo || {}
      const saleInfo = item.saleInfo || {}
      
      return {
        id: item.id,
        title: volumeInfo.title || 'Unknown Title',
        author: this.formatAuthors(volumeInfo.authors),
        authors: volumeInfo.authors || [],
        description: this.cleanDescription(volumeInfo.description),
        publishedDate: volumeInfo.publishedDate,
        publisher: volumeInfo.publisher,
        pageCount: volumeInfo.pageCount,
        categories: volumeInfo.categories || [],
        averageRating: volumeInfo.averageRating,
        ratingsCount: volumeInfo.ratingsCount,
        language: volumeInfo.language,
        isbn: this.extractISBN(volumeInfo.industryIdentifiers),
        thumbnail: this.getThumbnail(volumeInfo.imageLinks),
        previewLink: volumeInfo.previewLink,
        infoLink: volumeInfo.infoLink,
        buyLink: saleInfo.buyLink,
        listPrice: saleInfo.listPrice,
        retailPrice: saleInfo.retailPrice,
        availability: saleInfo.saleability
      }
    })
  }

  /**
   * Format authors array into readable string
   */
  formatAuthors(authors) {
    if (!Array.isArray(authors) || authors.length === 0) {
      return 'Unknown Author'
    }
    
    if (authors.length === 1) {
      return authors[0]
    } else if (authors.length === 2) {
      return `${authors[0]} & ${authors[1]}`
    } else {
      return `${authors[0]} et al.`
    }
  }

  /**
   * Clean and truncate description
   */
  cleanDescription(description) {
    if (!description) return ''
    
    // Remove HTML tags and clean up
    const cleaned = description
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    // Truncate if too long
    if (cleaned.length > 500) {
      return cleaned.substring(0, 500) + '...'
    }
    
    return cleaned
  }

  /**
   * Extract ISBN from industry identifiers
   */
  extractISBN(identifiers) {
    if (!Array.isArray(identifiers)) return null
    
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13')
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10')
    
    return isbn13?.identifier || isbn10?.identifier || null
  }

  /**
   * Get best available thumbnail
   */
  getThumbnail(imageLinks) {
    if (!imageLinks) return null
    
    return imageLinks.thumbnail || 
           imageLinks.smallThumbnail || 
           imageLinks.medium || 
           imageLinks.large || 
           null
  }

  /**
   * Get book details by ID
   */
  async getBookDetails(bookId) {
    console.log('📚 [GoogleBooks] Getting book details:', bookId)

    if (!bookId) {
      return {
        success: false,
        error: 'Book ID is required',
        data: null
      }
    }

    if (!this.isInitialized) {
      await this.initializeConfig()
    }

    if (!this.apiKey) {
      return {
        success: false,
        error: 'Google Books API key not configured',
        data: null
      }
    }

    try {
      const url = `${API_CONFIG.BASE_URL}/volumes/${bookId}?key=${this.apiKey}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        mode: 'cors',
        credentials: 'include',
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Google Books API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const formattedData = this.formatBooksData([data])[0]

      return {
        success: true,
        data: formattedData
      }

    } catch (error) {
      console.error('📚 [GoogleBooks] Get book details failed:', error)
      return {
        success: false,
        error: `Failed to get book details: ${error.message}`,
        data: null
      }
    }
  }
}

// Create singleton instance
const googleBooksApi = new GoogleBooksApiService()

export default googleBooksApi
