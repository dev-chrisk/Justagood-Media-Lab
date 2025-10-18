biem <template>
  <div class="modal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>{{ isEditing ? 'Edit Item' : 'Add Item' }}</h2>
      
      <form @submit.prevent="handleSave">
        <!-- Header Section with Category and Title -->
        <div class="form-header">
          <div class="form-group category-group">
            <label for="category">Category:</label>
            <select id="category" v-model="form.category" required>
              <option value="watchlist">Watchlist</option>
              <option value="game">Game</option>
              <option value="series">Series</option>
              <option value="movie">Movie</option>
              <option value="buecher">Bücher</option>
            </select>
          </div>
           
          <div class="form-group title-group">
            <label for="title">Title:</label>
            <div class="search-container">
              <input 
                type="text" 
                id="title"
                v-model="form.title" 
                @input="searchApi"
                required
                :placeholder="isWatchlist ? 'Enter title (API search + manual input available)' : 'Enter title'"
                :disabled="loading"
              />
              <div v-if="apiResults.length > 0" class="search-results">
                <div 
                  v-for="result in apiResults" 
                  :key="result.title"
                  class="search-result-item"
                  @click="selectApiResult(result)"
                >
                  <div class="result-thumbnail">
                    <img v-if="result.imageUrl" :src="ensureHttpsUrl(result.imageUrl)" :alt="result.title" />
                    <div v-else class="no-image">
                      <span>{{ result.title.charAt(0).toUpperCase() }}</span>
                    </div>
                  </div>
                  <div class="result-content">
                    <div class="result-title">{{ result.title }}</div>
                    <div class="result-meta">
                      <span v-if="result.release">{{ formatDate(result.release) }}</span>
                      <span v-if="result.genre">{{ result.genre }}</span>
                      <span v-if="result.rating" class="rating">⭐ {{ result.rating }}</span>
                    </div>
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
            <label for="apiRating">API Rating:</label>
            <input 
              type="number" 
              id="apiRating"
              v-model="form.apiRating" 
              step="0.1" 
              min="0" 
              max="10"
              placeholder="0-10"
              readonly
            />
            <div class="field-hint">From API - read only</div>
          </div>
          
          <div class="form-group">
            <label for="personalRating">Personal Rating:</label>
            <input 
              type="number" 
              id="personalRating"
              v-model="form.personalRating" 
              step="0.1" 
              min="0" 
              max="10"
              placeholder="0-10"
            />
            <div class="field-hint">Your personal rating</div>
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
        
        <!-- Description Field -->
        <div class="form-row">
          <div class="form-group full-width">
            <label for="description">Description:</label>
            <textarea 
              id="description"
              v-model="form.description" 
              placeholder="Enter description..."
              rows="3"
            ></textarea>
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
              <option value="buecher">Bücher</option>
            </select>
            <div v-if="form.category === 'watchlist' && !form.watchlistType" class="field-error">
              Please select a type for watchlist items
            </div>
          </div>
        </div>
        
        <!-- Books API Control Panel -->
        <BooksApiControlPanel 
          v-if="(form.category === 'buecher' || form.watchlistType === 'buecher')"
          :expanded="false"
          @preferences-changed="handlePreferencesChanged"
        />
        
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
        
        <!-- Extra Link for Series -->
        <div v-if="isSeries" class="form-row">
          <div class="form-group full-width">
            <label for="extraLink">Extra Link:</label>
            <input 
              type="url" 
              id="extraLink"
              v-model="form.extraLink" 
              placeholder="https://... (e.g., streaming platform, official website)"
            />
            <div class="field-hint">Optional: Additional link for series (e.g., streaming platform, official website)</div>
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
        
        <!-- Image Section -->
        <div class="form-row">
          <div class="form-group">
            <label for="imageUrl">Image URL (optional):</label>
            <input 
              type="text" 
              id="imageUrl"
              v-model="form.imageUrl" 
              placeholder="https://... or leave empty for API images"
            />
          </div>
          
          <div class="form-group">
            <label for="imageUpload">Upload Image:</label>
            <div class="image-upload-container">
              <input 
                type="file" 
                id="imageUpload"
                ref="imageUploadRef"
                @change="handleImageUpload"
                accept="image/*"
                style="display: none"
              />
              <button 
                type="button" 
                @click="triggerImageUpload"
                class="upload-btn"
                :disabled="loading"
              >
                📁 Choose Image
              </button>
              <div v-if="uploadedImagePath" class="upload-success">
                ✅ Image uploaded: {{ uploadedImagePath }}
                <button 
                  type="button" 
                  @click="removeUploadedImage"
                  class="remove-uploaded-btn"
                  title="Remove uploaded image to enable API search"
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Image Preview -->
        <div v-if="shouldShowImagePreview" class="form-row">
          <div class="form-group image-preview-group">
            <label>Image Preview:</label>
            <div class="image-preview">
              <img 
                :src="getImagePreviewUrl()" 
                :alt="form.title"
                @error="handleImageError"
                @load="handleImageLoad"
                @loadstart="handleImageLoadStart"
                @loadend="handleImageLoadEnd"
              />
              <button 
                type="button" 
                @click="clearImage"
                class="clear-image-btn"
                title="Remove image"
              >
                ✕
              </button>
            </div>
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
          <button 
            type="button" 
            @click="handleSave" 
            :disabled="loading"
            class="check-btn"
            title="Add to list"
          >
            ✓
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { mediaApi } from '@/services/api'
import { useMediaStore } from '@/stores/media'
import { downloadAndSaveImage, processImageUrl } from '@/utils/imageDownloader'
import { simpleGoogleBooksApi } from '@/services/simpleApi'
import { unifiedBooksApiService } from '@/services/unifiedBooksApi'
import BooksApiControlPanel from '@/components/BooksApiControlPanel.vue'

