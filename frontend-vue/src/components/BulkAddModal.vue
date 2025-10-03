<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Bulk Add Items</h2>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="bulk-add-form">
          <div class="form-group">
            <label for="category">Category *</label>
            <select id="category" v-model="bulkData.category" required>
              <option value="">Select Category</option>
              <option value="game">Game</option>
              <option value="series">Series</option>
              <option value="movie">Movie</option>
              <option value="buecher">Bücher</option>
              <option value="watchlist">Watchlist</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="items-text">Items (one per line) *</label>
            <textarea 
              id="items-text"
              v-model="bulkData.itemsText"
              placeholder="Enter items one per line, for example:&#10;The Witcher 3&#10;Cyberpunk 2077&#10;Red Dead Redemption 2"
              rows="10"
              required
            ></textarea>
            <small class="help-text">Enter one item per line. The system will automatically search the API for each title and use the official names, images, and details. You can add additional info using: Title | Additional Info</small>
          </div>
          
          <div class="form-group">
            <label for="default-rating">Default Rating</label>
            <input 
              id="default-rating"
              v-model.number="bulkData.defaultRating"
              type="number"
              min="0"
              max="10"
              step="0.1"
              placeholder="Optional rating for all items"
            />
          </div>
          
          <div class="form-group">
            <label for="default-platforms">Default Platforms</label>
            <input 
              id="default-platforms"
              v-model="bulkData.defaultPlatforms"
              type="text"
              placeholder="e.g., PC, PS5, Xbox"
            />
          </div>
          
          <div class="form-group">
            <label for="default-genre">Default Genre</label>
            <input 
              id="default-genre"
              v-model="bulkData.defaultGenre"
              type="text"
              placeholder="e.g., Action, Adventure, RPG"
            />
          </div>
        </div>
        
        <div v-if="isSearching" class="search-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: searchProgress + '%' }"></div>
          </div>
          <span class="progress-text">Searching API for {{ previewItems ? previewItems.length : 0 }} items... {{ searchProgress }}%</span>
        </div>
        
        <div v-if="previewItems && previewItems.length > 0 && !isSearching" class="preview-section">
          <h3>Preview ({{ previewItems.length }} items)</h3>
          <div class="preview-list">
            <div 
              v-for="(item, index) in previewItems.slice(0, 10)" 
              :key="index"
              class="preview-item"
              :class="{ 'has-api-data': item.hasApiData }"
            >
              <div class="item-main">
                <span class="item-title">{{ item.title }}</span>
                <span v-if="item.hasApiData" class="api-badge">✓ API</span>
                <span v-else class="manual-badge">Manual</span>
              </div>
              <div v-if="item.additionalInfo" class="item-info">
                | {{ item.additionalInfo }}
              </div>
              <div v-if="item.apiData" class="item-details">
                <small v-if="item.apiData.release" class="item-release">{{ item.apiData.release }}</small>
                <small v-if="item.apiData.rating" class="item-rating">⭐ {{ item.apiData.rating }}</small>
                <small v-if="item.apiData.genre" class="item-genre">{{ item.apiData.genre }}</small>
              </div>
            </div>
            <div v-if="previewItems && previewItems.length > 10" class="preview-more">
              ... and {{ previewItems.length - 10 }} more items
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">Cancel</button>
        <button 
          class="btn btn-primary" 
          @click="saveBulkItems"
          :disabled="!canSave || loading"
        >
          <span v-if="loading">Adding {{ previewItems ? previewItems.length : 0 }} items...</span>
          <span v-else-if="isSearching">Searching API...</span>
          <span v-else>Add {{ previewItems ? previewItems.length : 0 }} Items</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { mediaApi } from '@/services/api'

