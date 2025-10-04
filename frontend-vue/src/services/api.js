import axios from 'axios'
import { API_CONFIG } from '@/config/api'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// MAXIMUM DEBUGGING
console.log('🚀 API Instance Created:', {
  baseURL: api.defaults.baseURL,
  API_CONFIG: API_CONFIG,
  headers: api.defaults.headers
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  console.log('🔍 API Request:', {
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    method: config.method,
    headers: config.headers,
    data: config.data,
    token: token ? `${token.substring(0, 20)}...` : 'none'
  })
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    return response
  },
  (error) => {
    console.log('❌ API Response Error:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response?.status === 401) {
      // Only clear auth data if it's an actual auth error, not a validation error
      // Check if the error is from the /api/user endpoint (token validation)
      if (error.config?.url?.includes('/api/user')) {
        // Token validation failed, clear auth data
        localStorage.removeItem('authToken')
        localStorage.removeItem('currentUser')
        // Trigger logout in auth store
        window.dispatchEvent(new CustomEvent('auth:logout'))
      }
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
  },

  async adminSetup() {
    const response = await api.post('/api/admin-setup')
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
      const data = response.data
      
      // Ensure image URLs use HTTPS
      if (data.success && data.data && data.data.path) {
        data.data.path = data.data.path.startsWith('http://') ? data.data.path.replace('http://', 'https://') : data.data.path
      }
      
      return data
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
      // Ensure all image URLs use HTTPS
      return response.data.map(item => ({
        ...item,
        image: item.image ? (item.image.startsWith('http://') ? item.image.replace('http://', 'https://') : item.image) : item.image
      }))
    } catch (error) {
      console.error('API search failed:', error)
      return []
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
      // Simple data transformation - just send what we have
      const transformedData = {
        title: itemData.title,
        category: itemData.category,
        count: Math.max(itemData.count || 1, 1)  // Ensure minimum count of 1
      }
      
      // Only add optional fields if they exist and are not empty
      if (itemData.release) {
        transformedData.release = this.formatDateForBackend(itemData.release)
      }
      if (itemData.rating) {
        transformedData.rating = Math.round(itemData.rating)
      }
      if (itemData.platforms) {
        transformedData.platforms = itemData.platforms
      }
      if (itemData.genre) {
        transformedData.genre = itemData.genre
      }
      if (itemData.link) {
        transformedData.link = itemData.link
      }
      if (itemData.path) {
        transformedData.path = itemData.path
      }
      if (itemData.discovered) {
        transformedData.discovered = this.formatDateForBackend(itemData.discovered)
      }
      if (itemData.spielzeit) {
        transformedData.spielzeit = parseInt(itemData.spielzeit)
      }
      if (itemData.isAiring !== undefined) {
        transformedData.is_airing = itemData.isAiring
      }
      if (itemData.nextSeason) {
        transformedData.next_season = parseInt(itemData.nextSeason)
      }
      if (itemData.nextSeasonRelease) {
        transformedData.next_season_release = this.formatDateForBackend(itemData.nextSeasonRelease)
      }
      if (itemData.externalId) {
        transformedData.external_id = itemData.externalId
      }
      if (itemData.watchlistType) {
        transformedData.watchlist_type = itemData.watchlistType
      }
      
      console.log('Sending data to API:', transformedData)
      console.log('User authenticated:', !!localStorage.getItem('authToken'))
      console.log('Current user:', localStorage.getItem('currentUser'))
      
      const response = await api.post('/api/media', transformedData)
      return response.data
    } catch (error) {
      console.error('API add media failed:', error)
      throw error
    }
  },

  async updateMediaItem(id, itemData) {
    try {
      // Simple data transformation - just send what we have
      const transformedData = {}
      
      // Only add fields that are being updated
      if (itemData.title !== undefined) {
        transformedData.title = itemData.title
      }
      if (itemData.category !== undefined) {
        transformedData.category = itemData.category
      }
      if (itemData.count !== undefined) {
        transformedData.count = itemData.count
      }
      if (itemData.release !== undefined) {
        transformedData.release = itemData.release
      }
      if (itemData.rating !== undefined) {
        transformedData.rating = itemData.rating ? Math.round(itemData.rating) : null
      }
      if (itemData.platforms !== undefined) {
        transformedData.platforms = itemData.platforms
      }
      if (itemData.genre !== undefined) {
        transformedData.genre = itemData.genre
      }
      if (itemData.link !== undefined) {
        transformedData.link = itemData.link
      }
      if (itemData.path !== undefined) {
        transformedData.path = itemData.path
      }
      if (itemData.discovered !== undefined) {
        transformedData.discovered = itemData.discovered
      }
      if (itemData.spielzeit !== undefined) {
        transformedData.spielzeit = itemData.spielzeit ? parseInt(itemData.spielzeit) : 0
      }
      if (itemData.isAiring !== undefined) {
        transformedData.is_airing = itemData.isAiring
      }
      if (itemData.nextSeason !== undefined) {
        transformedData.next_season = itemData.nextSeason ? parseInt(itemData.nextSeason) : null
      }
      if (itemData.nextSeasonRelease !== undefined) {
        transformedData.next_season_release = itemData.nextSeasonRelease
      }
      if (itemData.externalId !== undefined) {
        transformedData.external_id = itemData.externalId
      }
      if (itemData.watchlistType !== undefined) {
        transformedData.watchlist_type = itemData.watchlistType
      }
      
      console.log('Updating data to API:', transformedData)
      
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
  },

  // Helper function to format dates for backend
  formatDateForBackend(dateValue) {
    if (!dateValue) return null
    
    // If it's already a valid date string in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue
    }
    
    // If it's just a year (4 digits), convert to YYYY-01-01
    if (typeof dateValue === 'string' && /^\d{4}$/.test(dateValue)) {
      return `${dateValue}-01-01`
    }
    
    // If it's a number (year), convert to YYYY-01-01
    if (typeof dateValue === 'number' && dateValue >= 1900 && dateValue <= 2100) {
      return `${dateValue}-01-01`
    }
    
    // Try to parse as date and format
    try {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    } catch (e) {
      console.warn('Could not parse date:', dateValue)
    }
    
    return null
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

