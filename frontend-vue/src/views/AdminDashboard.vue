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
      :current-category="'admin'"
      :category-counts="{}"
      :platforms="[]"
      :genres="[]"
      :categories="[]"
      @toggle="toggleSidebar"
      @navigate-to-library="navigateToLibrary"
      @navigate-to-statistics="navigateToStatistics"
      @navigate-to-calendar="navigateToCalendar"
      @navigate-to-features="navigateToFeatures"
      @navigate-to-profile="navigateToProfile"
      @logout="logout"
    />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <header class="main-header">
        <div class="header-left">
          <button class="mobile-sidebar-toggle" @click="toggleMobileSidebar">☰</button>
          <h1 class="page-title">Admin Dashboard</h1>
        </div>
        <div class="header-right">
          <button class="refresh-btn" @click="loadData" title="Refresh data">
            <span class="refresh-icon">🔄</span>
          </button>
        </div>
      </header>

      <main class="content-area">
        <LoadingSpinner v-if="loading" message="Loading admin data..." />
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="loadData">Retry</button>
        </div>
        
        <div v-else>
          <!-- Statistics Overview -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-content">
                <h3>Total Users</h3>
                <p class="stat-number">{{ statistics.total_users || 0 }}</p>
                <p class="stat-subtitle">{{ statistics.admin_users || 0 }} admins</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📚</div>
              <div class="stat-content">
                <h3>Media Items</h3>
                <p class="stat-number">{{ statistics.total_media_items || 0 }}</p>
                <p class="stat-subtitle">across all users</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📁</div>
              <div class="stat-content">
                <h3>Collections</h3>
                <p class="stat-number">{{ statistics.total_collections || 0 }}</p>
                <p class="stat-subtitle">user collections</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📈</div>
              <div class="stat-content">
                <h3>Recent Activity</h3>
                <p class="stat-number">{{ statistics.recent_registrations || 0 }}</p>
                <p class="stat-subtitle">new users (30 days)</p>
              </div>
            </div>
          </div>

          <!-- Users Table -->
          <div class="admin-section">
            <div class="section-header">
              <h2>User Management</h2>
              <div class="section-actions">
                <input 
                  type="text" 
                  v-model="userSearchQuery" 
                  placeholder="Search users..."
                  class="search-input"
                  @input="searchUsers"
                >
              </div>
            </div>
            <div class="table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Admin</th>
                    <th>Media Items</th>
                    <th>Collections</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in filteredUsers" :key="user.id">
                    <td>
                      <div class="user-info">
                        <span class="user-name">{{ user.name }}</span>
                        <span v-if="user.is_admin" class="admin-badge">👑</span>
                      </div>
                    </td>
                    <td>{{ user.email }}</td>
                    <td>
                      <label class="checkbox-container">
                        <input 
                          type="checkbox" 
                          v-model="user.is_admin" 
                          @change="updateUser(user)"
                          :disabled="updatingUsers.includes(user.id) || user.id === currentUserId"
                        >
                        <span class="checkmark"></span>
                      </label>
                    </td>
                    <td>{{ user.media_items_count || 0 }}</td>
                    <td>{{ user.collections_count || 0 }}</td>
                    <td>{{ formatDate(user.created_at) }}</td>
                    <td>
                      <div class="action-buttons">
                        <button 
                          class="btn-small btn-primary" 
                          @click="viewUserDetails(user.id)"
                          :disabled="loading"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          class="btn-small btn-danger" 
                          @click="confirmDeleteUser(user)"
                          :disabled="loading || user.id === currentUserId"
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- All Media Items -->
          <div class="admin-section">
            <div class="section-header">
              <h2>All Media Items</h2>
            </div>
            <div class="media-grid">
              <div v-for="item in allMediaItems" :key="item.id" class="media-item-card">
                <div class="media-info">
                  <h4>{{ item.title }}</h4>
                  <p class="media-category">{{ item.category }}</p>
                  <p class="media-user">User: {{ item.user?.name || 'Unknown' }}</p>
                  <p class="media-date">{{ formatDate(item.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- All Collections -->
          <div class="admin-section">
            <div class="section-header">
              <h2>All Collections</h2>
            </div>
            <div class="collections-grid">
              <div v-for="collection in allCollections" :key="collection.id" class="collection-card">
                <h4>{{ collection.name }}</h4>
                <p class="collection-description">{{ collection.description || 'No description' }}</p>
                <p class="collection-user">User: {{ collection.user?.name || 'Unknown' }}</p>
                <p class="collection-count">{{ collection.media_items_count || 0 }} items</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- User Details Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click="closeUserModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>User Details</h3>
          <button class="close-btn" @click="closeUserModal">×</button>
        </div>
        <div class="modal-body" v-if="selectedUser">
          <div class="user-details">
            <div class="detail-row">
              <label>Name:</label>
              <span>{{ selectedUser.name }}</span>
            </div>
            <div class="detail-row">
              <label>Email:</label>
              <span>{{ selectedUser.email }}</span>
            </div>
            <div class="detail-row">
              <label>Admin Status:</label>
              <span class="admin-status" :class="{ admin: selectedUser.is_admin }">
                {{ selectedUser.is_admin ? '👑 Admin' : '👤 User' }}
              </span>
            </div>
            <div class="detail-row">
              <label>Joined:</label>
              <span>{{ formatDate(selectedUser.created_at) }}</span>
            </div>
            <div class="detail-row">
              <label>Media Items:</label>
              <span>{{ selectedUser.media_items_count || 0 }}</span>
            </div>
            <div class="detail-row">
              <label>Collections:</label>
              <span>{{ selectedUser.collections_count || 0 }}</span>
            </div>
          </div>
          
          <div v-if="selectedUser.media_items && selectedUser.media_items.length > 0" class="recent-activity">
            <h4>Recent Media Items</h4>
            <div class="activity-list">
              <div v-for="item in selectedUser.media_items.slice(0, 5)" :key="item.id" class="activity-item">
                <span class="activity-title">{{ item.title }}</span>
                <span class="activity-category">{{ item.category }}</span>
                <span class="activity-date">{{ formatDate(item.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/services/adminService'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Sidebar from '@/components/Sidebar.vue'

export default {
  name: 'AdminDashboard',
  components: {
    LoadingSpinner,
    Sidebar
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    // State
    const loading = ref(false)
    const error = ref(null)
    const statistics = ref({})
    const users = ref([])
    const allMediaItems = ref([])
    const allCollections = ref([])
    const updatingUsers = ref([])
    const currentUserId = ref(authStore.user?.id)
    
    // UI state
    const userSearchQuery = ref('')
    const selectedUser = ref(null)
    const showUserModal = ref(false)
    
    // Sidebar state
    const sidebarCollapsed = ref(false)
    const mobileSidebarOpen = ref(false)
    
    // Computed properties
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const isAdmin = computed(() => authStore.isAdmin)
    const userName = computed(() => authStore.userName)
    
    // Methods
    const loadData = async () => {
      loading.value = true
      error.value = null
      
      try {
        console.log('🔧 Loading admin data...')
        console.log('🔧 Current user:', authStore.user)
        console.log('🔧 Is admin:', authStore.isAdmin)
        console.log('🔧 Auth token:', authStore.token ? 'Present' : 'Missing')
        
        const [statsData, usersData, mediaData, collectionsData] = await Promise.all([
          adminApi.getStatistics(),
          adminApi.getUsers(),
          adminApi.getAllMediaItems(),
          adminApi.getAllCollections()
        ])
        
        console.log('✅ Admin data loaded successfully:', { statsData, usersData, mediaData, collectionsData })
        statistics.value = statsData
        users.value = usersData
        allMediaItems.value = mediaData.data || mediaData
        allCollections.value = collectionsData.data || collectionsData
      } catch (err) {
        console.error('❌ Admin data load error:', err)
        console.error('❌ Error response:', err.response)
        console.error('❌ Error status:', err.response?.status)
        console.error('❌ Error data:', err.response?.data)
        
        if (err.response?.status === 401) {
          error.value = 'Nicht autorisiert. Bitte loggen Sie sich als Admin ein.'
        } else if (err.response?.status === 403) {
          error.value = 'Admin-Berechtigung erforderlich. Sie sind kein Admin.'
        } else {
          error.value = err.response?.data?.message || err.message || 'Fehler beim Laden der Admin-Daten'
        }
      } finally {
        loading.value = false
      }
    }
    
    const updateUser = async (user) => {
      updatingUsers.value.push(user.id)
      
      try {
        await adminApi.updateUser(user.id, { is_admin: user.is_admin })
        console.log(`User ${user.name} admin status updated`)
      } catch (err) {
        console.error('Failed to update user:', err)
        // Revert the change
        user.is_admin = !user.is_admin
      } finally {
        updatingUsers.value = updatingUsers.value.filter(id => id !== user.id)
      }
    }
    
    
    
    const navigateToLibrary = () => {
      router.push('/')
    }
    
    const navigateToStatistics = () => {
      router.push('/statistics')
    }
    
    const navigateToCalendar = () => {
      router.push('/calendar')
    }
    
    const navigateToFeatures = () => {
      router.push('/features')
    }
    
    const navigateToProfile = () => {
      router.push('/profile')
    }
    
    const logout = async () => {
      await authStore.logout()
      router.push('/')
    }
    
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }
    
    const toggleMobileSidebar = () => {
      mobileSidebarOpen.value = !mobileSidebarOpen.value
    }
    
    const closeMobileSidebar = () => {
      mobileSidebarOpen.value = false
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString()
    }

    // Computed properties
    const filteredUsers = computed(() => {
      if (!userSearchQuery.value) return users.value
      
      const query = userSearchQuery.value.toLowerCase()
      return users.value.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    })

    // User management methods
    const searchUsers = () => {
      // Search is handled by computed property
    }

    const confirmDeleteUser = async (user) => {
      if (user.id === currentUserId.value) {
        alert('You cannot delete your own account!')
        return
      }

      const confirmed = confirm(
        `Are you sure you want to delete user "${user.name}"?\n\nThis will permanently delete:\n- All their media items\n- All their collections\n- Their account\n\nThis action cannot be undone!`
      )

      if (confirmed) {
        try {
          await adminApi.deleteUser(user.id)
          // Remove user from local list
          users.value = users.value.filter(u => u.id !== user.id)
          alert('User deleted successfully')
        } catch (err) {
          console.error('Failed to delete user:', err)
          alert('Failed to delete user: ' + (err.response?.data?.error || err.message))
        }
      }
    }

    const viewUserDetails = async (userId) => {
      try {
        const userDetails = await adminApi.getUserDetails(userId)
        selectedUser.value = userDetails
        showUserModal.value = true
      } catch (err) {
        console.error('Failed to load user details:', err)
        alert('Failed to load user details: ' + (err.response?.data?.error || err.message))
      }
    }

    const closeUserModal = () => {
      showUserModal.value = false
      selectedUser.value = null
    }
    
    

    onMounted(() => {
      // Check if user is admin before loading data
      if (!authStore.isLoggedIn) {
        error.value = 'Bitte loggen Sie sich ein, um das Admin-Panel zu verwenden.'
        return
      }
      
      if (!authStore.isAdmin) {
        error.value = 'Sie haben keine Admin-Berechtigung. Nur Administratoren können auf dieses Panel zugreifen.'
        return
      }
      
      loadData()
    })
    
    return {
      loading,
      error,
      statistics,
      users,
      allMediaItems,
      allCollections,
      updatingUsers,
      currentUserId,
      userSearchQuery,
      selectedUser,
      showUserModal,
      sidebarCollapsed,
      mobileSidebarOpen,
      isLoggedIn,
      isAdmin,
      userName,
      filteredUsers,
      loadData,
      updateUser,
      viewUserDetails,
      confirmDeleteUser,
      closeUserModal,
      searchUsers,
      navigateToLibrary,
      navigateToStatistics,
      navigateToCalendar,
      navigateToFeatures,
      navigateToProfile,
      logout,
      toggleSidebar,
      toggleMobileSidebar,
      closeMobileSidebar,
      formatDate
    }
  }
}
</script>

<style scoped>
/* Admin Dashboard Layout */
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

.refresh-btn {
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

.refresh-btn:hover {
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

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.stat-card {
  background: #2d2d2d;
  border-radius: 12px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid #404040;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4a9eff, #3a8eef);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: #4a9eff;
}

.stat-icon {
  font-size: 3rem;
  opacity: 0.9;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.stat-content h3 {
  margin: 0 0 8px 0;
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #4a9eff;
  margin: 0 0 5px 0;
  line-height: 1;
}

.stat-subtitle {
  font-size: 13px;
  color: #a0a0a0;
  margin: 0;
  font-weight: 500;
}

/* Admin Sections */
.admin-section {
  background: #2d2d2d;
  border-radius: 12px;
  margin-bottom: 30px;
  border: 1px solid #404040;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 1px solid #404040;
  background: #3a3a3a;
}

.section-header h2 {
  margin: 0;
  color: #e0e0e0;
  font-size: 20px;
  font-weight: 600;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}


/* Search Input */
.search-input {
  padding: 12px 16px;
  border: 1px solid #404040;
  border-radius: 8px;
  background: #3a3a3a;
  color: #e0e0e0;
  font-size: 14px;
  width: 250px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

.search-input::placeholder {
  color: #a0a0a0;
}

/* Table Styles */
.table-container {
  overflow-x: auto;
  background: #2d2d2d;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.admin-table th,
.admin-table td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid #404040;
}

.admin-table th {
  background: #3a3a3a;
  color: #e0e0e0;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.admin-table td {
  color: #d0d0d0;
  vertical-align: middle;
}

.admin-table tbody tr:hover {
  background: #3a3a3a;
}

/* User Info */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  font-weight: 600;
  color: #e0e0e0;
}

.admin-badge {
  font-size: 14px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

/* Checkbox Styles */
.checkbox-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.checkbox-container input {
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #3a3a3a;
  border: 2px solid #404040;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: #4a4a4a;
  border-color: #555;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #4a9eff;
  border-color: #4a9eff;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-small {
  background: #4a9eff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
}

.btn-small:hover {
  background: #3a8eef;
  transform: translateY(-1px);
}

.btn-small:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
}

.btn-small.btn-primary {
  background: #4a9eff;
}

.btn-small.btn-primary:hover {
  background: #3a8eef;
}

.btn-small.btn-danger {
  background: #dc3545;
}

.btn-small.btn-danger:hover {
  background: #c82333;
}

.btn-small.btn-danger:disabled {
  background: #666;
  cursor: not-allowed;
}

/* Grid Layouts */
.media-grid,
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 30px;
}

.media-item-card,
.collection-card {
  background: #3a3a3a;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #505050;
  transition: all 0.2s;
}

.media-item-card:hover,
.collection-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border-color: #4a9eff;
}

.media-item-card h4,
.collection-card h4 {
  margin: 0 0 10px 0;
  color: #e0e0e0;
  font-size: 16px;
  font-weight: 600;
}

.media-category,
.media-user,
.media-date,
.collection-user,
.collection-count {
  margin: 6px 0;
  font-size: 13px;
  color: #a0a0a0;
  font-weight: 500;
}

.collection-description {
  margin: 10px 0;
  font-size: 14px;
  color: #d0d0d0;
  font-style: italic;
  line-height: 1.4;
}

/* Error Styles */
.error {
  text-align: center;
  padding: 60px 40px;
  color: #ff6b6b;
  background: #2d2d2d;
  border-radius: 12px;
  border: 1px solid #404040;
}

.error p {
  font-size: 18px;
  margin-bottom: 20px;
  font-weight: 500;
}

.error button {
  background: #4a9eff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.error button:hover {
  background: #3a8eef;
  transform: translateY(-1px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #2d2d2d;
  border-radius: 12px;
  border: 1px solid #404040;
  max-width: 700px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 1px solid #404040;
  background: #3a3a3a;
}

.modal-header h3 {
  margin: 0;
  color: #e0e0e0;
  font-size: 20px;
  font-weight: 600;
}

.modal-body {
  padding: 30px;
}

.user-details {
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #404040;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  font-weight: 600;
  color: #a0a0a0;
  min-width: 140px;
  font-size: 14px;
}

.detail-row span {
  color: #e0e0e0;
  font-weight: 500;
}

.admin-status.admin {
  color: #ffd700;
  font-weight: 600;
}

.recent-activity {
  margin-top: 30px;
}

.recent-activity h4 {
  color: #e0e0e0;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #3a3a3a;
  border-radius: 8px;
  border: 1px solid #505050;
  transition: all 0.2s;
}

.activity-item:hover {
  background: #404040;
  border-color: #4a9eff;
}

.activity-title {
  font-weight: 600;
  color: #e0e0e0;
  flex: 1;
  font-size: 14px;
}

.activity-category {
  color: #4a9eff;
  font-size: 12px;
  margin: 0 15px;
  font-weight: 500;
  background: rgba(74, 158, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.activity-date {
  color: #a0a0a0;
  font-size: 12px;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .content-area {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .mobile-sidebar-toggle {
    display: block;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 15px;
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
  
  .media-grid,
  .collections-grid {
    grid-template-columns: 1fr;
    padding: 20px;
  }
  
  .search-input {
    width: 200px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .section-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .search-input {
    width: 100%;
    max-width: 200px;
  }
  
  .table-container {
    font-size: 12px;
  }
  
  .admin-table th,
  .admin-table td {
    padding: 10px 12px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 5px;
  }
}
</style>

