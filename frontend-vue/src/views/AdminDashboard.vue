<template>
  <div class="vue-app">
    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar">
      <div class="sidebar-header" @click="toggleSidebar">
        <h2>Admin Panel</h2>
        <button class="sidebar-toggle">☰</button>
      </div>
      <div class="sidebar-content">
        <div class="sidebar-section">
          <h3>Administration</h3>
          <nav class="sidebar-nav">
            <button class="nav-btn active">
              <span class="nav-icon">👑</span>
              <span class="nav-text">Dashboard</span>
            </button>
            <button class="nav-btn" @click="showUsers = true">
              <span class="nav-icon">👥</span>
              <span class="nav-text">Users</span>
            </button>
            <button class="nav-btn" @click="showMedia = true">
              <span class="nav-icon">📚</span>
              <span class="nav-text">All Media</span>
            </button>
            <button class="nav-btn" @click="showCollections = true">
              <span class="nav-icon">📁</span>
              <span class="nav-text">Collections</span>
            </button>
          </nav>
        </div>
        <div class="sidebar-section">
          <h3>Navigation</h3>
          <nav class="sidebar-nav">
            <button class="nav-btn" @click="navigateToLibrary">
              <span class="nav-icon">🏠</span>
              <span class="nav-text">Back to Library</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <header class="main-header">
        <div class="header-left">
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
          <div v-if="showUsers" class="admin-section">
            <div class="section-header">
              <h2>User Management</h2>
              <button class="close-btn" @click="showUsers = false">×</button>
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
                  <tr v-for="user in users" :key="user.id">
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td>
                      <input 
                        type="checkbox" 
                        v-model="user.is_admin" 
                        @change="updateUser(user)"
                        :disabled="updatingUsers.includes(user.id)"
                      >
                    </td>
                    <td>{{ user.media_items_count || 0 }}</td>
                    <td>{{ user.collections_count || 0 }}</td>
                    <td>{{ formatDate(user.created_at) }}</td>
                    <td>
                      <button 
                        class="btn-small" 
                        @click="viewUserDetails(user.id)"
                        :disabled="loading"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- All Media Items -->
          <div v-if="showMedia" class="admin-section">
            <div class="section-header">
              <h2>All Media Items</h2>
              <button class="close-btn" @click="showMedia = false">×</button>
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
          <div v-if="showCollections" class="admin-section">
            <div class="section-header">
              <h2>All Collections</h2>
              <button class="close-btn" @click="showCollections = false">×</button>
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/services/adminService'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

export default {
  name: 'AdminDashboard',
  components: {
    LoadingSpinner
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
    
    // UI state
    const showUsers = ref(false)
    const showMedia = ref(false)
    const showCollections = ref(false)
    
    // Methods
    const loadData = async () => {
      loading.value = true
      error.value = null
      
      try {
        const [statsData, usersData] = await Promise.all([
          adminApi.getStatistics(),
          adminApi.getUsers()
        ])
        
        statistics.value = statsData
        users.value = usersData
      } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Failed to load admin data'
        console.error('Admin data load error:', err)
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
    
    const viewUserDetails = async (userId) => {
      try {
        const userDetails = await adminApi.getUserDetails(userId)
        console.log('User details:', userDetails)
        // You could open a modal or navigate to a details page here
        alert(`User Details:\nName: ${userDetails.name}\nEmail: ${userDetails.email}\nMedia Items: ${userDetails.media_items_count}\nCollections: ${userDetails.collections_count}`)
      } catch (err) {
        console.error('Failed to load user details:', err)
      }
    }
    
    const loadAllMediaItems = async () => {
      try {
        const mediaData = await adminApi.getAllMediaItems()
        allMediaItems.value = mediaData.data || mediaData
      } catch (err) {
        console.error('Failed to load media items:', err)
      }
    }
    
    const loadAllCollections = async () => {
      try {
        const collectionsData = await adminApi.getAllCollections()
        allCollections.value = collectionsData
      } catch (err) {
        console.error('Failed to load collections:', err)
      }
    }
    
    const navigateToLibrary = () => {
      router.push('/')
    }
    
    const toggleSidebar = () => {
      // Sidebar toggle logic
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString()
    }
    
    // Watchers
    const watchShowMedia = () => {
      if (showMedia.value && allMediaItems.value.length === 0) {
        loadAllMediaItems()
      }
    }
    
    const watchShowCollections = () => {
      if (showCollections.value && allCollections.value.length === 0) {
        loadAllCollections()
      }
    }
    
    onMounted(() => {
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
      showUsers,
      showMedia,
      showCollections,
      loadData,
      updateUser,
      viewUserDetails,
      navigateToLibrary,
      toggleSidebar,
      formatDate,
      watchShowMedia,
      watchShowCollections
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 1px solid #404040;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.stat-content h3 {
  margin: 0 0 5px 0;
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #4a9eff;
  margin: 0;
}

.stat-subtitle {
  font-size: 12px;
  color: #a0a0a0;
  margin: 0;
}

.admin-section {
  background: #2d2d2d;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #404040;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #404040;
}

.section-header h2 {
  margin: 0;
  color: #e0e0e0;
}

.close-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
}

.close-btn:hover {
  color: #e0e0e0;
}

.table-container {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th,
.admin-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #404040;
}

.admin-table th {
  background: #3a3a3a;
  color: #e0e0e0;
  font-weight: 500;
}

.admin-table td {
  color: #d0d0d0;
}

.admin-table input[type="checkbox"] {
  transform: scale(1.2);
}

.btn-small {
  background: #4a9eff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-small:hover {
  background: #3a8eef;
}

.btn-small:disabled {
  background: #666;
  cursor: not-allowed;
}

.media-grid,
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  padding: 20px;
}

.media-item-card,
.collection-card {
  background: #3a3a3a;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #505050;
}

.media-item-card h4,
.collection-card h4 {
  margin: 0 0 8px 0;
  color: #e0e0e0;
  font-size: 14px;
}

.media-category,
.media-user,
.media-date,
.collection-user,
.collection-count {
  margin: 4px 0;
  font-size: 12px;
  color: #a0a0a0;
}

.collection-description {
  margin: 8px 0;
  font-size: 13px;
  color: #d0d0d0;
  font-style: italic;
}

.refresh-btn {
  background: #4a9eff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-btn:hover {
  background: #3a8eef;
}

.error {
  text-align: center;
  padding: 40px;
  color: #ff6b6b;
}

.error button {
  background: #4a9eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.error button:hover {
  background: #3a8eef;
}
</style>
