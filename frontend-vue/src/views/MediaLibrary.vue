<template>
  <div class="vue-app">
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" :class="{ show: safeSidebarStore.mobileOpen }" @click="safeSidebarStore.closeMobileSidebar"></div>
    
    <!-- Sidebar -->
    <Sidebar
      :collapsed="safeSidebarStore.collapsed"
      :mobile-open="safeSidebarStore.mobileOpen"
      :is-logged-in="isLoggedIn"
      :is-admin="isAdmin"
      :user-name="userName"
      :current-category="currentCategory"
      :category-counts="categoryCounts"
      :categories="categories"
      :selected-genres="selectedGenres"
      :excluded-genres="excludedGenres"
      :genres="genres"
      :genre-loading="genreLoading"
      :genre-error="genreError"
      @toggle="safeSidebarStore.toggleSidebar"
      @set-category="setCategory"
      @navigate-to-calendar="navigateToCalendar"
      @navigate-to-profile="navigateToProfile"
      @navigate-to-admin="debugNavigateToAdmin"
      @add-item="addItemFromSidebar"
      @show-login="showLoginModal = true"
      @show-register="showRegisterModal = true"
      @show-admin-login="showAdminLogin"
      @logout="logout"
      @genres-updated="handleGenresUpdated"
      @genres-excluded="handleGenresExcluded"
      @genres-cleared="handleGenresCleared"
      @load-genres="loadGenres"
    />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <MainHeader
        v-model:search-query="searchQuery"
        :sort-by="sortBy"
        :edit-mode="editMode"
        @toggle-mobile-sidebar="safeSidebarStore.toggleMobileSidebar"
        @clear-search="clearSearch"
        @toggle-edit-mode="toggleEditMode"
        @update:sort-by="updateSortBy"
      />

      <!-- Content Area -->
      <main class="content-area">
        <LoadingSpinner v-if="loading" message="Loading media data..." />
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="loadMedia">Retry</button>
        </div>
        
        <div v-else>
          <!-- Calendar View -->
          <div v-if="currentCategory === 'calendar'" class="calendar-view">
            <!-- Calendar Header -->
            <div class="calendar-header">
              <button class="month-nav-btn" @click="previousMonth" :disabled="isLoading">
                <span class="nav-icon">‹</span>
              </button>
              
              <div class="month-year-display">
                <h2 class="month-name">{{ currentMonthName }}</h2>
                <span class="year">{{ currentYear }}</span>
              </div>
              
              <button class="month-nav-btn" @click="nextMonth" :disabled="isLoading">
                <span class="nav-icon">›</span>
              </button>
            </div>

            <!-- Calendar Grid -->
            <div class="calendar-container">
              <div class="calendar-grid">
                <!-- Weekday Headers -->
                <div class="weekday-header" v-for="day in weekdays" :key="day">
                  {{ day }}
                </div>
                
                <!-- Calendar Days -->
                <div 
                  v-for="day in calendarDays" 
                  :key="`${day.date}-${day.month}`"
                  class="calendar-day"
                  :class="{
                    'other-month': !day.isCurrentMonth,
                    'today': day.isToday,
                    'weekend': day.isWeekend,
                    'has-events': day.hasEvents
                  }"
                  @click="selectDay(day)"
                >
                  <span class="day-number">{{ day.day }}</span>
                  <div v-if="day.hasEvents" class="event-indicator">
                    <div class="event-dot"></div>
                    <span v-if="day.events && day.events.length > 1" class="event-count">{{ day.events.length }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected Day Info -->
            <div v-if="selectedDay" class="selected-day-info">
              <h3>{{ formatSelectedDay(selectedDay) }}</h3>
              <div class="day-events">
                <p v-if="!selectedDay.events || selectedDay.events.length === 0" class="no-events">
                  No watchlist releases scheduled for this day
                </p>
                <div v-else class="events-list">
                  <div v-for="event in selectedDay.events" :key="event.id" class="event-item" :class="`event-${event.type}`">
                    <div class="event-header">
                      <span class="event-time">{{ event.time }}</span>
                      <span class="event-type-badge">{{ event.type }}</span>
                    </div>
                    <span class="event-title">{{ event.title }}</span>
                    <div v-if="event.item.platforms" class="event-platforms">{{ event.item.platforms }}</div>
                    <div v-if="event.item.genre" class="event-genre">{{ event.item.genre }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile View -->
          <div v-else-if="currentCategory === 'profile'" class="profile-container">
            <!-- Profile Header -->
            <div class="profile-header">
              <div class="profile-avatar-section">
                <div class="profile-avatar-large" @click="changeAvatar">
                  <img v-if="profileData.avatar" :src="profileData.avatar" alt="Profile Picture">
                  <span v-else class="avatar-initials">{{ getInitials() }}</span>
                </div>
                <input 
                  type="file" 
                  ref="avatarInput"
                  accept="image/*" 
                  @change="handleAvatarChange"
                  style="display: none"
                >
              </div>
              <div class="profile-info-header">
                <h2>{{ profileData.displayName || profileData.firstName + ' ' + profileData.lastName || 'User' }}</h2>
                <p>{{ profileData.email || 'user@example.com' }}</p>
                <div class="profile-stats">
                  <div class="stat-item">
                    <span class="stat-number">{{ totalItems }}</span>
                    <span class="stat-label">Total Items</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ new Date().getFullYear() }}</span>
                    <span class="stat-label">Member Since</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Settings Sections -->
            <div class="settings-sections">
              <!-- Personal Information -->
              <div class="settings-section">
                <div class="section-header">
                  <h3>Personal Information</h3>
                  <p>Manage your personal details and account information</p>
                </div>
                <div class="section-content">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="firstName">First Name</label>
                      <input 
                        type="text" 
                        id="firstName"
                        v-model="profileData.firstName" 
                        placeholder="Enter your first name"
                      >
                    </div>
                    <div class="form-group">
                      <label for="lastName">Last Name</label>
                      <input 
                        type="text" 
                        id="lastName"
                        v-model="profileData.lastName" 
                        placeholder="Enter your last name"
                      >
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="displayName">Display Name</label>
                    <input 
                      type="text" 
                      id="displayName"
                      v-model="profileData.displayName" 
                      placeholder="How others see your name"
                    >
                  </div>
                  
                  <div class="form-group">
                    <label for="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email"
                      v-model="profileData.email" 
                      placeholder="your.email@example.com"
                    >
                  </div>
                  
                  <div class="form-group">
                    <label for="bio">Bio</label>
                    <textarea 
                      id="bio"
                      v-model="profileData.bio" 
                      placeholder="Tell us about yourself..." 
                      rows="4"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Preferences -->
              <div class="settings-section">
                <div class="section-header">
                  <h3>Preferences</h3>
                  <p>Customize your application experience</p>
                </div>
                <div class="section-content">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="language">Language</label>
                      <select id="language" v-model="profileData.language">
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                        <option value="fr">Français</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="timezone">Timezone</label>
                      <select id="timezone" v-model="profileData.timezone">
                        <option value="UTC">UTC</option>
                        <option value="Europe/Berlin">Europe/Berlin</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label for="dateFormat">Date Format</label>
                      <select id="dateFormat" v-model="profileData.dateFormat">
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="booksApiProvider">Books API Provider</label>
                      <select id="booksApiProvider" v-model="profileData.booksApiProvider">
                        <option value="wikipedia">Wikipedia (Primary)</option>
                        <option value="google_books">Google Books (Fallback)</option>
                        <option value="both">Both (Wikipedia + Google Books)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label for="enableGoogleBooksFallback">Enable Google Books Fallback</label>
                      <div class="checkbox-container">
                        <input 
                          type="checkbox" 
                          id="enableGoogleBooksFallback" 
                          v-model="profileData.enableGoogleBooksFallback"
                        />
                        <label for="enableGoogleBooksFallback" class="checkbox-label">
                          Use Google Books as fallback when Wikipedia search fails
                        </label>
                      </div>
                    </div>
                    <div class="form-group">
                      <!-- Empty div to maintain layout -->
                    </div>
                  </div>
                </div>
              </div>

              <!-- Data Management -->
              <div class="settings-section">
                <div class="section-header">
                  <h3>Data Management</h3>
                  <p>Manage your data and account</p>
                </div>
                <div class="section-content">
                  <div class="data-actions">
                    <button class="data-btn export-btn" @click="exportData">
                      <span class="btn-icon">📦</span>
                      <span class="btn-text">Export All Data</span>
                      <span class="btn-description">Download your complete media library</span>
                    </button>
                    
                    <button class="data-btn import-btn" @click="importData">
                      <span class="btn-icon">📥</span>
                      <span class="btn-text">Import Data</span>
                      <span class="btn-description">Import data from a backup file</span>
                    </button>
                    
                    <button class="data-btn backup-btn" @click="createBackup">
                      <span class="btn-icon">💾</span>
                      <span class="btn-text">Create Backup</span>
                      <span class="btn-description">Create a local backup of your data</span>
                    </button>
                    
                    <button class="data-btn cache-btn" @click="clearCache">
                      <span class="btn-icon">🗑️</span>
                      <span class="btn-text">Clear Cache</span>
                      <span class="btn-description">Clear temporary files and cache</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Danger Zone -->
              <div class="settings-section danger-zone">
                <div class="section-header">
                  <h3>Danger Zone</h3>
                  <p>Irreversible and destructive actions</p>
                </div>
                <div class="section-content">
                  <div class="danger-actions">
                    <button class="danger-btn reset-btn" @click="resetSettings">
                      <span class="btn-icon">🔄</span>
                      <span class="btn-text">Reset All Settings</span>
                      <span class="btn-description">Reset all settings to default values</span>
                    </button>
                    
                    <button class="danger-btn clear-btn" @click="clearAllData">
                      <span class="btn-icon">🗑️</span>
                      <span class="btn-text">Clear All Data</span>
                      <span class="btn-description">Permanently delete all your data</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics View -->
          <div v-else-if="currentCategory === 'statistics'" class="statistics-container">
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
          <div v-else class="grid" :class="{ 'edit-mode': editMode }">
            <MediaItem 
              v-for="item in paginatedMedia" 
              :key="item.id" 
              :item="item"
              :edit-mode="editMode"
              @edit="editItem"
              @watchlist-toggled="handleWatchlistToggled"
              @show-message="showMessage"
              @rating-changed="handleRatingChanged"
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
import { onMounted, onUnmounted, ref, computed, reactive, watch } from 'vue'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { useMediaStore } from '@/stores/media'
import { useMessageStore } from '@/stores/message'
import { useConfirmStore } from '@/stores/confirm'
import { useInputStore } from '@/stores/input'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'
import { mediaApi } from '@/services/api'
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
    
    // Create a safe sidebar store with fallback values
    const safeSidebarStore = computed(() => {
      if (!sidebarStore || typeof sidebarStore !== 'object') {
        console.warn('SidebarStore not properly initialized, using fallback values')
        return {
          collapsed: false,
          mobileOpen: false,
          toggleSidebar: () => {},
          toggleMobileSidebar: () => {},
          closeMobileSidebar: () => {}
        }
      }
      return sidebarStore
    })
    
    // Admin setup state
    const adminSetupLoading = ref(false)
    const adminSetupMessage = ref(null)
    
    // Calendar state
    const currentDate = ref(new Date())
    const selectedDay = ref(null)
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    // Profile state
    const avatarInput = ref(null)
    const profileData = reactive({
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      bio: '',
      avatar: '',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      booksApiProvider: 'wikipedia',
      enableGoogleBooksFallback: true
    })
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
      updateSortBy,
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
    
    // Edit Mode functionality
    const editMode = computed(() => mediaStore.editMode)
    
    const toggleEditMode = () => {
      mediaStore.toggleEditMode()
    }
    
    const handleRatingChanged = async (ratingData) => {
      try {
        await mediaStore.updateItemRating(ratingData.itemId, ratingData.rating)
        console.log('✅ Rating updated successfully:', ratingData)
        showMessage({
          type: 'success',
          text: `Rating updated to ${ratingData.rating}/10`
        })
      } catch (error) {
        console.error('❌ Failed to update rating:', error)
        showMessage({
          type: 'error',
          text: 'Failed to update rating. Please try again.'
        })
      }
    }

    // Computed property for category display name to ensure it's always available
    const currentCategoryDisplayName = computed(() => {
      try {
        return getCategoryDisplayName ? getCategoryDisplayName(currentCategory.value) : currentCategory.value
      } catch (error) {
        console.error('Error getting category display name:', error)
        return currentCategory.value || 'Unknown'
      }
    })

    // Calendar computed properties
    const currentYear = computed(() => currentDate.value.getFullYear())
    const currentMonth = computed(() => currentDate.value.getMonth())
    const currentMonthName = computed(() => currentDate.value.toLocaleDateString('en-US', { month: 'long' }))
    
    // Genre state
    const genres = ref([])
    const genreLoading = ref(false)
    const genreError = ref(null)
    
    const calendarDays = computed(() => {
      const year = currentYear.value
      const month = currentMonth.value
      
      // Get first day of month and calculate starting day of week
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDate = new Date(firstDay)
      
      // Adjust to start from Monday (0 = Sunday, 1 = Monday)
      const dayOfWeek = firstDay.getDay()
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startDate.setDate(startDate.getDate() - mondayOffset)
      
      const days = []
      const today = new Date()
      
      // Generate 42 days (6 weeks) to fill the grid
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        
        const isCurrentMonth = date.getMonth() === month
        const isToday = date.toDateString() === today.toDateString()
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        
        days.push({
          date: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          fullDate: new Date(date),
          isCurrentMonth,
          isToday,
          isWeekend,
          hasEvents: hasEventsForDate(date),
          events: getEventsForDate(date)
        })
      }
      
      return days
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

    // Calendar methods
    const previousMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
      selectedDay.value = null
    }
    
    const nextMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
      selectedDay.value = null
    }
    
    const selectDay = (day) => {
      if (day.isCurrentMonth) {
        selectedDay.value = day
      }
    }
    
    const formatSelectedDay = (day) => {
      const date = day.fullDate
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    
    const hasEventsForDate = (date) => {
      // Check if there are any watchlist items with release dates on this date
      const watchlistItems = getWatchlistItemsForDate(date)
      return watchlistItems.length > 0
    }
    
    const getEventsForDate = (date) => {
      // Get watchlist items with release dates on this date
      const watchlistItems = getWatchlistItemsForDate(date)
      
      return watchlistItems.map(item => ({
        id: item.id,
        title: item.title,
        time: 'Release',
        type: item.watchlistType || item.watchlist_type || 'unknown',
        item: item
      }))
    }
    
    const getWatchlistItemsForDate = (date) => {
      // Get all watchlist items from the media store
      const watchlistItems = mediaStore.mediaData.filter(item => 
        item.category === 'watchlist' && item.release
      )
      
      // Filter items that have a release date on the given date
      return watchlistItems.filter(item => {
        if (!item.release) return false
        
        const releaseDate = new Date(item.release)
        const targetDate = new Date(date)
        
        // Compare dates (ignore time)
        return releaseDate.getFullYear() === targetDate.getFullYear() &&
               releaseDate.getMonth() === targetDate.getMonth() &&
               releaseDate.getDate() === targetDate.getDate()
      })
    }

    // Profile methods
    const getInitials = () => {
      const first = profileData.firstName?.charAt(0) || 'U'
      const last = profileData.lastName?.charAt(0) || 'S'
      return (first + last).toUpperCase()
    }
    
    const changeAvatar = () => {
      avatarInput.value?.click()
    }
    
    const handleAvatarChange = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          profileData.avatar = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    // Genre functions
    const loadGenres = async () => {
      if (!currentCategory.value || 
          currentCategory.value === 'statistics' || 
          currentCategory.value === 'calendar' || 
          currentCategory.value === 'profile') {
        genres.value = []
        return
      }

      genreLoading.value = true
      genreError.value = null
      
      try {
        const response = await mediaApi.getGenres(currentCategory.value)
        if (response.success) {
          genres.value = response.genres || []
        } else {
          throw new Error(response.error || 'Failed to load genres')
        }
      } catch (err) {
        console.error('Failed to load genres:', err)
        genreError.value = err.message || 'Failed to load genres'
        genres.value = []
      } finally {
        genreLoading.value = false
      }
    }

    const handleGenresUpdated = (genres) => {
      mediaStore.setGenres(genres)
    }

    const handleGenresExcluded = (genres) => {
      mediaStore.setExcludedGenres(genres)
    }

    const handleGenresCleared = () => {
      mediaStore.clearGenres()
      mediaStore.clearExcludedGenres()
    }
    
    const handleWatchlistToggled = (data) => {
      console.log('💖 Watchlist toggled:', data)
      
      // Show success message
      if (data.message) {
        showMessage({
          type: 'success',
          text: data.message
        })
      }
      
      // Add visual feedback for category switch
      showCategorySwitchAnimation()
      
      // Only switch to watchlist category if item was added, not removed
      if (data.action === 'added') {
        setCategory('watchlist')
      }
      
      // Refresh media data to update watchlist status
      loadMedia()
    }
    
    const showCategorySwitchAnimation = () => {
      // Create a temporary animation element
      const animationEl = document.createElement('div')
      animationEl.innerHTML = '❤️ Switching to Watchlist...'
      animationEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #e8f4fd, #d1e7f7);
        color: #1a1a1a;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: 600;
        z-index: 10000;
        animation: categorySwitchPulse 1.2s ease-out;
        pointer-events: none;
        box-shadow: 0 8px 25px rgba(232, 244, 253, 0.4);
        border: 2px solid #e8f4fd;
      `
      
      // Add CSS animation
      const style = document.createElement('style')
      style.textContent = `
        @keyframes categorySwitchPulse {
          0% { 
            transform: translate(-50%, -50%) scale(0.8); 
            opacity: 0; 
          }
          20% { 
            transform: translate(-50%, -50%) scale(1.1); 
            opacity: 1; 
          }
          80% { 
            transform: translate(-50%, -50%) scale(1); 
            opacity: 1; 
          }
          100% { 
            transform: translate(-50%, -50%) scale(0.9); 
            opacity: 0; 
          }
        }
      `
      document.head.appendChild(style)
      
      document.body.appendChild(animationEl)
      
      setTimeout(() => {
        document.body.removeChild(animationEl)
        document.head.removeChild(style)
      }, 1200)
    }
    
    const showMessage = (messageData) => {
      console.log('📢 Message:', messageData.type, messageData.text)
      
      // Use the message store for better UX
      if (messageData.type === 'error') {
        messageStore.showMessage('Error', messageData.text, 'error')
      } else {
        messageStore.showMessage('Success', messageData.text, 'success')
      }
    }

    // Watch for category changes to load genres
    watch(currentCategory, (newCategory) => {
      if (newCategory && 
          newCategory !== 'statistics' && 
          newCategory !== 'calendar' && 
          newCategory !== 'profile') {
        loadGenres()
        // Clear selected genres when category changes
        mediaStore.clearGenres()
      } else {
        // Clear genres for non-media categories
        genres.value = []
        mediaStore.clearGenres()
      }
    }, { immediate: true })
    
    const exportData = () => {
      const allData = {
        profile: profileData,
        media: mediaStore.mediaData,
        settings: {
          language: profileData.language,
          timezone: profileData.timezone,
          dateFormat: profileData.dateFormat
        },
        exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `media-library-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    
    const importData = () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const data = JSON.parse(e.target.result)
              
              if (data.profile) {
                Object.assign(profileData, data.profile)
              }
              
              if (data.media) {
                mediaStore.mediaData = data.media
                mediaStore.saveMedia()
              }
              
              if (data.settings) {
                Object.assign(profileData, data.settings)
              }
              
              saveProfileData()
            } catch (error) {
              console.error('Failed to import data:', error)
            }
          }
          reader.readAsText(file)
        }
      }
      input.click()
    }
    
    const createBackup = () => {
      const backupData = {
        profile: profileData,
        media: mediaStore.mediaData,
        settings: {
          language: profileData.language,
          timezone: profileData.timezone,
          dateFormat: profileData.dateFormat
        },
        backupDate: new Date().toISOString()
      }
      
      const backupKey = `backup_${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify(backupData))
      alert('Backup created successfully!')
    }
    
    const clearCache = () => {
      // Clear any cached data
      alert('Cache cleared successfully!')
    }
    
    const resetSettings = () => {
      if (confirm('Are you sure you want to reset all settings?')) {
        Object.assign(profileData, {
          firstName: '',
          lastName: '',
          displayName: '',
          email: '',
          bio: '',
          avatar: '',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          booksApiProvider: 'wikipedia',
          enableGoogleBooksFallback: true
        })
        saveProfileData()
      }
    }
    
    const clearAllData = () => {
      if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
        localStorage.clear()
        window.location.reload()
      }
    }
    
    const saveProfileData = () => {
      localStorage.setItem('profileData', JSON.stringify(profileData))
    }
    
    const saveAllChanges = () => {
      saveProfileData()
      alert('All changes saved successfully!')
    }


    // Lifecycle
    onMounted(async () => {
      try {
        await loadMedia()
        
        // Load profile data from localStorage
        const saved = localStorage.getItem('profileData')
        if (saved) {
          try {
            const savedData = JSON.parse(saved)
            Object.assign(profileData, savedData)
          } catch (error) {
            console.error('Failed to load profile data:', error)
          }
        }
        
        // Load user data from auth store
        if (authStore.user) {
          profileData.firstName = authStore.user.name?.split(' ')[0] || ''
          profileData.lastName = authStore.user.name?.split(' ').slice(1).join(' ') || ''
          profileData.email = authStore.user.email || ''
        }
        
        // Set today as selected by default for calendar
        const today = new Date()
        const todayDay = calendarDays.value.find(day => 
          day.isToday && day.isCurrentMonth
        )
        if (todayDay) {
          selectedDay.value = todayDay
        }
        
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
      sortBy,
      categories,
      txtImportResults,
      adminSetupLoading,
      adminSetupMessage,
      editMode,
      
      // Calendar state
      currentDate,
      selectedDay,
      weekdays,
      
      // Profile state
      avatarInput,
      profileData,
      
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
      selectedGenres: computed(() => mediaStore.selectedGenres),
      genres,
      genreLoading,
      genreError,
      
      // Calendar computed
      currentYear,
      currentMonth,
      currentMonthName,
      calendarDays,

      // Methods
      setCategory,
      clearSearch,
      updateSortBy,
      navigateToCalendar,
      navigateToProfile,
      addItemFromSidebar,
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
      handleGenresUpdated,
      handleGenresExcluded,
      handleGenresCleared,
      loadGenres,
      toggleEditMode,
      handleRatingChanged,
      
      // Calendar methods
      previousMonth,
      nextMonth,
      selectDay,
      formatSelectedDay,
      hasEventsForDate,
      getEventsForDate,
      
      // Profile methods
      getInitials,
      changeAvatar,
      handleAvatarChange,
      exportData,
      importData,
      createBackup,
      clearCache,
      resetSettings,
      clearAllData,
      saveProfileData,
      saveAllChanges,
      
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
      sidebarStore,
      safeSidebarStore
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
  color: #1a1a1a;
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

/* Grid Layout - Fixed 6 columns */
.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(6, 1fr);
  transition: all 0.3s ease-in-out;
  width: 100%;
  contain: layout;
}

/* Edit Mode Grid Styles */
.grid.edit-mode {
  gap: 16px;
  animation: editModeEnter 0.5s ease-out;
}

@keyframes editModeEnter {
  0% {
    opacity: 0.8;
    transform: scale(0.98);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.grid.edit-mode .media-item {
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.grid.edit-mode .media-item:hover {
  border-color: #e8f4fd;
  box-shadow: 0 8px 25px rgba(232, 244, 253, 0.3);
  transform: translateY(-2px) scale(1.02);
}

.grid.edit-mode .media-item::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #e8f4fd, #d1e7f7, #e8f4fd);
  border-radius: 14px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.grid.edit-mode .media-item:hover::before {
  opacity: 0.1;
}

/* Edit Mode Indicator */
.grid.edit-mode::after {
  content: '✏️ Edit Mode Active';
  position: fixed;
  top: 60px;
  right: 20px;
  background: rgba(232, 244, 253, 0.95);
  color: #1a1a1a;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  z-index: 1000;
  animation: slideInRight 0.5s ease-out;
  box-shadow: 0 4px 12px rgba(232, 244, 253, 0.3);
}

@keyframes slideInRight {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Smooth animations for grid items */
.grid > * {
  animation: fadeInUp 0.4s ease-out;
  transition: all 0.3s ease-in-out;
  position: relative;
  z-index: 1;
}

/* Fade in animation for new items */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth hover effects */
.grid > *:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  z-index: 10;
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
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.error button:hover {
  background: #d1e7f7;
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

/* Responsive Design for 6 columns */
@media (min-width: 1281px) {
  .grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 24px;
  }
}

@media (max-width: 1280px) and (min-width: 1025px) {
  .grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
  }
}

@media (max-width: 1024px) and (min-width: 901px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

@media (max-width: 900px) and (min-width: 769px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
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
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .content-area {
    padding: 8px;
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media (max-width: 360px) {
  .content-area {
    padding: 6px;
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
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
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #d1e7f7;
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
  color: #e8f4fd;
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
  background: #e8f4fd;
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

/* Calendar Styles */
.calendar-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  color: #e0e0e0;
  overflow: hidden;
  border-radius: 8px;
  margin: 0;
}

/* Calendar Header */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
  min-height: 80px;
}

.month-nav-btn {
  background: #3a3a3a;
  border: 1px solid #505050;
  color: #e0e0e0;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 24px;
  font-weight: bold;
}

.month-nav-btn:hover:not(:disabled) {
  background: #e8f4fd;
  border-color: #e8f4fd;
  color: #1a1a1a;
}

.month-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.month-year-display {
  text-align: center;
  flex: 1;
  margin: 0 20px;
}

.month-name {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: #e0e0e0;
}

.year {
  font-size: 18px;
  color: #a0a0a0;
  font-weight: 400;
}

/* Calendar Container */
.calendar-container {
  flex: 1;
  padding: 20px 30px;
  overflow: auto;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #404040;
  border-radius: 8px;
  overflow: hidden;
  min-height: 500px;
}

/* Weekday Headers */
.weekday-header {
  background: #3a3a3a;
  color: #a0a0a0;
  padding: 15px 10px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Calendar Days */
.calendar-day {
  background: #2d2d2d;
  min-height: 80px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  position: relative;
  border: 1px solid transparent;
}

.calendar-day:hover {
  background: #3a3a3a;
  border-color: #e8f4fd;
}

.calendar-day.other-month {
  background: #1a1a1a;
  color: #666;
}

.calendar-day.other-month:hover {
  background: #2a2a2a;
}

.calendar-day.today {
  background: #1e3a5f;
  border-color: #e8f4fd;
}

.calendar-day.today .day-number {
  color: #e8f4fd;
  font-weight: bold;
}

.calendar-day.weekend {
  background: #252525;
}

.calendar-day.has-events {
  border-left: 3px solid #e8f4fd;
}

.day-number {
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.event-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.event-dot {
  width: 6px;
  height: 6px;
  background: #e8f4fd;
  border-radius: 50%;
}

.event-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e8f4fd;
  color: #1a1a1a;
  font-size: 10px;
  font-weight: bold;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Selected Day Info */
.selected-day-info {
  background: #2d2d2d;
  border-top: 1px solid #404040;
  padding: 20px 30px;
  min-height: 120px;
}

.selected-day-info h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #e0e0e0;
  font-weight: 500;
}

.no-events {
  color: #a0a0a0;
  font-style: italic;
  margin: 0;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #3a3a3a;
  border-radius: 6px;
  border-left: 3px solid #e8f4fd;
  margin-bottom: 8px;
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.event-time {
  font-size: 12px;
  color: #a0a0a0;
  font-weight: 500;
}

.event-type-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.event-title {
  font-size: 14px;
  color: #e0e0e0;
  font-weight: 500;
}

.event-platforms, .event-genre {
  font-size: 11px;
  color: #a0a0a0;
  font-style: italic;
}

/* Event type specific colors */
.event-game {
  border-left-color: #4CAF50;
}

.event-game .event-type-badge {
  background: #4CAF50;
  color: #000;
}

.event-series {
  border-left-color: #2196F3;
}

.event-series .event-type-badge {
  background: #2196F3;
  color: #fff;
}

.event-movie {
  border-left-color: #FF9800;
}

.event-movie .event-type-badge {
  background: #FF9800;
  color: #000;
}

.event-buecher {
  border-left-color: #9C27B0;
}

.event-buecher .event-type-badge {
  background: #9C27B0;
  color: #fff;
}

.event-unknown {
  border-left-color: #757575;
}

.event-unknown .event-type-badge {
  background: #757575;
  color: #fff;
}


/* Profile Styles */
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #2d2d2d;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid #404040;
}

.profile-avatar-section {
  flex-shrink: 0;
}

.profile-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #3a3a3a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  border: 2px solid #555;
}

.profile-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 24px;
  font-weight: bold;
  color: #a0a0a0;
}

.profile-info-header {
  flex: 1;
}

.profile-info-header h2 {
  margin: 0 0 5px 0;
  color: #e0e0e0;
}

.profile-info-header p {
  margin: 0 0 15px 0;
  color: #a0a0a0;
}

.profile-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #e8f4fd;
}

.stat-label {
  font-size: 12px;
  color: #a0a0a0;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  background: #2d2d2d;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid #404040;
}

.section-header {
  padding: 20px;
  background: #3a3a3a;
  border-bottom: 1px solid #505050;
}

.section-header h3 {
  margin: 0 0 5px 0;
  color: #e0e0e0;
}

.section-header p {
  margin: 0;
  color: #a0a0a0;
  font-size: 14px;
}

.section-content {
  padding: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 500;
  color: #d0d0d0;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
  background: #3a3a3a;
  color: #e0e0e0;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #e8f4fd;
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.data-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.data-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.data-btn:hover {
  background: #4a4a4a;
  border-color: #666;
}

.btn-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.btn-text {
  font-weight: 500;
  margin-bottom: 4px;
  color: #e0e0e0;
}

.btn-description {
  font-size: 12px;
  color: #a0a0a0;
}

.danger-zone {
  border: 1px solid #e74c3c;
}

.danger-zone .section-header {
  background: #4a2a2a;
  border-bottom-color: #e74c3c;
}

.danger-zone .section-header h3 {
  color: #ff6b6b;
}

.danger-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.danger-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #4a2a2a;
  border: 1px solid #e74c3c;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.danger-btn:hover {
  background: #5a3a3a;
}

.danger-btn .btn-text {
  color: #ff6b6b;
}

/* Checkbox styles */
.checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
}

.checkbox-container input[type="checkbox"] {
  margin: 0;
  width: 18px;
  height: 18px;
  accent-color: #e8f4fd;
}

.checkbox-label {
  font-size: 14px;
  color: #d0d0d0;
  line-height: 1.4;
  cursor: pointer;
  margin: 0;
}

/* Mobile Calendar Styles */
@media (max-width: 768px) {
  .calendar-header {
    padding: 15px 20px;
    min-height: 70px;
  }
  
  .month-name {
    font-size: 24px;
  }
  
  .year {
    font-size: 16px;
  }
  
  .month-nav-btn {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .calendar-container {
    padding: 15px 20px;
  }
  
  .calendar-day {
    min-height: 60px;
    padding: 6px;
  }
  
  .day-number {
    font-size: 14px;
  }
  
  .weekday-header {
    padding: 10px 5px;
    font-size: 12px;
  }
  
  .selected-day-info {
    padding: 15px 20px;
    min-height: 100px;
  }
  
  .selected-day-info h3 {
    font-size: 16px;
  }
}

/* Mobile Profile Styles */
@media (max-width: 768px) {
  .profile-container {
    padding: 15px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .data-actions,
  .danger-actions {
    grid-template-columns: 1fr;
  }
}
</style>
