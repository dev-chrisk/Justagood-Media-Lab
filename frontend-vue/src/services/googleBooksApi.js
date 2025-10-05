// Google Books API Service with maximum debugging
import { API_CONFIG } from '@/config/api'

let GOOGLE_BOOKS_API_KEY = null
let GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1'

class GoogleBooksApi {
  constructor() {
    console.log('📚 Google Books API initialized')
    this.initializeConfig()
  }

  // Initialize API configuration from backend
  async initializeConfig() {
    try {
      console.log('📚 Fetching Google Books API config from backend...')
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
      
      console.log('📚 Google Books API Config loaded:', {
        apiKey: GOOGLE_BOOKS_API_KEY ? `${GOOGLE_BOOKS_API_KEY.substring(0, 10)}...` : 'MISSING',
        baseUrl: GOOGLE_BOOKS_BASE_URL
      })
    } catch (error) {
      console.error('📚 Failed to load Google Books API config:', error)
    }
  }

  // Search books with maximum debugging
  async searchBooks(query, maxResults = 10) {
    console.log('📚 Google Books Search:', {
      query,
      maxResults,
      apiKey: GOOGLE_BOOKS_API_KEY ? `${GOOGLE_BOOKS_API_KEY.substring(0, 10)}...` : 'MISSING'
    })

    if (!query || query.trim().length === 0) {
      console.warn('📚 Google Books Search: Empty query provided')
      return { success: false, error: 'Query cannot be empty' }
    }

    // Try backend API first
    try {
      console.log('📚 Trying backend Google Books API...')
      const baseUrl = API_CONFIG.BASE_URL
      const response = await fetch(`${baseUrl}/api/google-books/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📚 Backend Google Books API Success:', data)
        return data
      } else {
        console.warn('📚 Backend Google Books API failed:', response.status)
        // If backend fails, try direct API call
        return await this.tryDirectApiCall(query, maxResults)
      }
    } catch (error) {
      console.warn('📚 Backend Google Books API error:', error.message)
      // If backend fails, try direct API call
      return await this.tryDirectApiCall(query, maxResults)
    }
  }

  // Try direct API call as fallback
  async tryDirectApiCall(query, maxResults) {
    // Wait for API key to be loaded if not already loaded
    if (!GOOGLE_BOOKS_API_KEY) {
      console.log('📚 Google Books Search: API key not loaded, waiting...')
      await this.initializeConfig()
    }

    // Check if API key is available
    if (!GOOGLE_BOOKS_API_KEY) {
      console.log('📚 Google Books Search: No API key available, using fallback results')
      return this.getFallbackResults(query)
    }

    // Try direct API call
    console.log('📚 Trying direct Google Books API...')

    try {
      const url = `${GOOGLE_BOOKS_BASE_URL}/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=${maxResults}`
      
      console.log('📚 Google Books Request URL:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('📚 Google Books Response Status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('📚 Google Books API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        
        // Return fallback results instead of error
        console.log('📚 Returning fallback results due to API error')
        return this.getFallbackResults(query)
      }

      const data = await response.json()
      console.log('📚 Google Books API Success:', {
        totalItems: data.totalItems,
        itemsCount: data.items ? data.items.length : 0
      })

      return {
        success: true,
        data: this.formatBooksData(data.items || []),
        totalItems: data.totalItems || 0
      }

    } catch (error) {
      console.error('📚 Google Books Search Error:', {
        message: error.message,
        stack: error.stack,
        query
      })
      
      // Return fallback results instead of error
      console.log('📚 Returning fallback results due to network error')
      return this.getFallbackResults(query)
    }
  }

  // Fallback results when API is not available
  getFallbackResults(query) {
    console.log('📚 Generating fallback results for:', query)
    
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
    console.log('📚 Formatting books data:', { itemsCount: items.length })

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

      console.log(`📚 Formatted book ${index + 1}:`, {
        title: formattedBook.title,
        author: formattedBook.author,
        publishedDate: formattedBook.publishedDate,
        imageUrl: formattedBook.imageUrl ? 'Yes' : 'No'
      })

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
    console.log('📚 Google Books Get Details:', { bookId })

    if (!bookId) {
      console.warn('📚 Google Books Get Details: No book ID provided')
      return { success: false, error: 'Book ID is required' }
    }

    if (!GOOGLE_BOOKS_API_KEY) {
      console.error('📚 Google Books Get Details: API key missing')
      return { success: false, error: 'Google Books API key not configured' }
    }

    try {
      const url = `${GOOGLE_BOOKS_BASE_URL}/volumes/${bookId}?key=${GOOGLE_BOOKS_API_KEY}`
      
      console.log('📚 Google Books Details URL:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('📚 Google Books Details Response Status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('📚 Google Books Details Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        return { 
          success: false, 
          error: `Google Books API error: ${response.status} ${response.statusText}`,
          details: errorText
        }
      }

      const data = await response.json()
      console.log('📚 Google Books Details Success:', {
        id: data.id,
        title: data.volumeInfo?.title
      })

      return {
        success: true,
        data: this.formatBooksData([data])[0]
      }

    } catch (error) {
      console.error('📚 Google Books Details Error:', {
        message: error.message,
        stack: error.stack,
        bookId
      })
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
