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
      
      return { success: true }
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
      console.error('Logout API call failed:', err)
    } finally {
      // Clear local data regardless of API call result
      token.value = null
      user.value = null
      localStorage.removeItem('authToken')
      localStorage.removeItem('currentUser')
    }
  }

  async function validateToken() {
    if (!token.value) return false
    
    try {
      const response = await authApi.validateToken(token.value)
      user.value = response
      return true
    } catch (err) {
      console.error('Token validation failed:', err)
      await logout()
      return false
    }
  }

  async function initializeAuth() {
    // Load user from localStorage
    const savedUser = localStorage.getItem('currentUser')
    
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (err) {
        console.error('Failed to parse saved user data:', err)
        await logout()
        return
      }
    }
    
    // Validate token with server
    if (token.value) {
      await validateToken()
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
    
    // Actions
    login,
    register,
    logout,
    validateToken,
    initializeAuth,
    clearError
  }
})

