import axios from 'axios'
import { API_CONFIG } from '@/config/api'
import { createSecureFetch, logSecurityInfo } from '@/config/security'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true, // Enable credentials for CORS
  timeout: 15000 // 15 second timeout for production
})

// Add a health check function
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${API_CONFIG.API_BASE_URL}/debug/health`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    })
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}


// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  
  console.log('🔍 API Request Debug:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    headers: config.headers
  })
  
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
      // Only clear auth data if it's an actual auth error, not a validation error
      // Check if the error is from the /user endpoint (token validation)
      if (error.config?.url?.includes('/user')) {
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
    try {
      const response = await api.post('/login', { email, password })
      return response.data
    } catch (error) {
      // Check if it's a server error (500)
      if (error.response?.status === 500) {
        let errorMessage = 'Server-Fehler (500). Bitte versuchen Sie es später erneut.'
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = `Server-Fehler: ${error.response.data}`
          } else if (error.response.data.message) {
            errorMessage = `Server-Fehler: ${error.response.data.message}`
          } else if (error.response.data.error) {
            errorMessage = `Server-Fehler: ${error.response.data.error}`
          }
        }
        throw new Error(errorMessage)
      }
      
      // Check if it's a network error
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        throw new Error('Server ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Administrator.')
      }
      
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Server antwortet nicht. Bitte versuchen Sie es später erneut.')
      }
      
      // For other errors, re-throw with original message
      throw error
    }
  },

  async register(name, username, email, password, passwordConfirm) {
    try {
      const response = await api.post('/register', { 
        name, 
        username,
        email, 
        password, 
        password_confirmation: passwordConfirm 
      })
      return response.data
    } catch (error) {
      // Check if it's a server error (500)
      if (error.response?.status === 500) {
        let errorMessage = 'Server-Fehler (500). Bitte versuchen Sie es später erneut.'
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = `Server-Fehler: ${error.response.data}`
          } else if (error.response.data.message) {
            errorMessage = `Server-Fehler: ${error.response.data.message}`
          } else if (error.response.data.error) {
            errorMessage = `Server-Fehler: ${error.response.data.error}`
          }
        }
        throw new Error(errorMessage)
      }
      
      // Check if it's a network error
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        throw new Error('Server ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Administrator.')
      }
      
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Server antwortet nicht. Bitte versuchen Sie es später erneut.')
      }
      
      // For other errors, re-throw with original message
      throw error
    }
  },

  async logout() {
    const response = await api.post('/logout')
    return response.data
  },

  async validateToken(token) {
    const response = await api.get('/user', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  async adminSetup() {
    try {
      const response = await api.post('/admin-setup')
      return response.data
    } catch (error) {
      // Check if it's a server error (500)
      if (error.response?.status === 500) {
        let errorMessage = 'Server-Fehler (500). Bitte versuchen Sie es später erneut.'
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = `Server-Fehler: ${error.response.data}`
          } else if (error.response.data.message) {
            errorMessage = `Server-Fehler: ${error.response.data.message}`
          } else if (error.response.data.error) {
            errorMessage = `Server-Fehler: ${error.response.data.error}`
          }
        }
        throw new Error(errorMessage)
      }
      
      // Check if it's a network error
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        throw new Error('Server ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Administrator.')
      }
      
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Server antwortet nicht. Bitte versuchen Sie es später erneut.')
      }
      
      // For other errors, re-throw with original message
      throw error
    }
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
      const response = await api.get('/media')
      console.log('API - getMedia response:', response.data)
      if (response.data && response.data.length > 0) {
        console.log('API - first item rating:', response.data[0].rating)
      }
      return response.data
    } catch (error) {
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
      const response = await api.post('/fetch-api', { title, category })
      const data = response.data
      
      // Ensure image URLs use HTTPS
      if (data.success && data.data && data.data.path) {
        data.data.path = data.data.path.startsWith('http://') ? data.data.path.replace('http://', 'https://') : data.data.path
      }
      
      return data
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  async searchApi(title, category, limit = 10) {
    try {
      const response = await api.get('/search', { 
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
      return []
    }
  },


  async deleteMediaItem(id) {
    try {
      const response = await api.delete(`/media/${id}`)
      return response.data
    } catch (error) {
      // Handle 404 - item doesn't exist, which is fine for delete operations
      if (error.response?.status === 404) {
        // Don't log 404 errors to console - they're expected for delete operations
        const notFoundError = new Error(`Media item with ID ${id} not found`)
        notFoundError.response = error.response
        notFoundError.isNotFound = true // Add flag to identify 404 errors
        notFoundError.silent = true // Mark as silent error
        throw notFoundError
      }
      
      // Log other errors
      console.error('Delete API error:', error)
      
      // Provide more specific error messages for other errors
      if (error.response?.status === 403) {
        const forbiddenError = new Error('You do not have permission to delete this item')
        forbiddenError.response = error.response
        throw forbiddenError
      }
      
      throw error
    }
  },

  async checkExistingItems(items) {
    try {
      console.log('🔍 DEBUG: Checking existing items:', items)
      const response = await api.post('/media/check-existing', { items })
      console.log('🔍 DEBUG: Check existing response:', response.data)
      return response.data
    } catch (error) {
      console.error('🔍 DEBUG: Check existing error:', error)
      throw error
    }
  },

  async batchAddMediaItems(items) {
    try {
      console.log('🔍 DEBUG: Attempting batch add with items:', items)
      const response = await api.post('/media/batch-add', { items })
      console.log('🔍 DEBUG: Batch add response:', response.data)
      return response.data
    } catch (error) {
      console.error('🔍 DEBUG: Batch add error:', error)
      throw error
    }
  },

  async batchDeleteMediaItems(ids) {
    try {
      const response = await api.post('/media/batch-delete', { ids })
      return response.data
    } catch (error) {
      // Handle 404 - some items might not exist, which is fine for delete operations
      if (error.response?.status === 404) {
        const notFoundError = new Error('Some items were not found and could not be deleted')
        notFoundError.response = error.response
        notFoundError.isNotFound = true
        notFoundError.silent = true // Mark as silent error
        throw notFoundError
      }
      
      // Handle 400 - validation errors (e.g., invalid IDs)
      if (error.response?.status === 400) {
        const validationError = new Error('Invalid item IDs provided for deletion')
        validationError.response = error.response
        throw validationError
      }
      
      // Handle 403 - permission errors
      if (error.response?.status === 403) {
        const forbiddenError = new Error('You do not have permission to delete these items')
        forbiddenError.response = error.response
        throw forbiddenError
      }
      
      // Log other errors
      console.error('Batch delete API error:', error)
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
      if (itemData.apiRating) {
        transformedData.api_rating = Math.round(itemData.apiRating)
      }
      if (itemData.personalRating) {
        transformedData.personal_rating = Math.round(itemData.personalRating)
      }
      if (itemData.platforms) {
        transformedData.platforms = itemData.platforms
      }
      if (itemData.genre) {
        transformedData.genre = itemData.genre
      }
      if (itemData.description) {
        transformedData.description = itemData.description
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
      if (itemData.extra_link) {
        transformedData.extra_link = itemData.extra_link
      }
      
      
      const response = await api.post('/media', transformedData)
      return response.data
    } catch (error) {
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
      // Handle rating - prioritize personal rating over API rating
      if (itemData.personalRating !== undefined && itemData.personalRating !== null) {
        // Use personal rating as the main rating since that's what the user sets
        transformedData.rating = itemData.personalRating ? Math.round(itemData.personalRating) : null
      } else if (itemData.rating !== undefined && itemData.rating !== null) {
        // Use rating if personalRating is not set
        transformedData.rating = itemData.rating ? Math.round(itemData.rating) : null
      } else if (itemData.apiRating !== undefined) {
        transformedData.rating = itemData.apiRating ? Math.round(itemData.apiRating) : null
      }
      if (itemData.platforms !== undefined) {
        transformedData.platforms = itemData.platforms
      }
      if (itemData.genre !== undefined) {
        transformedData.genre = itemData.genre
      }
      if (itemData.description !== undefined) {
        transformedData.description = itemData.description
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
      if (itemData.imageUrl !== undefined) {
        // Only send image_url if it's not null (null means "don't update this field")
        if (itemData.imageUrl !== null) {
          transformedData.image_url = itemData.imageUrl
        }
      }
      if (itemData.path !== undefined) {
        // Only send path if it's not null (null means "don't update this field")
        if (itemData.path !== null) {
          transformedData.path = itemData.path
        }
      }
      if (itemData.extra_link !== undefined) {
        // Only send extra_link if it's not null (null means "don't update this field")
        if (itemData.extra_link !== null) {
          transformedData.extra_link = itemData.extra_link
        }
      }
      
      console.log('API - updateMediaItem transformedData:', transformedData)
      console.log('API - rating in transformedData:', transformedData.rating)
      const response = await api.put(`/media/${id}`, transformedData)
      console.log('API - update response:', response.data)
      console.log('API - response data rating:', response.data.data?.rating)
      return response.data
    } catch (error) {
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
      
      const response = await api.post('/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Download image from URL
  async downloadImageFromUrl(url, path) {
    try {
      const response = await api.post('/download-image', { url, path })
      return response.data
    } catch (error) {
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

