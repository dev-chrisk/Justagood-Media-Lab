<template>
  <div class="vue-app">
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" :class="{ show: sidebarStore.mobileOpen }" @click="sidebarStore.closeMobileSidebar"></div>
    
    <!-- Sidebar -->
    <Sidebar
      :collapsed="sidebarStore.collapsed"
      :mobile-open="sidebarStore.mobileOpen"
      :is-logged-in="isLoggedIn"
      :is-admin="isAdmin"
      :user-name="userName"
      :current-category="currentCategory"
      :category-counts="categoryCounts"
      :platforms="platforms"
      :genres="genres"
      :categories="categories"
      @toggle="sidebarStore.toggleSidebar"
      @set-category="setCategory"
      @navigate-to-calendar="navigateToCalendar"
      @navigate-to-profile="navigateToProfile"
      @navigate-to-admin="debugNavigateToAdmin"
      @toggle-platform-filter="togglePlatformFilter"
      @toggle-genre-filter="toggleGenreFilter"
      @toggle-airing-filter="toggleAiringFilter"
      @clear-filters="clearFilters"
      @add-item="addItemFromSidebar"
      @show-login="showLoginModal = true"
      @show-register="showRegisterModal = true"
      @show-admin-login="showAdminLogin"
      @logout="logout"
    />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <MainHeader
        v-model:search-query="searchQuery"
        v-model:grid-columns="gridColumns"
        v-model:sort-by="sortBy"
        @toggle-mobile-sidebar="sidebarStore.toggleMobileSidebar"
        @clear-search="clearSearch"
      />

      <!-- Content Area -->
      <main class="content-area">
        <LoadingSpinner v-if="loading" message="Loading media data..." />
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="loadMedia">Retry</button>
        </div>
        
        <div v-else>
          <!-- Statistics View -->
          <div v-if="currentCategory === 'statistics'" class="statistics-container">
            <div class="statistics-header">
              <h1>📊 Media Library Statistics</h1>
              <p>Übersicht über deine Media Collection</p>
              <div class="refresh-controls">
                <button class="refresh-btn" @click="loadMedia">🔄 Refresh Statistics</button>
              </div>
            </div>

            <div class="statistics-content">
              <!-- Summary Cards -->
              <div class="stats-summary">
                <div class="summary-card">
                  <div class="summary-number">{{ statistics.totalItems }}</div>
                  <div class="summary-label">Total Items</div>
                </div>
                <div class="summary-card">
                  <div class="summary-number">{{ statistics.totalCollections }}</div>
                  <div class="summary-label">Collections</div>
                </div>
                <div class="summary-card">
                  <div class="summary-number">{{ statistics.totalPlaytime }}h</div>
                  <div class="summary-label">Total Playtime</div>
                </div>
                <div class="summary-card">
                  <div class="summary-number">{{ statistics.avgRating }}</div>
                  <div class="summary-label">Avg Rating</div>
                </div>
              </div>

              <!-- Category Distribution -->
              <div class="chart-container">
                <h3 class="chart-title">📈 Category Distribution</h3>
                <div class="category-stats">
                  <div 
                    v-for="(count, category) in statistics.categoryDistribution" 
                    :key="category"
                    class="category-stat"
                  >
                    <div class="category-name">{{ category }}</div>
                    <div class="category-bar">
                      <div 
                        class="category-fill" 
                        :style="{ width: `${(count / statistics.totalItems) * 100}%` }"
                      ></div>
                    </div>
                    <div class="category-count">{{ count }} ({{ ((count / statistics.totalItems) * 100).toFixed(1) }}%)</div>
                  </div>
                </div>
              </div>

              <!-- Rating Distribution -->
              <div class="chart-container">
                <h3 class="chart-title">⭐ Rating Distribution</h3>
                <div class="rating-stats">
                  <div 
                    v-for="(count, rating) in statistics.ratingDistribution" 
                    :key="rating"
                    class="rating-stat"
                  >
                    <div class="rating-stars">{{ getRatingStars(rating) }}</div>
                    <div class="rating-bar">
                      <div 
                        class="rating-fill" 
                        :style="{ width: `${(count / statistics.totalItems) * 100}%` }"
                      ></div>
                    </div>
                    <div class="rating-count">{{ count }} ({{ ((count / statistics.totalItems) * 100).toFixed(1) }}%)</div>
                  </div>
                </div>
              </div>

              <!-- Platform Distribution -->
              <div class="chart-container">
                <h3 class="chart-title">🎮 Platform Distribution</h3>
                <div class="platform-stats">
                  <div 
                    v-for="(count, platform) in statistics.platformDistribution" 
                    :key="platform"
                    class="platform-stat"
                  >
                    <div class="platform-name">{{ platform }}</div>
                    <div class="platform-bar">
                      <div 
                        class="platform-fill" 
                        :style="{ width: `${(count / statistics.totalItems) * 100}%` }"
                      ></div>
                    </div>
                    <div class="platform-count">{{ count }} ({{ ((count / statistics.totalItems) * 100).toFixed(1) }}%)</div>
                  </div>
                </div>
              </div>

              <!-- Genre Distribution -->
              <div class="chart-container">
                <h3 class="chart-title">🎭 Top Genres</h3>
                <div class="genre-stats">
                  <div 
                    v-for="(count, genre) in statistics.genreDistribution" 
                    :key="genre"
                    class="genre-stat"
                  >
                    <div class="genre-name">{{ genre }}</div>
                    <div class="genre-bar">
                      <div 
                        class="genre-fill" 
                        :style="{ width: `${(count / statistics.totalItems) * 100}%` }"
                      ></div>
                    </div>
                    <div class="genre-count">{{ count }} ({{ ((count / statistics.totalItems) * 100).toFixed(1) }}%)</div>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div class="chart-container">
                <h3 class="chart-title">📅 Recent Activity</h3>
                <div class="recent-activity">
                  <div 
                    v-for="item in statistics.recentActivity" 
                    :key="item.title"
                    class="activity-item"
                  >
                    <div class="activity-title">{{ item.title }}</div>
                    <div class="activity-category">{{ item.category }}</div>
                    <div class="activity-date">{{ formatDate(item.discovered) }}</div>
                  </div>
                </div>
              </div>

              <!-- Airing Series -->
              <div class="chart-container">
                <h3 class="chart-title">📺 Currently Airing Series</h3>
                <div class="airing-series">
                  <div 
                    v-for="series in statistics.airingSeries" 
                    :key="series.title"
                    class="airing-item"
                  >
                    <div class="airing-title">{{ series.title }}</div>
                    <div class="airing-next">Next: Season {{ series.nextSeason }}</div>
                    <div class="airing-date">{{ series.nextSeasonRelease ? formatDate(series.nextSeasonRelease) : 'TBA' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Regular Media Grid -->
          <div v-else class="grid" :style="{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
            <MediaItem 
              v-for="item in paginatedMedia" 
              :key="item.id" 
              :item="item"
              @edit="editItem"
            />
          </div>
        </div>
      </main>
    </div>

    <!-- Admin Setup Button (only show when not logged in) -->
    <div v-if="!isLoggedIn" class="admin-setup-container">
      <button 
        @click="handleAdminSetup" 
        :disabled="adminSetupLoading"
        class="admin-setup-btn"
        title="Setup Admin Account (Creates admin account with default password)"
      >
        <span v-if="adminSetupLoading">🔧 Setting up...</span>
        <span v-else>🔧 Admin Setup</span>
      </button>
      <div v-if="adminSetupMessage" class="admin-setup-message" :class="adminSetupMessage.type">
        {{ adminSetupMessage.text }}
      </div>
    </div>

    <!-- Modals -->
    <LoginModal 
      v-if="showLoginModal" 
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
      @switch-to-register="switchToRegister"
    />
    
    <RegisterModal 
      v-if="showRegisterModal" 
      @close="showRegisterModal = false"
      @success="handleRegisterSuccess"
    />

    <EditModal 
      v-if="showEditModal" 
      :item="editingItem"
      :current-category="currentCategory"
      @close="closeEditModal"
      @save="handleSaveItem"
      @delete="handleDeleteItem"
    />

    <!-- Bulk Add Modal -->
    <BulkAddModal
      :show="showBulkAddModal"
      :current-category="currentCategory"
      @close="closeBulkAddModal"
    />

    <!-- TXT Import Modals -->
    <TxtImportModal
      :show="showTxtImportModal"
      @close="showTxtImportModal = false"
      @file-processed="processTxtContent"
    />

    <TxtImportResultsModal
      :show="showTxtImportResults"
      :results="txtImportResults"
      @close="closeTxtImportResults"
    />

    <!-- Floating Action Button -->
    <FloatingActionButton
      :show-menu="showFloatingMenu"
      :show-delete-all="isLoggedIn && currentCategory !== 'all' && categoryCounts[currentCategory] > 0"
      :category-name="currentCategoryDisplayName"
      :item-count="categoryCounts[currentCategory] || 0"
      @toggle-menu="toggleFloatingMenu"
      @add-new-item="addNewItem"
      @bulk-add-items="bulkAddItems"
      @import-from-txt="importFromTxt"
      @import-from-api="importFromAPI"
      @create-collection="createCollection"
      @delete-all-in-category="deleteAllInCategory"
    />
    
    <!-- Message Box -->
    <MessageBox
      :show="messageStore.show"
      :type="messageStore.type"
      :title="messageStore.title"
      :message="messageStore.message"
      :details="messageStore.details"
      @close="messageStore.closeMessage"
    />
    
    <!-- Confirm Dialog -->
    <ConfirmDialog
      :show="confirmStore.show"
      :title="confirmStore.title"
      :message="confirmStore.message"
      @confirm="confirmStore.confirm"
      @close="confirmStore.cancel"
    />
    
    <!-- Input Dialog -->
    <InputDialog
      :show="inputStore.show"
      :title="inputStore.title"
      :message="inputStore.message"
      :placeholder="inputStore.placeholder"
      :input-type="inputStore.inputType"
      :default-value="inputStore.defaultValue"
      @confirm="inputStore.confirm"
      @close="inputStore.cancel"
    />
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { useMediaStore } from '@/stores/media'
import { useMessageStore } from '@/stores/message'
import { useConfirmStore } from '@/stores/confirm'
import { useInputStore } from '@/stores/input'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'
import MediaItem from '@/components/MediaItem.vue'
import Sidebar from '@/components/Sidebar.vue'
import MainHeader from '@/components/MainHeader.vue'
import FloatingActionButton from '@/components/FloatingActionButton.vue'
import LoginModal from '@/components/LoginModal.vue'
import RegisterModal from '@/components/RegisterModal.vue'
import EditModal from '@/components/EditModal.vue'
import BulkAddModal from '@/components/BulkAddModal.vue'
import TxtImportModal from '@/components/TxtImportModal.vue'
import TxtImportResultsModal from '@/components/TxtImportResultsModal.vue'
import SimpleAddItem from '@/components/SimpleAddItem.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import MessageBox from '@/components/MessageBox.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import InputDialog from '@/components/InputDialog.vue'

export default {
  name: 'MediaLibrary',
  components: {
    MediaItem,
    Sidebar,
    MainHeader,
    FloatingActionButton,
    LoginModal,
    RegisterModal,
    EditModal,
    BulkAddModal,
    TxtImportModal,
    TxtImportResultsModal,
    SimpleAddItem,
    LoadingSpinner,
    MessageBox,
    ConfirmDialog,
    InputDialog,
  },
  setup() {
    const mediaStore = useMediaStore()
    const messageStore = useMessageStore()
    const confirmStore = useConfirmStore()
    const inputStore = useInputStore()
    const authStore = useAuthStore()
    const sidebarStore = useSidebarStore()
    
    // Admin setup state
    const adminSetupLoading = ref(false)
    const adminSetupMessage = ref(null)
    const {
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
      platforms,
      genres,
      
      // Methods
      setCategory,
      clearSearch,
      togglePlatformFilter,
      toggleGenreFilter,
      toggleAiringFilter,
      clearFilters,
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
    } = useMediaLibrary()

    // Computed property for category display name to ensure it's always available
    const currentCategoryDisplayName = computed(() => {
      try {
        return getCategoryDisplayName ? getCategoryDisplayName(currentCategory.value) : currentCategory.value
      } catch (error) {
        console.error('Error getting category display name:', error)
        return currentCategory.value || 'Unknown'
      }
    })

    // Statistics computed property
    const statistics = computed(() => {
      const data = mediaStore.mediaData || []
      const stats = {
        totalItems: data.length,
        totalCollections: 0, // TODO: Implement collections
        totalPlaytime: 0,
        avgRating: 0,
        categoryDistribution: {},
        ratingDistribution: {},
        platformDistribution: {},
        genreDistribution: {},
        recentActivity: [],
        airingSeries: []
      }
      
      let totalRating = 0
      let ratedItems = 0
      
      data.forEach(item => {
        // Category distribution
        const category = item.category || 'unknown'
        stats.categoryDistribution[category] = (stats.categoryDistribution[category] || 0) + 1
        
        // Rating distribution
        if (item.rating && item.rating > 0) {
          const rating = Math.floor(item.rating)
          stats.ratingDistribution[rating] = (stats.ratingDistribution[rating] || 0) + 1
          totalRating += item.rating
          ratedItems++
        }
        
        // Platform distribution
        if (item.platforms && item.category === 'game') {
          const platforms = item.platforms.split(',').map(p => p.trim()).filter(p => p)
          platforms.forEach(platform => {
            stats.platformDistribution[platform] = (stats.platformDistribution[platform] || 0) + 1
          })
        }
        
        // Genre distribution
        if (item.genre && (item.category === 'series' || item.category === 'movie')) {
          const genres = item.genre.split(',').map(g => g.trim()).filter(g => g)
          genres.forEach(genre => {
            stats.genreDistribution[genre] = (stats.genreDistribution[genre] || 0) + 1
          })
        }
        
        // Total playtime
        if (item.spielzeit && item.spielzeit > 0) {
          stats.totalPlaytime += item.spielzeit
        }
        
        // Airing series
        if (item.category === 'series' && item.isAiring === true) {
          stats.airingSeries.push({
            title: item.title,
            nextSeason: item.nextSeason,
            nextSeasonRelease: item.nextSeasonRelease
          })
        }
        
        // Recent activity (last 30 days)
        if (item.discovered) {
          const discoveredDate = new Date(item.discovered)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          
          if (discoveredDate >= thirtyDaysAgo) {
            stats.recentActivity.push({
              title: item.title,
              category: item.category,
              discovered: item.discovered
            })
          }
        }
      })
      
      // Calculate average rating
      if (ratedItems > 0) {
        stats.avgRating = (totalRating / ratedItems).toFixed(1)
      }
      
      // Convert playtime to hours
      stats.totalPlaytime = Math.round(stats.totalPlaytime / 60)
      
      // Sort recent activity by date
      stats.recentActivity.sort((a, b) => new Date(b.discovered) - new Date(a.discovered))
      
      return stats
    })

    // Format date function
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString()
    }

    // Get rating stars function
    const getRatingStars = (rating) => {
      const numRating = Math.max(0, Math.min(5, parseInt(rating) || 0))
      const filledStars = '★'.repeat(numRating)
      const emptyStars = '☆'.repeat(5 - numRating)
      return filledStars + emptyStars
    }

    const addItemFromSidebar = (category) => {
      // Set the category and open the edit modal for adding a new item
      setCategory(category)
      addNewItem()
    }

    // Auth methods
    const switchToRegister = () => {
      showLoginModal.value = false
      showRegisterModal.value = true
    }

    const showAdminLogin = () => {
      showLoginModal.value = true
      // Pre-fill admin credentials for easier access
      // This will be handled by the LoginModal component
    }

    const handleLoginSuccess = (loginData) => {
      showLoginModal.value = false
      
      
      loadMedia()
    }

    const handleRegisterSuccess = () => {
      showRegisterModal.value = false
      loadMedia()
    }

    const handleAdminSetup = async () => {
      adminSetupLoading.value = true
      adminSetupMessage.value = null
      
      try {
        console.log('🔧 Starting admin setup...')
        const result = await authStore.adminSetup()
        
        if (result.success) {
          console.log('✅ Admin setup successful:', result)
          adminSetupMessage.value = {
            type: 'success',
            text: `✅ Admin created and logged in! User: ${result.user.name} (${result.user.email})`
          }
          
          // Reload media data
          await loadMedia()
          
          // Clear message after 5 seconds
          setTimeout(() => {
            adminSetupMessage.value = null
          }, 5000)
        } else {
          console.log('ℹ️ Admin already exists:', result)
          adminSetupMessage.value = {
            type: 'info',
            text: `ℹ️ ${result.message} (${result.admin_count} admin(s) exist)`
          }
          
          // Clear message after 3 seconds
          setTimeout(() => {
            adminSetupMessage.value = null
          }, 3000)
        }
      } catch (error) {
        console.error('❌ Admin setup failed:', error)
        adminSetupMessage.value = {
          type: 'error',
          text: `❌ Admin setup failed: ${error.message || 'Unknown error'}`
        }
        
        // Clear message after 5 seconds
        setTimeout(() => {
          adminSetupMessage.value = null
        }, 5000)
      } finally {
        adminSetupLoading.value = false
      }
    }

    // DEBUG: Direct admin navigation function
    const debugNavigateToAdmin = () => {
      console.log('🔥 DEBUG: Direct admin navigation called!')
      console.log('🔥 DEBUG: Router object:', router)
      try {
        router.push('/admin')
        console.log('🔥 DEBUG: Successfully navigated to /admin!')
      } catch (error) {
        console.error('🔥 DEBUG: Error navigating to admin:', error)
      }
    }


    // Lifecycle
    onMounted(async () => {
      try {
        await loadMedia()
        
        // Initialize real-time updates only for authenticated users
        if (isLoggedIn.value) {
          try {
            mediaStore.initializeRealtimeUpdates()
          } catch (realtimeError) {
            console.error('Error initializing realtime updates:', realtimeError)
          }
        }
        
      } catch (error) {
        console.error('Error during initialization:', error)
      }
    })

    onUnmounted(() => {
      // Cleanup real-time updates only if they were initialized
      if (isLoggedIn.value) {
        try {
          mediaStore.cleanupRealtimeUpdates()
        } catch (error) {
          console.error('Error cleaning up realtime updates:', error)
        }
      }
      
      
      // Cleanup grid columns resize listener
      cleanup()
    })

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
      adminSetupLoading,
      adminSetupMessage,
      
      // Computed
      isLoggedIn,
      isAdmin,
      userName,
      currentCategory,
      currentCategoryDisplayName,
      searchQuery,
      categoryCounts,
      loading,
      error,
      paginatedMedia,
      platforms,
      genres,
      
      // Methods
      setCategory,
      clearSearch,
      navigateToCalendar,
      navigateToProfile,
      addItemFromSidebar,
      togglePlatformFilter,
      toggleGenreFilter,
      toggleAiringFilter,
      editItem,
      switchToRegister,
      showAdminLogin,
      handleLoginSuccess,
      handleRegisterSuccess,
      handleAdminSetup,
      debugNavigateToAdmin,
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
      closeTxtImportResults,
      
      // Message Store
      messageStore,
      
      // Confirm Store
      confirmStore,
      
      // Input Store
      inputStore,
      
      // Statistics
      statistics,
      formatDate,
      getRatingStars,
      
      // Sidebar Store
      sidebarStore
    }
  }
}
</script>

