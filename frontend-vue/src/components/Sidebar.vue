<template>
  <aside 
    id="sidebar" 
    class="sidebar" 
    :class="{ collapsed: collapsed, open: mobileOpen }"
  >
    <div class="sidebar-header" @click="$emit('toggle')">
      <h2>Media Library</h2>
      <button class="sidebar-toggle">☰</button>
    </div>
    
    <div class="sidebar-content">
      <!-- Main Navigation -->
      <div class="sidebar-section">
        <h3>Browse</h3>
        <nav class="sidebar-nav">
          <div 
            v-for="category in categories" 
            :key="category.key"
            class="nav-item"
          >
            <button 
              class="nav-btn" 
              :class="{ active: currentCategory === category.key }"
              @click="$emit('setCategory', category.key)"
            >
              <span class="nav-icon">{{ category.icon }}</span>
              <span class="nav-text">{{ category.name }}</span>
              <span class="nav-count">{{ categoryCounts[category.key] || 0 }}</span>
            </button>
            <button 
              class="add-btn"
              @click="$emit('addItem', category.key)"
              :title="`Add ${category.name}`"
            >
              <span class="add-icon">+</span>
            </button>
          </div>
          <button 
            class="nav-btn" 
            :class="{ active: currentCategory === 'statistics' }"
            @click="$emit('setCategory', 'statistics')"
          >
            <span class="nav-icon">📊</span>
            <span class="nav-text">Statistics</span>
          </button>
          <button 
            class="nav-btn" 
            :class="{ active: currentCategory === 'calendar' }"
            @click="$emit('setCategory', 'calendar')"
          >
            <span class="nav-icon">📅</span>
            <span class="nav-text">Calendar</span>
          </button>
          <button 
            class="nav-btn" 
            :class="{ active: currentCategory === 'profile' }"
            @click="$emit('setCategory', 'profile')"
          >
            <span class="nav-icon">👤</span>
            <span class="nav-text">Profile</span>
          </button>
        </nav>
      </div>



      <!-- Genre Filter Section -->
      <div v-if="showGenreSection" class="sidebar-section genre-section">
        <h3>Genres</h3>
        <div v-if="genreLoading" class="genre-loading">
          <div class="loading-spinner"></div>
          <span>Loading genres...</span>
        </div>
        <div v-else-if="genreError" class="genre-error">
          <span>Failed to load genres</span>
          <button @click="loadGenres" class="retry-btn">Retry</button>
        </div>
        <div v-else-if="genres.length === 0" class="genre-empty">
          <span>No genres available</span>
        </div>
        <div v-else class="genre-list" :class="{ 'loading': genreLoading }">
          <transition-group name="genre-fade" tag="div">
            <div
              v-for="(genre, index) in genreCheckboxStates"
              :key="genre.name"
              class="genre-checkbox-item"
              :title="`${genre.name} (${genre.count} items)`"
              :style="{ '--animation-delay': `${index * 50}ms` }"
            >
            <!-- Genre Name -->
            <span class="genre-name">{{ genre.name }}</span>
            
            <!-- Checkbox Container with Dividers -->
            <div class="checkbox-container">
              <!-- Include Checkbox (Blue) -->
              <label class="genre-checkbox-label include-checkbox">
                <input
                  type="checkbox"
                  :value="genre.name"
                  :checked="genre.isIncluded"
                  @change="toggleGenreInclude(genre.name)"
                  class="genre-checkbox include-checkbox-input"
                />
              </label>
              
              <!-- Exclude Checkbox (Red) -->
              <label class="genre-checkbox-label exclude-checkbox">
                <input
                  type="checkbox"
                  :value="genre.name"
                  :checked="genre.isExcluded"
                  @change="toggleGenreExclude(genre.name)"
                  class="genre-checkbox exclude-checkbox-input"
                />
              </label>
            </div>
            
            <!-- Genre Count -->
            <span class="genre-count">{{ genre.count }}</span>
          </div>
          </transition-group>
          
          <!-- Show More/Less Toggle -->
          <button 
            v-if="genres.length > 5" 
            class="show-more-btn" 
            @click="toggleShowAllGenres"
            :title="showAllGenres ? 'Show fewer genres' : 'Show all genres'"
          >
            {{ showAllGenres ? 'Show Less' : `Show More (${genres.length - 5})` }}
          </button>
          
          <button 
            v-if="selectedGenres.length > 0 || excludedGenres.length > 0" 
            class="clear-genre-btn" 
            @click="clearGenreFilter"
            title="Clear all genre filters"
          >
            Clear All Filters ({{ selectedGenres.length + excludedGenres.length }})
          </button>
        </div>
      </div>

      <!-- Account Section -->
      <div class="sidebar-section">
        <h3>Account</h3>
        <div v-if="!isLoggedIn" class="auth-buttons">
          <button class="auth-btn" @click="$emit('showLogin')">Login</button>
          <button class="auth-btn" @click="$emit('showRegister')">Register</button>
        </div>
        <div v-else class="user-info">
          <div class="user-profile">
            <div class="profile-avatar">
              <span class="avatar-text">👤</span>
            </div>
            <div class="profile-details">
              <span class="user-name">{{ userName }}</span>
            </div>
            <button class="account-btn" @click="$emit('navigateToProfile')">⚙️</button>
          </div>
          <button class="auth-btn" @click="$emit('logout')">Logout</button>
          <button class="change-password-btn" @click="$emit('changePassword')">CHANGE PASSWORD</button>
          <button class="delete-account-btn" @click="$emit('deleteAccount')">DELETE ACCOUNT</button>
        </div>
      </div>
    </div>
    
    <!-- Version Info -->
    <VersionInfo />
  </aside>
