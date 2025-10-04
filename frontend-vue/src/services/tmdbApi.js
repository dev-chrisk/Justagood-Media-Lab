// TMDB API Service for fetching detailed information including genres
class TmdbApiService {
  constructor() {
    this.apiKey = null
    this.baseUrl = 'https://api.themoviedb.org/3'
  }

  async initializeConfig() {
    try {
      // Try to get config from backend first
      const response = await fetch('/api/tmdb-config', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const config = await response.json()
        this.apiKey = config.api_key
        console.log('🎬 TMDB API initialized with backend key:', this.apiKey ? 'Yes' : 'No')
        return true
      }
    } catch (error) {
      console.log('🎬 TMDB API config from backend failed, trying fallback...')
    }

    // Fallback: Use a public API key or try without key (limited functionality)
    try {
      // For now, we'll use a demo approach - in production you'd want a proper API key
      this.apiKey = null // No API key available
      console.log('🎬 TMDB API initialized without key (limited functionality)')
      return false
    } catch (error) {
      console.error('🎬 TMDB API config failed:', error)
      return false
    }
  }

  async getMovieDetails(tmdbId) {
    if (!this.apiKey) {
      await this.initializeConfig()
    }

    if (!this.apiKey) {
      return { success: false, error: 'TMDB API key not available' }
    }

    try {
      const url = `${this.baseUrl}/movie/${tmdbId}?api_key=${this.apiKey}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: {
          genres: data.genres || [],
          genreNames: data.genres ? data.genres.map(g => g.name).join(', ') : ''
        }
      }
    } catch (error) {
      console.error('🎬 TMDB movie details failed:', error)
      return { success: false, error: error.message }
    }
  }

  async getTvDetails(tmdbId) {
    if (!this.apiKey) {
      await this.initializeConfig()
    }

    if (!this.apiKey) {
      return { success: false, error: 'TMDB API key not available' }
    }

    try {
      const url = `${this.baseUrl}/tv/${tmdbId}?api_key=${this.apiKey}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: {
          genres: data.genres || [],
          genreNames: data.genres ? data.genres.map(g => g.name).join(', ') : ''
        }
      }
    } catch (error) {
      console.error('🎬 TMDB TV details failed:', error)
      return { success: false, error: error.message }
    }
  }

  async getGenresForItem(item) {
    // Extract TMDB ID from the item ID
    const tmdbId = this.extractTmdbId(item.id, item.api_source)
    
    if (!tmdbId) {
      return { success: false, error: 'No TMDB ID found' }
    }

    if (item.api_source === 'tmdb') {
      // Determine if it's a movie or TV show based on the original search category
      // For now, we'll try both and see which one works
      const movieResult = await this.getMovieDetails(tmdbId)
      if (movieResult.success) {
        return movieResult
      }
      
      const tvResult = await this.getTvDetails(tmdbId)
      if (tvResult.success) {
        return tvResult
      }
      
      return { success: false, error: 'Could not fetch details from TMDB' }
    }

    return { success: false, error: 'Not a TMDB item' }
  }

  extractTmdbId(id, apiSource) {
    if (apiSource === 'tmdb') {
      // Extract ID from formats like "tmdb_movie_123" or "tmdb_tv_456"
      const match = id.match(/tmdb_(?:movie|tv)_(\d+)/)
      return match ? match[1] : null
    }
    return null
  }
}

// Create singleton instance
const tmdbApi = new TmdbApiService()

export default tmdbApi