<style scoped>
/* Admin Setup Button */
.admin-setup-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.admin-setup-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-setup-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.admin-setup-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.admin-setup-message {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  max-width: 300px;
  word-wrap: break-word;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
}

.admin-setup-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.admin-setup-message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.admin-setup-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Vue App Layout */
.vue-app {
  display: flex;
  height: 100vh;
  background: #1a1a1a;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Content Area */
.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #1a1a1a;
}

/* Grid Layout */
.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* When gridColumns is set to 3, use fixed columns for better mobile display */
.grid[style*="repeat(3, 1fr)"] {
  grid-template-columns: repeat(3, 1fr);
}

/* Loading and Error States */
.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.loading p,
.error p {
  font-size: 16px;
  color: #a0a0a0;
  margin-bottom: 20px;
}

.error button {
  background: #4a9eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.error button:hover {
  background: #3a8eef;
}

/* Mobile Overlay for Sidebar */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.mobile-overlay.show {
  display: block;
}

/* Responsive Design */
@media (min-width: 1281px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 24px;
  }
}

@media (max-width: 1280px) and (min-width: 769px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 900px) and (min-width: 769px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 14px;
  }
}

@media (max-width: 768px) {
  .mobile-overlay.show {
    display: block;
  }
  
  .content-area {
    padding: 12px;
  }
  
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  
  /* When using 3 columns on mobile, ensure proper aspect ratio */
  .grid[style*="repeat(3, 1fr)"] {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .content-area {
    padding: 8px;
  }
  
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  /* When using 3 columns on small mobile, maintain proper spacing */
  .grid[style*="repeat(3, 1fr)"] {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
}

@media (max-width: 360px) {
  .content-area {
    padding: 6px;
  }
  
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
  
  /* When using 3 columns on very small mobile, ensure cards fit properly */
  .grid[style*="repeat(3, 1fr)"] {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
}

/* Touch-specific improvements */
@media (hover: none) and (pointer: coarse) {
  .error button {
    min-height: 44px;
  }
  
  .content-area {
    -webkit-overflow-scrolling: touch;
  }
}

/* Statistics Styles */
.statistics-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.statistics-header {
  text-align: center;
  margin-bottom: 30px;
}

.statistics-header h1 {
  margin: 0 0 10px 0;
  color: #e0e0e0;
  font-size: 24px;
}

.statistics-header p {
  margin: 0 0 20px 0;
  color: #a0a0a0;
  font-size: 16px;
}

.refresh-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.refresh-btn {
  background: #4a9eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #3a8eef;
  transform: translateY(-1px);
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  text-align: center;
  border: 1px solid #404040;
}

.summary-number {
  font-size: 2em;
  font-weight: bold;
  color: #4a9eff;
  margin-bottom: 5px;
}

.summary-label {
  color: #a0a0a0;
  font-size: 14px;
}

.chart-container {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
  border: 1px solid #404040;
}

.chart-title {
  margin: 0 0 20px 0;
  color: #e0e0e0;
  font-size: 18px;
}

.category-stats,
.rating-stats,
.platform-stats,
.genre-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-stat,
.rating-stat,
.platform-stat,
.genre-stat {
  display: flex;
  align-items: center;
  gap: 15px;
}

.category-name,
.rating-stars,
.platform-name,
.genre-name {
  min-width: 100px;
  font-weight: 500;
}

.category-bar,
.rating-bar,
.platform-bar,
.genre-bar {
  flex: 1;
  height: 20px;
  background: #3a3a3a;
  border-radius: 10px;
  overflow: hidden;
}

.category-fill,
.rating-fill,
.platform-fill,
.genre-fill {
  height: 100%;
  background: #4a9eff;
  transition: width 0.3s ease;
}

.category-count,
.rating-count,
.platform-count,
.genre-count {
  min-width: 80px;
  text-align: right;
  font-size: 12px;
  color: #a0a0a0;
}

.recent-activity,
.airing-series {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item,
.airing-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #3a3a3a;
  border-radius: 4px;
  border: 1px solid #555;
}

.activity-title,
.airing-title {
  font-weight: 500;
  flex: 1;
}

.activity-category,
.airing-next {
  color: #a0a0a0;
  font-size: 12px;
  margin: 0 10px;
}

.activity-date,
.airing-date {
  color: #888;
  font-size: 12px;
}

/* Mobile Statistics Styles */
@media (max-width: 768px) {
  .statistics-container {
    padding: 15px;
  }
  
  .stats-summary {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .summary-card {
    padding: 15px;
  }
  
  .summary-number {
    font-size: 1.5em;
  }
  
  .chart-container {
    padding: 15px;
    margin-bottom: 15px;
  }
  
  .category-stat,
  .rating-stat,
  .platform-stat,
  .genre-stat {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .category-name,
  .rating-stars,
  .platform-name,
  .genre-name {
    min-width: auto;
    font-size: 14px;
  }
  
  .category-bar,
  .rating-bar,
  .platform-bar,
  .genre-bar {
    width: 100%;
    height: 16px;
  }
  
  .category-count,
  .rating-count,
  .platform-count,
  .genre-count {
    min-width: auto;
    text-align: left;
    font-size: 11px;
  }
}
</style>