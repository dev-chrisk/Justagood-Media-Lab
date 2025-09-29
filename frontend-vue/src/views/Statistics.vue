<template>
  <div class="vue-app">
    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar">
      <div class="sidebar-header" @click="toggleSidebar">
        <h2>Media Library</h2>
        <button class="sidebar-toggle">☰</button>
      </div>
      <div class="sidebar-content">
        <div class="sidebar-section">
          <h3>Navigation</h3>
          <nav class="sidebar-nav">
            <button class="nav-btn" @click="navigateToLibrary">
              <span class="nav-icon">📚</span>
              <span class="nav-text">Library</span>
            </button>
            <button class="nav-btn active">
              <span class="nav-icon">📊</span>
              <span class="nav-text">Statistics</span>
            </button>
            <button class="nav-btn" @click="navigateToProfile">
              <span class="nav-icon">👤</span>
              <span class="nav-text">Profile</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <header class="main-header">
        <div class="header-left">
          <button class="mobile-sidebar-toggle" @click="toggleMobileSidebar">☰</button>
          <h1 class="page-title">Statistics</h1>
        </div>
        <div class="header-right">
          <button class="refresh-stats-btn" @click="refreshStatistics" title="Refresh statistics">
            <span class="refresh-icon">🔄</span>
          </button>
        </div>
      </header>

      <main class="content-area">
        <div class="statistics-container">
          <div class="statistics-header">
            <h1>📊 Media Library Statistics</h1>
            <p>Übersicht über deine Media Collection</p>
            <div class="refresh-controls">
              <button class="refresh-btn" @click="refreshStatistics">🔄 Refresh Statistics</button>
            </div>
          </div>

          <div v-if="loading" class="loading">
            <p>Lade Statistiken...</p>
          </div>

          <div v-else-if="error" class="error">
            <p>{{ error }}</p>
            <button @click="refreshStatistics">Retry</button>
          </div>

          <div v-else class="statistics-content">
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
                  <div class="rating-stars">{{ '★'.repeat(parseInt(rating)) }}{{ '☆'.repeat(5 - parseInt(rating)) }}</div>
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
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'

export default {
  name: 'Statistics',
  setup() {
    const router = useRouter()
    const mediaStore = useMediaStore()
    
    const loading = ref(false)
    const error = ref('')
    
    const statistics = computed(() => {
      const data = mediaStore.mediaData
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
    
    const toggleSidebar = () => {
      // Sidebar toggle logic
    }
    
    const toggleMobileSidebar = () => {
      // Mobile sidebar toggle logic - can be implemented if needed
    }
    
    const navigateToLibrary = () => {
      router.push('/')
    }
    
    const navigateToProfile = () => {
      router.push('/profile')
    }
    
    const refreshStatistics = async () => {
      loading.value = true
      error.value = ''
      
      try {
        await mediaStore.loadMedia()
      } catch (err) {
        error.value = 'Failed to refresh statistics'
      } finally {
        loading.value = false
      }
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString()
    }
    
    onMounted(async () => {
      await refreshStatistics()
    })
    
    return {
      loading,
      error,
      statistics,
      toggleSidebar,
      toggleMobileSidebar,
      navigateToLibrary,
      navigateToProfile,
      refreshStatistics,
      formatDate
    }
  }
}
</script>

<style scoped>
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
}

.statistics-header p {
  margin: 0 0 20px 0;
  color: #a0a0a0;
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
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn:hover {
  background: #3a8eef;
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
</style>

