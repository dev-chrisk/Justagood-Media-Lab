import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import { useMessageStore } from '@/stores/message'
import { useConfirmStore } from '@/stores/confirm'
import { useInputStore } from '@/stores/input'
import { useSidebarStore } from '@/stores/sidebar'

export function useMediaLibrary() {
  const router = useRouter()
  const authStore = useAuthStore()
  const mediaStore = useMediaStore()
  const messageStore = useMessageStore()
  const confirmStore = useConfirmStore()
  const inputStore = useInputStore()
  
  // UI State
  // Sidebar state is now managed globally in useSidebarStore
  const showLoginModal = ref(false)
  const showRegisterModal = ref(false)
  const showEditModal = ref(false)
  const showFloatingMenu = ref(false)
  const showBulkAddModal = ref(false)
  const showTxtImportModal = ref(false)
  const showTxtImportResults = ref(false)
  const editingItem = ref(null)
  // Responsive default grid columns: 8 for desktop, 3 for mobile
  const getDefaultGridColumns = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768 ? 8 : 3
    }
    return 8 // Default to desktop value for SSR
  }
  const gridColumns = ref(getDefaultGridColumns())
  const sortBy = ref('order_asc')
  const txtImportResults = ref(null)

  // Update grid columns on window resize
  const updateGridColumns = () => {
    gridColumns.value = getDefaultGridColumns()
  }

  // Add resize listener when component mounts
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateGridColumns)
  }

  // Categories
  const categories = [
    { key: 'game', name: 'Games', icon: '🎮' },
    { key: 'series', name: 'Series', icon: '📺' },
    { key: 'movie', name: 'Movies', icon: '🎬' },
    { key: 'buecher', name: 'Bücher', icon: '📚' },
    { key: 'watchlist', name: 'Watchlist', icon: '❤️' }
  ]

  // Computed
  const isLoggedIn = computed(() => {
    try {
      return authStore.isLoggedIn
    } catch (error) {
      console.error('Error accessing authStore.isLoggedIn:', error)
      return false
    }
  })
  const userName = computed(() => {
    try {
      return authStore.userName
    } catch (error) {
      console.error('Error accessing authStore.userName:', error)
      return ''
    }
  })
  const isAdmin = computed(() => {
    try {
      return authStore.isAdmin
    } catch (error) {
      console.error('Error accessing authStore.isAdmin:', error)
      return false
    }
  })
  const currentCategory = computed(() => {
    try {
      return mediaStore.currentCategory
    } catch (error) {
      console.error('Error accessing mediaStore.currentCategory:', error)
      return 'game'
    }
  })
  const searchQuery = computed({
    get: () => {
      try {
        return mediaStore.searchQuery
      } catch (error) {
        console.error('Error accessing mediaStore.searchQuery:', error)
        return ''
      }
    },
    set: (value) => {
      try {
        mediaStore.setSearchQuery(value)
      } catch (error) {
        console.error('Error setting mediaStore.searchQuery:', error)
      }
    }
  })
  const categoryCounts = computed(() => {
    try {
      return mediaStore.categoryCounts
    } catch (error) {
      console.error('Error accessing mediaStore.categoryCounts:', error)
      return {}
    }
  })
  const loading = computed(() => {
    try {
      return mediaStore.loading
    } catch (error) {
      console.error('Error accessing mediaStore.loading:', error)
      return false
    }
  })
  const error = computed(() => {
    try {
      return mediaStore.error
    } catch (error) {
      console.error('Error accessing mediaStore.error:', error)
      return null
    }
  })

  // Filtered and sorted media
  const sortedMedia = computed(() => {
    try {
      const media = [...(mediaStore.filteredMedia || [])]
      const [field, order] = sortBy.value.split('_')
      
      return media.sort((a, b) => {
        let aVal = a[field]
        let bVal = b[field]
        
        if (field === 'order') {
          aVal = a.__order || 0
          bVal = b.__order || 0
        } else if (field === 'airing') {
          // Sort by airing status (airing first, then finished)
          aVal = a.isAiring ? 1 : 0
          bVal = b.isAiring ? 1 : 0
        } else if (field === 'api_rating') {
          // Sort by API rating
          aVal = a.api_rating || a.rating || 0
          bVal = b.api_rating || b.rating || 0
        } else if (field === 'personal_rating') {
          // Sort by personal rating
          aVal = a.personal_rating || 0
          bVal = b.personal_rating || 0
        }
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }
        
        if (order === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    } catch (error) {
      console.error('Error in sortedMedia computed:', error)
      return []
    }
  })

  const paginatedMedia = computed(() => {
    return sortedMedia.value
  })


  // Methods
  // Sidebar methods are now managed globally in useSidebarStore

  const setCategory = (category) => {
    mediaStore.setCategory(category)
    // Close mobile sidebar when category is set
    const sidebarStore = useSidebarStore()
    sidebarStore.closeMobileSidebar()
  }

  const clearSearch = () => {
    mediaStore.setSearchQuery('')
  }


  const editItem = (item) => {
    editingItem.value = item
    showEditModal.value = true
  }

  const closeEditModal = () => {
    showEditModal.value = false
    editingItem.value = null
  }

  const closeBulkAddModal = () => {
    showBulkAddModal.value = false
  }

  const handleBulkAddItems = async (items) => {
    // This function is no longer used - the new BulkAddModal handles everything internally
    // Keeping for backward compatibility but not used
    console.log('handleBulkAddItems called but not used in new workflow')
  }

  const handleSaveItem = async (itemData) => {
    // This function is now handled directly in EditModal
    // Keeping for backward compatibility but not used
    if (editingItem.value) {
      await mediaStore.updateMediaItem(editingItem.value.id, itemData)
    } else {
      await mediaStore.addMediaItem(itemData)
    }
    closeEditModal()
  }

  const handleDeleteItem = async (item) => {
    try {
      await mediaStore.deleteMediaItem(item.id)
      // If we get here, deletion was successful (even if item was already gone)
      // No console output needed for successful operations
    } catch (error) {
      // Only show error to user if it's not a 404 (item not found)
      if (error.response?.status !== 404 && !error.silent) {
        console.error('Delete failed:', error)
        messageStore.showError('Failed to delete item: ' + (error.message || 'Unknown error'), 'Delete Failed')
      }
      // For 404 errors, silently continue - item was already gone
    }
  }

  const logout = async () => {
    await authStore.logout()
    await loadMedia()
  }

  const loadMedia = async () => {
    try {
      await mediaStore.loadMedia()
    } catch (error) {
      console.error('Error loading media:', error)
    }
  }

  // Floating Action Button methods
  const toggleFloatingMenu = () => {
    showFloatingMenu.value = !showFloatingMenu.value
  }

  const addNewItem = () => {
    showFloatingMenu.value = false
    if (!isLoggedIn.value) {
      messageStore.showWarning('Bitte loggen Sie sich ein, um neue Items hinzuzufügen.', 'Login erforderlich')
      return
    }
    editingItem.value = null
    showEditModal.value = true
  }

  const bulkAddItems = () => {
    showFloatingMenu.value = false
    if (!isLoggedIn.value) {
      messageStore.showWarning('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.', 'Login erforderlich')
      return
    }
    showBulkAddModal.value = true
  }

  const importFromTxt = () => {
    showFloatingMenu.value = false
    if (!isLoggedIn.value) {
      messageStore.showWarning('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.', 'Login erforderlich')
      return
    }
    showTxtImportModal.value = true
  }

  const importFromAPI = () => {
    showFloatingMenu.value = false
    if (!isLoggedIn.value) {
      messageStore.showWarning('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.', 'Login erforderlich')
      return
    }
    messageStore.showInfo('API Import feature coming soon!', 'Feature in Entwicklung')
  }

  const createCollection = () => {
    showFloatingMenu.value = false
    if (!isLoggedIn.value) {
      messageStore.showWarning('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.', 'Login erforderlich')
      return
    }
    exportMediaCollection()
  }

  // Category Management Functions
  const getCategoryDisplayName = (categoryKey) => {
    if (!categoryKey) return 'Unknown'
    const category = categories.find(cat => cat.key === categoryKey)
    return category ? category.name : categoryKey
  }

  const deleteAllInCategory = async () => {
    const categoryName = getCategoryDisplayName(currentCategory.value)
    const itemCount = categoryCounts.value[currentCategory.value] || 0
    
    if (itemCount === 0) {
      messageStore.showInfo('No items to delete in this category.', 'Nothing to Delete')
      return
    }

    const confirmMessage = `Are you sure you want to delete ALL ${itemCount} items in "${categoryName}"?\n\nThis action cannot be undone!`
    
    const confirmed = await confirmStore.showConfirm({
      title: 'Delete All Items',
      message: confirmMessage
    })
    
    if (confirmed) {
      try {
        const itemsToDelete = (mediaStore?.mediaData || []).filter(item => {
          if (currentCategory.value === 'watchlist') {
            return item.category === 'watchlist' || item.isNew === true
          }
          return item.category === currentCategory.value
        })

        const itemIds = itemsToDelete.map(item => item.id)
        await mediaStore.batchDeleteMediaItems(itemIds)
        await loadMedia()

        messageStore.showSuccess(`Successfully deleted ${itemCount} items from "${categoryName}"`, 'Items Deleted')
      } catch (error) {
        console.error('Error deleting items:', error)
        
        // Handle different types of errors
        if (error.silent) {
          // Silent errors (like 404) - still show success but with different message
          messageStore.showSuccess(`Items deleted from "${categoryName}" (some items may not have existed)`, 'Items Deleted')
        } else if (error.isNotFound) {
          // Some items not found - show warning instead of error
          messageStore.showWarning('Some items were not found and could not be deleted, but the operation completed.', 'Partial Success')
        } else {
          // Real errors - show error message
          messageStore.showError('Error occurred while deleting items. Please try again.', 'Delete Failed')
        }
      }
    }
  }

  // TXT Import functions
  const processTxtContent = (content) => {
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lines.length === 0) {
      messageStore.showWarning('Die TXT-Datei ist leer oder enthält keine gültigen Einträge.', 'Leere Datei')
      return
    }

    const currentItems = mediaStore.filteredMedia
    const currentTitles = currentItems.map(item => item.title.toLowerCase().trim())

    const missingItems = lines.filter(line => {
      const normalizedLine = line.toLowerCase().trim()
      return !currentTitles.some(title => 
        title.includes(normalizedLine) || normalizedLine.includes(title)
      )
    })

    const existingItems = lines.filter(line => {
      const normalizedLine = line.toLowerCase().trim()
      return currentTitles.some(title => 
        title.includes(normalizedLine) || normalizedLine.includes(title)
      )
    })

    txtImportResults.value = {
      totalInFile: lines.length,
      missingItems: missingItems,
      existingItems: existingItems,
      currentCategory: currentCategory.value,
      categoryName: getCategoryDisplayName(currentCategory.value)
    }

    showTxtImportModal.value = false
    showTxtImportResults.value = true
  }

  const closeTxtImportResults = () => {
    txtImportResults.value = null
    showTxtImportResults.value = false
  }

  // Export functions
  const exportMediaCollection = async () => {
    const allMedia = mediaStore?.mediaData || []
    
    if (allMedia.length === 0) {
      messageStore.showInfo('Keine Media Items zum Exportieren gefunden.', 'Nichts zu exportieren')
      return
    }

    const format = await inputStore.showInput({
      title: 'Export Format wählen',
      message: '1 = CSV\n2 = JSON\n3 = Beide\n\nGeben Sie die Nummer ein:',
      placeholder: '1',
      defaultValue: '1'
    })
    
    if (!format || !['1', '2', '3'].includes(format)) {
      return
    }

    const date = new Date().toISOString().split('T')[0]
    
    if (format === '1' || format === '3') {
      exportAsCSV(allMedia, date)
    }
    
    if (format === '2' || format === '3') {
      exportAsJSON(allMedia, date)
    }
    
    messageStore.showSuccess(`Collection mit ${allMedia.length} Items wurde erfolgreich exportiert!`, 'Export erfolgreich')
  }

  const exportAsCSV = (mediaItems, date) => {
    const headers = ['Titel', 'Kategorie', 'Release', 'Rating', 'Platforms', 'Genre', 'Spielzeit', 'Status', 'Beschreibung']
    const csvContent = [
      headers.join(','),
      ...mediaItems.map(item => [
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${(item.category || item.category_name || 'Unbekannt').replace(/"/g, '""')}"`,
        `"${item.release || ''}"`,
        `"${item.rating || ''}"`,
        `"${(item.platforms || '').replace(/"/g, '""')}"`,
        `"${(item.genre || '').replace(/"/g, '""')}"`,
        `"${item.spielzeit || ''}"`,
        `"${item.isAiring ? 'Airing' : 'Abgeschlossen'}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    downloadFile(csvContent, `media_collection_${date}.csv`, 'text/csv;charset=utf-8;')
  }

  const exportAsJSON = (mediaItems, date) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalItems: mediaItems.length,
      categories: [...new Set(mediaItems.map(item => item.category || item.category_name || 'Unbekannt'))],
      items: mediaItems.map(item => ({
        id: item.id,
        title: item.title || '',
        category: item.category || item.category_name || 'Unbekannt',
        release: item.release || '',
        rating: item.rating || null,
        platforms: item.platforms || '',
        genre: item.genre || '',
        spielzeit: item.spielzeit || null,
        status: item.isAiring ? 'Airing' : 'Abgeschlossen',
        description: item.description || '',
        isNew: item.isNew || false,
        nextSeason: item.nextSeason || null,
        discovered: item.discovered || null
      }))
    }

    downloadFile(JSON.stringify(exportData, null, 2), `media_collection_${date}.json`, 'application/json;charset=utf-8;')
  }

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Navigation functions

  const navigateToCalendar = () => {
    router.push('/calendar')
  }


  const navigateToProfile = () => {
    router.push('/profile')
  }

  const navigateToAdmin = () => {
    console.log('🔥 navigateToAdmin function called!')
    console.log('🔥 Router object:', router)
    console.log('🔥 Pushing to /admin...')
    try {
      router.push('/admin')
      console.log('🔥 Successfully navigated to /admin!')
    } catch (error) {
      console.error('🔥 Error navigating to admin:', error)
    }
  }

  // Cleanup function to remove event listener
  const cleanup = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateGridColumns)
    }
  }

  return {
    // State
    showLoginModal,
    showRegisterModal,
    showEditModal,
    showFloatingMenu,
    showBulkAddModal,
    showTxtImportModal,
    showTxtImportResults,
    editingItem,
    gridColumns,
    sortBy,
    categories,
    txtImportResults,
    
    // Computed
    isLoggedIn,
    isAdmin,
    userName,
    currentCategory,
    searchQuery,
    categoryCounts,
    loading,
    error,
    paginatedMedia,
    
    // Methods
    setCategory,
    clearSearch,
    editItem,
    closeEditModal,
    closeBulkAddModal,
    handleBulkAddItems,
    handleSaveItem,
    handleDeleteItem,
    logout,
    loadMedia,
    toggleFloatingMenu,
    addNewItem,
    bulkAddItems,
    importFromTxt,
    importFromAPI,
    createCollection,
    exportMediaCollection,
    exportAsCSV,
    exportAsJSON,
    downloadFile,
    deleteAllInCategory,
    getCategoryDisplayName,
    navigateToCalendar,
    navigateToProfile,
    navigateToAdmin,
    processTxtContent,
    closeTxtImportResults,
    cleanup,
    router
  }
}