export default {
  name: 'EditModal',
  components: {
    BooksApiControlPanel
  },
  props: {
    item: {
      type: Object,
      default: null
    },
    currentCategory: {
      type: String,
      default: 'watchlist'
    }
  },
  emits: ['close', 'save', 'delete'],
  setup(props, { emit }) {
    const mediaStore = useMediaStore()
    const loading = ref(false)
    const error = ref('')
    const apiResults = ref([])
    const searchTimeout = ref(null)
    const imageUploadRef = ref(null)
    const uploadedImagePath = ref('')
    
    const form = reactive({
      category: 'watchlist',
      title: '',
      release: '',
      apiRating: '',
      personalRating: '',
      count: '',
      platforms: '',
      genre: '',
      description: '',
      link: '',
      extraLink: '',
      path: '',
      discovered: '',
      spielzeit: '',
      isAiring: false,
      nextSeason: '',
      nextSeasonRelease: '',
      imageUrl: '',
      watchlistType: '',
      imageCleared: false
    })
    
    const isEditing = computed(() => !!props.item)
    const isGame = computed(() => form.category === 'game')
    const isSeries = computed(() => form.category === 'series')
    const isWatchlist = computed(() => form.category === 'watchlist')
    
    // Initialize form with item data
    watch(() => props.item, (newItem) => {
      if (newItem) {
        console.log('🔄 [DEBUG] Initializing form with item data:', newItem)
        // Map backend field names to frontend field names FIRST
        if (newItem.watchlist_type !== undefined) {
          form.watchlistType = newItem.watchlist_type || ''
        } else if (newItem.watchlistType !== undefined) {
          form.watchlistType = newItem.watchlistType || ''
        } else {
          form.watchlistType = ''
        }
        
        // Then map other fields, but skip watchlistType to avoid overwriting
        Object.keys(form).forEach(key => {
          if (key !== 'watchlistType') {
            form[key] = newItem[key] || ''
          }
        })
        
        // Map other backend field names to frontend field names
        if (newItem.is_airing !== undefined) {
          form.isAiring = newItem.is_airing
        }
        if (newItem.next_season !== undefined) {
          form.nextSeason = newItem.next_season
        }
        if (newItem.next_season_release !== undefined) {
          form.nextSeasonRelease = newItem.next_season_release
        }
        if (newItem.api_rating !== undefined) {
          form.apiRating = newItem.api_rating
        }
        if (newItem.personal_rating !== undefined) {
          form.personalRating = newItem.personal_rating
        }
        if (newItem.description !== undefined) {
          form.description = newItem.description
        }
        if (newItem.image_url !== undefined) {
          form.imageUrl = newItem.image_url
          console.log('🖼️ [DEBUG] Set form.imageUrl from item:', newItem.image_url)
        }
        if (newItem.path !== undefined) {
          form.path = newItem.path
          console.log('🖼️ [DEBUG] Set form.path from item:', newItem.path)
        }
        if (newItem.extra_link !== undefined) {
          form.extraLink = newItem.extra_link
        }
        // Map the main rating field to personal rating (since that's what users edit)
        if (newItem.rating !== undefined && !form.personalRating) {
          form.personalRating = newItem.rating
        }
        
        console.log('🔄 [DEBUG] Form initialization completed:')
        console.log('🔄 [DEBUG] - form.imageUrl:', form.imageUrl)
        console.log('🔄 [DEBUG] - form.path:', form.path)
        console.log('🔄 [DEBUG] - uploadedImagePath.value:', uploadedImagePath.value)
        
      } else {
        console.log('🔄 [DEBUG] Initializing new item form')
        // Reset form for new item - use current category from sidebar
        Object.keys(form).forEach(key => {
          if (key === 'category') {
            form[key] = props.currentCategory || 'watchlist'
          } else if (key === 'release') {
            // Set default release date to today for new items
            form[key] = new Date().toISOString().split('T')[0]
          } else if (key === 'watchlistType') {
            // Set default watchlistType to 'series' for new watchlist items
            form[key] = props.currentCategory === 'watchlist' ? 'series' : ''
          } else {
            form[key] = ''
          }
        })
        console.log('🔄 [DEBUG] New item form initialized:')
        console.log('🔄 [DEBUG] - form.imageUrl:', form.imageUrl)
        console.log('🔄 [DEBUG] - form.path:', form.path)
        console.log('🔄 [DEBUG] - uploadedImagePath.value:', uploadedImagePath.value)
      }
    }, { immediate: true })
    
    // Watch for currentCategory changes to update form when adding new items
    watch(() => props.currentCategory, (newCategory) => {
      if (!props.item && newCategory) {
        form.category = newCategory
      }
    })
    
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
        
        // Convert empty strings to null for optional fields (except watchlistType, image fields, and extraLink)
        Object.keys(itemData).forEach(key => {
          if (itemData[key] === '' && key !== 'watchlistType' && key !== 'imageUrl' && key !== 'path' && key !== 'extraLink') {
            itemData[key] = null
          }
        })
        
        // Process image URL - prioritize uploaded image over URL
        if (uploadedImagePath.value) {
          // Use uploaded image path
          itemData.path = uploadedImagePath.value
          itemData.imageUrl = uploadedImagePath.value
        } else if (itemData.imageUrl && itemData.imageUrl.trim()) {
          // Use image URL if no uploaded image
          itemData.path = itemData.imageUrl
        } else if (isEditing.value && props.item) {
          // When editing, preserve existing image if no new image is provided
          if (props.item.image_url) {
            itemData.imageUrl = props.item.image_url
            itemData.path = props.item.path || props.item.image_url
          } else if (props.item.path) {
            itemData.path = props.item.path
            itemData.imageUrl = props.item.path
          }
        } else {
          // Clear empty image fields only for new items
          itemData.imageUrl = null
          itemData.path = null
        }
        
        // Convert numeric fields
        if (itemData.apiRating !== undefined && itemData.apiRating !== null && itemData.apiRating !== '') {
          itemData.apiRating = parseFloat(itemData.apiRating)
        }
        if (itemData.personalRating !== undefined && itemData.personalRating !== null && itemData.personalRating !== '') {
          itemData.personalRating = parseFloat(itemData.personalRating)
        }
        if (itemData.count !== undefined && itemData.count !== null && itemData.count !== '') {
          itemData.count = parseInt(itemData.count)
        }
        if (itemData.spielzeit !== undefined && itemData.spielzeit !== null && itemData.spielzeit !== '') {
          itemData.spielzeit = parseInt(itemData.spielzeit)
        }
        if (itemData.nextSeason !== undefined && itemData.nextSeason !== null && itemData.nextSeason !== '') {
          itemData.nextSeason = parseInt(itemData.nextSeason)
        }
        
        // Map frontend field names to backend field names
        if (itemData.watchlistType !== undefined) {
          itemData.watchlist_type = itemData.watchlistType || null
          delete itemData.watchlistType
        }
        if (itemData.isAiring !== undefined) {
          itemData.is_airing = itemData.isAiring
          delete itemData.isAiring
        }
        if (itemData.nextSeason) {
          itemData.next_season = itemData.nextSeason
          delete itemData.nextSeason
        }
        if (itemData.nextSeasonRelease) {
          itemData.next_season_release = itemData.nextSeasonRelease
          delete itemData.nextSeasonRelease
        }
        // Handle rating - prioritize personal rating over API rating
        if (itemData.personalRating !== undefined) {
          itemData.rating = itemData.personalRating
          delete itemData.personalRating
        } else if (itemData.apiRating !== undefined) {
          itemData.rating = itemData.apiRating
          delete itemData.apiRating
        }
        if (itemData.imageUrl) {
          itemData.image_url = itemData.imageUrl
          delete itemData.imageUrl
        }
        if (itemData.extraLink !== undefined) {
          itemData.extra_link = itemData.extraLink
          delete itemData.extraLink
        }
        
        
        // Use store methods to ensure proper state updates
        if (isEditing.value && props.item) {
          await mediaStore.updateMediaItem(props.item.id, itemData)
        } else {
          await mediaStore.addMediaItem(itemData)
        }
        
        // Close modal after successful save
        closeModal()
      } catch (err) {
        // Handle duplicate errors specifically
        if (err.isDuplicate || (err.response?.status === 409 && err.response?.data?.duplicate)) {
          error.value = 'Ein Eintrag mit diesem Titel und dieser Kategorie existiert bereits. Bitte wählen Sie einen anderen Titel oder bearbeiten Sie den bestehenden Eintrag.'
        } else {
          error.value = err.message || 'Failed to save item'
        }
      } finally {
        loading.value = false
      }
    }
    
    const closeModal = () => {
      // Clear any error when closing modal
      error.value = ''
      emit('close')
    }
    
    const deleteItem = () => {
      emit('delete', props.item)
      closeModal()
    }
    
    
    const searchApi = async () => {
      // API-Suche ist jetzt auch für Watchlist verfügbar
      
      // Disable API search if an image has been uploaded
      if (uploadedImagePath.value) {
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

          // For watchlist, use the watchlistType as category for API search
          const searchCategory = form.category === 'watchlist' ? form.watchlistType : form.category
          
          // Skip API search if watchlist type is not selected
          if (form.category === 'watchlist' && !form.watchlistType) {
            apiResults.value = []
            return
          }

          let results = []
          let searchResults = []

          // Check if this is a books search
          if (searchCategory === 'buecher') {
            const unifiedResult = await unifiedBooksApiService.searchBooks(form.title, 10)
            
            if (unifiedResult.success && unifiedResult.data) {
              
              searchResults = unifiedResult.data.map(book => ({
                title: book.title,
                release: book.publishedDate ? formatDateForInput(book.publishedDate) : '',
                genre: book.categories ? book.categories.join(', ') : '',
                platforms: book.author || '', // Use author in platforms field for books
                link: book.link || '',
                imageUrl: book.imageUrl || '',
                rating: '', // Most APIs don't provide ratings
                apiSource: book.apiSource || unifiedResult.source,
                id: book.id,
                author: book.author,
                description: book.description,
                publisher: book.publisher,
                isbn10: book.isbn10,
                isbn13: book.isbn13
              }))
              
            }
          } else {
            // Use existing media API for other categories
            results = await mediaApi.searchApi(form.title, searchCategory, 10)
            
            if (results && results.length > 0) {
              searchResults = results.map(result => ({
                title: result.title,
                release: result.release,
                genre: result.genre || '',
                description: result.overview || '',
                platforms: result.platforms || '',
                link: result.link || '',
                imageUrl: result.image || '',
                rating: result.rating || '',
                apiSource: result.api_source || '',
                id: result.id || ''
              }))
            }
          }
          
          if (searchResults.length > 0) {
            apiResults.value = searchResults
          } else {
            // Show a message that API is not available
            apiResults.value = [{
              title: `"${form.title}" - Keine Ergebnisse gefunden`,
              release: '',
              genre: 'Bitte manuell ausfüllen',
              isPlaceholder: true
            }]
          }
        } catch (err) {
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
    
    const selectApiResult = async (result) => {
      if (result.isPlaceholder) {
        // Don't fill form for placeholder results
        apiResults.value = []
        return
      }
      
      
      form.title = result.title
      if (result.release) form.release = result.release
      if (result.platforms) form.platforms = result.platforms
      if (result.genre) form.genre = result.genre
      if (result.description) form.description = result.description
      if (result.link) form.link = result.link
      if (result.rating) form.apiRating = result.rating
      
      // Handle Books API specific fields (both Wikipedia and Google Books)
      if (result.apiSource === 'google_books' || result.apiSource === 'wikipedia') {
        
        // For books, we can use the author field in the platforms field
        if (result.author) {
          form.platforms = result.author // Use platforms field for author
        }
        
        
        // Add publisher info to link if available
        if (result.publisher) {
          const currentLink = form.link || ''
          form.link = currentLink || `Publisher: ${result.publisher}`
        }
      }
      
      // Handle image URL - use original URL directly
      if (result.imageUrl) {
        form.imageUrl = result.imageUrl
        form.path = result.imageUrl // Use same URL for path
      } else {
        // Clear image fields if no image URL from API
        form.imageUrl = ''
        form.path = ''
      }
      
      apiResults.value = []
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
    
    const formatDateForInput = (dateString) => {
      if (!dateString) return ''
      
      // Handle different date formats from Google Books
      let date
      if (typeof dateString === 'string') {
        // If it's just a year (4 digits)
        if (/^\d{4}$/.test(dateString)) {
          return `${dateString}-01-01`
        }
        // If it's year-month format
        if (/^\d{4}-\d{2}$/.test(dateString)) {
          return `${dateString}-01`
        }
        // If it's already a full date
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString
        }
        // Try to parse as date
        date = new Date(dateString)
      } else {
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) {
        return ''
      }
      
      return date.toISOString().split('T')[0]
    }
    
    const ensureHttpsUrl = (url) => {
      if (!url) return url
      return url.startsWith('http://') ? url.replace('http://', 'https://') : url
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
    
    // Image upload functions
    const triggerImageUpload = () => {
      imageUploadRef.value?.click()
    }
    
    const handleImageUpload = async (event) => {
      console.log('🖼️ [DEBUG] Image upload started')
      const file = event.target.files[0]
      if (!file) {
        console.log('❌ [DEBUG] No file selected')
        return
      }
      
      console.log('📁 [DEBUG] File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('❌ [DEBUG] Invalid file type:', file.type)
        error.value = 'Please select a valid image file'
        return
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        console.log('❌ [DEBUG] File too large:', file.size, 'bytes')
        error.value = 'Image file too large. Maximum size is 10MB'
        return
      }
      
      console.log('✅ [DEBUG] File validation passed')
      loading.value = true
      error.value = ''
      
      try {
        // Generate custom path based on title and category
        const safeTitle = form.title.replace(/[^a-zA-Z0-9\s\-_\.]/g, '').trim() || 'item'
        const timestamp = Date.now()
        const extension = file.name.split('.').pop() || 'jpg'
        const customPath = `images_downloads/uploads/${safeTitle}_${timestamp}.${extension}`
        
        console.log('🛤️ [DEBUG] Generated path:', customPath)
        console.log('📤 [DEBUG] Starting upload to API...')
        
        const result = await mediaApi.uploadImage(file, customPath)
        
        console.log('📥 [DEBUG] Upload response:', result)
        
        if (result.success) {
          console.log('✅ [DEBUG] Upload successful, saved path:', result.saved)
          uploadedImagePath.value = result.saved
          form.path = result.saved
          form.imageUrl = result.saved
          console.log('🔗 [DEBUG] Image URL set to:', form.imageUrl)
        } else {
          console.log('❌ [DEBUG] Upload failed:', result.error)
          error.value = result.error || 'Failed to upload image'
        }
      } catch (err) {
        console.log('💥 [DEBUG] Upload error:', err)
        console.log('💥 [DEBUG] Error details:', {
          message: err.message,
          stack: err.stack,
          response: err.response?.data
        })
        error.value = err.message || 'Failed to upload image'
      } finally {
        loading.value = false
        console.log('🏁 [DEBUG] Upload process completed')
      }
    }
    
    const getImagePreviewUrl = () => {
      console.log('🔍 [DEBUG] Getting image preview URL...')
      console.log('🔍 [DEBUG] uploadedImagePath.value:', uploadedImagePath.value)
      console.log('🔍 [DEBUG] form.imageUrl:', form.imageUrl)
      console.log('🔍 [DEBUG] Template condition (form.imageUrl || uploadedImagePath):', !!(form.imageUrl || uploadedImagePath.value))
      
      if (uploadedImagePath.value) {
        console.log('🔍 [DEBUG] Using uploadedImagePath.value for URL generation')
        // Ensure we don't double-add /storage/ prefix
        if (uploadedImagePath.value.startsWith('storage/')) {
          const url = `/${uploadedImagePath.value}`
          console.log('🔗 [DEBUG] Generated URL (starts with storage/):', url)
          return url
        }
        // Use the API route instead of storage symlink
        // uploadedImagePath.value already contains 'images_downloads/uploads/...'
        const url = `/${uploadedImagePath.value}`
        console.log('🔗 [DEBUG] Generated URL (using API route):', url)
        return url
      }
      if (form.imageUrl) {
        console.log('🔍 [DEBUG] Using form.imageUrl for URL generation')
        // Handle both URLs and relative paths
        if (form.imageUrl.startsWith('http')) {
          console.log('🔗 [DEBUG] Using external URL:', form.imageUrl)
          return form.imageUrl
        }
        // Ensure we don't double-add /storage/ prefix
        if (form.imageUrl.startsWith('storage/')) {
          const url = `/${form.imageUrl}`
          console.log('🔗 [DEBUG] Generated URL from form.imageUrl (starts with storage/):', url)
          return url
        }
        // Use the API route instead of storage symlink
        // form.imageUrl already contains 'images_downloads/uploads/...'
        const url = `/${form.imageUrl}`
        console.log('🔗 [DEBUG] Generated URL from form.imageUrl (using API route):', url)
        return url
      }
      console.log('❌ [DEBUG] No image URL available')
      return ''
    }
    
    const handleImageError = (event) => {
      console.log('❌ [DEBUG] Image load error occurred')
      console.log('❌ [DEBUG] Error event:', event)
      console.log('❌ [DEBUG] Error target:', event.target)
      console.log('❌ [DEBUG] Error target src:', event.target.src)
      console.log('❌ [DEBUG] Error target alt:', event.target.alt)
      console.log('❌ [DEBUG] Current image URL:', getImagePreviewUrl())
      console.log('❌ [DEBUG] uploadedImagePath.value:', uploadedImagePath.value)
      console.log('❌ [DEBUG] form.imageUrl:', form.imageUrl)
      
      // Hide the broken image
      event.target.style.display = 'none'
      
      // Show error message
      error.value = 'Failed to load image: ' + event.target.src
    }
    
    const handleImageLoad = (event) => {
      console.log('✅ [DEBUG] Image loaded successfully')
      console.log('✅ [DEBUG] Load event:', event)
      console.log('✅ [DEBUG] Load target:', event.target)
      console.log('✅ [DEBUG] Load target src:', event.target.src)
      console.log('✅ [DEBUG] Load target naturalWidth:', event.target.naturalWidth)
      console.log('✅ [DEBUG] Load target naturalHeight:', event.target.naturalHeight)
      console.log('✅ [DEBUG] Load target complete:', event.target.complete)
      
      // Clear any previous error
      if (error.value && error.value.includes('Failed to load image')) {
        error.value = ''
      }
    }
    
    const handleImageLoadStart = (event) => {
      console.log('🔄 [DEBUG] Image load started')
      console.log('🔄 [DEBUG] Load start event:', event)
      console.log('🔄 [DEBUG] Load start target src:', event.target.src)
      console.log('🔄 [DEBUG] Current time:', new Date().toISOString())
    }
    
    const handleImageLoadEnd = (event) => {
      console.log('🏁 [DEBUG] Image load ended')
      console.log('🏁 [DEBUG] Load end event:', event)
      console.log('🏁 [DEBUG] Load end target src:', event.target.src)
      console.log('🏁 [DEBUG] Load end target complete:', event.target.complete)
      console.log('🏁 [DEBUG] Current time:', new Date().toISOString())
    }
    
    const clearImage = () => {
      form.imageUrl = ''
      form.path = ''
      uploadedImagePath.value = ''
      if (imageUploadRef.value) {
        imageUploadRef.value.value = ''
      }
    }
    
    const removeUploadedImage = () => {
      console.log('🗑️ [DEBUG] Removing uploaded image')
      console.log('🗑️ [DEBUG] Before removal - uploadedImagePath.value:', uploadedImagePath.value)
      console.log('🗑️ [DEBUG] Before removal - form.imageUrl:', form.imageUrl)
      console.log('🗑️ [DEBUG] Before removal - form.path:', form.path)
      
      uploadedImagePath.value = ''
      // Keep form.imageUrl and form.path as they might contain URL images
      // Only clear them if they match the uploaded image path
      if (form.imageUrl === uploadedImagePath.value) {
        form.imageUrl = ''
      }
      if (form.path === uploadedImagePath.value) {
        form.path = ''
      }
      if (imageUploadRef.value) {
        imageUploadRef.value.value = ''
      }
      
      console.log('🗑️ [DEBUG] After removal - uploadedImagePath.value:', uploadedImagePath.value)
      console.log('🗑️ [DEBUG] After removal - form.imageUrl:', form.imageUrl)
      console.log('🗑️ [DEBUG] After removal - form.path:', form.path)
    }
    
    // Computed property for template condition debugging
    const shouldShowImagePreview = computed(() => {
      const shouldShow = !!(form.imageUrl || uploadedImagePath.value)
      console.log('🎭 [DEBUG] Template condition check:')
      console.log('🎭 [DEBUG] - form.imageUrl:', form.imageUrl)
      console.log('🎭 [DEBUG] - uploadedImagePath.value:', uploadedImagePath.value)
      console.log('🎭 [DEBUG] - shouldShowImagePreview:', shouldShow)
      return shouldShow
    })
    
    const handlePreferencesChanged = (preferences) => {
      // Clear current API results to force a new search with new preferences
      apiResults.value = []
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
      imageUploadRef,
      uploadedImagePath,
      handleSave,
      closeModal,
      deleteItem,
      searchApi,
      selectApiResult,
      formatDate,
      formatDateForInput,
      ensureHttpsUrl,
      getReleasePreview,
      triggerImageUpload,
      handleImageUpload,
      getImagePreviewUrl,
      handleImageError,
      handleImageLoad,
      handleImageLoadStart,
      handleImageLoadEnd,
      clearImage,
      removeUploadedImage,
      shouldShowImagePreview,
      handlePreferencesChanged
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
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  border-radius: 12px;
  animation: slideInUp 0.3s ease-out;
  max-width: 1000px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid #404040;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .modal-content {
    padding: 16px;
    max-height: 95vh;
    margin: 0;
    border-radius: 8px 8px 0 0;
    width: 100%;
    max-width: 100%;
  }
}

.modal-content h2 {
  margin: 0 0 20px 0;
  text-align: center;
  color: #e0e0e0;
}

.form-header {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 20px;
  margin-bottom: 20px;
  align-items: start;
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
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #e8f4fd;
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group textarea {
  padding: 12px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 16px;
  background: #3a3a3a;
  color: #fff;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
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
  margin-top: 20px;
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
  background: #e8f4fd;
  color: #1a1a1a;
}

.modal-buttons button[type="submit"]:hover:not(:disabled) {
  background: #d1e7f7;
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
  color: #1a1a1a;
  border: 1px solid #c0392b;
}

.modal-buttons .delete-btn:hover:not(:disabled) {
  background: #c0392b;
  border-color: #a93226;
}

.modal-buttons .check-btn {
  background: #27ae60;
  color: #1a1a1a;
  border: 1px solid #229954;
  font-size: 18px;
  font-weight: bold;
  padding: 12px 16px;
}

.modal-buttons .check-btn:hover:not(:disabled) {
  background: #229954;
  border-color: #1e8449;
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
  border-radius: 0 0 8px 8px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.search-result-item {
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid #555;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-result-item:hover {
  background: #4a4a4a;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-thumbnail .no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f4fd, #6bb6ff);
  color: #1a1a1a;
  font-weight: bold;
  font-size: 24px;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 6px;
  font-size: 14px;
  line-height: 1.3;
}

.result-meta {
  font-size: 12px;
  color: #a0a0a0;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.result-meta .rating {
  color: #ffd700;
  font-weight: 500;
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
  color: #e8f4fd;
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

/* Image Upload Styles */
.image-upload-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-btn {
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  min-height: 44px;
}

.upload-btn:hover:not(:disabled) {
  background: #d1e7f7;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-success {
  background: #2d4a2d;
  border: 1px solid #4a7c4a;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: #90ee90;
  word-break: break-all;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.remove-uploaded-btn {
  background: #e74c3c;
  color: #1a1a1a;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.remove-uploaded-btn:hover {
  background: #c0392b;
}

.image-preview-group {
  grid-column: 1 / -1;
}

.image-preview {
  position: relative;
  display: inline-block;
  margin-top: 8px;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #555;
  object-fit: cover;
}

.clear-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e74c3c;
  color: #1a1a1a;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.clear-image-btn:hover {
  background: #c0392b;
}

@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    max-width: 100%;
    padding: 16px;
    max-height: 95vh;
  }
  
  .form-header {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .modal-buttons {
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }
  
  .modal-buttons button {
    width: 100%;
  }
  
  .search-results {
    max-height: 250px;
  }
  
  .result-thumbnail {
    width: 50px;
    height: 70px;
  }
  
  .result-title {
    font-size: 13px;
  }
  
  .result-meta {
    font-size: 11px;
    gap: 8px;
  }
}
</style>

