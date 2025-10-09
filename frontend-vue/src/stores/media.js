import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { mediaApi } from '@/services/api'
import realtimeService from '@/services/realtime'

export const useMediaStore = defineStore('media', () => {
  // Load current category from localStorage
  const loadCurrentCategory = () => {
    try {
      const saved = localStorage.getItem('currentCategory')
      return saved || 'game'
    } catch (err) {
      console.error('Failed to load current category from localStorage:', err)
      return 'game'
    }
  }

  // Save current category to localStorage
  const saveCurrentCategory = (category) => {
    try {
      localStorage.setItem('currentCategory', category)
    } catch (err) {
      console.error('Failed to save current category to localStorage:', err)
    }
  }

  // Load search query from localStorage
  const loadSearchQuery = () => {
    try {
      const saved = localStorage.getItem('searchQuery')
      return saved || ''
    } catch (err) {
      console.error('Failed to load search query from localStorage:', err)
      return ''
    }
  }

  // Save search query to localStorage
  const saveSearchQuery = (query) => {
    try {
      localStorage.setItem('searchQuery', query)
    } catch (err) {
      console.error('Failed to save search query to localStorage:', err)
    }
  }

  // Load active filters from localStorage
  const loadActiveFilters = () => {
    try {
      const saved = localStorage.getItem('activeFilters')
      return saved ? JSON.parse(saved) : []
    } catch (err) {
      console.error('Failed to load active filters from localStorage:', err)
      return []
    }
  }

  // Save active filters to localStorage
  const saveActiveFilters = (filters) => {
    try {
      localStorage.setItem('activeFilters', JSON.stringify(filters))
    } catch (err) {
      console.error('Failed to save active filters to localStorage:', err)
    }
  }

  // State
  const mediaData = ref(loadMediaFromStorage())
  const currentCategory = ref(loadCurrentCategory())
  const searchQuery = ref(loadSearchQuery())
  const activeFilters = ref(loadActiveFilters())
  const filtersEnabled = ref(true) // New state for filter toggle
  const loading = ref(false)
  const error = ref(null)

  // Watch for changes and persist to localStorage
  watch(currentCategory, (newValue) => {
    saveCurrentCategory(newValue)
  }, { immediate: false })

  watch(searchQuery, (newValue) => {
    saveSearchQuery(newValue)
  }, { immediate: false })

  watch(activeFilters, (newValue) => {
    saveActiveFilters(newValue)
  }, { immediate: false, deep: true })

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
    
    // Debug logging
    console.log('🔍 FILTER DEBUG: Total media items:', mediaData.value.length)
    console.log('🔍 FILTER DEBUG: Current category:', currentCategory.value)
    console.log('🔍 FILTER DEBUG: Search query:', searchQuery.value)
    console.log('🔍 FILTER DEBUG: Active filters:', activeFilters.value)
    console.log('🔍 FILTER DEBUG: Filters enabled:', filtersEnabled.value)
    console.log('🔍 FILTER DEBUG: Raw media data:', mediaData.value)

    // Filter by category
    if (currentCategory.value && currentCategory.value !== 'all') {
      const beforeFilter = filtered.length
      filtered = filtered.filter(item => {
        // For watchlist, show items that are marked as new or in watchlist category
        if (currentCategory.value === 'watchlist') {
          return item.category === 'watchlist' || item.isNew === true
        }
        // Debug: Log each item's category for comparison
        console.log('🔍 CATEGORY DEBUG: Item title:', item.title, 'Item category:', item.category, 'Current category:', currentCategory.value, 'Match:', item.category === currentCategory.value)
        return item.category === currentCategory.value
      })
      console.log('🔍 FILTER DEBUG: After category filter:', filtered.length, 'items (was', beforeFilter, ')')
      
      // If no items match the category, show all items as fallback
      if (filtered.length === 0 && beforeFilter > 0) {
        console.log('🔍 FALLBACK: No items match category, showing all items')
        filtered = [...mediaData.value]
      }
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
      console.log('🔍 FILTER DEBUG: After search filter:', filtered.length, 'items')
    }

    // Apply active filters only if filters are enabled
    if (filtersEnabled.value) {
      console.log('🔍 FILTER DEBUG: Applying active filters, count:', activeFilters.value.length)
      activeFilters.value.forEach(filter => {
        if (filter.type === 'platform') {
          const beforeCount = filtered.length
          filtered = filtered.filter(item => 
            item.platforms?.toLowerCase().includes(filter.value.toLowerCase())
          )
          console.log('🔍 PLATFORM FILTER:', filter.value, 'Before:', beforeCount, 'After:', filtered.length)
        } else if (filter.type === 'genre') {
          const beforeCount = filtered.length
          filtered = filtered.filter(item => 
            item.genre?.toLowerCase().includes(filter.value.toLowerCase())
          )
          console.log('🔍 GENRE FILTER:', filter.value, 'Before:', beforeCount, 'After:', filtered.length)
        } else if (filter.type === 'airing') {
          const beforeCount = filtered.length
          if (filter.value === 'airing') {
            filtered = filtered.filter(item => item.isAiring === true)
          } else if (filter.value === 'finished') {
            filtered = filtered.filter(item => item.isAiring === false || item.isAiring === null)
          }
          console.log('🔍 AIRING FILTER:', filter.value, 'Before:', beforeCount, 'After:', filtered.length)
        }
      })
    } else {
      console.log('🔍 FILTER DEBUG: Filters disabled, skipping active filters')
    }
    
    console.log('🔍 FILTER DEBUG: Final filtered result:', filtered.length, 'items')
    console.log('🔍 FILTER DEBUG: Final filtered items:', filtered)

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
          console.log('🔍 LOAD DEBUG: API returned data:', data)
          console.log('🔍 LOAD DEBUG: Data length:', data?.length)
          console.log('🔍 LOAD DEBUG: First item:', data?.[0])
          mediaData.value = data || []
          console.log('🔍 LOAD DEBUG: mediaData.value set to:', mediaData.value)
          
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

  function toggleFilters() {
    console.log('🔄 TOGGLE FILTERS: Before toggle, filtersEnabled =', filtersEnabled.value)
    filtersEnabled.value = !filtersEnabled.value
    console.log('🔄 TOGGLE FILTERS: After toggle, filtersEnabled =', filtersEnabled.value)
  }

  function clearError() {
    error.value = null
  }

  async function addMediaItem(itemData, skipReload = false) {
    // Clear any existing error when starting a new save operation
    error.value = null
    
    try {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('currentUser')
      
      if (token && user) {
        // For logged in users, save via API only
        try {
          const newItem = await mediaApi.addMediaItem(itemData)
          
          // Only reload data from API if not in bulk mode
          if (!skipReload) {
            await loadMedia()
          } else {
            // In bulk mode, just add the item to the local state to keep UI responsive
            const itemWithId = {
              ...newItem,
              __order: mediaData.value.length
            }
            mediaData.value.push(itemWithId)
          }
          
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
          // Handle silent errors (like 404) - don't show error messages for these
          if (apiError.silent) {
            console.log('Silent batch delete error (some items may not exist):', apiError.message)
            // Still reload data to reflect current state
            await loadMedia()
            return true
          }
          
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
      // Only set error if it's not a silent error
      if (!err.silent) {
        error.value = err.message || 'Failed to delete media items'
      }
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

  // Reset media state to defaults
  const resetMediaState = () => {
    currentCategory.value = 'game'
    searchQuery.value = ''
    activeFilters.value = []
    // Clear from localStorage
    localStorage.removeItem('currentCategory')
    localStorage.removeItem('searchQuery')
    localStorage.removeItem('activeFilters')
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
    toggleFilters,
    filtersEnabled,
    addMediaItem,
    updateMediaItem,
    deleteMediaItem,
    batchAddMediaItems,
    batchDeleteMediaItems,
    saveMedia,
    clearError,
    initializeRealtimeUpdates,
    cleanupRealtimeUpdates,
    resetMediaState
  }
})