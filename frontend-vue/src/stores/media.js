import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mediaApi } from '@/services/api'
import realtimeService from '@/services/realtime'

export const useMediaStore = defineStore('media', () => {
  // State
  const mediaData = ref(loadMediaFromStorage())
  const currentCategory = ref('game')
  const searchQuery = ref('')
  const activeFilters = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Load media from localStorage on initialization
  function loadMediaFromStorage() {
    try {
      // Only load from localStorage if user is not logged in
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (!token || !user) {
        const saved = localStorage.getItem('mediaData')
        return saved ? JSON.parse(saved) : []
      }
      
      // For logged in users, don't load from localStorage
      return []
    } catch (err) {
      console.error('Failed to load media from storage:', err)
      return []
    }
  }

  // Save media to localStorage
  function saveMediaToStorage() {
    try {
      // Only save to localStorage if user is not logged in
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (!token || !user) {
        localStorage.setItem('mediaData', JSON.stringify(mediaData.value))
      }
    } catch (err) {
      console.error('Failed to save media to storage:', err)
    }
  }

  // Getters
  const totalItems = computed(() => mediaData.value.length)
  
  const categoryCounts = computed(() => {
    const counts = {}
    mediaData.value.forEach(item => {
      const category = item.category || 'unknown'
      counts[category] = (counts[category] || 0) + 1
    })
    return counts
  })

  const filteredMedia = computed(() => {
    let filtered = [...mediaData.value]

    // Filter by category
    if (currentCategory.value && currentCategory.value !== 'all') {
      filtered = filtered.filter(item => {
        // For watchlist, show items that are marked as new or in watchlist category
        if (currentCategory.value === 'watchlist') {
          return item.category === 'watchlist' || item.isNew === true
        }
        return item.category === currentCategory.value
      })
    }

    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.genre?.toLowerCase().includes(query) ||
        item.platforms?.toLowerCase().includes(query)
      )
    }

    // Apply active filters
    activeFilters.value.forEach(filter => {
      if (filter.type === 'platform') {
        filtered = filtered.filter(item => 
          item.platforms?.toLowerCase().includes(filter.value.toLowerCase())
        )
      } else if (filter.type === 'genre') {
        filtered = filtered.filter(item => 
          item.genre?.toLowerCase().includes(filter.value.toLowerCase())
        )
      } else if (filter.type === 'airing') {
        if (filter.value === 'airing') {
          filtered = filtered.filter(item => item.isAiring === true)
        } else if (filter.value === 'finished') {
          filtered = filtered.filter(item => item.isAiring === false || item.isAiring === null)
        }
      }
    })

    return filtered
  })

  // Extract unique platforms from media data
  const platforms = computed(() => {
    const platformSet = new Set()
    mediaData.value.forEach(item => {
      if (item.platforms) {
        // Split by common separators and clean up
        const platformList = item.platforms
          .split(/[,;|&]/)
          .map(p => p.trim())
          .filter(p => p.length > 0)
        platformList.forEach(platform => platformSet.add(platform))
      }
    })
    return Array.from(platformSet).sort()
  })

  // Extract unique genres from media data
  const genres = computed(() => {
    const genreSet = new Set()
    mediaData.value.forEach(item => {
      if (item.genre) {
        // Split by common separators and clean up
        const genreList = item.genre
          .split(/[,;|&]/)
          .map(g => g.trim())
          .filter(g => g.length > 0)
        genreList.forEach(genre => genreSet.add(genre))
      }
    })
    return Array.from(genreSet).sort()
  })

  // Actions
  async function loadMedia() {
    loading.value = true
    error.value = null
    
    try {
      // Check if user is logged in
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (token && user) {
        try {
          // For logged in users, only load from API
          const data = await mediaApi.getMedia()
          mediaData.value = data || []
          
        } catch (apiError) {
          console.warn('API load failed for logged in user:', apiError)
          // Clear data for logged in users if API fails
          mediaData.value = []
        }
      } else {
        // For non-logged in users, use local storage or demo data
        const localData = loadMediaFromStorage()
        if (localData.length > 0) {
          mediaData.value = localData
        } else {
          // Load demo data if no local data exists
          const demoData = await mediaApi.getMedia()
          mediaData.value = demoData || []
          saveMediaToStorage()
        }
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load media data'
      console.error('Failed to load media:', err)
    } finally {
      loading.value = false
    }
  }



  function setCategory(category) {
    currentCategory.value = category
  }

  function setSearchQuery(query) {
    searchQuery.value = query
  }

  function addFilter(filter) {
    const exists = activeFilters.value.some(f => 
      f.type === filter.type && f.value === filter.value
    )
    if (!exists) {
      activeFilters.value.push(filter)
    }
  }

  function removeFilter(filter) {
    activeFilters.value = activeFilters.value.filter(f => 
      !(f.type === filter.type && f.value === filter.value)
    )
  }

  function clearFilters() {
    activeFilters.value = []
  }

  function clearError() {
    error.value = null
  }

  async function addMediaItem(itemData) {
    // Clear any existing error when starting a new save operation
    error.value = null
    
    try {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (token && user) {
        // For logged in users, save via API only
        try {
          const newItem = await mediaApi.addMediaItem(itemData)
          // Reload data from API to get the correct ID and data
          await loadMedia()
          return newItem
        } catch (apiError) {
          // Handle duplicate error specifically - don't set error in store
          if (apiError.response?.status === 409 && apiError.response?.data?.duplicate) {
            const duplicateError = new Error(apiError.response.data.error || 'Ein Eintrag mit diesem Titel und dieser Kategorie existiert bereits.')
            duplicateError.isDuplicate = true
            throw duplicateError
          }
          
          // For other errors, set error in store and log
          error.value = apiError.message || 'Failed to add media item'
          console.error('API save failed for logged in user:', apiError)
          throw apiError
        }
      } else {
        // For non-logged in users, save locally
        const newItem = {
          id: Date.now(), // Simple ID generation
          ...itemData,
          __order: mediaData.value.length
        }
        
        mediaData.value.push(newItem)
        saveMediaToStorage()
        
        return newItem
      }
    } catch (err) {
      // Re-throw the error - error handling is done in the specific API catch blocks
      throw err
    }
  }

  async function updateMediaItem(id, itemData) {
    // Clear any existing error when starting a new update operation
    error.value = null
    
    try {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (token && user) {
        // For logged in users, update via API only
        try {
          const updatedItem = await mediaApi.updateMediaItem(id, itemData)
          // Reload data from API
          await loadMedia()
          return updatedItem
        } catch (apiError) {
          console.error('API update failed for logged in user:', apiError)
          throw apiError
        }
      } else {
        // For non-logged in users, update locally
        const index = mediaData.value.findIndex(item => item.id === id)
        if (index !== -1) {
          mediaData.value[index] = { ...mediaData.value[index], ...itemData }
          saveMediaToStorage()
          return mediaData.value[index]
        }
        throw new Error('Media item not found')
      }
    } catch (err) {
      // Don't set error for duplicate errors - they should be handled in the modal
      if (!err.isDuplicate) {
        error.value = err.message || 'Failed to update media item'
      }
      throw err
    }
  }

  async function deleteMediaItem(id) {
    try {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (token && user) {
        // For logged in users, delete via API only
        try {
          await mediaApi.deleteMediaItem(id)
          // Reload data from API
          await loadMedia()
          return true
        } catch (apiError) {
          // If it's a 404 error, the item doesn't exist, so we should still refresh the data
          // and consider the deletion successful (item is already gone)
          if (apiError.response?.status === 404 || apiError.isNotFound) {
            // Silent handling - no console output for expected 404s
            await loadMedia()
            return true
          }
          
          // Log other errors
          console.error('API delete failed for logged in user:', apiError)
          throw apiError
        }
      } else {
        // For non-logged in users, delete locally
        const index = mediaData.value.findIndex(item => item.id === id)
        if (index !== -1) {
          mediaData.value.splice(index, 1)
          saveMediaToStorage()
          return true
        }
        throw new Error('Media item not found')
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete media item'
      throw err
    }
  }

  async function batchAddMediaItems(items) {
    try {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (token && user) {
        // For logged in users, add via API only
        try {
          const result = await mediaApi.batchAddMediaItems(items)
          // Reload data from API
          await loadMedia()
          return result
        } catch (apiError) {
          console.error('API batch add failed for logged in user:', apiError)
          throw apiError
        }
      } else {
        // For non-logged in users, add locally
        const newItems = items.map((item, index) => ({
          id: Date.now() + index, // Simple ID generation
          ...item,
          __order: mediaData.value.length + index
        }))
        
        mediaData.value.push(...newItems)
        saveMediaToStorage()
        
        return {
          success: true,
          stats: {
            created: newItems.length,
            failed: 0,
            errors: []
          }
        }
      }
    } catch (err) {
      error.value = err.message || 'Failed to add media items'
      throw err
    }
  }

  async function batchDeleteMediaItems(ids) {
    try {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (token && user) {
        // For logged in users, delete via API only
        try {
          await mediaApi.batchDeleteMediaItems(ids)
          // Reload data from API
          await loadMedia()
          return true
        } catch (apiError) {
          console.error('API batch delete failed for logged in user:', apiError)
          throw apiError
        }
      } else {
        // For non-logged in users, delete locally
        mediaData.value = mediaData.value.filter(item => !ids.includes(item.id))
        saveMediaToStorage()
        return true
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete media items'
      throw err
    }
  }

  async function saveMedia() {
    try {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (token && user) {
        // For logged in users, save via API
        await mediaApi.saveMedia(mediaData.value)
      } else {
        // For non-logged in users, save locally
        saveMediaToStorage()
      }
    } catch (err) {
      console.error('Failed to save media:', err)
      // Don't throw error for save failures to avoid breaking UI
    }
  }

  function clearError() {
    error.value = null
  }

  // Real-time update handlers
  function handleRealtimeUpdate(data) {
    console.log('Processing real-time update:', data)
    
    if (data.type === 'media_updated' && data.items) {
      // Handle polling updates
      data.items.forEach(item => {
        const existingIndex = mediaData.value.findIndex(m => m.id === item.id)
        
        if (existingIndex !== -1) {
          // Update existing item
          mediaData.value[existingIndex] = { ...mediaData.value[existingIndex], ...item }
        } else {
          // Add new item
          mediaData.value.push(item)
        }
      })
    } else if (data.action === 'created' || data.action === 'updated') {
      const item = data.item
      const existingIndex = mediaData.value.findIndex(m => m.id === item.id)
      
      if (existingIndex !== -1) {
        // Update existing item
        mediaData.value[existingIndex] = { ...mediaData.value[existingIndex], ...item }
      } else {
        // Add new item
        mediaData.value.push(item)
      }
    } else if (data.action === 'deleted') {
      // Remove deleted item
      const index = mediaData.value.findIndex(m => m.id === data.id)
      if (index !== -1) {
        mediaData.value.splice(index, 1)
      }
    }
    
    // Save to localStorage for non-logged in users
    saveMediaToStorage()
  }

  function initializeRealtimeUpdates() {
    // Only initialize for authenticated users
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('currentUser')
    
    if (!token || !user) {
      console.log('Skipping realtime initialization - user not authenticated')
      return
    }
    
    try {
      // Add listener for real-time updates
      realtimeService.addListener('media-store', handleRealtimeUpdate)
      
      // Connect to real-time service
      realtimeService.connect()
    } catch (error) {
      console.error('Failed to initialize realtime updates:', error)
    }
  }

  function cleanupRealtimeUpdates() {
    realtimeService.removeListener('media-store')
  }

  return {
    // State
    mediaData,
    currentCategory,
    searchQuery,
    activeFilters,
    loading,
    error,
    
    // Getters
    totalItems,
    categoryCounts,
    filteredMedia,
    platforms,
    genres,
    
    // Actions
    loadMedia,
    setCategory,
    setSearchQuery,
    addFilter,
    removeFilter,
    clearFilters,
    addMediaItem,
    updateMediaItem,
    deleteMediaItem,
    batchAddMediaItems,
    batchDeleteMediaItems,
    saveMedia,
    clearError,
    initializeRealtimeUpdates,
    cleanupRealtimeUpdates
  }
})