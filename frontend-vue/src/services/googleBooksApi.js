// Google Books API Service with maximum debugging
import { API_CONFIG } from '@/config/api'

let GOOGLE_BOOKS_API_KEY = null
let GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1'

class GoogleBooksApi {
  constructor() {
    this.initializeConfig()
  }

  // Initialize API configuration from backend
  async initializeConfig() {
    try {
      const baseUrl = API_CONFIG.BASE_URL
      const response = await fetch(`${baseUrl}/api/google-books-config`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      const config = await response.json()
      
      GOOGLE_BOOKS_API_KEY = config.api_key
      GOOGLE_BOOKS_BASE_URL = config.base_url
    } catch (error) {
      console.error('Failed to load Google Books API config:', error)
    }
  }

  // Search books
  async searchBooks(query, maxResults = 10) {
    if (!query || query.trim().length === 0) {
      return { success: false, error: 'Query cannot be empty' }
    }

    // Try backend API first
    try {
      const baseUrl = API_CONFIG.BASE_URL
      const response = await fetch(`${baseUrl}/api/google-books/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
      
      if (response.ok) {
        const data = await response.json()
        return data
      } else {
        // If backend fails, try direct API call
        return await this.tryDirectApiCall(query, maxResults)
      }
    } catch (error) {
      // If backend fails, try direct API call
      return await this.tryDirectApiCall(query, maxResults)
    }
  }

  // Try direct API call as fallback
  async tryDirectApiCall(query, maxResults) {
    // Wait for API key to be loaded if not already loaded
    if (!GOOGLE_BOOKS_API_KEY) {
      await this.initializeConfig()
    }

    // Check if API key is available
    if (!GOOGLE_BOOKS_API_KEY) {
      return this.getFallbackResults(query)
    }

    try {
      const url = `${GOOGLE_BOOKS_BASE_URL}/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=${maxResults}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // Return fallback results instead of error
        return this.getFallbackResults(query)
      }

      const data = await response.json()

      return {
        success: true,
        data: this.formatBooksData(data.items || []),
        totalItems: data.totalItems || 0
      }

    } catch (error) {
      // Return fallback results instead of error
      return this.getFallbackResults(query)
    }
  }

  // Fallback results when API is not available
  getFallbackResults(query) {
    
    // Generate some sample book suggestions based on the query
    const fallbackBooks = [
      {
        id: 'fallback-1',
        title: `${query} - Sample Book 1`,
        authors: ['Unknown Author'],
        author: 'Unknown Author',
        description: 'This is a sample book result. Please fill in the details manually.',
        publishedDate: '2020-01-01',
        publisher: 'Sample Publisher',
        pageCount: 300,
        categories: ['Fiction'],
        language: 'en',
        isbn10: null,
        isbn13: null,
        imageUrl: null,
        previewLink: null,
        infoLink: null,
        canonicalVolumeLink: null
      },
      {
        id: 'fallback-2',
        title: `${query} - Sample Book 2`,
        authors: ['Another Author'],
        author: 'Another Author',
        description: 'Another sample book result. Please fill in the details manually.',
        publishedDate: '2021-01-01',
        publisher: 'Another Publisher',
        pageCount: 250,
        categories: ['Non-Fiction'],
        language: 'en',
        isbn10: null,
        isbn13: null,
        imageUrl: null,
        previewLink: null,
        infoLink: null,
        canonicalVolumeLink: null
      }
    ]

    return {
      success: true,
      data: fallbackBooks,
      totalItems: fallbackBooks.length,
      fallback: true
    }
  }

  // Format books data for our application
  formatBooksData(items) {
    return items.map((item, index) => {
      const volumeInfo = item.volumeInfo || {}
      const imageLinks = volumeInfo.imageLinks || {}
      
      const formattedBook = {
        id: item.id,
        title: volumeInfo.title || 'Unknown Title',
        authors: volumeInfo.authors || [],
        author: volumeInfo.authors ? volumeInfo.authors.join(', ') : '',
        description: volumeInfo.description || '',
        publishedDate: volumeInfo.publishedDate || '',
        publisher: volumeInfo.publisher || '',
        pageCount: volumeInfo.pageCount || null,
        categories: volumeInfo.categories || [],
        language: volumeInfo.language || '',
        isbn10: this.extractISBN(item.volumeInfo?.industryIdentifiers, 'ISBN_10'),
        isbn13: this.extractISBN(item.volumeInfo?.industryIdentifiers, 'ISBN_13'),
        imageUrl: imageLinks.thumbnail || imageLinks.smallThumbnail || null,
        previewLink: volumeInfo.previewLink || null,
        infoLink: volumeInfo.infoLink || null,
        canonicalVolumeLink: volumeInfo.canonicalVolumeLink || null
      }

      return formattedBook
    })
  }

  // Extract ISBN from industry identifiers
  extractISBN(identifiers, type) {
    if (!identifiers || !Array.isArray(identifiers)) return null
    
    const identifier = identifiers.find(id => id.type === type)
    return identifier ? identifier.identifier : null
  }

  // Get book details by ID
  async getBookDetails(bookId) {
    if (!bookId) {
      return { success: false, error: 'Book ID is required' }
    }

    if (!GOOGLE_BOOKS_API_KEY) {
      return { success: false, error: 'Google Books API key not configured' }
    }

    try {
      const url = `${GOOGLE_BOOKS_BASE_URL}/volumes/${bookId}?key=${GOOGLE_BOOKS_API_KEY}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { 
          success: false, 
          error: `Google Books API error: ${response.status} ${response.statusText}`,
          details: errorText
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: this.formatBooksData([data])[0]
      }

    } catch (error) {
      return { 
        success: false, 
        error: `Network error: ${error.message}` 
      }
    }
  }
}

// Create singleton instance
const googleBooksApi = new GoogleBooksApi()

export default googleBooksApi
