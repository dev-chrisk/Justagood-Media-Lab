import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('authToken') || null)
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.name || '')
  const userEmail = computed(() => user.value?.email || '')
  const isAdmin = computed(() => user.value?.is_admin || false)

  // Actions
  async function login(email, password) {
    loading.value = true
    error.value = null
    
    try {
      const response = await authApi.login(email, password)
      
      token.value = response.token
      user.value = response.user
      
      // Save to localStorage
      localStorage.setItem('authToken', token.value)
      localStorage.setItem('currentUser', JSON.stringify(user.value))
      
      return { 
        success: true, 
        user: response.user, 
        token: response.token
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function register(name, email, password, passwordConfirm) {
    loading.value = true
    error.value = null
    
    try {
      const response = await authApi.register(name, email, password, passwordConfirm)
      
      token.value = response.token
      user.value = response.user
      
      // Save to localStorage
      localStorage.setItem('authToken', token.value)
      localStorage.setItem('currentUser', JSON.stringify(user.value))
      
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await authApi.logout(token.value)
      }
    } catch (err) {
    } finally {
      // Clear local data regardless of API call result
      token.value = null
      user.value = null
      localStorage.removeItem('authToken')
      localStorage.removeItem('currentUser')
      localStorage.removeItem('mediaData') // Clear media data on logout
    }
  }

  async function validateToken() {
    if (!token.value) return false
    
    try {
      const response = await authApi.validateToken(token.value)
      user.value = response
      return true
    } catch (err) {
      await logout()
      return false
    }
  }


  async function initializeAuth() {
    // Load user from localStorage first
    const savedUser = localStorage.getItem('currentUser')
    
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (err) {
        await logout()
        return
      }
    }
    
    // Validate token with server if token exists
    if (token.value) {
      const isValid = await validateToken()
      if (!isValid) {
        // Token is invalid, clear everything
        await logout()
      }
    } else if (savedUser) {
      // If we have user data but no token, clear user data
      await logout()
    }
    
    // Listen for auth logout events from API interceptor
    window.addEventListener('auth:logout', async () => {
      await logout()
    })
  }

  async function adminSetup() {
    loading.value = true
    error.value = null
    
    try {
      const response = await authApi.adminSetup()
      
      if (response.success) {
        token.value = response.token
        user.value = response.user
        
        // Save to localStorage
        localStorage.setItem('authToken', token.value)
        localStorage.setItem('currentUser', JSON.stringify(user.value))
        
        return { 
          success: true, 
          user: response.user, 
          token: response.token
        }
      } else {
        return { 
          success: false, 
          message: response.message,
          admin_count: response.admin_count
        }
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Admin setup failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    token,
    user,
    loading,
    error,
    
    // Getters
    isLoggedIn,
    userName,
    userEmail,
    isAdmin,
    
    // Actions
    login,
    register,
    logout,
    validateToken,
    initializeAuth,
    adminSetup,
    clearError
  }
})

