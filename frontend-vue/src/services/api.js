import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8050',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear auth data
      localStorage.removeItem('authToken')
      localStorage.removeItem('currentUser')
      // Don't reload the page, just clear the auth state
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  async login(email, password) {
    const response = await api.post('/api/login', { email, password })
    return response.data
  },

  async register(name, email, password, passwordConfirm) {
    const response = await api.post('/api/register', { 
      name, 
      email, 
      password, 
      password_confirmation: passwordConfirm 
    })
    return response.data
  },

  async logout() {
    const response = await api.post('/api/logout')
    return response.data
  },

  async validateToken(token) {
    const response = await api.get('/api/user', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}

// Media API - using the same endpoints as the original application
export const mediaApi = {
  async getMedia() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('currentUser')
    
    if (!token || !user) {
      // Return demo data for non-logged in users
      return [
        {
          id: 1,
          title: "Sample Game",
          category: "game",
          release: "2023-01-01",
          rating: 8.5,
          platforms: "PC, PS5",
          genre: "Action, Adventure",
          path: null,
          isNew: false,
          __order: 0
        },
        {
          id: 2,
          title: "Sample Series",
          category: "series",
          release: "2023-02-01",
          rating: 9.0,
          platforms: "Netflix",
          genre: "Drama, Thriller",
          path: null,
          isNew: false,
          isAiring: true,
          nextSeason: 2,
          __order: 1
        },
        {
          id: 3,
          title: "Sample Movie",
          category: "movie",
          release: "2023-03-01",
          rating: 7.5,
          platforms: "Cinema",
          genre: "Comedy, Romance",
          path: null,
          isNew: false,
          __order: 2
        }
      ]
    }
    
    try {
      // Try API for logged in users
      const response = await api.get('/api/media')
      return response.data
    } catch (error) {
      console.error('API Error:', error)
      // Don't fallback to demo data for logged in users - throw the error
      throw error
    }
  },

  async saveMedia(data) {
    const response = await api.post('/media_relative.json', data)
    return response.data
  },

  async fetchApiData(title, category) {
    try {
      const response = await api.post('/api/fetch-api', { title, category })
      return response.data
    } catch (error) {
      console.error('API fetch failed:', error)
      return { success: false, error: error.message }
    }
  },

  async searchApi(title, category, limit = 10) {
    try {
      const response = await api.get('/api/search', { 
        params: { 
          q: title, 
          category: category,
          limit: limit 
        } 
      })
      return response.data
    } catch (error) {
      console.error('API search failed:', error)
      return []
    }
  },

  async checkDuplicates() {
    try {
      const response = await api.get('/api/media/check-duplicates')
      return response.data
    } catch (error) {
      console.error('Duplicate check failed:', error)
      return { success: false, count: 0, duplicates: [] }
    }
  },

  async checkCategoryDuplicates(category) {
    try {
      const response = await api.get(`/api/media/check-duplicates/${category}`)
      return response.data
    } catch (error) {
      console.error('Category duplicate check failed:', error)
      return { success: false, count: 0, duplicates: [] }
    }
  },

  async deleteMediaItem(id) {
    try {
      const response = await api.delete(`/api/media/${id}`)
      return response.data
    } catch (error) {
      console.error('API delete failed:', error)
      throw error
    }
  },

  async batchAddMediaItems(items) {
    try {
      const response = await api.post('/api/media/batch-add', { items })
      return response.data
    } catch (error) {
      console.error('API batch add failed:', error)
      throw error
    }
  },

  async batchDeleteMediaItems(ids) {
    try {
      const response = await api.post('/api/media/batch-delete', { ids })
      return response.data
    } catch (error) {
      console.error('API batch delete failed:', error)
      throw error
    }
  },

  async addMediaItem(itemData) {
    try {
      // Transform data to match backend expectations
      const transformedData = {
        title: itemData.title,
        category: itemData.category,
        watchlist_type: itemData.watchlistType, // Add watchlist type support
        release: itemData.release,
        rating: itemData.rating ? Math.round(itemData.rating) : null, // Convert to integer
        count: itemData.count || 0, // Default to 0 if not provided
        platforms: itemData.platforms,
        genre: itemData.genre,
        link: itemData.link,
        path: itemData.path,
        discovered: itemData.discovered,
        spielzeit: itemData.spielzeit || 0, // Default to 0 if not provided
        is_airing: itemData.isAiring || false, // Default to false if not provided
        next_season: itemData.nextSeason,
        next_season_release: itemData.nextSeasonRelease,
        external_id: itemData.externalId
      }
      
      const response = await api.post('/api/media', transformedData)
      return response.data
    } catch (error) {
      console.error('API add media failed:', error)
      throw error
    }
  },

  async updateMediaItem(id, itemData) {
    try {
      // Transform data to match backend expectations
      const transformedData = {
        title: itemData.title,
        category: itemData.category,
        watchlist_type: itemData.watchlistType, // Add watchlist type support
        release: itemData.release,
        rating: itemData.rating ? Math.round(itemData.rating) : null, // Convert to integer
        count: itemData.count || 0, // Default to 0 if not provided
        platforms: itemData.platforms,
        genre: itemData.genre,
        link: itemData.link,
        path: itemData.path,
        discovered: itemData.discovered,
        spielzeit: itemData.spielzeit || 0, // Default to 0 if not provided
        is_airing: itemData.isAiring || false, // Default to false if not provided
        next_season: itemData.nextSeason,
        next_season_release: itemData.nextSeasonRelease,
        external_id: itemData.externalId
      }
      
      const response = await api.put(`/api/media/${id}`, transformedData)
      return response.data
    } catch (error) {
      console.error('API update media failed:', error)
      throw error
    }
  },

  // Image upload functionality
  async uploadImage(file, customPath = null) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (customPath) {
        formData.append('dst', customPath)
      }
      
      const response = await api.post('/api/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Image upload failed:', error)
      throw error
    }
  },

  // Download image from URL
  async downloadImageFromUrl(url, path) {
    try {
      const response = await api.post('/api/download-image', { url, path })
      return response.data
    } catch (error) {
      console.error('Image download failed:', error)
      throw error
    }
  }
}

// Statistics API
export const statisticsApi = {
  async getStatistics() {
    // This would be a new endpoint for statistics
    // For now, we'll calculate from media data
    return null
  }
}

export default api

