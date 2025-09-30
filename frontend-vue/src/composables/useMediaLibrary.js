import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import { useMessageStore } from '@/stores/message'
import { useConfirmStore } from '@/stores/confirm'
import { useInputStore } from '@/stores/input'

export function useMediaLibrary() {
  const authStore = useAuthStore()
  const mediaStore = useMediaStore()
  const messageStore = useMessageStore()
  const confirmStore = useConfirmStore()
  const inputStore = useInputStore()
  
  // UI State
  const sidebarCollapsed = ref(false)
  const mobileSidebarOpen = ref(false)
  const showLoginModal = ref(false)
  const showRegisterModal = ref(false)
  const showEditModal = ref(false)
  const showFloatingMenu = ref(false)
  const showBulkAddModal = ref(false)
  const showTxtImportModal = ref(false)
  const showTxtImportResults = ref(false)
  const editingItem = ref(null)
  const gridColumns = ref(8)
  const sortBy = ref('order_asc')
  const txtImportResults = ref(null)

  // Categories
  const categories = [
    { key: 'game', name: 'Games', icon: '🎮' },
    { key: 'series', name: 'Series', icon: '📺' },
    { key: 'movie', name: 'Movies', icon: '🎬' },
    { key: 'watchlist', name: 'Watchlist', icon: '❤️' }
  ]

  // Computed
  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const userName = computed(() => authStore.userName)
  const currentCategory = computed(() => mediaStore.currentCategory)
  const searchQuery = computed({
    get: () => mediaStore.searchQuery,
    set: (value) => mediaStore.setSearchQuery(value)
  })
  const categoryCounts = computed(() => mediaStore.categoryCounts)
  const loading = computed(() => mediaStore.loading)
  const error = computed(() => mediaStore.error)

  // Filtered and sorted media
  const sortedMedia = computed(() => {
    const media = [...mediaStore.filteredMedia]
    const [field, order] = sortBy.value.split('_')
    
    return media.sort((a, b) => {
      let aVal = a[field]
      let bVal = b[field]
      
      if (field === 'order') {
        aVal = a.__order || 0
        bVal = b.__order || 0
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
  })

  const paginatedMedia = computed(() => {
    return sortedMedia.value
  })

  // Extract unique platforms and genres for filters
  const platforms = computed(() => {
    if (!mediaStore || !mediaStore.mediaData) return []
    const platformSet = new Set()
    mediaStore.mediaData.forEach(item => {
      if (item.platforms) {
        item.platforms.split(',').forEach(p => platformSet.add(p.trim()))
      }
    })
    return Array.from(platformSet).sort()
  })

  const genres = computed(() => {
    if (!mediaStore || !mediaStore.mediaData) return []
    const genreSet = new Set()
    mediaStore.mediaData.forEach(item => {
      if (item.genre) {
        item.genre.split(',').forEach(g => genreSet.add(g.trim()))
      }
    })
    return Array.from(genreSet).sort()
  })

  // Methods
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const toggleMobileSidebar = () => {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  const closeMobileSidebar = () => {
    mobileSidebarOpen.value = false
  }

  const setCategory = (category) => {
    mediaStore.setCategory(category)
    mobileSidebarOpen.value = false
  }

  const clearSearch = () => {
    mediaStore.setSearchQuery('')
  }

  const togglePlatformFilter = (platform, checked) => {
    if (checked) {
      mediaStore.addFilter({ type: 'platform', value: platform })
    } else {
      mediaStore.removeFilter({ type: 'platform', value: platform })
    }
  }

  const toggleGenreFilter = (genre, checked) => {
    if (checked) {
      mediaStore.addFilter({ type: 'genre', value: genre })
    } else {
      mediaStore.removeFilter({ type: 'genre', value: genre })
    }
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
    try {
      const result = await mediaStore.batchAddMediaItems(items)
      
      // Show success message
      if (result.success) {
        const { created, failed } = result.stats
        let message = `Successfully added ${created} items`
        if (failed > 0) {
          message += ` (${failed} failed)`
        }
        messageStore.showSuccess(message, 'Bulk Add Successful')
      }
      
      closeBulkAddModal()
    } catch (error) {
      console.error('Bulk add failed:', error)
      messageStore.showError('Failed to add items: ' + (error.message || 'Unknown error'), 'Bulk Add Failed')
    }
  }

  const handleSaveItem = async (itemData) => {
    if (editingItem.value) {
      await mediaStore.updateMediaItem(editingItem.value.id, itemData)
    } else {
      await mediaStore.addMediaItem(itemData)
    }
    closeEditModal()
  }

  const handleDeleteItem = async (item) => {
    await mediaStore.deleteMediaItem(item.id)
  }

  const logout = async () => {
    await authStore.logout()
    await loadMedia()
  }

  const loadMedia = async () => {
    await mediaStore.loadMedia()
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
        messageStore.showError('Error occurred while deleting items. Please try again.', 'Delete Failed')
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

  return {
    // State
    sidebarCollapsed,
    mobileSidebarOpen,
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
    userName,
    currentCategory,
    searchQuery,
    categoryCounts,
    loading,
    error,
    paginatedMedia,
    platforms,
    genres,
    
    // Methods
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    setCategory,
    clearSearch,
    togglePlatformFilter,
    toggleGenreFilter,
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
    processTxtContent,
    closeTxtImportResults
  }
}