export default {
  name: 'BulkAddModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    currentCategory: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const loading = ref(false)
    const error = ref(null)
    const searchProgress = ref(0)
    const searchResults = ref([])
    const isSearching = ref(false)
    
    const bulkData = ref({
      category: '',
      itemsText: '',
      defaultRating: null,
      defaultPlatforms: '',
      defaultGenre: ''
    })
    
    const previewItems = computed(() => {
      if (!bulkData.value.itemsText || !bulkData.value.itemsText.trim()) return []
      
      const rawItems = bulkData.value.itemsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split('|').map(part => part.trim())
          return {
            searchTerm: parts[0] || '',
            additionalInfo: parts[1] || null
          }
        })
      
      // If we have search results, merge them with the raw items
      if (searchResults.value && searchResults.value.length > 0) {
        return rawItems.map((item, index) => {
          const searchResult = searchResults.value[index]
          return {
            searchTerm: item.searchTerm,
            additionalInfo: item.additionalInfo,
            title: searchResult?.title || item.searchTerm,
            apiData: searchResult || null,
            hasApiData: !!searchResult
          }
        })
      }
      
      // Fallback to search terms as titles
      return rawItems.map(item => ({
        searchTerm: item.searchTerm,
        additionalInfo: item.additionalInfo,
        title: item.searchTerm,
        apiData: null,
        hasApiData: false
      }))
    })
    
    const canSave = computed(() => {
      return bulkData.value.category && 
             bulkData.value.itemsText.trim() && 
             previewItems.value && 
             previewItems.value.length > 0 &&
             !isSearching.value
    })
    
    const closeModal = () => {
      // Clear any error when closing modal
      error.value = null
      emit('close')
    }
    
    
    const searchApiData = async () => {
      if (!bulkData.value.category || !bulkData.value.itemsText || !bulkData.value.itemsText.trim()) return
      
      isSearching.value = true
      searchProgress.value = 0
      searchResults.value = []
      error.value = null
      
      try {
        const rawItems = bulkData.value.itemsText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => line.split('|')[0].trim()) // Only use the first part before |
        
        const results = []
        
        for (let i = 0; i < rawItems.length; i++) {
          const searchTerm = rawItems[i]
          searchProgress.value = Math.round(((i + 1) / rawItems.length) * 100)
          
          try {
            // Search for the item using the API
            const searchResults = await mediaApi.searchApi(searchTerm, bulkData.value.category, 1)
            
            if (searchResults && searchResults.length > 0) {
              // Use the first search result
              const result = searchResults[0]
              results.push({
                title: result.title,
                release: result.release,
                rating: result.rating ? Math.round(result.rating) : null,
                platforms: result.platforms || bulkData.value.defaultPlatforms,
                genre: result.genre || bulkData.value.defaultGenre,
                link: result.link,
                path: result.image, // This will be the image URL
                external_id: result.id,
                api_source: result.api_source
              })
            } else {
              // No API result found, use search term as title
              results.push({
                title: searchTerm,
                release: null,
                rating: bulkData.value.defaultRating,
                platforms: bulkData.value.defaultPlatforms,
                genre: bulkData.value.defaultGenre,
                link: null,
                path: null,
                external_id: null,
                api_source: null
              })
            }
          } catch (searchError) {
            console.warn(`Search failed for "${searchTerm}":`, searchError)
            // Fallback to search term as title
            results.push({
              title: searchTerm,
              release: null,
              rating: bulkData.value.defaultRating,
              platforms: bulkData.value.defaultPlatforms,
              genre: bulkData.value.defaultGenre,
              link: null,
              path: null,
              external_id: null,
              api_source: null
            })
          }
          
          // Small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        searchResults.value = results || []
        
      } catch (err) {
        error.value = 'Failed to search API data: ' + (err.message || 'Unknown error')
        console.error('API search error:', err)
      } finally {
        isSearching.value = false
        searchProgress.value = 100
      }
    }
    
    const saveBulkItems = async () => {
      if (!canSave.value || !previewItems.value) return
      
      loading.value = true
      error.value = null
      
      try {
        const items = previewItems.value.map(item => {
          // Use API data if available, otherwise use form data
          const apiData = item.apiData
          
          return {
            title: item.title,
            category: bulkData.value.category,
            release: apiData?.release || null,
            rating: apiData?.rating || bulkData.value.defaultRating || null,
            platforms: apiData?.platforms || bulkData.value.defaultPlatforms || null,
            genre: apiData?.genre || bulkData.value.defaultGenre || null,
            link: apiData?.link || null,
            path: apiData?.path || null, // This will be the image URL
            external_id: apiData?.external_id || null,
            count: 0,
            is_airing: false,
            spielzeit: 0
          }
        })
        
        emit('save', items)
        
        // Reset form
        bulkData.value = {
          category: '',
          itemsText: '',
          defaultRating: null,
          defaultPlatforms: '',
          defaultGenre: ''
        }
        searchResults.value = []
        
      } catch (err) {
        error.value = err.message || 'Failed to add items'
        console.error('Bulk add error:', err)
      } finally {
        loading.value = false
      }
    }
    
    // Auto-search when category and items are provided
    watch([() => bulkData.value.category, () => bulkData.value.itemsText], 
      ([newCategory, newItemsText]) => {
        if (newCategory && newItemsText && newItemsText.trim() && !isSearching.value) {
          // Small delay to prevent too many API calls while typing
          setTimeout(() => {
            if (bulkData.value.category === newCategory && 
                bulkData.value.itemsText === newItemsText && 
                !isSearching.value) {
              searchApiData()
            }
          }, 1000) // 1 second delay
        }
      }
    )

    // Set category when modal opens
    watch(() => props.show, (newVal) => {
      if (newVal && props.currentCategory) {
        bulkData.value.category = props.currentCategory
      } else if (!newVal) {
        bulkData.value = {
          category: '',
          itemsText: '',
          defaultRating: null,
          defaultPlatforms: '',
          defaultGenre: ''
        }
        searchResults.value = []
        error.value = null
        isSearching.value = false
        searchProgress.value = 0
      }
    })
    
    return {
      loading,
      error,
      bulkData,
      previewItems,
      canSave,
      closeModal,
      searchApiData,
      saveBulkItems,
      isSearching,
      searchProgress
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: #2d2d2d;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
  border-bottom: 1px solid #404040;
  margin-bottom: 24px;
}

