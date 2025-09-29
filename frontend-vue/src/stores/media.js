import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mediaApi } from '@/services/api'

export const useMediaStore = defineStore('media', () => {
  // State
  const mediaData = ref([])
  const currentCategory = ref('watchlist')
  const searchQuery = ref('')
  const activeFilters = ref([])
  const loading = ref(false)
  const error = ref(null)

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
      }
    })

    return filtered
  })

  // Actions
  async function loadMedia() {
    loading.value = true
    error.value = null
    
    try {
      // Load all media data without category filter
      const data = await mediaApi.getMedia()
      mediaData.value = data || []
      console.log('Loaded media data:', data.length, 'items')
      console.log('Categories found:', [...new Set(data.map(item => item.category))])
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

  async function addMediaItem(itemData) {
    try {
      const newItem = {
        id: Date.now(), // Simple ID generation
        ...itemData,
        __order: mediaData.value.length
      }
      
      mediaData.value.push(newItem)
      await saveMedia()
      return newItem
    } catch (err) {
      error.value = err.message || 'Failed to add media item'
      throw err
    }
  }

  async function updateMediaItem(id, itemData) {
    try {
      const index = mediaData.value.findIndex(item => item.id === id)
      if (index !== -1) {
        mediaData.value[index] = { ...mediaData.value[index], ...itemData }
        await saveMedia()
        return mediaData.value[index]
      }
      throw new Error('Media item not found')
    } catch (err) {
      error.value = err.message || 'Failed to update media item'
      throw err
    }
  }

  async function deleteMediaItem(id) {
    try {
      // Try to delete via API first if user is logged in
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          await mediaApi.deleteMediaItem(id)
        } catch (apiError) {
          console.warn('API delete failed, falling back to local delete:', apiError)
        }
      }
      
      // Remove from local data
      const index = mediaData.value.findIndex(item => item.id === id)
      if (index !== -1) {
        mediaData.value.splice(index, 1)
        await saveMedia()
        return true
      }
      throw new Error('Media item not found')
    } catch (err) {
      error.value = err.message || 'Failed to delete media item'
      throw err
    }
  }

  async function saveMedia() {
    try {
      await mediaApi.saveMedia(mediaData.value)
    } catch (err) {
      console.error('Failed to save media:', err)
      // Don't throw error for save failures to avoid breaking UI
    }
  }

  function clearError() {
    error.value = null
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
    saveMedia,
    clearError
  }
})