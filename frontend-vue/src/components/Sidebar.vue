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
          <router-link to="/calendar" class="nav-btn">
            <span class="nav-icon">📅</span>
            <span class="nav-text">Calendar</span>
          </router-link>
          <router-link to="/profile" class="nav-btn">
            <span class="nav-icon">👤</span>
            <span class="nav-text">Profile</span>
          </router-link>
        </nav>
      </div>

      <!-- Filters Section -->
      <div v-if="isLoggedIn" class="sidebar-section">
        <div class="filters-header">
          <h3>Filters</h3>
          <div class="filter-controls">
            <button 
              class="refresh-btn" 
              @click="$emit('clearFilters')"
              title="Clear all filters"
            >
              <span class="refresh-icon">🔄</span>
              <span class="refresh-text">Refresh</span>
            </button>
            <button 
              class="toggle-filters-btn" 
              :class="{ active: filtersEnabled }"
              @click="$emit('toggleFilters')"
              :title="filtersEnabled ? 'Disable all filters' : 'Enable all filters'"
            >
              <span class="toggle-icon">{{ filtersEnabled ? '🔍' : '🚫' }}</span>
              <span class="toggle-text">{{ filtersEnabled ? 'ON' : 'OFF' }}</span>
            </button>
          </div>
        </div>
        <div class="filter-section">
          <div class="filter-group">
            <h4>Platforms</h4>
            <div class="filter-checkboxes">
              <label v-for="platform in platforms" :key="platform" class="filter-option">
                <input 
                  type="checkbox" 
                  :value="platform"
                  @change="$emit('togglePlatformFilter', platform, $event.target.checked)"
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
                  @change="$emit('toggleGenreFilter', genre, $event.target.checked)"
                >
                <span class="checkmark"></span>
                <span class="option-text">{{ genre }}</span>
              </label>
            </div>
          </div>
          <div class="filter-group">
            <h4>Series Status</h4>
            <div class="filter-checkboxes">
              <label class="filter-option">
                <input 
                  type="checkbox" 
                  value="airing"
                  @change="$emit('toggleAiringFilter', 'airing', $event.target.checked)"
                >
                <span class="checkmark"></span>
                <span class="option-text">
                  <span class="airing-indicator">●</span>
                  Airing
                </span>
              </label>
              <label class="filter-option">
                <input 
                  type="checkbox" 
                  value="finished"
                  @change="$emit('toggleAiringFilter', 'finished', $event.target.checked)"
                >
                <span class="checkmark"></span>
                <span class="option-text">Finished</span>
              </label>
            </div>
          </div>
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
    platforms: {
      type: Array,
      default: () => []
    },
    genres: {
      type: Array,
      default: () => []
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
    filtersEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: [
    'toggle',
    'setCategory',
    'addItem',
    'navigateToCalendar',
    'navigateToProfile',
    'togglePlatformFilter',
    'toggleGenreFilter',
    'toggleAiringFilter',
    'clearFilters',
    'toggleFilters',
    'showLogin',
    'showRegister',
    'logout'
  ],
  methods: {
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

.sidebar.collapsed .filter-section {
  display: none;
}

.sidebar.collapsed .user-profile .profile-details {
  display: none;
}

.sidebar.collapsed .user-profile .account-btn {
  display: none;
}

.sidebar.collapsed .auth-buttons {
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
  background: #4a9eff;
  color: white;
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
  background: #4a9eff;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;
  opacity: 0;
  transform: scale(0.8);
}

.nav-item:hover .add-btn {
  opacity: 1;
  transform: scale(1);
}

.add-btn:hover {
  background: #3a8eef;
  transform: scale(1.1);
}

.add-icon {
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}

/* Filter Section */
.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 15px 20px;
}

.filter-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filters-header h3 {
  margin: 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(74, 158, 255, 0.1);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 4px;
  color: #4a9eff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  min-height: 32px;
}

.refresh-btn:hover {
  background: rgba(74, 158, 255, 0.2);
  border-color: rgba(74, 158, 255, 0.5);
  color: #5ba8ff;
}

.refresh-icon {
  font-size: 14px;
  transition: transform 0.2s;
}

.refresh-btn:hover .refresh-icon {
  transform: rotate(180deg);
}

.refresh-text {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar.collapsed .refresh-btn {
  padding: 6px 8px;
  min-width: 32px;
  justify-content: center;
}

.sidebar.collapsed .refresh-text {
  display: none;
}

.sidebar.collapsed .refresh-icon {
  font-size: 16px;
}

.toggle-filters-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(102, 102, 102, 0.1);
  border: 1px solid rgba(102, 102, 102, 0.3);
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 50px;
  justify-content: center;
}

.toggle-filters-btn:hover {
  background: rgba(102, 102, 102, 0.2);
  border-color: rgba(102, 102, 102, 0.5);
  color: #777;
}

.toggle-filters-btn.active {
  background: rgba(40, 167, 69, 0.1);
  border-color: rgba(40, 167, 69, 0.3);
  color: #28a745;
}

.toggle-filters-btn.active:hover {
  background: rgba(40, 167, 69, 0.2);
  border-color: rgba(40, 167, 69, 0.5);
  color: #218838;
}

.toggle-icon {
  font-size: 14px;
  transition: transform 0.2s;
}

.toggle-text {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.sidebar.collapsed .toggle-filters-btn {
  padding: 6px 8px;
  min-width: 32px;
  justify-content: center;
}

.sidebar.collapsed .toggle-text {
  display: none;
}

.sidebar.collapsed .toggle-icon {
  font-size: 12px;
}

.filter-section {
  padding: 0 20px;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group h4 {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 10px 0;
  color: #a0a0a0;
}

.filter-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  color: #d0d0d0;
  min-height: 44px;
  padding: 8px 0;
}

.filter-option input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #a0a0a0;
  border-radius: 3px;
  margin-right: 12px;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}

.filter-option input[type="checkbox"]:checked + .checkmark {
  background: #4a9eff;
  border-color: #4a9eff;
}

.filter-option input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 2px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.option-text {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.airing-indicator {
  color: #27ae60;
  font-size: 12px;
  animation: pulse 2s infinite;
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
  border: 1px solid #4a9eff;
  background: transparent;
  color: #4a9eff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  min-height: 44px;
}

.auth-btn:hover {
  background: #4a9eff;
  color: white;
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
  background: #4a9eff;
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
  color: white;
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
  color: white;
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
</style>
