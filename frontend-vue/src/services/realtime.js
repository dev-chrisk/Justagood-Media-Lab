import { ref } from 'vue'
import { mediaApi } from '@/services/api'
import { API_CONFIG } from '@/config/api'

class RealtimeService {
  constructor() {
    this.isConnected = { value: false }
    this.listeners = new Map()
    this.pollingInterval = null
    this.lastUpdate = null
    this.pollingIntervalMs = 20000 // Poll every 20 seconds
  }

  /**
   * Get API base URL using the central API configuration
   */
  getApiBaseUrl() {
    return API_CONFIG.BASE_URL
  }

  connect() {
    if (this.pollingInterval) {
      return
    }

    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('currentUser')
    
    if (!token || !user) {
      return
    }

    // Starting polling for real-time updates
    this.isConnected.value = true
    this.lastUpdate = new Date()

    // Start polling
    this.pollingInterval = setInterval(() => {
      this.checkForUpdates()
    }, this.pollingIntervalMs)
  }

  async checkForUpdates() {
    try {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (!token || !user) {
        return // Only poll for logged in users
      }

      // Get recent media items - use a simpler approach without since parameter
      // Use the same API URL detection logic as other services
      const apiBaseUrl = this.getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/media`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, disconnect
          this.disconnect()
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data && data.length > 0) {
        // Polling found updates
        
        // Notify all listeners
        this.listeners.forEach((callback, key) => {
          try {
            callback({
              type: 'media_updated',
              items: data,
              count: data.length,
              timestamp: new Date().toISOString()
            })
          } catch (error) {
          }
        })
      }

      this.lastUpdate = new Date()
    } catch (error) {
      // Polling error - will retry on next interval
      // If there's a network error, don't disconnect immediately
      // The service will retry on the next interval
    }
  }

  addListener(key, callback) {
    this.listeners.set(key, callback)
  }

  removeListener(key) {
    this.listeners.delete(key)
  }

  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    this.isConnected.value = false
  }

  // Cleanup when component is unmounted
  destroy() {
    this.disconnect()
    this.listeners.clear()
  }
}

// Create singleton instance
const realtimeService = new RealtimeService()

export default realtimeService
