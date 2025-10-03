<template>
  <div class="vue-app">
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" :class="{ show: mobileSidebarOpen }" @click="closeMobileSidebar"></div>
    
    <!-- Sidebar -->
    <Sidebar
      :collapsed="sidebarCollapsed"
      :mobile-open="mobileSidebarOpen"
      :is-logged-in="isLoggedIn"
      :is-admin="isAdmin"
      :user-name="userName"
      :current-category="currentCategory"
      :category-counts="categoryCounts"
      :platforms="platforms"
      :genres="genres"
      :categories="categories"
      @toggle="toggleSidebar"
      @set-category="setCategory"
      @navigate-to-statistics="navigateToStatistics"
      @navigate-to-calendar="navigateToCalendar"
      @navigate-to-features="navigateToFeatures"
      @navigate-to-profile="navigateToProfile"
      @navigate-to-admin="navigateToAdmin"
      @toggle-platform-filter="togglePlatformFilter"
      @toggle-genre-filter="toggleGenreFilter"
      @toggle-airing-filter="toggleAiringFilter"
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
        @toggle-mobile-sidebar="toggleMobileSidebar"
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
          <div class="grid" :style="{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
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
      @save="handleBulkAddItems"
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
      :category-name="getCategoryDisplayName(currentCategory)"
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
import { onMounted, onUnmounted } from 'vue'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { useMediaStore } from '@/stores/media'
import { useMessageStore } from '@/stores/message'
import { useConfirmStore } from '@/stores/confirm'
import { useInputStore } from '@/stores/input'
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
    const {
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
      toggleAiringFilter,
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
      navigateToStatistics,
      navigateToCalendar,
      navigateToFeatures,
      navigateToProfile,
      navigateToAdmin,
      processTxtContent,
      closeTxtImportResults,
      cleanup
    } = useMediaLibrary()

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
      navigateToStatistics,
      navigateToCalendar,
      navigateToFeatures,
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
      inputStore
    }
  }
}
</script>

<style scoped>
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
</style>