</template>

<script>
import VersionInfo from './VersionInfo.vue'

export default {
  name: 'Sidebar',
  components: {
    VersionInfo
  },
  props: {
    collapsed: {
      type: Boolean,
      default: false
    },
    mobileOpen: {
      type: Boolean,
      default: false
    },
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    userName: {
      type: String,
      default: ''
    },
    currentCategory: {
      type: String,
      default: 'watchlist'
    },
    categoryCounts: {
      type: Object,
      default: () => ({})
    },
    categories: {
      type: Array,
      default: () => [
        { key: 'game', name: 'Games', icon: '🎮' },
        { key: 'series', name: 'Series', icon: '📺' },
        { key: 'movie', name: 'Movies', icon: '🎬' },
        { key: 'buecher', name: 'Bücher', icon: '📚' },
        { key: 'watchlist', name: 'Watchlist', icon: '❤️' }
      ]
    },
    selectedGenres: {
      type: Array,
      default: () => []
    },
    excludedGenres: {
      type: Array,
      default: () => []
    },
    genres: {
      type: Array,
      default: () => []
    },
    genreLoading: {
      type: Boolean,
      default: false
    },
    genreError: {
      type: String,
      default: null
    },
  },
  emits: [
    'toggle',
    'setCategory',
    'addItem',
    'navigateToCalendar',
    'navigateToProfile',
    'showLogin',
    'showRegister',
    'logout',
    'changePassword',
    'deleteAccount',
    'genres-updated',
    'genres-excluded',
    'genres-cleared',
    'load-genres'
  ],
  data() {
    return {
      showAllGenres: false
    }
  },
  computed: {
    showGenreSection() {
      return this.currentCategory && 
             this.currentCategory !== 'statistics' && 
             this.currentCategory !== 'calendar' && 
             this.currentCategory !== 'profile'
    },
    visibleGenres() {
      if (this.showAllGenres || this.genres.length <= 5) {
        return this.genres
      }
      return this.genres.slice(0, 5)
    },
    // Ensure checkbox states are properly synchronized
    genreCheckboxStates() {
      return this.visibleGenres.map(genre => ({
        ...genre,
        isIncluded: this.selectedGenres.includes(genre.name),
        isExcluded: this.excludedGenres.includes(genre.name)
      }))
    }
  },
  methods: {
    toggleGenreInclude(genreName) {
      const currentGenres = [...this.selectedGenres]
      const currentExcluded = [...this.excludedGenres]
      
      // Check if genre is currently included
      const isIncluded = currentGenres.includes(genreName)
      
      if (isIncluded) {
        // If currently included, remove it (neutral state)
        const index = currentGenres.indexOf(genreName)
        currentGenres.splice(index, 1)
      } else {
        // If not included, add it and ALWAYS remove from excluded
        currentGenres.push(genreName)
        // Force remove from excluded array
        const excludeIndex = currentExcluded.indexOf(genreName)
        if (excludeIndex > -1) {
          currentExcluded.splice(excludeIndex, 1)
        }
      }
      
      // Emit both events to ensure state is synchronized
      this.$emit('genres-updated', currentGenres)
      this.$emit('genres-excluded', currentExcluded)
    },
    toggleGenreExclude(genreName) {
      const currentGenres = [...this.selectedGenres]
      const currentExcluded = [...this.excludedGenres]
      
      // Check if genre is currently excluded
      const isExcluded = currentExcluded.includes(genreName)
      
      if (isExcluded) {
        // If currently excluded, remove it (neutral state)
        const index = currentExcluded.indexOf(genreName)
        currentExcluded.splice(index, 1)
      } else {
        // If not excluded, add it and ALWAYS remove from included
        currentExcluded.push(genreName)
        // Force remove from included array
        const includeIndex = currentGenres.indexOf(genreName)
        if (includeIndex > -1) {
          currentGenres.splice(includeIndex, 1)
        }
      }
      
      // Emit both events to ensure state is synchronized
      this.$emit('genres-updated', currentGenres)
      this.$emit('genres-excluded', currentExcluded)
    },
    clearGenreFilter() {
      this.$emit('genres-cleared')
      this.$emit('genres-excluded', [])
    },
    loadGenres() {
      this.$emit('load-genres')
    },
    toggleShowAllGenres() {
      this.showAllGenres = !this.showAllGenres
    }
  }
}
</script>

