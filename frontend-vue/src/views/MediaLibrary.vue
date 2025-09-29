<template>
  <div class="vue-app">
    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar" :class="{ collapsed: sidebarCollapsed }">
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
            @delete="deleteItem"
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
    />

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
        <button class="floating-menu-item" @click="importFromAPI">
          <span class="menu-icon">🌐</span>
          <span class="menu-text">Import from API</span>
        </button>
        <button class="floating-menu-item" @click="createCollection">
          <span class="menu-icon">📚</span>
          <span class="menu-text">Create Collection</span>
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
    const showLoginModal = ref(false)
    const showRegisterModal = ref(false)
    const showEditModal = ref(false)
    const showFloatingMenu = ref(false)
    const editingItem = ref(null)
    const gridColumns = ref(8)
    const sortBy = ref('order_asc')
    

    // Categories
    const categories = [
      { key: 'game', name: 'Games', icon: '🎮' },
      { key: 'series', name: 'Series', icon: '📺' },
      { key: 'movie', name: 'Movies', icon: '🎬' },
      { key: 'games_new', name: 'Games New', icon: '🎯' },
      { key: 'series_new', name: 'Series New', icon: '⭐' },
      { key: 'movie_new', name: 'Movies New', icon: '✨' }
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
      // Mobile sidebar toggle logic
    }

    const setCategory = (category) => {
      mediaStore.setCategory(category)
    }

    const clearSearch = () => {
      mediaStore.setSearchQuery('')
    }

    const navigateToStatistics = () => {
      router.push('/statistics')
    }

    const navigateToProfile = () => {
      router.push('/profile')
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

    const deleteItem = async (item) => {
      if (confirm('Are you sure you want to delete this item?')) {
        await mediaStore.deleteMediaItem(item.id)
      }
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
      // TODO: Implement collection creation
      alert('Collection creation feature coming soon!')
    }

    // Lifecycle
    onMounted(async () => {
      await authStore.initializeAuth()
      await loadMedia()
    })

    return {
      // State
      sidebarCollapsed,
      showLoginModal,
      showRegisterModal,
      showEditModal,
      showFloatingMenu,
      editingItem,
      gridColumns,
      sortBy,
      categories,
      
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
      setCategory,
      clearSearch,
      navigateToStatistics,
      navigateToProfile,
      togglePlatformFilter,
      toggleGenreFilter,
      editItem,
      deleteItem,
      switchToRegister,
      handleLoginSuccess,
      handleRegisterSuccess,
      closeEditModal,
      handleSaveItem,
      logout,
      loadMedia,
      toggleFloatingMenu,
      addNewItem,
      bulkAddItems,
      importFromAPI,
      createCollection
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

.floating-menu.show {
  display: flex;
}

.floating-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
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
</style>