.modal-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #cccccc;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #404040;
  color: #ffffff;
}

.modal-body {
  padding: 0 24px;
}

.bulk-add-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #e0e0e0;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #1a1a1a;
  color: #ffffff;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.help-text {
  color: #999;
  font-size: 0.8rem;
  margin-top: 4px;
}

.preview-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #404040;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-section h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.8rem;
  min-width: auto;
}

.search-progress {
  margin-bottom: 16px;
  padding: 12px;
  background: #1a1a1a;
  border-radius: 6px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #1a73e8;
  transition: width 0.3s ease;
}

.progress-text {
  color: #999;
  font-size: 0.8rem;
}

.preview-list {
  max-height: 200px;
  overflow-y: auto;
  background: #1a1a1a;
  border-radius: 6px;
  padding: 12px;
}

.preview-item {
  padding: 12px 0;
  border-bottom: 1px solid #333;
  color: #e0e0e0;
  font-size: 0.9rem;
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-item.has-api-data {
  background: rgba(26, 115, 232, 0.1);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 4px;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.item-title {
  font-weight: 500;
  color: #ffffff;
  flex: 1;
}

.api-badge {
  background: #1a73e8;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.manual-badge {
  background: #666;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.item-info {
  color: #999;
  font-style: italic;
  margin-bottom: 4px;
}

.item-details {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.item-details small {
  color: #999;
  font-size: 0.8rem;
}

.item-release {
  color: #4CAF50 !important;
}

.item-rating {
  color: #FFC107 !important;
}

.item-genre {
  color: #9C27B0 !important;
}

.preview-more {
  padding: 8px 0;
  color: #999;
  font-style: italic;
  text-align: center;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #404040;
  margin-top: 24px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #404040;
  color: #ffffff;
}

.btn-secondary:hover:not(:disabled) {
  background: #555;
}

.btn-primary {
  background: #1a73e8;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1557b0;
}

@media (max-width: 768px) {
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>

