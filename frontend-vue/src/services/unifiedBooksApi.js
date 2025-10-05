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
    console.log('📚 [UnifiedBooks] Starting search:', { query, maxResults })
    
    const preferences = this.getUserPreferences()
    console.log('📚 [UnifiedBooks] User preferences:', preferences)

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

      console.log('📚 [UnifiedBooks] Search completed:', {
        totalResults: results.length,
        primarySource,
        fallbackUsed
      })

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
    console.log('📚 [UnifiedBooks] Searching Wikipedia first...')
    
    // Try Wikipedia first
    const wikipediaResult = await this.wikipediaService.searchBooks(query, maxResults)
    
    if (wikipediaResult.success && wikipediaResult.data.length > 0) {
      console.log('📚 [UnifiedBooks] Wikipedia search successful:', wikipediaResult.data.length, 'results')
      return wikipediaResult.data
    }

    // If Wikipedia fails and fallback is enabled, try Google Books
    if (preferences.enableGoogleBooksFallback) {
      console.log('📚 [UnifiedBooks] Wikipedia failed, trying Google Books fallback...')
      const googleResult = await this.googleBooksService.searchBooks(query, maxResults)
      
      if (googleResult.success && googleResult.data.length > 0) {
        console.log('📚 [UnifiedBooks] Google Books fallback successful:', googleResult.data.length, 'results')
        return googleResult.data
      }
    }

    console.log('📚 [UnifiedBooks] All searches failed')
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
    console.log('📚 [UnifiedBooks] Searching Google Books first...')
    
    // Try Google Books first
    const googleResult = await this.googleBooksService.searchBooks(query, maxResults)
    
    if (googleResult.success && googleResult.data.length > 0) {
      console.log('📚 [UnifiedBooks] Google Books search successful:', googleResult.data.length, 'results')
      return googleResult.data
    }

    // If Google Books fails and fallback is enabled, try Wikipedia
    if (preferences.enableGoogleBooksFallback) {
      console.log('📚 [UnifiedBooks] Google Books failed, trying Wikipedia fallback...')
      const wikipediaResult = await this.wikipediaService.searchBooks(query, maxResults)
      
      if (wikipediaResult.success && wikipediaResult.data.length > 0) {
        console.log('📚 [UnifiedBooks] Wikipedia fallback successful:', wikipediaResult.data.length, 'results')
        return wikipediaResult.data
      }
    }

    console.log('📚 [UnifiedBooks] All searches failed')
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
    console.log('📚 [UnifiedBooks] Searching both APIs...')
    
    // Search both APIs in parallel
    const [wikipediaResult, googleResult] = await Promise.allSettled([
      this.wikipediaService.searchBooks(query, Math.ceil(maxResults / 2)),
      this.googleBooksService.searchBooks(query, Math.ceil(maxResults / 2))
    ])

    let results = []

    // Add Wikipedia results
    if (wikipediaResult.status === 'fulfilled' && wikipediaResult.value.success) {
      results = results.concat(wikipediaResult.value.data)
      console.log('📚 [UnifiedBooks] Wikipedia results:', wikipediaResult.value.data.length)
    }

    // Add Google Books results
    if (googleResult.status === 'fulfilled' && googleResult.value.success) {
      results = results.concat(googleResult.value.data)
      console.log('📚 [UnifiedBooks] Google Books results:', googleResult.value.data.length)
    }

    // Remove duplicates based on title similarity
    results = this.removeDuplicateResults(results)
    
    // Limit to maxResults
    results = results.slice(0, maxResults)

    console.log('📚 [UnifiedBooks] Combined results:', results.length)
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