<style scoped>
/* Sidebar Styles */
.sidebar {
  width: 280px;
  background: #2d2d2d;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
  border-right: 1px solid #404040;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar.collapsed .sidebar-header h2 {
  opacity: 0;
  transition: opacity 0.1s ease;
}

.sidebar.collapsed .nav-text {
  display: none;
}

.sidebar.collapsed .nav-count {
  display: none;
}

.sidebar.collapsed .add-btn {
  display: none;
}

.sidebar.collapsed .sidebar-section h3 {
  display: none;
}

.sidebar.collapsed .genre-section {
  display: none;
}


.sidebar.collapsed .user-profile .profile-details {
  display: none;
}

.sidebar.collapsed .user-profile .account-btn {
  display: none;
}

.sidebar.collapsed .user-profile {
  padding: 8px;
  justify-content: center;
}

.sidebar.collapsed .profile-avatar {
  margin-right: 0;
}

.sidebar.collapsed .auth-buttons {
  display: none;
}

.sidebar.collapsed .user-info .auth-btn {
  display: none;
}

.sidebar-header {
  padding: 8px 20px;
  background: #3a3a3a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #505050;
  cursor: pointer;
  transition: background 0.2s;
  height: 44px;
  box-sizing: border-box;
}

.sidebar-header:hover {
  background: #404040;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 15px 8px;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #e0e0e0;
  transition: opacity 0.1s ease;
  white-space: nowrap;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: #e0e0e0;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.2s;
  pointer-events: none;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.sidebar.collapsed .sidebar-content {
  padding: 10px 0;
}

.sidebar-section {
  margin-bottom: 30px;
}

.sidebar.collapsed .sidebar-section {
  margin-bottom: 20px;
}

.sidebar-section h3 {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 15px 20px;
  color: #a0a0a0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  position: relative;
  justify-content: space-between;
}

.nav-btn, .nav-btn:visited {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: none;
  border: none;
  color: #d0d0d0;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 14px;
  min-height: 44px;
  flex: 1;
  text-decoration: none;
}

.sidebar.collapsed .nav-btn {
  justify-content: center;
  padding: 12px 8px;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-btn.active, .nav-btn.router-link-active {
  background: #e8f4fd;
  color: #1a1a1a;
}

.nav-icon {
  font-size: 16px;
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

.sidebar.collapsed .nav-icon {
  margin-right: 0;
  font-size: 18px;
}

.nav-text {
  flex: 1;
}

.nav-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: 4px;
  color: #a0a0a0;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;
  opacity: 1;
  transform: scale(1);
  flex-shrink: 0;
}

.nav-item:hover .add-btn {
  transform: scale(1.05);
  color: #e0e0e0;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
  color: #e0e0e0;
}

.add-icon {
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}


@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Account Section */
.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 20px;
}

.auth-btn {
  padding: 12px 16px;
  border: 1px solid #e8f4fd;
  background: transparent;
  color: #e8f4fd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  min-height: 44px;
  margin-bottom: 10px;
}

.auth-btn:hover {
  background: #e8f4fd;
  color: #1a1a1a;
}

.change-password-btn {
  padding: 16px 20px;
  border: 2px solid #f39c12;
  background: #5a4a2a;
  color: #ffb84d;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.2s;
  min-height: 50px;
  width: 100%;
  margin-top: 10px;
  text-align: left;
}

.change-password-btn:hover:not(:disabled) {
  background: #6a5a3a;
  border-color: #ffb84d;
  color: #ffcc80;
  transform: scale(1.02);
}

.change-password-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-account-btn {
  padding: 16px 20px;
  border: 2px solid #e74c3c;
  background: #5a2a2a;
  color: #ff6b6b;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.2s;
  min-height: 50px;
  width: 100%;
  margin-top: 10px;
  text-align: left;
}

.delete-account-btn:hover:not(:disabled) {
  background: #6a3a3a;
  border-color: #ff6b6b;
  color: #ff9999;
  transform: scale(1.02);
}

.delete-account-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sidebar.collapsed .change-password-btn,
.sidebar.collapsed .delete-account-btn {
  display: none;
}


.user-info {
  padding: 0 20px;
}

.sidebar.collapsed .user-info {
  padding: 0 8px;
}

.user-profile {
  display: flex;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  margin-bottom: 10px;
}

.sidebar.collapsed .user-profile {
  justify-content: center;
  padding: 10px 8px;
}

.profile-avatar {
  width: 32px;
  height: 32px;
  background: #e8f4fd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 14px;
}

.profile-details {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.account-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  font-size: 16px;
  transition: all 0.2s;
}

.account-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #1a1a1a;
}



