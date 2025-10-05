import { APP_CONFIG } from '@/config/environment'

/**
 * Wikipedia API Service for searching books and literature
 * Uses Wikipedia's search API and content API to find book information
 */
class WikipediaApiService {
  constructor() {
    this.baseUrl = 'https://en.wikipedia.org/w/api.php'
    this.timeout = 10000
    this.maxResults = 10
  }

  /**
   * Search for books using Wikipedia API
   * @param {string} query - Search query (book title, author, etc.)
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @returns {Promise<Object>} Search results
   */
  async searchBooks(query, maxResults = 10) {
    console.log('📚 [Wikipedia] Searching books:', { query, maxResults })

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.warn('📚 [Wikipedia] Invalid query provided')
      return {
        success: false,
        error: 'Search query is required',
        data: []
      }
    }

    try {
      // First, search for pages related to the query
      const searchResults = await this.searchPages(query, maxResults)
      
      if (!searchResults.success || searchResults.data.length === 0) {
        return {
          success: false,
          error: 'No results found',
          data: []
        }
      }

      // Get detailed information for each page
      const detailedResults = await this.getPageDetails(searchResults.data)
      
      // Filter and format results for books
      const bookResults = this.filterAndFormatBookResults(detailedResults)

      console.log('📚 [Wikipedia] Search completed:', {
        totalResults: detailedResults.length,
        bookResults: bookResults.length
      })

      return {
        success: true,
        data: bookResults,
        source: 'wikipedia'
      }

    } catch (error) {
      console.error('📚 [Wikipedia] Search failed:', error)
      return {
        success: false,
        error: `Search failed: ${error.message}`,
        data: []
      }
    }
  }

  /**
   * Search for Wikipedia pages
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Object>} Search results
   */
  async searchPages(query, maxResults) {
    const searchParams = new URLSearchParams({
      action: 'query',
      format: 'json',
      list: 'search',
      srsearch: `${query} book novel`,
      srnamespace: 0,
      srlimit: maxResults,
      srprop: 'snippet|timestamp',
      origin: '*'
    })

    try {
      const response = await fetch(`${this.baseUrl}?${searchParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.info || 'Wikipedia API error')
      }

      const results = data.query?.search || []
      
      return {
        success: true,
        data: results.map(result => ({
          pageid: result.pageid,
          title: result.title,
          snippet: result.snippet,
          timestamp: result.timestamp
        }))
      }

    } catch (error) {
      console.error('📚 [Wikipedia] Page search failed:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }

  /**
   * Get detailed information for Wikipedia pages
   * @param {Array} pages - Array of page objects with pageid and title
   * @returns {Promise<Array>} Detailed page information
   */
  async getPageDetails(pages) {
    if (!pages || pages.length === 0) return []

    const pageIds = pages.map(page => page.pageid).join('|')

    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      pageids: pageIds,
      prop: 'extracts|pageimages|info',
      exintro: 'true',
      explaintext: 'true',
      exsectionformat: 'plain',
      piprop: 'thumbnail|original',
      pithumbsize: 300,
      pilimit: 1,
      inprop: 'url',
      origin: '*'
    })

    try {
      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.info || 'Wikipedia API error')
      }

      const pages = data.query?.pages || {}
      return Object.values(pages).map(page => ({
        pageid: page.pageid,
        title: page.title,
        extract: page.extract || '',
        thumbnail: page.thumbnail?.source || null,
        fullurl: page.fullurl || null,
        canonicalurl: page.canonicalurl || null
      }))

    } catch (error) {
      console.error('📚 [Wikipedia] Page details failed:', error)
      return []
    }
  }

  /**
   * Filter and format results to focus on books
   * @param {Array} pages - Array of page details
   * @returns {Array} Formatted book results
   */
  filterAndFormatBookResults(pages) {
    const bookKeywords = [
      'book', 'novel', 'fiction', 'non-fiction', 'author', 'published', 
      'publisher', 'isbn', 'literature', 'story', 'chapter', 'edition',
      'written by', 'series', 'trilogy', 'saga', 'collection', 'anthology'
    ]

    return pages
      .filter(page => {
        const content = (page.extract || '').toLowerCase()
        const title = (page.title || '').toLowerCase()
        
        // Check if content or title contains book-related keywords
        const hasBookKeywords = bookKeywords.some(keyword => 
          content.includes(keyword) || title.includes(keyword)
        )
        
        // Also check if title looks like a book title (contains common book words)
        const bookTitleWords = ['book', 'novel', 'story', 'tale', 'chronicles', 'saga', 'trilogy']
        const hasBookTitleWords = bookTitleWords.some(word => title.includes(word))
        
        return hasBookKeywords || hasBookTitleWords
      })
      .map(page => {
        // Extract book information from the extract
        const extract = page.extract || ''
        const title = page.title || ''
        
        // Try to extract author, publication year, etc. from the extract
        const authorMatch = extract.match(/written by[^,.\n]*?([A-Z][^,.\n]*?[A-Z][^,.\n]*?)(?:\s|\.|,|$)/i)
        const yearMatch = extract.match(/(\d{4})/)
        const publisherMatch = extract.match(/(?:published by|publisher)\s+([^,.\n]+)/i)
        
        // Clean up author name - improved approach
        let cleanAuthor = ''
        if (authorMatch) {
          const rawAuthor = authorMatch[1].trim()
          // Remove common prefixes and get the actual name
          cleanAuthor = rawAuthor.replace(/^(British|American|German|French|Spanish|Italian)\s+(?:author|writer|novelist)?\s*/i, '')
          // If still contains "author" or similar, try to extract the name part
          if (cleanAuthor.includes('author') || cleanAuthor.includes('writer')) {
            const nameMatch = cleanAuthor.match(/([A-Z][^,.\n]*?[A-Z][^,.\n]*?)(?:\s|\.|,|$)/)
            cleanAuthor = nameMatch ? nameMatch[1].trim() : cleanAuthor
          }
        }
        
        // If no author found with the first pattern, try alternative patterns
        if (!cleanAuthor) {
          const altAuthorMatch = extract.match(/(?:by|author|written by)\s+([A-Z][^,.\n]*?[A-Z][^,.\n]*?)(?:\s|\.|,|$)/i)
          if (altAuthorMatch) {
            cleanAuthor = altAuthorMatch[1].trim()
              .replace(/^(British|American|German|French|Spanish|Italian)\s+(?:author|writer|novelist)?\s*/i, '')
          }
        }
        
        return {
          id: `wikipedia_${page.pageid}`,
          title: title,
          author: cleanAuthor,
          description: extract.substring(0, 300) + (extract.length > 300 ? '...' : ''),
          publishedDate: yearMatch ? yearMatch[1] : '',
          publisher: publisherMatch ? publisherMatch[1].trim() : '',
          imageUrl: page.thumbnail || null,
          link: page.fullurl || page.canonicalurl || '',
          apiSource: 'wikipedia',
          snippet: extract.substring(0, 150) + (extract.length > 150 ? '...' : ''),
          categories: this.extractCategories(extract)
        }
      })
      .slice(0, this.maxResults) // Limit results
  }

  /**
   * Extract categories from Wikipedia extract
   * @param {string} extract - Page extract text
   * @returns {Array} Array of categories
   */
  extractCategories(extract) {
    const categories = []
    const text = extract.toLowerCase()
    
    if (text.includes('fiction')) categories.push('Fiction')
    if (text.includes('non-fiction') || text.includes('nonfiction')) categories.push('Non-Fiction')
    if (text.includes('novel')) categories.push('Novel')
    if (text.includes('biography')) categories.push('Biography')
    if (text.includes('history')) categories.push('History')
    if (text.includes('science')) categories.push('Science')
    if (text.includes('philosophy')) categories.push('Philosophy')
    if (text.includes('poetry')) categories.push('Poetry')
    if (text.includes('drama')) categories.push('Drama')
    if (text.includes('mystery')) categories.push('Mystery')
    if (text.includes('romance')) categories.push('Romance')
    if (text.includes('fantasy')) categories.push('Fantasy')
    if (text.includes('science fiction') || text.includes('sci-fi')) categories.push('Science Fiction')
    if (text.includes('thriller')) categories.push('Thriller')
    if (text.includes('horror')) categories.push('Horror')
    
    return categories
  }

  /**
   * Get book information by Wikipedia page ID
   * @param {string} pageId - Wikipedia page ID
   * @returns {Promise<Object>} Book information
   */
  async getBookById(pageId) {
    try {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        pageids: pageId,
        prop: 'extracts|pageimages|info',
        exintro: 'true',
        explaintext: 'true',
        piprop: 'thumbnail',
        pithumbsize: 300,
        inprop: 'url',
        origin: '*'
      })

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const page = Object.values(data.query?.pages || {})[0]
      
      if (!page) {
        throw new Error('Page not found')
      }

      return {
        success: true,
        data: {
          id: `wikipedia_${page.pageid}`,
          title: page.title,
          description: page.extract || '',
          imageUrl: page.thumbnail?.source || null,
          link: page.fullurl || page.canonicalurl || '',
          apiSource: 'wikipedia'
        }
      }

    } catch (error) {
      console.error('📚 [Wikipedia] Get book by ID failed:', error)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  }
}

// Create and export singleton instance
export const wikipediaApiService = new WikipediaApiService()
export default wikipediaApiService
