<template>
  <div class="vue-app">
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" :class="{ show: mobileSidebarOpen }" @click="closeMobileSidebar"></div>
    
    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar" :class="{ collapsed: sidebarCollapsed, open: mobileSidebarOpen }">
      <div class="sidebar-header" @click="toggleSidebar">
        <h2>Media Library</h2>
        <button class="sidebar-toggle">☰</button>
      </div>
      
      <div class="sidebar-content">
        <!-- Main Navigation -->
        <div class="sidebar-section">
          <h3>Browse</h3>
          <nav class="sidebar-nav">
            <button 
              v-for="category in categories" 
              :key="category.key"
              class="nav-btn" 
              :class="{ active: currentCategory === category.key }"
              @click="setCategory(category.key)"
            >
              <span class="nav-icon">{{ category.icon }}</span>
              <span class="nav-text">{{ category.name }}</span>
              <span class="nav-count">{{ categoryCounts[category.key] || 0 }}</span>
            </button>
            <button class="nav-btn" @click="navigateToStatistics">
              <span class="nav-icon">📊</span>
              <span class="nav-text">Statistics</span>
            </button>
          </nav>
        </div>

        <!-- Filters Section -->
        <div v-if="isLoggedIn" class="sidebar-section">
          <h3>Filters</h3>
          <div class="filter-section">
            <div class="filter-group">
              <h4>Platforms</h4>
              <div class="filter-checkboxes">
                <label v-for="platform in platforms" :key="platform" class="filter-option">
                  <input 
                    type="checkbox" 
                    :value="platform"
                    @change="togglePlatformFilter(platform, $event.target.checked)"
                  >
                  <span class="checkmark"></span>
                  <span class="option-text">{{ platform }}</span>
                </label>
              </div>
            </div>
            <div class="filter-group">
              <h4>Genres</h4>
              <div class="filter-checkboxes">
                <label v-for="genre in genres" :key="genre" class="filter-option">
                  <input 
                    type="checkbox" 
                    :value="genre"
                    @change="toggleGenreFilter(genre, $event.target.checked)"
                  >
                  <span class="checkmark"></span>
                  <span class="option-text">{{ genre }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Section -->
        <div class="sidebar-section">
          <h3>Account</h3>
          <div v-if="!isLoggedIn" class="auth-buttons">
            <button class="auth-btn" @click="showLoginModal = true">Login</button>
            <button class="auth-btn" @click="showRegisterModal = true">Register</button>
          </div>
          <div v-else class="user-info">
            <div class="user-profile">
              <div class="profile-avatar">
                <span class="avatar-text">👤</span>
              </div>
              <div class="profile-details">
                <span class="user-name">{{ userName }}</span>
              </div>
              <button class="account-btn" @click="navigateToProfile">⚙️</button>
            </div>
            <button class="auth-btn" @click="logout">Logout</button>
          </div>
        </div>

      </div>
      
      <!-- Version Info -->
      <VersionInfo />
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <header class="main-header">
        <div class="header-left">
          <button class="mobile-sidebar-toggle" @click="toggleMobileSidebar">☰</button>
        </div>
        <div class="header-center">
          <div class="search-container">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Search..." 
            />
            <button class="search-clear" @click="clearSearch">×</button>
          </div>
        </div>
        <div class="header-right">
          <div class="grid-count-container">
            <label>Columns:</label>
            <select v-model="gridColumns">
              <option v-for="i in 12" :key="i" :value="i">{{ i }}</option>
            </select>
          </div>
          <div class="sort-container">
            <select v-model="sortBy">
              <option value="order_asc">Original order ↑</option>
              <option value="order_desc">Original order ↓</option>
              <option value="title_asc">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
              <option value="release_asc">Release ↑</option>
              <option value="release_desc">Release ↓</option>
              <option value="rating_asc">Rating ↑</option>
              <option value="rating_desc">Rating ↓</option>
            </select>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <main class="content-area">
        <LoadingSpinner v-if="loading" message="Loading media data..." />
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="loadMedia">Retry</button>
        </div>
        
        <div v-else class="grid" :style="{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
          <MediaItem 
            v-for="item in paginatedMedia" 
            :key="item.id" 
            :item="item"
            @edit="editItem"
          />
        </div>
      </main>
    </div>


    <!-- Modals -->
    <LoginModal 
      v-if="showLoginModal" 
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
      @switchToRegister="switchToRegister"
    />
    
    <RegisterModal 
      v-if="showRegisterModal" 
      @close="showRegisterModal = false"
      @success="handleRegisterSuccess"
    />

    <EditModal 
      v-if="showEditModal" 
      :item="editingItem"
      @close="closeEditModal"
      @save="handleSaveItem"
      @delete="handleDeleteItem"
    />

    <!-- TXT Import Modal -->
    <div v-if="showTxtImportModal" class="modal" @click="showTxtImportModal = false">
      <div class="modal-content" @click.stop>
        <h2>📄 Import from TXT File</h2>
        <p>Wählen Sie eine .txt Datei mit einer Liste von Titeln aus, um zu prüfen, welche Items in der aktuellen Kategorie fehlen.</p>
        
        <div class="file-upload-area">
          <input 
            type="file" 
            id="txtFileInput"
            accept=".txt"
            @change="handleTxtFileUpload"
            style="display: none"
          />
          <label for="txtFileInput" class="file-upload-label">
            <span class="upload-icon">📁</span>
            <span class="upload-text">TXT-Datei auswählen</span>
            <span class="upload-hint">Eine .txt Datei mit einer Liste von Titeln</span>
          </label>
        </div>
        
        <div class="modal-buttons">
          <button type="button" @click="showTxtImportModal = false">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- TXT Import Results Modal -->
    <div v-if="txtImportResults" class="modal" @click="closeTxtImportResults">
      <div class="modal-content results-modal" @click.stop>
        <h2>📊 TXT Import Ergebnisse</h2>
        <div class="results-summary">
          <div class="summary-item">
            <span class="summary-label">Kategorie:</span>
            <span class="summary-value">{{ txtImportResults.categoryName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Titel in Datei:</span>
            <span class="summary-value">{{ txtImportResults.totalInFile }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Bereits vorhanden:</span>
            <span class="summary-value existing">{{ txtImportResults.existingItems.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Fehlende Titel:</span>
            <span class="summary-value missing">{{ txtImportResults.missingItems.length }}</span>
          </div>
        </div>

        <div v-if="txtImportResults.missingItems.length > 0" class="missing-items">
          <h3>❌ Fehlende Titel ({{ txtImportResults.missingItems.length }}):</h3>
          <div class="items-list">
            <div 
              v-for="(item, index) in txtImportResults.missingItems" 
              :key="index"
              class="missing-item"
            >
              {{ item }}
            </div>
          </div>
        </div>

        <div v-if="txtImportResults.existingItems.length > 0" class="existing-items">
          <h3>✅ Bereits vorhanden ({{ txtImportResults.existingItems.length }}):</h3>
          <div class="items-list">
            <div 
              v-for="(item, index) in txtImportResults.existingItems" 
              :key="index"
              class="existing-item"
            >
              {{ item }}
            </div>
          </div>
        </div>

        <div class="modal-buttons">
          <button type="button" @click="closeTxtImportResults">
            Schließen
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <div class="floating-actions">
      <div class="floating-menu" :class="{ show: showFloatingMenu }">
        <button class="floating-menu-item" @click="addNewItem">
          <span class="menu-icon">➕</span>
          <span class="menu-text">Add Item</span>
        </button>
        <button class="floating-menu-item" @click="bulkAddItems">
          <span class="menu-icon">📦</span>
          <span class="menu-text">Bulk Add</span>
        </button>
        <button class="floating-menu-item" @click="importFromTxt">
          <span class="menu-icon">📄</span>
          <span class="menu-text">Import from TXT</span>
        </button>
        <button class="floating-menu-item" @click="importFromAPI">
          <span class="menu-icon">🌐</span>
          <span class="menu-text">Import from API</span>
        </button>
        <button class="floating-menu-item" @click="createCollection">
          <span class="menu-icon">📚</span>
          <span class="menu-text">Create Collection</span>
        </button>
        <button 
          v-if="isLoggedIn && currentCategory !== 'all' && categoryCounts[currentCategory] > 0"
          class="floating-menu-item delete-all-item" 
          @click="deleteAllInCategory"
        >
          <span class="menu-icon">🗑️</span>
          <span class="menu-text">Delete All {{ getCategoryDisplayName(currentCategory) }}</span>
          <span class="item-count-badge">({{ categoryCounts[currentCategory] || 0 }})</span>
        </button>
      </div>
      <button class="floating-add-btn" @click="toggleFloatingMenu">
        {{ showFloatingMenu ? '✕' : '+' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import MediaItem from '@/components/MediaItem.vue'
import LoginModal from '@/components/LoginModal.vue'
import RegisterModal from '@/components/RegisterModal.vue'
import EditModal from '@/components/EditModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import VersionInfo from '@/components/VersionInfo.vue'

export default {
  name: 'MediaLibrary',
  components: {
    MediaItem,
    LoginModal,
    RegisterModal,
    EditModal,
    LoadingSpinner,
    VersionInfo
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const mediaStore = useMediaStore()

    // UI State
    const sidebarCollapsed = ref(false)
    const mobileSidebarOpen = ref(false)
    const showLoginModal = ref(false)
    const showRegisterModal = ref(false)
    const showEditModal = ref(false)
    const showFloatingMenu = ref(false)
    const showTxtImportModal = ref(false)
    const editingItem = ref(null)
    const gridColumns = ref(8)
    const sortBy = ref('order_asc')
    const txtImportResults = ref(null)
    

    // Categories
    const categories = [
      { key: 'watchlist', name: 'Watchlist', icon: '📋' },
      { key: 'game', name: 'Games', icon: '🎮' },
      { key: 'series', name: 'Series', icon: '📺' },
      { key: 'movie', name: 'Movies', icon: '🎬' }
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
      // For now, return all items. Pagination can be added later
      return sortedMedia.value
    })

    // Extract unique platforms and genres for filters
    const platforms = computed(() => {
      const platformSet = new Set()
      mediaStore.mediaData.forEach(item => {
        if (item.platforms) {
          item.platforms.split(',').forEach(p => platformSet.add(p.trim()))
        }
      })
      return Array.from(platformSet).sort()
    })

    const genres = computed(() => {
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
      // Close mobile sidebar when category is selected
      mobileSidebarOpen.value = false
    }

    const clearSearch = () => {
      mediaStore.setSearchQuery('')
    }

    const navigateToStatistics = () => {
      router.push('/statistics')
      mobileSidebarOpen.value = false
    }

    const navigateToProfile = () => {
      router.push('/profile')
      mobileSidebarOpen.value = false
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


    const switchToRegister = () => {
      showLoginModal.value = false
      showRegisterModal.value = true
    }

    const handleLoginSuccess = () => {
      showLoginModal.value = false
      loadMedia()
    }

    const handleRegisterSuccess = () => {
      showRegisterModal.value = false
      loadMedia()
    }

    const closeEditModal = () => {
      showEditModal.value = false
      editingItem.value = null
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
      loadMedia() // Reload with demo data
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
        alert('Bitte loggen Sie sich ein, um neue Items hinzuzufügen.')
        return
      }
      editingItem.value = null
      showEditModal.value = true
    }

    const bulkAddItems = () => {
      showFloatingMenu.value = false
      if (!isLoggedIn.value) {
        alert('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.')
        return
      }
      // TODO: Implement bulk add modal
      alert('Bulk Add feature coming soon!')
    }

    const importFromTxt = () => {
      showFloatingMenu.value = false
      if (!isLoggedIn.value) {
        alert('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.')
        return
      }
      showTxtImportModal.value = true
    }

    const importFromAPI = () => {
      showFloatingMenu.value = false
      if (!isLoggedIn.value) {
        alert('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.')
        return
      }
      // TODO: Implement API import modal
      alert('API Import feature coming soon!')
    }

    const createCollection = () => {
      showFloatingMenu.value = false
      if (!isLoggedIn.value) {
        alert('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.')
        return
      }
      
      // Export all media items with categories
      exportMediaCollection()
    }

    const exportMediaCollection = () => {
      const allMedia = mediaStore.mediaData
      
      if (allMedia.length === 0) {
        alert('Keine Media Items zum Exportieren gefunden.')
        return
      }

      // Ask user for export format
      const format = prompt('Export Format wählen:\n1 = CSV\n2 = JSON\n3 = Beide\n\nGeben Sie die Nummer ein:', '1')
      
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
      
      alert(`Collection mit ${allMedia.length} Items wurde erfolgreich exportiert!`)
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

    // Category Management Functions
    const getCategoryDisplayName = (categoryKey) => {
      const category = categories.find(cat => cat.key === categoryKey)
      return category ? category.name : categoryKey
    }

    const deleteAllInCategory = async () => {
      const categoryName = getCategoryDisplayName(currentCategory.value)
      const itemCount = categoryCounts.value[currentCategory.value] || 0
      
      if (itemCount === 0) {
        alert('No items to delete in this category.')
        return
      }

      const confirmMessage = `Are you sure you want to delete ALL ${itemCount} items in "${categoryName}"?\n\nThis action cannot be undone!`
      
      if (confirm(confirmMessage)) {
        try {
          // Filter items by current category
          const itemsToDelete = mediaStore.mediaData.filter(item => {
            if (currentCategory.value === 'watchlist') {
              return item.category === 'watchlist' || item.isNew === true
            }
            return item.category === currentCategory.value
          })

          // Delete each item
          for (const item of itemsToDelete) {
            try {
              await mediaStore.deleteMediaItem(item.id)
            } catch (error) {
              console.error('Error deleting item:', item.title, error)
            }
          }
          
          // Reload media data to refresh the UI
          await loadMedia()

          alert(`Successfully deleted ${itemCount} items from "${categoryName}"`)
        } catch (error) {
          console.error('Error deleting items:', error)
          alert('Error occurred while deleting items. Please try again.')
        }
      }
    }

    // TXT Import functions
    const handleTxtFileUpload = (event) => {
      const file = event.target.files[0]
      if (!file) return

      if (!file.name.toLowerCase().endsWith('.txt')) {
        alert('Bitte wählen Sie eine .txt Datei aus.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        processTxtContent(content)
      }
      reader.readAsText(file, 'UTF-8')
    }

    const processTxtContent = (content) => {
      // Split content into lines and clean them
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

      if (lines.length === 0) {
        alert('Die TXT-Datei ist leer oder enthält keine gültigen Einträge.')
        return
      }

      // Get current category items
      const currentItems = mediaStore.filteredMedia
      const currentTitles = currentItems.map(item => item.title.toLowerCase().trim())

      // Find missing items
      const missingItems = lines.filter(line => {
        const normalizedLine = line.toLowerCase().trim()
        return !currentTitles.some(title => 
          title.includes(normalizedLine) || normalizedLine.includes(title)
        )
      })

      // Find existing items (for reference)
      const existingItems = lines.filter(line => {
        const normalizedLine = line.toLowerCase().trim()
        return currentTitles.some(title => 
          title.includes(normalizedLine) || normalizedLine.includes(title)
        )
      })

      // Store results
      txtImportResults.value = {
        totalInFile: lines.length,
        missingItems: missingItems,
        existingItems: existingItems,
        currentCategory: currentCategory.value,
        categoryName: getCategoryDisplayName(currentCategory.value)
      }

      showTxtImportModal.value = false
    }

    const closeTxtImportResults = () => {
      txtImportResults.value = null
    }

    // Lifecycle
    onMounted(async () => {
      await authStore.initializeAuth()
      await loadMedia()
    })

    return {
      // State
      sidebarCollapsed,
      mobileSidebarOpen,
      showLoginModal,
      showRegisterModal,
      showEditModal,
      showFloatingMenu,
      showTxtImportModal,
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
      navigateToStatistics,
      navigateToProfile,
      togglePlatformFilter,
      toggleGenreFilter,
      editItem,
      switchToRegister,
      handleLoginSuccess,
      handleRegisterSuccess,
      closeEditModal,
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
      handleTxtFileUpload,
      processTxtContent,
      closeTxtImportResults
    }
  }
}
</script>

<style scoped>

/* Floating Action Button Styles */
.floating-actions {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: none;
}

.floating-actions > * {
  pointer-events: auto;
}

.floating-add-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #1a73e8;
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 300;
}

@media (max-width: 768px) {
  .floating-add-btn {
    width: 64px;
    height: 64px;
    font-size: 1.8rem;
    bottom: 80px; /* Move up to avoid mobile browser UI */
  }
}

.floating-add-btn:hover {
  background: #1557b0;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.floating-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 8px;
  display: none;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .floating-menu {
    bottom: 80px;
    right: -10px;
    min-width: 200px;
  }
}

.floating-menu.show {
  display: flex;
}

.floating-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px; /* Larger for touch */
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
  min-height: 48px; /* Touch-friendly */
}

.floating-menu-item:hover {
  background: #3a3a3a;
  color: #e0e0e0;
}

.menu-icon {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.menu-text {
  font-weight: 500;
}

/* Delete All Item in Floating Menu */
.delete-all-item {
  background: #8B0000 !important;
  border: 1px solid #A52A2A !important;
  color: #ffffff !important;
}

.delete-all-item:hover {
  background: #A52A2A !important;
  border-color: #DC143C !important;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(139, 0, 0, 0.4);
}

.item-count-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
}

/* TXT Import Modal Styles */
.file-upload-area {
  margin: 20px 0;
  text-align: center;
}

.file-upload-label {
  display: inline-block;
  padding: 40px 20px;
  border: 2px dashed #4a9eff;
  border-radius: 8px;
  background: #2d2d2d;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 300px;
}

.file-upload-label:hover {
  border-color: #3a8eef;
  background: #333333;
}

.upload-icon {
  display: block;
  font-size: 48px;
  margin-bottom: 10px;
}

.upload-text {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 5px;
}

.upload-hint {
  display: block;
  font-size: 12px;
  color: #a0a0a0;
}

/* Results Modal Styles */
.results-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
  padding: 20px;
  background: #3a3a3a;
  border-radius: 8px;
  border: 1px solid #555;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-label {
  font-size: 12px;
  color: #a0a0a0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
}

.summary-value.existing {
  color: #27ae60;
}

.summary-value.missing {
  color: #e74c3c;
}

.missing-items,
.existing-items {
  margin: 20px 0;
}

.missing-items h3,
.existing-items h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #e0e0e0;
}

.items-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #555;
  border-radius: 4px;
  background: #2d2d2d;
}

.missing-item,
.existing-item {
  padding: 8px 12px;
  border-bottom: 1px solid #404040;
  font-size: 14px;
  color: #e0e0e0;
}

.missing-item:last-child,
.existing-item:last-child {
  border-bottom: none;
}

.missing-item {
  background: rgba(231, 76, 60, 0.1);
  border-left: 3px solid #e74c3c;
}

.existing-item {
  background: rgba(39, 174, 96, 0.1);
  border-left: 3px solid #27ae60;
}

@media (max-width: 768px) {
  .results-summary {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .file-upload-label {
    min-width: 250px;
    padding: 30px 15px;
  }
  
  .upload-icon {
    font-size: 36px;
  }
}
</style>

