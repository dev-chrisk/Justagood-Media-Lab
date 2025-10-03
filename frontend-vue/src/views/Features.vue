<template>
  <div class="vue-app">
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" :class="{ show: mobileSidebarOpen }" @click="closeMobileSidebar"></div>
    
    <!-- Sidebar -->
    <Sidebar
      :collapsed="sidebarCollapsed"
      :mobile-open="mobileSidebarOpen"
      :is-logged-in="isLoggedIn"
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
      @toggle-platform-filter="togglePlatformFilter"
      @toggle-genre-filter="toggleGenreFilter"
      @toggle-airing-filter="toggleAiringFilter"
      @add-item="addItemFromSidebar"
      @show-login="showLoginModal = true"
      @show-register="showRegisterModal = true"
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
        <div class="features-container">
          <h1>Features</h1>
          <p class="features-description">
            Erweiterte Funktionen für Ihre Media Library
          </p>

          <!-- TMDb Collection Test Feature -->
          <div class="feature-card">
            <div class="feature-header">
              <h2>🎬 TMDb Collection Test</h2>
              <p>Testen Sie TMDb Collections und fügen Sie ganze Filmreihen hinzu</p>
            </div>
            
            <div class="feature-content">
              <div class="input-group">
                <label for="movieInput">Film-Titel oder TMDb ID eingeben:</label>
                <div class="input-with-button">
                  <input
                    id="movieInput"
                    v-model="movieInput"
                    type="text"
                    placeholder="z.B. 'The Lord of the Rings', 'Matrix' oder '120'"
                    @keyup.enter="testCollection"
                    :disabled="isTesting"
                  />
                  <button 
                    @click="testCollection" 
                    :disabled="!movieInput.trim() || isTesting"
                    class="test-button"
                  >
                    {{ isTesting ? 'Teste...' : 'Collection testen' }}
                  </button>
                </div>
                <div class="input-hint">
                  <p>💡 <strong>Tipp:</strong> Versuchen Sie "The Lord of the Rings", "Matrix", "Star Wars" oder "Harry Potter"</p>
                </div>
              </div>

              <!-- Test Results -->
              <div v-if="testResults" class="test-results">
                <div class="result-header">
                  <h3>Collection gefunden!</h3>
                  <p><strong>{{ testResults.collection.name }}</strong></p>
                  <p>{{ testResults.collection.overview || 'Keine Beschreibung verfügbar' }}</p>
                </div>
                
                <div class="collection-movies">
                  <h4>Filme in der Collection ({{ testResults.collection.parts.length }}):</h4>
                  <div class="movie-list">
                    <div 
                      v-for="(movie, index) in testResults.collection.parts" 
                      :key="movie.id"
                      class="movie-item"
                    >
                      <div class="movie-poster">
                        <img 
                          v-if="movie.poster_path" 
                          :src="`https://image.tmdb.org/t/p/w200${movie.poster_path}`"
                          :alt="movie.title"
                          @error="handleImageError"
                        />
                        <div v-else class="no-poster">🎬</div>
                      </div>
                      <div class="movie-info">
                        <h5>{{ movie.title }}</h5>
                        <p class="movie-release">{{ formatDate(movie.release_date) }}</p>
                        <p class="movie-overview">{{ movie.overview || 'Keine Beschreibung verfügbar' }}</p>
                        <div class="movie-meta">
                          <span class="rating">⭐ {{ movie.vote_average?.toFixed(1) || 'N/A' }}</span>
                          <span class="id">ID: {{ movie.id }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="collection-actions">
                  <button 
                    @click="addCollectionToLibrary"
                    :disabled="isAddingCollection"
                    class="add-collection-button"
                  >
                    {{ isAddingCollection ? 'Füge hinzu...' : `Alle ${testResults.collection.parts.length} Filme zur Bibliothek hinzufügen` }}
                  </button>
                  <button @click="clearResults" class="clear-button">
                    Neuen Test starten
                  </button>
                </div>
              </div>

              <!-- Error Display -->
              <div v-if="testError" class="error-message">
                <h4>❌ Test fehlgeschlagen</h4>
                <p>{{ testError }}</p>
                <button @click="clearError" class="clear-button">Erneut versuchen</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modals -->
    <LoginModal 
      v-if="showLoginModal" 
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
    />
    <RegisterModal 
      v-if="showRegisterModal" 
      @close="showRegisterModal = false"
      @success="handleRegisterSuccess"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import { useMessageStore } from '@/stores/message'
import Sidebar from '@/components/Sidebar.vue'
import MainHeader from '@/components/MainHeader.vue'
import LoginModal from '@/components/LoginModal.vue'
import RegisterModal from '@/components/RegisterModal.vue'
import { mediaApi } from '@/services/api'

export default {
  name: 'Features',
  components: {
    Sidebar,
    MainHeader,
    LoginModal,
    RegisterModal
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const mediaStore = useMediaStore()
    const messageStore = useMessageStore()

    // UI State
    const sidebarCollapsed = ref(false)
    const mobileSidebarOpen = ref(false)
    const showLoginModal = ref(false)
    const showRegisterModal = ref(false)
    const movieInput = ref('')
    const isTesting = ref(false)
    const isAddingCollection = ref(false)
    const testResults = ref(null)
    const testError = ref('')

    // Computed
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const userName = computed(() => authStore.userName)
    const currentCategory = computed(() => mediaStore.currentCategory)
    const categoryCounts = computed(() => mediaStore.categoryCounts)
    const platforms = computed(() => mediaStore.platforms)
    const genres = computed(() => mediaStore.genres)
    const categories = computed(() => [
      { key: 'game', name: 'Games', icon: '🎮' },
      { key: 'series', name: 'Series', icon: '📺' },
      { key: 'movie', name: 'Movies', icon: '🎬' },
      { key: 'watchlist', name: 'Watchlist', icon: '❤️' }
    ])

    // Methods
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    const toggleMobileSidebar = () => {
      mobileSidebarOpen.value = !mobileSidebarOpen.value
    }

    const closeMobileSidebar = () => {
      mobileSidebarOpen.value = false
    }

    const setCategory = (category) => {
      mediaStore.setCategory(category)
    }

    const clearSearch = () => {
      mediaStore.setSearchQuery('')
    }

    const togglePlatformFilter = (platform) => {
      mediaStore.togglePlatformFilter(platform)
    }

    const toggleGenreFilter = (genre) => {
      mediaStore.toggleGenreFilter(genre)
    }

    const toggleAiringFilter = () => {
      mediaStore.toggleAiringFilter()
    }

    const addItemFromSidebar = (category) => {
      // Navigate back to main library to add item
      router.push('/')
    }

    const logout = async () => {
      await authStore.logout()
      messageStore.showMessage('Erfolgreich abgemeldet', 'success')
    }

    // Navigation methods
    const navigateToStatistics = () => {
      router.push('/statistics')
      mobileSidebarOpen.value = false
    }

    const navigateToCalendar = () => {
      router.push('/calendar')
      mobileSidebarOpen.value = false
    }

    const navigateToFeatures = () => {
      router.push('/features')
      mobileSidebarOpen.value = false
    }

    const navigateToProfile = () => {
      router.push('/profile')
      mobileSidebarOpen.value = false
    }

    // TMDb Collection Test Methods
    const testCollection = async () => {
      if (!movieInput.value.trim()) return

      isTesting.value = true
      testError.value = ''
      testResults.value = null

      try {
        // First, search for the movie
        const searchResults = await mediaApi.searchApi(movieInput.value, 'movie', 1)
        
        if (!searchResults || searchResults.length === 0) {
          throw new Error('Kein Film mit diesem Namen gefunden')
        }

        const movie = searchResults[0]
        const tmdbId = movie.id.replace('tmdb_movie_', '')
        
        // Get movie details to check for collection
        const movieDetails = await fetchMovieDetails(tmdbId)
        
        if (!movieDetails.belongs_to_collection) {
          throw new Error('Dieser Film gehört zu keiner Collection')
        }

        const collectionId = movieDetails.belongs_to_collection.id
        const collectionDetails = await fetchCollectionDetails(collectionId)

        if (!collectionDetails.parts || collectionDetails.parts.length < 2) {
          throw new Error('Collection hat weniger als 2 Filme')
        }

        testResults.value = {
          movie: movieDetails,
          collection: collectionDetails
        }

        messageStore.showMessage('Collection erfolgreich gefunden!', 'success')

      } catch (error) {
        console.error('Collection test failed:', error)
        testError.value = error.message || 'Unbekannter Fehler beim Testen der Collection'
        messageStore.showMessage('Collection-Test fehlgeschlagen', 'error')
      } finally {
        isTesting.value = false
      }
    }

    const fetchMovieDetails = async (tmdbId) => {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://teabubble.attrebi.ch'
      const response = await fetch(`${baseUrl}/api/tmdb/movie/${tmdbId}`)
      if (!response.ok) {
        throw new Error('Film-Details konnten nicht abgerufen werden')
      }
      return await response.json()
    }

    const fetchCollectionDetails = async (collectionId) => {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://teabubble.attrebi.ch'
      const response = await fetch(`${baseUrl}/api/tmdb/collection/${collectionId}`)
      if (!response.ok) {
        throw new Error('Collection-Details konnten nicht abgerufen werden')
      }
      return await response.json()
    }

    const addCollectionToLibrary = async () => {
      if (!testResults.value || !isLoggedIn.value) return

      isAddingCollection.value = true

      try {
        const movies = testResults.value.collection.parts
        let addedCount = 0

        for (const movie of movies) {
          try {
            const movieData = {
              title: movie.title,
              category: 'movie',
              watchlistType: 'watchlist',
              release: movie.release_date,
              rating: Math.round(movie.vote_average),
              platforms: 'Cinema',
              genre: 'Collection',
              link: `https://www.themoviedb.org/movie/${movie.id}`,
              path: null,
              discovered: new Date().toISOString().split('T')[0],
              externalId: `tmdb_movie_${movie.id}`
            }

            await mediaApi.addMediaItem(movieData)
            addedCount++
          } catch (error) {
            console.warn(`Failed to add movie ${movie.title}:`, error)
          }
        }

        messageStore.showMessage(`${addedCount} von ${movies.length} Filmen erfolgreich hinzugefügt`, 'success')
        
        // Reload media to show new items
        await mediaStore.loadMedia()

      } catch (error) {
        console.error('Failed to add collection:', error)
        messageStore.showMessage('Fehler beim Hinzufügen der Collection', 'error')
      } finally {
        isAddingCollection.value = false
      }
    }

    const clearResults = () => {
      testResults.value = null
      testError.value = ''
      movieInput.value = ''
    }

    const clearError = () => {
      testError.value = ''
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'Unbekannt'
      return new Date(dateString).toLocaleDateString('de-DE')
    }

    const handleImageError = (event) => {
      event.target.style.display = 'none'
    }

    const handleLoginSuccess = () => {
      showLoginModal.value = false
      messageStore.showMessage('Erfolgreich angemeldet', 'success')
    }

    const handleRegisterSuccess = () => {
      showRegisterModal.value = false
      messageStore.showMessage('Erfolgreich registriert', 'success')
    }

    // Load media on mount
    onMounted(async () => {
      await mediaStore.loadMedia()
    })

    return {
      // State
      sidebarCollapsed,
      mobileSidebarOpen,
      showLoginModal,
      showRegisterModal,
      movieInput,
      isTesting,
      isAddingCollection,
      testResults,
      testError,
      
      // Computed
      isLoggedIn,
      userName,
      currentCategory,
      categoryCounts,
      platforms,
      genres,
      categories,
      
      // Methods
      toggleSidebar,
      toggleMobileSidebar,
      closeMobileSidebar,
      setCategory,
      clearSearch,
      togglePlatformFilter,
      toggleGenreFilter,
      toggleAiringFilter,
      addItemFromSidebar,
      logout,
      navigateToStatistics,
      navigateToCalendar,
      navigateToFeatures,
      navigateToProfile,
      testCollection,
      addCollectionToLibrary,
      clearResults,
      clearError,
      formatDate,
      handleImageError,
      handleLoginSuccess,
      handleRegisterSuccess
    }
  }
}
</script>

<style scoped>
.features-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.features-container h1 {
  color: #e0e0e0;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.features-description {
  color: #b0b0b0;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.feature-card {
  background: #3a3a3a;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #4a4a4a;
}

.feature-header h2 {
  color: #e0e0e0;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.feature-header p {
  color: #b0b0b0;
  margin-bottom: 1.5rem;
}

.input-group {
  margin-bottom: 2rem;
}

.input-hint {
  margin-top: 0.5rem;
}

.input-hint p {
  color: #888;
  font-size: 0.9rem;
  margin: 0;
}

.input-group label {
  display: block;
  color: #e0e0e0;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.input-with-button {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.input-with-button input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #555;
  border-radius: 6px;
  background: #2a2a2a;
  color: #e0e0e0;
  font-size: 1rem;
}

.input-with-button input:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.test-button {
  padding: 0.75rem 1.5rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.test-button:hover:not(:disabled) {
  background: #005a9e;
}

.test-button:disabled {
  background: #555;
  cursor: not-allowed;
}

.test-results {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.result-header h3 {
  color: #4caf50;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
}

.result-header p {
  color: #e0e0e0;
  margin-bottom: 0.5rem;
}

.collection-movies h4 {
  color: #e0e0e0;
  margin: 1.5rem 0 1rem 0;
  font-size: 1.1rem;
}

.movie-list {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.movie-item {
  display: flex;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #333;
}

.movie-poster {
  width: 80px;
  height: 120px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.movie-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.no-poster {
  width: 100%;
  height: 100%;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border-radius: 4px;
}

.movie-info {
  flex: 1;
}

.movie-info h5 {
  color: #e0e0e0;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.movie-release {
  color: #b0b0b0;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.movie-overview {
  color: #a0a0a0;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.movie-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.rating {
  color: #ffd700;
}

.id {
  color: #888;
}

.collection-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.add-collection-button {
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.add-collection-button:hover:not(:disabled) {
  background: #45a049;
}

.add-collection-button:disabled {
  background: #555;
  cursor: not-allowed;
}

.clear-button {
  padding: 0.75rem 1.5rem;
  background: #666;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.clear-button:hover {
  background: #777;
}

.error-message {
  background: #4a1a1a;
  border: 1px solid #8b0000;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.error-message h4 {
  color: #ff6b6b;
  margin-bottom: 0.5rem;
}

.error-message p {
  color: #e0e0e0;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .features-container {
    padding: 1rem;
  }
  
  .input-with-button {
    flex-direction: column;
  }
  
  .movie-list {
    grid-template-columns: 1fr;
  }
  
  .movie-item {
    flex-direction: column;
  }
  
  .movie-poster {
    width: 100%;
    height: 200px;
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .collection-actions {
    flex-direction: column;
  }
}
</style>
