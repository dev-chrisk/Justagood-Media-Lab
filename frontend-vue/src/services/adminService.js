import axios from 'axios'
import { API_CONFIG } from '@/config/api'

const API_BASE_URL = API_CONFIG.API_BASE_URL

// Create axios instance with default config
const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Add request interceptor to include auth token
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    console.log('🔧 Admin API Request Debug:')
    console.log('🔧 URL:', config.baseURL + config.url)
    console.log('🔧 Token present:', !!token)
    console.log('🔧 Token value:', token ? token.substring(0, 20) + '...' : 'null')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔧 Authorization header set:', config.headers.Authorization.substring(0, 30) + '...')
    } else {
      console.log('❌ No token found in localStorage')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('🔧 Admin API Response Error:', error.response?.status, error.response?.data)
    
    // Only logout for 401/403 if it's not an admin route
    // Admin routes might return 401/403 for non-admin users, but we don't want to logout
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔧 Admin API got 401/403, but not logging out to preserve session')
      // Don't automatically logout for admin API calls
      // The admin dashboard will handle the error display
    }
    return Promise.reject(error)
  }
)

export const adminApi = {
  // User Management
  async getUsers() {
    const response = await adminApiClient.get('/admin/users')
    return response.data
  },

  async getUserDetails(userId) {
    const response = await adminApiClient.get(`/admin/users/${userId}`)
    return response.data
  },

  async updateUser(userId, userData) {
    const response = await adminApiClient.put(`/admin/users/${userId}`, userData)
    return response.data
  },

  async deleteUser(userId) {
    const response = await adminApiClient.delete(`/admin/users/${userId}`)
    return response.data
  },

  // Statistics
  async getStatistics() {
    const response = await adminApiClient.get('/admin/statistics')
    return response.data
  },

  // User Activity
  async getUserActivity(userId) {
    const response = await adminApiClient.get(`/admin/user-activity/${userId}`)
    return response.data
  },

  // Media Items
  async getAllMediaItems(params = {}) {
    const response = await adminApiClient.get('/admin/media-items', { params })
    return response.data
  },

  // Collections
  async getAllCollections(params = {}) {
    const response = await adminApiClient.get('/admin/collections', { params })
    return response.data
  }
}

export default adminApi