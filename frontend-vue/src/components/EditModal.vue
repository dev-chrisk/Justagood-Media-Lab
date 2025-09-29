<template>
  <div class="modal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>{{ isEditing ? 'Edit Item' : 'Add Item' }}</h2>
      
      <form @submit.prevent="handleSave">
        <div class="form-row">
          <div class="form-group">
            <label for="category">Category:</label>
            <select id="category" v-model="form.category" required>
              <option value="watchlist">Watchlist</option>
              <option value="game">Game</option>
              <option value="series">Series</option>
              <option value="movie">Movie</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="title">Title:</label>
            <div class="search-container">
              <input 
                type="text" 
                id="title"
                v-model="form.title" 
                @input="searchApi"
                required
                :placeholder="isWatchlist ? 'Manuell eingeben (keine API-Suche)' : 'Enter title'"
                :disabled="loading"
              />
              <div v-if="isWatchlist" class="watchlist-hint">
                📋 Watchlist: Bitte alle Felder manuell ausfüllen
              </div>
              <div v-if="apiResults.length > 0" class="search-results">
                <div 
                  v-for="result in apiResults" 
                  :key="result.title"
                  class="search-result-item"
                  @click="selectApiResult(result)"
                >
                  <div class="result-title">{{ result.title }}</div>
                  <div class="result-meta">
                    <span v-if="result.release">{{ formatDate(result.release) }}</span>
                    <span v-if="result.genre">{{ result.genre }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="release">
              {{ isWatchlist ? 'Release Date:' : 'Release:' }}
              <span v-if="isWatchlist" class="required">*</span>
            </label>
            <input 
              type="date" 
              id="release"
              v-model="form.release"
              :required="isWatchlist"
            />
            <div v-if="isWatchlist" class="field-hint">
              📅 Set the release date to track countdown or status
            </div>
            <div v-if="isWatchlist && form.release" class="release-preview">
              <strong>Preview:</strong> {{ getReleasePreview() }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="rating">Rating:</label>
            <input 
              type="number" 
              id="rating"
              v-model="form.rating" 
              step="0.1" 
              min="0" 
              max="10"
              placeholder="0-10"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="views">Views:</label>
            <input 
              type="number" 
              id="views"
              v-model="form.count" 
              min="0"
              placeholder="0"
            />
          </div>
          
          <div class="form-group">
            <label for="discovered">Discovered:</label>
            <input 
              type="date" 
              id="discovered"
              v-model="form.discovered"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="platforms">Platforms:</label>
            <input 
              type="text" 
              id="platforms"
              v-model="form.platforms" 
              placeholder="PC, PS5, Xbox"
            />
          </div>
          
          <div class="form-group">
            <label for="genre">Genre:</label>
            <input 
              type="text" 
              id="genre"
              v-model="form.genre" 
              placeholder="Action, Adventure, RPG"
            />
          </div>
        </div>
        
        <!-- Watchlist Type Selection -->
        <div v-if="form.category === 'watchlist'" class="form-row">
          <div class="form-group">
            <label for="watchlistType">Type: <span class="required">*</span></label>
            <select id="watchlistType" v-model="form.watchlistType">
              <option value="">Select Type</option>
              <option value="game">Game</option>
              <option value="series">Series</option>
              <option value="movie">Movie</option>
            </select>
            <div v-if="form.category === 'watchlist' && !form.watchlistType" class="field-error">
              Please select a type for watchlist items
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="link">Link:</label>
            <input 
              type="url" 
              id="link"
              v-model="form.link" 
              placeholder="https://..."
            />
          </div>
          
          <div class="form-group">
            <label for="path">Image Path:</label>
            <input 
              type="text" 
              id="path"
              v-model="form.path" 
              placeholder="images/movies/filename.jpg"
            />
          </div>
        </div>
        
        <!-- Game-specific fields -->
        <div v-if="isGame" class="form-row">
          <div class="form-group">
            <label for="playtime">Playtime (Minutes):</label>
            <input 
              type="number" 
              id="playtime"
              v-model="form.spielzeit" 
              min="0"
              placeholder="0"
            />
          </div>
        </div>
        
        <!-- Series-specific fields -->
        <div v-if="isSeries" class="form-row">
          <div class="form-group">
            <label for="isAiring">Status:</label>
            <select id="isAiring" v-model="form.isAiring">
              <option :value="false">Finished</option>
              <option :value="true">Airing</option>
            </select>
          </div>
          
          <div v-if="form.isAiring" class="form-group">
            <label for="nextSeason">Next Season:</label>
            <input 
              type="number" 
              id="nextSeason"
              v-model="form.nextSeason" 
              min="1"
              placeholder="1"
            />
          </div>
        </div>
        
        <div v-if="form.isAiring" class="form-row">
          <div class="form-group">
            <label for="nextSeasonRelease">Next Season Release:</label>
            <input 
              type="date" 
              id="nextSeasonRelease"
              v-model="form.nextSeasonRelease"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="imageUrl">Image URL:</label>
            <input 
              type="url" 
              id="imageUrl"
              v-model="form.imageUrl" 
              placeholder="https://..."
            />
          </div>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="modal-buttons">
          <button type="submit" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" @click="closeModal" :disabled="loading">
            Cancel
          </button>
          <button 
            v-if="isEditing" 
            type="button" 
            @click="deleteItem" 
            :disabled="loading"
            class="delete-btn"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { mediaApi } from '@/services/api'

export default {
  name: 'EditModal',
  props: {
    item: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'save', 'delete'],
  setup(props, { emit }) {
    const loading = ref(false)
    const error = ref('')
    const apiResults = ref([])
    const searchTimeout = ref(null)
    
    const form = reactive({
      category: 'watchlist',
      title: '',
      release: '',
      rating: '',
      count: '',
      platforms: '',
      genre: '',
      link: '',
      path: '',
      discovered: '',
      spielzeit: '',
      isAiring: false,
      nextSeason: '',
      nextSeasonRelease: '',
      imageUrl: '',
      watchlistType: ''
    })
    
    const isEditing = computed(() => !!props.item)
    const isGame = computed(() => form.category === 'game')
    const isSeries = computed(() => form.category === 'series')
    const isWatchlist = computed(() => form.category === 'watchlist')
    
    // Initialize form with item data
    watch(() => props.item, (newItem) => {
      if (newItem) {
        Object.keys(form).forEach(key => {
          form[key] = newItem[key] || ''
        })
      } else {
        // Reset form for new item
        Object.keys(form).forEach(key => {
          form[key] = key === 'category' ? 'watchlist' : ''
        })
      }
    }, { immediate: true })
    
    const handleSave = async () => {
      if (!form.title) {
        error.value = 'Title is required'
        return
      }
      
      // Validate watchlist type
      if (form.category === 'watchlist' && !form.watchlistType) {
        error.value = 'Please select a type for watchlist items'
        return
      }
      
      // Validate watchlist release date
      if (form.category === 'watchlist' && !form.release) {
        error.value = 'Release date is required for watchlist items'
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        // Clean up form data
        const itemData = { ...form }
        
        // Convert empty strings to null for optional fields (except watchlistType)
        Object.keys(itemData).forEach(key => {
          if (itemData[key] === '' && key !== 'watchlistType') {
            itemData[key] = null
          }
        })
        
        // Convert numeric fields
        if (itemData.rating) itemData.rating = parseFloat(itemData.rating)
        if (itemData.count) itemData.count = parseInt(itemData.count)
        if (itemData.spielzeit) itemData.spielzeit = parseInt(itemData.spielzeit)
        if (itemData.nextSeason) itemData.nextSeason = parseInt(itemData.nextSeason)
        
        emit('save', itemData)
      } catch (err) {
        error.value = err.message || 'Failed to save item'
      } finally {
        loading.value = false
      }
    }
    
    const closeModal = () => {
      emit('close')
    }
    
    const deleteItem = () => {
      if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        emit('delete', props.item)
        closeModal()
      }
    }
    
    const searchApi = async () => {
      // Deaktiviere API-Suche für Watchlist (manuelle Eingabe)
      if (form.category === 'watchlist') {
        apiResults.value = []
        return
      }
      
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      
      if (!form.title || form.title.length < 3) {
        apiResults.value = []
        return
      }
      
      searchTimeout.value = setTimeout(async () => {
        try {
          const result = await mediaApi.fetchApiData(form.title, form.category)
          if (result && result.success) {
            apiResults.value = [result]
          } else {
            // Show a message that API is not available
            apiResults.value = [{
              title: `"${form.title}" - API nicht verfügbar`,
              release: '',
              genre: 'Bitte manuell ausfüllen',
              isPlaceholder: true
            }]
          }
        } catch (err) {
          console.error('API search failed:', err)
          // Show a message that API is not available
          apiResults.value = [{
            title: `"${form.title}" - API nicht verfügbar`,
            release: '',
            genre: 'Bitte manuell ausfüllen',
            isPlaceholder: true
          }]
        }
      }, 500) // Debounce search
    }
    
    const selectApiResult = (result) => {
      if (result.isPlaceholder) {
        // Don't fill form for placeholder results
        apiResults.value = []
        return
      }
      
      form.title = result.title
      if (result.release) form.release = result.release
      if (result.platforms) form.platforms = result.platforms
      if (result.genre) form.genre = result.genre
      if (result.link) form.link = result.link
      if (result.path) form.path = result.path
      if (result.imageUrl) form.imageUrl = result.imageUrl
      
      apiResults.value = []
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
    
    const getReleasePreview = () => {
      if (!form.release) return ''
      
      const releaseDate = new Date(form.release)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      releaseDate.setHours(0, 0, 0, 0)
      
      const timeDiff = releaseDate.getTime() - today.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (daysDiff > 0) {
        if (daysDiff === 1) {
          return 'Tomorrow!'
        } else if (daysDiff <= 7) {
          return `${daysDiff} days left`
        } else if (daysDiff <= 30) {
          return `${daysDiff} days left`
        } else {
          return `${Math.ceil(daysDiff / 30)} months left`
        }
      } else if (daysDiff === 0) {
        return 'Released today!'
      } else {
        const type = form.watchlistType?.toLowerCase() || 'media'
        if (type === 'game') {
          return 'Unplayed yet'
        } else if (type === 'series' || type === 'movie') {
          return 'Unwatched yet'
        } else {
          return 'Unconsumed yet'
        }
      }
    }
    
    return {
      form,
      loading,
      error,
      apiResults,
      isEditing,
      isGame,
      isSeries,
      isWatchlist,
      handleSave,
      closeModal,
      deleteItem,
      searchApi,
      selectApiResult,
      formatDate,
      getReleasePreview
    }
  }
}
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

@media (max-width: 768px) {
  .modal {
    align-items: flex-start;
    padding: 10px;
    padding-top: 20px;
  }
}

.modal-content {
  background: #2d2d2d;
  padding: 24px;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid #404040;
}

@media (max-width: 768px) {
  .modal-content {
    padding: 16px;
    max-height: 95vh;
    margin: 0;
    border-radius: 8px 8px 0 0;
  }
}

.modal-content h2 {
  margin: 0 0 20px 0;
  text-align: center;
  color: #e0e0e0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 4px;
  font-weight: 500;
  color: #d0d0d0;
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 12px; /* Larger for touch */
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 16px; /* Prevent zoom on iOS */
  background: #3a3a3a;
  color: #e0e0e0;
  min-height: 44px; /* Touch-friendly */
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4a9eff;
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.error-message {
  background: #4a2a2a;
  color: #ff6b6b;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
  border: 1px solid #e74c3c;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.modal-buttons button {
  padding: 12px 20px; /* Larger for touch */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px; /* Prevent zoom on iOS */
  transition: background 0.2s;
  min-height: 44px; /* Touch-friendly */
}

.modal-buttons button[type="submit"] {
  background: #4a9eff;
  color: white;
}

.modal-buttons button[type="submit"]:hover:not(:disabled) {
  background: #3a8eef;
}

.modal-buttons button[type="button"] {
  background: #3a3a3a;
  color: #d0d0d0;
  border: 1px solid #555;
}

.modal-buttons button[type="button"]:hover:not(:disabled) {
  background: #4a4a4a;
}

.modal-buttons .delete-btn {
  background: #e74c3c;
  color: white;
  border: 1px solid #c0392b;
}

.modal-buttons .delete-btn:hover:not(:disabled) {
  background: #c0392b;
  border-color: #a93226;
}

.modal-buttons button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-container {
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #3a3a3a;
  border: 1px solid #555;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.search-result-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #555;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #4a4a4a;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-title {
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.result-meta {
  font-size: 12px;
  color: #a0a0a0;
  display: flex;
  gap: 12px;
}

.watchlist-hint {
  background: #2d4a2d;
  border: 1px solid #4a7c4a;
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #90ee90;
  text-align: center;
}

.required {
  color: #e74c3c;
  font-weight: bold;
}

.field-error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}

.field-hint {
  color: #4a9eff;
  font-size: 12px;
  margin-top: 4px;
  font-style: italic;
}

.release-preview {
  background: #2d4a2d;
  border: 1px solid #4a7c4a;
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #90ee90;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .modal-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .modal-buttons button {
    width: 100%;
  }
  
  .search-results {
    max-height: 150px;
  }
}
</style>

