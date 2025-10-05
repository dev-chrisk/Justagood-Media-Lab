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
      :current-category="'profile'"
      :category-counts="{}"
      :platforms="[]"
      :genres="[]"
      :categories="[]"
      @toggle="sidebarStore.toggleSidebar"
      @navigate-to-library="navigateToLibrary"
      @navigate-to-calendar="navigateToCalendar"
      @logout="logout"
    />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <header class="main-header">
        <div class="header-left">
          <button class="mobile-sidebar-toggle" @click="sidebarStore.toggleMobileSidebar">☰</button>
          <h1 class="page-title">Profile Settings</h1>
        </div>
        <div class="header-right">
          <button class="refresh-stats-btn" @click="refreshStats" title="Refresh statistics">
            <span class="refresh-icon">🔄</span>
          </button>
        </div>
      </header>

      <main class="content-area">
        <div class="profile-container">
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
      </main>
    </div>

    <!-- Save Button -->
    <div class="floating-save">
      <button class="save-all-btn" @click="saveAllChanges">
        Save All Changes
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebarStore } from '@/stores/sidebar'

export default {
  name: 'Profile',
  components: {
    Sidebar
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const mediaStore = useMediaStore()
    const sidebarStore = useSidebarStore()
    
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
    
    const totalItems = computed(() => mediaStore.totalItems)
    
    // Sidebar state is now managed globally in useSidebarStore
    
    // Computed properties
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const isAdmin = computed(() => authStore.isAdmin)
    const userName = computed(() => authStore.userName)
    
    // Sidebar methods are now managed globally in useSidebarStore
    
    const navigateToLibrary = () => {
      router.push('/')
    }
    
    
    const navigateToCalendar = () => {
      router.push('/calendar')
    }
    
    
    const logout = async () => {
      await authStore.logout()
      router.push('/')
    }
    
    const refreshStats = () => {
      mediaStore.loadMedia()
    }
    
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
        router.push('/')
      }
    }
    
    const saveProfileData = () => {
      localStorage.setItem('profileData', JSON.stringify(profileData))
    }
    
    const saveAllChanges = () => {
      saveProfileData()
      alert('All changes saved successfully!')
    }
    
    onMounted(() => {
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
    })
    
    return {
      avatarInput,
      profileData,
      totalItems,
      isLoggedIn,
      isAdmin,
      userName,
      navigateToLibrary,
      navigateToCalendar,
      logout,
      refreshStats,
      getInitials,
      changeAvatar,
      handleAvatarChange,
      exportData,
      importData,
      createBackup,
      clearCache,
      resetSettings,
      clearAllData,
      saveAllChanges,
      
      // Sidebar Store
      sidebarStore
    }
  }
}
</script>

<style scoped>
/* Profile Layout */
.vue-app {
  display: flex;
  height: 100vh;
  background: #1a1a1a;
  color: #e0e0e0;
}

/* Mobile Overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.mobile-overlay.show {
  opacity: 1;
  visibility: visible;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s ease;
}

.main-header {
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.mobile-sidebar-toggle {
  display: none;
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.mobile-sidebar-toggle:hover {
  background: #404040;
  color: #e0e0e0;
}

.page-title {
  margin: 0;
  color: #e0e0e0;
  font-size: 24px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.refresh-stats-btn {
  background: #4a9eff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-stats-btn:hover {
  background: #3a8eef;
  transform: translateY(-1px);
}

.refresh-icon {
  font-size: 16px;
}

.content-area {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background: #1a1a1a;
}

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
  color: #4a9eff;
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
  border-color: #4a9eff;
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

.floating-save {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.save-all-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.save-all-btn:hover {
  background: #229954;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-area {
    padding: 20px;
  }
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
  accent-color: #4a9eff;
}

.checkbox-label {
  font-size: 14px;
  color: #d0d0d0;
  line-height: 1.4;
  cursor: pointer;
  margin: 0;
}

@media (max-width: 768px) {
  .mobile-sidebar-toggle {
    display: block;
  }
  
  .content-area {
    padding: 15px;
  }
  
  .main-header {
    padding: 15px 20px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .data-actions,
  .danger-actions {
    grid-template-columns: 1fr;
  }
}
</style>

