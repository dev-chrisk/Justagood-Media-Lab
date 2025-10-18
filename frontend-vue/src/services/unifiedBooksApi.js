import { wikipediaApiService } from './wikipediaApi'
import { simpleGoogleBooksApi } from './simpleApi'

/**
 * Unified Books API Service
 * Uses Wikipedia as primary source and Google Books as fallback
 * Respects user preferences for API provider selection
 */
class UnifiedBooksApiService {
  constructor() {
    this.wikipediaService = wikipediaApiService
    this.googleBooksService = simpleGoogleBooksApi
  }

  /**
   * Get user preferences for books API
   * @returns {Object} User preferences
   */
  getUserPreferences() {
    try {
      const saved = localStorage.getItem('profileData')
      if (saved) {
        const profileData = JSON.parse(saved)
        return {
          booksApiProvider: profileData.booksApiProvider || 'wikipedia',
          enableGoogleBooksFallback: profileData.enableGoogleBooksFallback !== false
        }
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error)
    }
    
    // Default preferences
    return {
      booksApiProvider: 'wikipedia',
      enableGoogleBooksFallback: true
    }
  }

  /**
   * Search for books using unified API approach
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Object>} Search results
   */
  async searchBooks(query, maxResults = 10) {
    const preferences = this.getUserPreferences()

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        success: false,
        error: 'Search query is required',
        data: []
      }
    }

    try {
      let results = []
      let primarySource = ''
      let fallbackUsed = false

      // Determine search strategy based on user preferences
      switch (preferences.booksApiProvider) {
        case 'wikipedia':
          results = await this.searchWithWikipediaFirst(query, maxResults, preferences)
          primarySource = 'wikipedia'
          break
          
        case 'google_books':
          results = await this.searchWithGoogleBooksFirst(query, maxResults, preferences)
          primarySource = 'google_books'
          break
          
        case 'both':
          results = await this.searchWithBothApis(query, maxResults, preferences)
          primarySource = 'both'
          break
          
        default:
          // Default to Wikipedia first
          results = await this.searchWithWikipediaFirst(query, maxResults, preferences)
          primarySource = 'wikipedia'
      }


      return {
        success: true,
        data: results,
        source: primarySource,
        fallbackUsed
      }

    } catch (error) {
      console.error('📚 [UnifiedBooks] Search failed:', error)
      return {
        success: false,
        error: `Search failed: ${error.message}`,
        data: []
      }
    }
  }

  /**
   * Search with Wikipedia as primary source
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} Search results
   */
  async searchWithWikipediaFirst(query, maxResults, preferences) {
    
    // Try Wikipedia first
    const wikipediaResult = await this.wikipediaService.searchBooks(query, maxResults)
    
    if (wikipediaResult.success && wikipediaResult.data.length > 0) {
      return wikipediaResult.data
    }

    // If Wikipedia fails and fallback is enabled, try Google Books
    if (preferences.enableGoogleBooksFallback) {
      const googleResult = await this.googleBooksService.searchBooks(query, maxResults)
      
      if (googleResult.success && googleResult.data.length > 0) {
        return googleResult.data
      }
    }

    return []
  }

  /**
   * Search with Google Books as primary source
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} Search results
   */
  async searchWithGoogleBooksFirst(query, maxResults, preferences) {
    
    // Try Google Books first
    const googleResult = await this.googleBooksService.searchBooks(query, maxResults)
    
    if (googleResult.success && googleResult.data.length > 0) {
      return googleResult.data
    }

    // If Google Books fails and fallback is enabled, try Wikipedia
    if (preferences.enableGoogleBooksFallback) {
      const wikipediaResult = await this.wikipediaService.searchBooks(query, maxResults)
      
      if (wikipediaResult.success && wikipediaResult.data.length > 0) {
        return wikipediaResult.data
      }
    }

    return []
  }

  /**
   * Search with both APIs and combine results
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} Combined search results
   */
  async searchWithBothApis(query, maxResults, preferences) {
    
    // Search both APIs in parallel
    const [wikipediaResult, googleResult] = await Promise.allSettled([
      this.wikipediaService.searchBooks(query, Math.ceil(maxResults / 2)),
      this.googleBooksService.searchBooks(query, Math.ceil(maxResults / 2))
    ])

    let results = []

    // Add Wikipedia results
    if (wikipediaResult.status === 'fulfilled' && wikipediaResult.value.success) {
      results = results.concat(wikipediaResult.value.data)
    }

    // Add Google Books results
    if (googleResult.status === 'fulfilled' && googleResult.value.success) {
      results = results.concat(googleResult.value.data)
    }

    // Remove duplicates based on title similarity
    results = this.removeDuplicateResults(results)
    
    // Limit to maxResults
    results = results.slice(0, maxResults)

    return results
  }

  /**
   * Remove duplicate results based on title similarity
   * @param {Array} results - Array of book results
   * @returns {Array} Deduplicated results
   */
  removeDuplicateResults(results) {
    const seen = new Set()
    const deduplicated = []

    for (const result of results) {
      const normalizedTitle = result.title.toLowerCase().replace(/[^\w\s]/g, '').trim()
      
      if (!seen.has(normalizedTitle)) {
        seen.add(normalizedTitle)
        deduplicated.push(result)
      }
    }

    return deduplicated
  }

  /**
   * Get book by ID from the appropriate service
   * @param {string} bookId - Book ID (prefixed with service name)
   * @returns {Promise<Object>} Book information
   */
  async getBookById(bookId) {
    if (bookId.startsWith('wikipedia_')) {
      const pageId = bookId.replace('wikipedia_', '')
      return await this.wikipediaService.getBookById(pageId)
    } else {
      // Assume it's a Google Books ID
      return await this.googleBooksService.getBookById(bookId)
    }
  }

  /**
   * Get API status and configuration
   * @returns {Object} API status information
   */
  getApiStatus() {
    const preferences = this.getUserPreferences()
    
    return {
      primaryProvider: preferences.booksApiProvider,
      fallbackEnabled: preferences.enableGoogleBooksFallback,
      availableProviders: ['wikipedia', 'google_books'],
      wikipediaAvailable: true, // Wikipedia API is always available
      googleBooksAvailable: true // We'll check this dynamically
    }
  }
}

// Create and export singleton instance
export const unifiedBooksApiService = new UnifiedBooksApiService()
export default unifiedBooksApiService
