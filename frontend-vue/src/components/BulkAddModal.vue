<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Bulk Add Items</h2>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- Step 1: Input List -->
        <div v-if="currentStep === 1" class="step-container">
          <div class="step-header">
            <div class="step-number">1</div>
            <h3>Enter Your List</h3>
          </div>
          
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
              <small class="help-text">Enter one item per line. The system will automatically search and add each item individually.</small>
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
          </div>
        </div>

        <!-- Step 2: Processing -->
        <div v-if="currentStep === 2" class="step-container">
          <div class="step-header">
            <div class="step-number">2</div>
            <h3>Processing Items</h3>
          </div>
          
          <div class="processing-container">
            <div class="progress-overview">
              <div class="progress-stats">
                <span class="stat">
                  <span class="stat-number">{{ processedCount }}</span>
                  <span class="stat-label">Processed</span>
                </span>
                <span class="stat">
                  <span class="stat-number">{{ addedCount }}</span>
                  <span class="stat-label">Added</span>
                </span>
                <span class="stat">
                  <span class="stat-number">{{ skippedCount }}</span>
                  <span class="stat-label">Skipped</span>
                </span>
                <span class="stat">
                  <span class="stat-number">{{ errorCount }}</span>
                  <span class="stat-label">Errors</span>
                </span>
              </div>
              
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              </div>
              <div class="progress-text">{{ progressPercentage }}% Complete</div>
            </div>
            
            <div class="current-item">
              <div class="current-item-header">
                <span class="current-item-title">Processing: {{ currentItem?.title || '...' }}</span>
                <span class="current-item-status" :class="currentItemStatus">
                  <span v-if="isPaused" class="paused-indicator">⏸️ PAUSED - </span>{{ currentItemStatusText }}
                </span>
              </div>
              <div v-if="currentItem?.description" class="current-item-description">
                {{ currentItem.description }}
              </div>
              <div v-if="currentItemStatus === 'found'" class="api-data-indicator">
                ✅ Real API data found with image and metadata
              </div>
              <div v-if="currentItemStatus === 'skipped'" class="no-api-indicator">
                ❌ No API data found - will be retried
              </div>
            </div>
            
            <div class="results-list">
              <div 
                v-for="(result, index) in processingResults" 
                :key="index"
                class="result-item"
                :class="result.status"
              >
                <div class="result-header">
                  <span class="result-title">{{ result.title }}</span>
                  <span class="result-status">{{ result.statusText }}</span>
                </div>
                <div v-if="result.message" class="result-message">{{ result.message }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Results -->
        <div v-if="currentStep === 3" class="step-container">
          <div class="step-header">
            <div class="step-number">3</div>
            <h3>Results</h3>
          </div>
          
          <div class="results-summary">
            <div class="summary-stats">
              <div class="summary-stat success">
                <span class="stat-number">{{ addedCount }}</span>
                <span class="stat-label">Successfully Added</span>
              </div>
              <div class="summary-stat warning">
                <span class="stat-number">{{ skippedItems.filter(item => item.reason !== 'duplicate').length }}</span>
                <span class="stat-label">Not Found (Ready for Retry)</span>
              </div>
              <div class="summary-stat info">
                <span class="stat-number">{{ skippedItems.filter(item => item.reason === 'duplicate').length }}</span>
                <span class="stat-label">Already in Profile</span>
              </div>
              <div class="summary-stat error">
                <span class="stat-number">{{ errorCount }}</span>
                <span class="stat-label">Errors</span>
              </div>
            </div>
            
            <div v-if="skippedItems.length > 0" class="retry-section">
              <h4>Items Ready for Retry</h4>
              <p class="retry-description">
                The following items can be edited and tried again:
              </p>
              <div class="retry-list">
                <div 
                  v-for="(item, index) in skippedItems" 
                  :key="index"
                  class="retry-item"
                  :class="{ 'duplicate-item': item.reason === 'duplicate' }"
                >
                  <input 
                    v-model="item.searchTerm"
                    class="retry-input"
                    placeholder="Edit search term..."
                    :disabled="item.reason === 'duplicate'"
                  />
                  <span v-if="item.additionalInfo" class="retry-additional">
                    | {{ item.additionalInfo }}
                  </span>
                  <span v-if="item.reason === 'duplicate'" class="duplicate-badge">
                    Already in profile
                  </span>
                  <span v-else class="retry-badge">
                    No API data
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="processingResults.length > 0" class="detailed-results">
              <h4>Detailed Results</h4>
              <div class="results-list">
                <div 
                  v-for="(result, index) in processingResults" 
                  :key="index"
                  class="result-item"
                  :class="result.status"
                >
                  <div class="result-header">
                    <span class="result-title">{{ result.title }}</span>
                    <span class="result-status">{{ result.statusText }}</span>
                  </div>
                  <div v-if="result.message" class="result-message">{{ result.message }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          v-if="currentStep === 1" 
          class="btn btn-secondary" 
          @click="closeModal"
        >
          Cancel
        </button>
        <button 
          v-if="currentStep === 1" 
          class="btn btn-primary" 
          @click="startProcessing"
          :disabled="!canStart"
        >
          Check All and Add
        </button>
        <div v-if="currentStep === 2" class="processing-controls">
          <button 
            class="btn btn-secondary" 
            @click="cancelProcessing"
            :disabled="!canCancel"
          >
            Cancel
          </button>
          <button 
            v-if="!isPaused"
            class="btn btn-warning" 
            @click="pauseProcessing"
            :disabled="!isProcessing"
          >
            Pause
          </button>
          <button 
            v-if="isPaused"
            class="btn btn-primary" 
            @click="resumeProcessing"
          >
            Resume
          </button>
        </div>
        <div v-if="currentStep === 3" class="footer-buttons">
          <button 
            v-if="skippedItems.filter(item => item.reason !== 'duplicate').length > 0"
            class="btn btn-warning" 
            @click="retrySkippedItems"
          >
            Retry {{ skippedItems.filter(item => item.reason !== 'duplicate').length }} Items
          </button>
          <button 
            class="btn btn-primary" 
            @click="closeModal"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { mediaApi } from '@/services/api'
import { useMediaStore } from '@/stores/media'

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
  emits: ['close'],
  setup(props, { emit }) {
    const mediaStore = useMediaStore()
    
    // State
    const currentStep = ref(1)
    const isProcessing = ref(false)
    const canCancel = ref(true)
    const isPaused = ref(false)
    
    // Processing state
    const processedCount = ref(0)
    const addedCount = ref(0)
    const skippedCount = ref(0)
    const errorCount = ref(0)
    const currentItem = ref(null)
    const currentItemStatus = ref('')
    const currentItemStatusText = ref('')
    const processingResults = ref([])
    const skippedItems = ref([])
    
    // Form data
    const bulkData = ref({
      category: '',
      itemsText: '',
      defaultRating: null
    })
    
    // Computed
    const canStart = computed(() => {
      return bulkData.value.category && 
             bulkData.value.itemsText.trim() && 
             !isProcessing.value
    })
    
    const progressPercentage = computed(() => {
      const total = getItemList().length
      return total > 0 ? Math.round((processedCount.value / total) * 100) : 0
    })
    
    // Helper functions
    const getItemList = () => {
      if (!bulkData.value.itemsText || !bulkData.value.itemsText.trim()) return []
      
      return bulkData.value.itemsText
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
    }
    
    const resetProcessing = () => {
      processedCount.value = 0
      addedCount.value = 0
      skippedCount.value = 0
      errorCount.value = 0
      currentItem.value = null
      currentItemStatus.value = ''
      currentItemStatusText.value = ''
      processingResults.value = []
      skippedItems.value = []
    }
    
    const updateCurrentItem = (item, status, statusText) => {
      currentItem.value = item
      currentItemStatus.value = status
      currentItemStatusText.value = statusText
    }
    
    const addResult = (title, status, message = '') => {
      const statusText = {
        'searching': 'Searching...',
        'found': 'Found',
        'adding': 'Adding...',
        'added': 'Added',
        'skipped': 'Skipped',
        'error': 'Error'
      }[status] || status
      
      processingResults.value.push({
        title,
        status,
        statusText,
        message
      })
    }
    
    // Main processing function
    const startProcessing = async () => {
      if (!canStart.value) return
      
      currentStep.value = 2
      isProcessing.value = true
      canCancel.value = true
      resetProcessing()
      
      const items = getItemList()
      let reloadCounter = 0 // Counter for when to reload media data
      
      try {
        // Step 1: Check all items for duplicates in one batch (for logged in users)
        let existingItems = []
        const token = localStorage.getItem('authToken')
        const user = localStorage.getItem('currentUser')
        if (token && user) {
          try {
            updateCurrentItem(
              { title: 'Checking all items...' },
              'searching',
              'Checking profile for duplicates...'
            )
            
            const checkData = await mediaApi.checkExistingItems(
              items.map(item => ({
                title: item.searchTerm,
                category: bulkData.value.category
              }))
            )
            
            existingItems = checkData.existing_items || []
            console.log(`🔍 Found ${existingItems.length} existing items out of ${items.length} total`)
          } catch (error) {
            console.warn('Failed to check existing items, falling back to individual checks:', error)
          }
        }
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          processedCount.value = i + 1
          
          // Update current item status
          updateCurrentItem(
            { title: item.searchTerm, description: item.additionalInfo },
            'searching',
            'Processing...'
          )
          
          try {
            // Check if item already exists (from batch check or individual check)
            let itemExists = false
            if (token && user && existingItems.length > 0) {
              itemExists = existingItems.some(existing => 
                existing.title.toLowerCase().trim() === item.searchTerm.toLowerCase().trim()
              )
            } else {
              // Fallback: individual check for non-logged in users
              const currentMedia = mediaStore.mediaData || []
              itemExists = currentMedia.some(mediaItem => 
                mediaItem.title && 
                mediaItem.title.toLowerCase().trim() === item.searchTerm.toLowerCase().trim() &&
                mediaItem.category === bulkData.value.category
              )
            }
            
            if (itemExists) {
              // Item already exists in profile - skip API search
              console.log(`✅ Found exact match in profile for "${item.searchTerm}"`)
              
              updateCurrentItem(
                { title: item.searchTerm },
                'skipped',
                'Already exists in profile - skipped'
              )
              
              skippedItems.value.push({
                searchTerm: item.searchTerm,
                additionalInfo: item.additionalInfo,
                reason: 'duplicate'
              })
              
              skippedCount.value++
              addResult(item.searchTerm, 'skipped', 'Already exists in profile - skipped')
              continue
            }
            
            // Step 2: Search for the item in API (only if not found in profile)
            updateCurrentItem(
              { title: item.searchTerm, description: item.additionalInfo },
              'searching',
              'Searching API...'
            )
            
            addResult(item.searchTerm, 'searching', 'Searching API...')
            
            console.log(`🔍 Searching API for: "${item.searchTerm}" in category: ${bulkData.value.category}`)
            const searchResults = await mediaApi.searchApi(item.searchTerm, bulkData.value.category, 1)
            console.log(`🔍 Search results for "${item.searchTerm}":`, searchResults)
            
            // Check if we have real API data (not just empty results)
            const hasRealApiData = searchResults && 
                                 searchResults.length > 0 && 
                                 searchResults[0] && 
                                 searchResults[0].api_source && 
                                 searchResults[0].image
            
            if (hasRealApiData) {
              // Item found in API with real data
              const apiResult = searchResults[0]
              
              console.log(`✅ Found real API data for "${item.searchTerm}":`, {
                title: apiResult.title,
                api_source: apiResult.api_source,
                has_image: !!apiResult.image,
                has_genre: !!apiResult.genre,
                has_release: !!apiResult.release
              })
              
              updateCurrentItem(
                { 
                  title: apiResult.title, 
                  description: `Found: ${apiResult.genre || 'Unknown genre'} • ${apiResult.release || 'Unknown year'} • ${apiResult.api_source}` 
                },
                'found',
                'Found in API with data'
              )
              
              addResult(item.searchTerm, 'found', `Found: ${apiResult.title} (${apiResult.api_source})`)
              
              // Step 2: Add the item using the same method as EditModal
              updateCurrentItem(
                { title: apiResult.title },
                'adding',
                'Adding to library...'
              )
              
              const itemData = {
                title: apiResult.title,
                category: bulkData.value.category,
                release: apiResult.release || null,
                rating: apiResult.rating ? Math.round(apiResult.rating) : bulkData.value.defaultRating || null,
                platforms: apiResult.platforms || null,
                genre: apiResult.genre || null,
                link: apiResult.link || null,
                path: apiResult.image || null,
                external_id: apiResult.id || null,
                count: 1,
                is_airing: false,
                spielzeit: 0,
                description: apiResult.overview || item.additionalInfo || null
              }
              
              // Use the same add method as EditModal with skipReload for bulk operations
              await mediaStore.addMediaItem(itemData, true)
              
              addedCount.value++
              updateCurrentItem(
                { title: apiResult.title },
                'added',
                'Successfully added with API data'
              )
              
              addResult(item.searchTerm, 'added', `Added: ${apiResult.title} with API data`)
              
            } else {
              // Item not found in API or no real data - add to skipped items for retry
              console.log(`❌ No real API data found for "${item.searchTerm}"`)
              
              updateCurrentItem(
                { title: item.searchTerm },
                'skipped',
                'No API data found - will retry'
              )
              
              skippedItems.value.push({
                searchTerm: item.searchTerm,
                additionalInfo: item.additionalInfo,
                reason: 'no_api_data'
              })
              
              skippedCount.value++
              addResult(item.searchTerm, 'skipped', 'No API data found - ready for retry')
            }
            
          } catch (error) {
            // Error occurred during processing
            console.error(`Error processing "${item.searchTerm}":`, error)
            
            // Handle duplicate errors specifically
            if (error.isDuplicate || (error.response?.status === 409 && error.response?.data?.duplicate)) {
              updateCurrentItem(
                { title: item.searchTerm },
                'skipped',
                'Already exists - skipped'
              )
              
              skippedCount.value++
              addResult(item.searchTerm, 'skipped', 'Item already exists in library')
            } else {
              updateCurrentItem(
                { title: item.searchTerm },
                'error',
                'Error occurred'
              )
              
              errorCount.value++
              addResult(item.searchTerm, 'error', error.message || 'Unknown error')
            }
          }
          
          // Increment reload counter and reload media data every 5 items
          reloadCounter++
          if (reloadCounter >= 5) {
            console.log('🔄 Reloading media data after 5 items...')
            try {
              await mediaStore.loadMedia()
              reloadCounter = 0 // Reset counter
            } catch (reloadError) {
              console.warn('Failed to reload media data:', reloadError)
            }
          }
          
          // Check if processing was cancelled
          if (!isProcessing.value) {
            break
          }
          
          // Wait for pause to be lifted if paused
          while (isPaused.value && isProcessing.value) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
          // Longer delay to prevent overwhelming the API and show progress
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // Final reload at the end
        console.log('🔄 Final media data reload...')
        try {
          await mediaStore.loadMedia()
        } catch (reloadError) {
          console.warn('Failed to reload media data at end:', reloadError)
        }
        
        // Processing complete
        currentStep.value = 3
        updateCurrentItem(null, '', '')
        
      } catch (error) {
        console.error('Bulk processing error:', error)
        errorCount.value++
      } finally {
        isProcessing.value = false
        canCancel.value = false
      }
    }
    
    const cancelProcessing = () => {
      isProcessing.value = false
      canCancel.value = false
      isPaused.value = false
      currentStep.value = 1
      resetProcessing()
    }
    
    const pauseProcessing = () => {
      isPaused.value = true
    }
    
    const resumeProcessing = () => {
      isPaused.value = false
    }
    
    const retrySkippedItems = () => {
      // Filter out duplicate items (those that already exist in profile)
      const retryItems = skippedItems.value.filter(item => item.reason !== 'duplicate')
      
      if (retryItems.length === 0) {
        // All skipped items were duplicates, just close the modal
        closeModal()
        return
      }
      
      // Convert skipped items back to text format
      const retryText = retryItems
        .map(item => {
          if (item.additionalInfo) {
            return `${item.searchTerm} | ${item.additionalInfo}`
          }
          return item.searchTerm
        })
        .join('\n')
      
      // Update the form with retry items
      bulkData.value.itemsText = retryText
      
      // Reset processing state but keep the skipped items for reference
      processedCount.value = 0
      addedCount.value = 0
      errorCount.value = 0
      currentItem.value = null
      currentItemStatus.value = ''
      currentItemStatusText.value = ''
      processingResults.value = []
      
      // Go back to step 1
      currentStep.value = 1
    }
    
    const closeModal = () => {
      // Reset everything when closing
      currentStep.value = 1
      isProcessing.value = false
      canCancel.value = true
      resetProcessing()
      
      // Reset form
      bulkData.value = {
        category: '',
        itemsText: '',
        defaultRating: null
      }
      
      emit('close')
    }
    
    // Set category when modal opens
    watch(() => props.show, (newVal) => {
      if (newVal && props.currentCategory) {
        bulkData.value.category = props.currentCategory
      } else if (!newVal) {
        closeModal()
      }
    })
    
    return {
      currentStep,
      isProcessing,
      canCancel,
      isPaused,
      processedCount,
      addedCount,
      skippedCount,
      errorCount,
      currentItem,
      currentItemStatus,
      currentItemStatusText,
      processingResults,
      skippedItems,
      bulkData,
      canStart,
      progressPercentage,
      startProcessing,
      cancelProcessing,
      pauseProcessing,
      resumeProcessing,
      retrySkippedItems,
      closeModal
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
  max-width: 700px;
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

.step-container {
  min-height: 400px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8f4fd;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.step-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 600;
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
  border-color: #e8f4fd;
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

.processing-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-overview {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #999;
  margin-top: 4px;
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
  background: #e8f4fd;
  transition: width 0.3s ease;
}

.progress-text {
  color: #999;
  font-size: 0.9rem;
  text-align: center;
}

.current-item {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #e8f4fd;
}

.current-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.current-item-title {
  font-weight: 600;
  color: #ffffff;
}

.current-item-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.current-item-status.searching {
  background: #ff9800;
  color: #1a1a1a;
}

.current-item-status.found {
  background: #4caf50;
  color: #1a1a1a;
}

.current-item-status.adding {
  background: #2196f3;
  color: #1a1a1a;
}

.current-item-status.added {
  background: #4caf50;
  color: #1a1a1a;
}

.current-item-status.skipped {
  background: #ff9800;
  color: #1a1a1a;
}

.current-item-status.error {
  background: #f44336;
  color: #1a1a1a;
}

.current-item-description {
  color: #999;
  font-size: 0.9rem;
}

.api-data-indicator {
  color: #4caf50;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 8px;
  padding: 4px 8px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
  border-left: 3px solid #4caf50;
}

.no-api-indicator {
  color: #ff9800;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 8px;
  padding: 4px 8px;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 4px;
  border-left: 3px solid #ff9800;
}

.results-list {
  max-height: 200px;
  overflow-y: auto;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 12px;
}

.result-item {
  padding: 8px 0;
  border-bottom: 1px solid #333;
  color: #e0e0e0;
  font-size: 0.9rem;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.searching {
  border-left: 3px solid #ff9800;
  padding-left: 8px;
}

.result-item.found {
  border-left: 3px solid #4caf50;
  padding-left: 8px;
}

.result-item.adding {
  border-left: 3px solid #2196f3;
  padding-left: 8px;
}

.result-item.added {
  border-left: 3px solid #4caf50;
  padding-left: 8px;
}

.result-item.skipped {
  border-left: 3px solid #ff9800;
  padding-left: 8px;
}

.result-item.error {
  border-left: 3px solid #f44336;
  padding-left: 8px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.result-title {
  font-weight: 500;
  color: #ffffff;
  flex: 1;
}

.result-status {
  font-size: 0.8rem;
  font-weight: 500;
}

.result-message {
  color: #999;
  font-size: 0.8rem;
  margin-left: 8px;
}

.results-summary {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-stat {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background: #1a1a1a;
}

.summary-stat.success {
  border-left: 4px solid #4caf50;
}

.summary-stat.warning {
  border-left: 4px solid #ff9800;
}

.summary-stat.error {
  border-left: 4px solid #f44336;
}

.summary-stat.info {
  border-left: 4px solid #2196f3;
}

.detailed-results h4 {
  margin: 0 0 16px 0;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
}

.retry-section {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #ff9800;
}

.retry-section h4 {
  margin: 0 0 12px 0;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
}

.retry-description {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.retry-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retry-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #2d2d2d;
  border-radius: 6px;
  border: 1px solid #555;
}

.retry-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #1a1a1a;
  color: #ffffff;
  font-size: 0.9rem;
}

.retry-input:focus {
  outline: none;
  border-color: #e8f4fd;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.retry-additional {
  color: #999;
  font-size: 0.9rem;
  font-style: italic;
}

.duplicate-item {
  opacity: 0.7;
  background: #2a2a2a;
}

.duplicate-badge {
  background: #ff9800;
  color: #1a1a1a;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  margin-left: 8px;
}

.retry-badge {
  background: #2196f3;
  color: #1a1a1a;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  margin-left: 8px;
}

.footer-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #404040;
  margin-top: 24px;
}

.processing-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.paused-indicator {
  color: #ff9800;
  font-weight: 600;
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
  background: #e8f4fd;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1557b0;
}

.btn-warning {
  background: #ff9800;
  color: #ffffff;
}

.btn-warning:hover:not(:disabled) {
  background: #f57c00;
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
  
  .progress-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