/* Mobile Styles */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: -280px;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s ease;
    width: 280px;
  }
  
  .sidebar.open {
    left: 0;
  }
  
  .sidebar-header {
    padding: 8px 12px;
    height: 44px;
  }
}

/* Genre Section Styles */
.genre-loading,
.genre-error,
.genre-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: #a0a0a0;
  font-size: 14px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #404040;
  border-top: 2px solid #e8f4fd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 8px;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #d1e7f7;
}

.genre-list {
  padding: 12px 0;
  min-height: 150px; /* Fixed height for 3 genres */
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  transition: height 0.3s ease;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  box-sizing: border-box;
}

/* Genre Checkbox Styles */
.genre-checkbox-item {
  padding: 8px 20px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 12px;
  margin: 2px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  border-radius: 6px;
  position: relative;
  min-height: 36px;
}

.genre-checkbox-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  transform: translateX(2px);
}

.genre-checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
  padding: 2px;
  width: 20px;
  height: 20px;
  justify-content: center;
  flex-shrink: 0;
}

.genre-checkbox-label:hover {
  background: rgba(255, 255, 255, 0.1);
}

.genre-checkbox {
  margin: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.include-checkbox-input {
  accent-color: #e8f4fd;
}

.exclude-checkbox-input {
  accent-color: #ff6b6b;
}

.genre-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
  color: #d0d0d0;
  font-size: 14px;
  min-height: 20px;
  display: flex;
  align-items: center;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  height: 100%;
  width: 70px;
  flex-shrink: 0;
  justify-content: center;
}

.genre-count {
  background: rgba(255, 255, 255, 0.2);
  color: #e0e0e0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
  justify-self: end;
}

/* Selected state for checkbox labels */
.include-checkbox-input:checked ~ .genre-name {
  color: #e8f4fd;
  font-weight: 500;
}

.include-checkbox-input:checked ~ .genre-count {
  background: rgba(232, 244, 253, 0.3);
  color: #e8f4fd;
}

.exclude-checkbox-input:checked ~ .genre-name {
  color: #ff6b6b;
  font-weight: 500;
}

.exclude-checkbox-input:checked ~ .genre-count {
  background: rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
}


.show-more-btn {
  width: calc(100% - 40px);
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  margin: 8px 20px 0;
  transition: all 0.2s;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.show-more-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.clear-genre-btn {
  width: calc(100% - 40px);
  padding: 8px 12px;
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  margin: 8px 20px 0;
  transition: background 0.2s;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clear-genre-btn:hover {
  background: #d1e7f7;
}

/* Scrollbar styling for genre list */
.genre-list::-webkit-scrollbar {
  width: 6px;
}

.genre-list::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.genre-list::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.genre-list::-webkit-scrollbar-thumb:hover {
  background: #777;
}

/* Genre transition animations */
.genre-fade-enter-active {
  transition: all 0.4s ease-out;
  transition-delay: var(--animation-delay, 0ms);
}

.genre-fade-leave-active {
  transition: all 0.3s ease-in;
}

.genre-fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.genre-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.genre-fade-move {
  transition: transform 0.3s ease;
}

/* Loading state for genre list */
.genre-list.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Fade-in animation for genre items (fallback) */
.genre-checkbox-item {
  animation: fadeIn 0.3s ease-in;
  animation-delay: var(--animation-delay, 0ms);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Touch-specific improvements */
@media (hover: none) and (pointer: coarse) {
  .nav-btn,
  .auth-btn {
    min-height: 44px;
  }
  
  .sidebar-content {
    -webkit-overflow-scrolling: touch;
  }
  
  .nav-btn,
  .auth-btn {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
}

/* Mobile adjustments for genre items */
@media (max-width: 768px) {
  .genre-checkbox-item {
    padding: 6px 8px 6px 16px;
    min-height: 32px;
  }
  
  .genre-checkbox {
    width: 14px;
    height: 14px;
  }
  
  .genre-checkbox-label {
    width: 18px;
    height: 18px;
    margin-right: 3px;
  }
  
  .genre-name {
    font-size: 13px;
    margin-right: 6px;
  }
  
  .genre-count {
    padding: 2px 6px;
    font-size: 11px;
    min-width: 20px;
  }
}
</style>
