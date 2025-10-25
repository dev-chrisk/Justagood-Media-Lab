<template>
  <div class="modal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>{{ isEditing ? 'Edit Item' : 'Add Item' }}</h2>
      
      <form @submit.prevent="handleSave">
        <!-- Category Bereich -->
        <div class="form-area category-area">
          <div class="form-group">
            <label for="category">Category:</label>
            <select id="category" v-model="form.category" required>
              <option value="watchlist">Watchlist</option>
              <option value="game">Game</option>
              <option value="series">Series</option>
              <option value="movie">Movie</option>
              <option value="buecher">Bücher</option>
            </select>
          </div>
        </div>
        
        <!-- Title Bereich -->
        <div class="form-area title-area">
          <div class="form-group">
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
        
        <!-- Details Bereich -->
        <div class="form-area details-area">
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
          </div>
          
          <div v-if="isSeries" class="form-group">
            <label for="isAiring">Status:</label>
            <select id="isAiring" v-model="form.isAiring">
              <option :value="false">Finished</option>
              <option :value="true">Airing</option>
            </select>
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
          </div>
        </div>
        
        <!-- Button Area -->
        <div class="form-area button-area">
          <div class="control-buttons">
            <button type="submit" :disabled="loading" class="save-btn">
              {{ loading ? 'Saving...' : '💾 Save' }}
            </button>
            <button type="button" @click="closeModal" :disabled="loading" class="cancel-btn">
              ✕ Cancel
            </button>
            <button 
              v-if="isEditing" 
              type="button" 
              @click="deleteItem" 
              :disabled="loading"
              class="delete-btn"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
        
        <!-- Main Form Area (Fixed, Non-scrollable) -->
        <div class="main-form-area">
          <div class="form-columns">
            <div class="form-column-left">
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
            
            <div class="form-column-right">
              <div class="form-group">
                <label for="description">Description:</label>
                <textarea 
                  id="description"
                  v-model="form.description" 
                  placeholder="Enter description..."
                  rows="3"
                ></textarea>
              </div>
              
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
                <label for="imageUrl">Image URL:</label>
                <div class="image-input-group">
                  <input 
                    type="text" 
                    id="imageUrl"
                    v-model="form.imageUrl" 
                    placeholder="https://... or leave empty for API images"
                  />
                  <button 
                    type="button" 
                    @click="triggerImageUpload"
                    class="upload-btn"
                    :disabled="loading"
                  >
                    📁 Upload
                  </button>
                </div>
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
        </div>
        
        <!-- Watchlist Fields (Inline when category is watchlist) -->
        <div v-if="form.category === 'watchlist'" class="watchlist-fields">
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
          
          <div class="form-group">
            <label for="watchlistReleaseDate">Watchlist Release Date</label>
            <input
              type="date"
              id="watchlistReleaseDate"
              v-model="form.watchlistReleaseDate"
              placeholder="When does this release?"
            />
          </div>
          
          <div class="form-group">
            <label for="watchlistNumber">Watchlist Number</label>
            <input
              type="number"
              id="watchlistNumber"
              v-model="form.watchlistNumber"
              placeholder="Enter a number"
              min="1"
            />
          </div>
          
          <div class="form-group">
            <label for="extraLink">Extra Link:</label>
            <input 
              type="url" 
              id="extraLink"
              v-model="form.extraLink" 
              placeholder="https://... (e.g., streaming platform, official website)"
            />
            <div class="field-hint">Optional: Additional link for watchlist items (e.g., streaming platform, official website)</div>
          </div>
        </div>
        
        <!-- Game Fields (Inline when category is game) -->
        <div v-if="isGame" class="game-fields">
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
        
        <!-- Collapsible Sections -->
        <div class="collapsible-sections">
          <!-- Series Details Section -->
          <div v-if="isSeries" class="collapsible-section">
            <button 
              type="button" 
              @click="toggleSeriesDetails" 
              class="collapsible-header"
              :class="{ 'expanded': seriesDetailsExpanded }"
            >
              📺 Series Details {{ seriesDetailsExpanded ? '▼' : '▶' }}
            </button>
            <div v-if="seriesDetailsExpanded" class="collapsible-content">
              <div class="form-row">
                <div class="form-group">
                  <label for="nextSeasonName">Next Season Name:</label>
                  <input 
                    type="text" 
                    id="nextSeasonName"
                    v-model="form.nextSeasonName" 
                    placeholder="e.g., The Final Season"
                  />
                </div>
                
                <div class="form-group">
                  <label for="lastAirDate">Last Air Date:</label>
                  <input 
                    type="date" 
                    id="lastAirDate"
                    v-model="form.lastAirDate"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="totalSeasons">Total Seasons:</label>
                  <input 
                    type="number" 
                    id="totalSeasons"
                    v-model="form.totalSeasons" 
                    min="0"
                    placeholder="0"
                  />
                </div>
                
                <div class="form-group">
                  <label for="totalEpisodes">Total Episodes:</label>
                  <input 
                    type="number" 
                    id="totalEpisodes"
                    v-model="form.totalEpisodes" 
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="seriesStatus">Series Status:</label>
                  <select id="seriesStatus" v-model="form.seriesStatus">
                    <option value="">Select Status</option>
                    <option value="Returning Series">Returning Series</option>
                    <option value="Ended">Ended</option>
                    <option value="In Production">In Production</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="networks">Networks:</label>
                  <input 
                    type="text" 
                    id="networks"
                    v-model="form.networks" 
                    placeholder="e.g., Netflix, HBO"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group full-width">
                  <label for="createdBy">Created By:</label>
                  <input 
                    type="text" 
                    id="createdBy"
                    v-model="form.createdBy" 
                    placeholder="e.g., The Duffer Brothers"
                  />
                </div>
              </div>
              
              <div class="form-row">
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
              
              <!-- Series API Check Button -->
              <div class="form-row">
                <div class="form-group full-width">
                  <label>TMDB Series Information:</label>
                  <div class="api-check-container">
                    <button 
                      type="button" 
                      @click="checkSeriesAPI" 
                      :disabled="loading || !form.title"
                      class="api-check-btn"
                    >
                      <span v-if="apiLoading">🔍 Checking...</span>
                      <span v-else>🔍 Check Series Info</span>
                    </button>
                    <div v-if="apiError" class="api-error">
                      {{ apiError }}
                    </div>
                    <div v-if="apiSuccess" class="api-success">
                      ✅ Series information updated from TMDB
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Books API Control Panel -->
        <BooksApiControlPanel 
          v-if="(form.category === 'buecher' || form.watchlistType === 'buecher')"
          :expanded="false"
          @preferences-changed="handlePreferencesChanged"
        />
        
        <div v-if="error" class="error-message">
          {{ error }}
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
import { onMounted, onUnmounted } from 'vue'

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
    
    // API check states
    const apiLoading = ref(false)
    const apiError = ref('')
    const apiSuccess = ref(false)
    
    // Collapsible sections state
    const seriesDetailsExpanded = ref(false)
    
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
      watchlistReleaseDate: '',
      watchlistNumber: '',
      imageCleared: false,
      // New series fields
      tmdbId: '',
      nextSeasonName: '',
      lastAirDate: '',
      totalSeasons: '',
      totalEpisodes: '',
      seriesStatus: '',
      networks: '',
      createdBy: ''
    })
    
    const isEditing = computed(() => !!props.item)
    const isGame = computed(() => form.category === 'game')
    const isSeries = computed(() => form.category === 'series')
    const isWatchlist = computed(() => form.category === 'watchlist')
    
    // Initialize form with item data
    watch(() => props.item, (newItem) => {
      if (newItem) {
        // Map backend field names to frontend field names FIRST
        if (newItem.watchlist_type !== undefined) {
          form.watchlistType = newItem.watchlist_type || ''
        } else if (newItem.watchlistType !== undefined) {
          form.watchlistType = newItem.watchlistType || ''
        } else {
          form.watchlistType = ''
        }
        
        if (newItem.watchlist_release_date !== undefined) {
          // Convert date to YYYY-MM-DD format for input field
          const date = newItem.watchlist_release_date
          if (date instanceof Date) {
            form.watchlistReleaseDate = date.toISOString().split('T')[0]
          } else if (typeof date === 'string' && date.includes('T')) {
            form.watchlistReleaseDate = date.split('T')[0]
          } else {
            form.watchlistReleaseDate = date || ''
          }
        } else if (newItem.watchlistReleaseDate !== undefined) {
          form.watchlistReleaseDate = newItem.watchlistReleaseDate || ''
        } else {
          form.watchlistReleaseDate = ''
        }
        
        if (newItem.watchlist_number !== undefined) {
          form.watchlistNumber = newItem.watchlist_number || ''
        } else if (newItem.watchlistNumber !== undefined) {
          form.watchlistNumber = newItem.watchlistNumber || ''
        } else {
          form.watchlistNumber = ''
        }
        
        // Then map other fields, but skip watchlistType, watchlistReleaseDate, and watchlistNumber to avoid overwriting
        Object.keys(form).forEach(key => {
          if (key !== 'watchlistType' && key !== 'watchlistReleaseDate' && key !== 'watchlistNumber') {
            form[key] = newItem[key] || ''
          }
        })
        
        // Map other backend field names to frontend field names
        if (newItem.is_airing !== undefined) {
          console.log('DEBUG: Loading isAiring from backend:', {
            is_airing: newItem.is_airing,
            type: typeof newItem.is_airing,
            form_isAiring_before: form.isAiring
          })
          form.isAiring = newItem.is_airing
          console.log('DEBUG: form.isAiring after setting:', form.isAiring)
        }
        
        // Map new series fields
        if (newItem.tmdb_id !== undefined) {
          form.tmdbId = newItem.tmdb_id
        }
        if (newItem.next_season_name !== undefined) {
          form.nextSeasonName = newItem.next_season_name
        }
        if (newItem.last_air_date !== undefined) {
          form.lastAirDate = newItem.last_air_date
        }
        if (newItem.total_seasons !== undefined) {
          form.totalSeasons = newItem.total_seasons
        }
        if (newItem.total_episodes !== undefined) {
          form.totalEpisodes = newItem.total_episodes
        }
        if (newItem.series_status !== undefined) {
          form.seriesStatus = newItem.series_status
        }
        if (newItem.networks !== undefined) {
          form.networks = newItem.networks
        }
        if (newItem.created_by !== undefined) {
          form.createdBy = newItem.created_by
        }
        if (newItem.next_season !== undefined) {
          form.nextSeason = newItem.next_season
        }
        if (newItem.next_season_release !== undefined) {
          // Convert date to YYYY-MM-DD format for input field
          const date = newItem.next_season_release
          if (date instanceof Date) {
            form.nextSeasonRelease = date.toISOString().split('T')[0]
          } else if (typeof date === 'string' && date.includes('T')) {
            form.nextSeasonRelease = date.split('T')[0]
          } else {
            form.nextSeasonRelease = date || ''
          }
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
        }
        if (newItem.path !== undefined) {
          form.path = newItem.path
        }
        if (newItem.extra_link !== undefined) {
          form.extraLink = newItem.extra_link
        }
        // Map the main rating field to personal rating (since that's what users edit)
        if (newItem.rating !== undefined && !form.personalRating) {
          form.personalRating = newItem.rating
        }
        
      } else {
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
        
        console.log('🔍 ULTRA DEBUG - Form data before processing:', {
          watchlistReleaseDate: form.watchlistReleaseDate,
          nextSeasonRelease: form.nextSeasonRelease,
          watchlistNumber: form.watchlistNumber,
          extraLink: form.extraLink,
          type_watchlist: typeof form.watchlistReleaseDate,
          type_next: typeof form.nextSeasonRelease,
          type_watchlist_number: typeof form.watchlistNumber,
          type_extraLink: typeof form.extraLink,
          is_empty_watchlist: form.watchlistReleaseDate === '',
          is_empty_next: form.nextSeasonRelease === '',
          is_empty_watchlist_number: form.watchlistNumber === '',
          is_empty_extraLink: form.extraLink === '',
          is_null_watchlist: form.watchlistReleaseDate === null,
          is_null_next: form.nextSeasonRelease === null,
          is_null_watchlist_number: form.watchlistNumber === null,
          is_null_extraLink: form.extraLink === null,
          is_undefined_watchlist: form.watchlistReleaseDate === undefined,
          is_undefined_next: form.nextSeasonRelease === undefined,
          is_undefined_watchlist_number: form.watchlistNumber === undefined,
          is_undefined_extraLink: form.extraLink === undefined,
          ALL_FORM_DATA: form
        })
        
        // Convert empty strings to null for optional fields (except watchlistType, image fields, extraLink, and date fields)
        Object.keys(itemData).forEach(key => {
          if (itemData[key] === '' && key !== 'watchlistType' && key !== 'imageUrl' && key !== 'path' && key !== 'extraLink' && key !== 'watchlistReleaseDate' && key !== 'nextSeasonRelease' && key !== 'lastAirDate' && key !== 'watchlistNumber') {
            itemData[key] = null
          }
        })
        
        // Handle extraLink separately - convert empty string to null
        if (itemData.extraLink === '') {
          itemData.extraLink = null
        }
        
        console.log('🔍 ULTRA DEBUG - Form data after null conversion:', {
          watchlistReleaseDate: itemData.watchlistReleaseDate,
          nextSeasonRelease: itemData.nextSeasonRelease,
          watchlistNumber: itemData.watchlistNumber,
          type_watchlist: typeof itemData.watchlistReleaseDate,
          type_next: typeof itemData.nextSeasonRelease,
          type_watchlist_number: typeof itemData.watchlistNumber,
          is_empty_watchlist: itemData.watchlistReleaseDate === '',
          is_empty_next: itemData.nextSeasonRelease === '',
          is_empty_watchlist_number: itemData.watchlistNumber === '',
          is_null_watchlist: itemData.watchlistReleaseDate === null,
          is_null_next: itemData.nextSeasonRelease === null,
          is_null_watchlist_number: itemData.watchlistNumber === null,
          is_undefined_watchlist: itemData.watchlistReleaseDate === undefined,
          is_undefined_next: itemData.nextSeasonRelease === undefined,
          is_undefined_watchlist_number: itemData.watchlistNumber === undefined,
          ALL_ITEM_DATA: itemData
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
        if (itemData.watchlistReleaseDate !== undefined) {
          console.log('🔍 ULTRA DEBUG - watchlistReleaseDate mapping:', {
            original: itemData.watchlistReleaseDate,
            type: typeof itemData.watchlistReleaseDate,
            is_empty: itemData.watchlistReleaseDate === '',
            is_null: itemData.watchlistReleaseDate === null,
            is_undefined: itemData.watchlistReleaseDate === undefined,
            mapped: itemData.watchlistReleaseDate === '' ? null : itemData.watchlistReleaseDate,
            FINAL_VALUE: itemData.watchlistReleaseDate === '' ? null : itemData.watchlistReleaseDate,
            BEFORE_DELETE: itemData.watchlistReleaseDate
          })
          // Convert empty string to null for proper database storage
          itemData.watchlist_release_date = itemData.watchlistReleaseDate === '' ? null : itemData.watchlistReleaseDate
          console.log('🔍 ULTRA DEBUG - watchlistReleaseDate after mapping:', {
            watchlist_release_date: itemData.watchlist_release_date,
            type: typeof itemData.watchlist_release_date,
            is_null: itemData.watchlist_release_date === null,
            is_undefined: itemData.watchlist_release_date === undefined
          })
          delete itemData.watchlistReleaseDate
        }
        if (itemData.watchlistNumber !== undefined) {
          console.log('🔍 ULTRA DEBUG - watchlistNumber mapping:', {
            original: itemData.watchlistNumber,
            type: typeof itemData.watchlistNumber,
            is_empty: itemData.watchlistNumber === '',
            is_null: itemData.watchlistNumber === null,
            is_undefined: itemData.watchlistNumber === undefined,
            mapped: itemData.watchlistNumber === '' ? null : itemData.watchlistNumber,
            FINAL_VALUE: itemData.watchlistNumber === '' ? null : itemData.watchlistNumber,
            BEFORE_DELETE: itemData.watchlistNumber
          })
          // Convert empty string to null for proper database storage
          itemData.watchlist_number = itemData.watchlistNumber === '' ? null : itemData.watchlistNumber
          console.log('🔍 ULTRA DEBUG - watchlistNumber after mapping:', {
            watchlist_number: itemData.watchlist_number,
            type: typeof itemData.watchlist_number,
            is_null: itemData.watchlist_number === null,
            is_undefined: itemData.watchlist_number === undefined
          })
          delete itemData.watchlistNumber
        }
        if (itemData.isAiring !== undefined) {
          itemData.is_airing = itemData.isAiring
          delete itemData.isAiring
        }
        
        // Map new series fields to backend
        if (itemData.tmdbId !== undefined) {
          itemData.tmdb_id = itemData.tmdbId
          delete itemData.tmdbId
        }
        if (itemData.nextSeasonName !== undefined) {
          itemData.next_season_name = itemData.nextSeasonName
          delete itemData.nextSeasonName
        }
        if (itemData.lastAirDate !== undefined) {
          itemData.last_air_date = itemData.lastAirDate
          delete itemData.lastAirDate
        }
        if (itemData.totalSeasons !== undefined) {
          itemData.total_seasons = itemData.totalSeasons
          delete itemData.totalSeasons
        }
        if (itemData.totalEpisodes !== undefined) {
          itemData.total_episodes = itemData.totalEpisodes
          delete itemData.totalEpisodes
        }
        if (itemData.seriesStatus !== undefined) {
          itemData.series_status = itemData.seriesStatus
          delete itemData.seriesStatus
        }
        if (itemData.networks !== undefined) {
          itemData.networks = itemData.networks
        }
        if (itemData.createdBy !== undefined) {
          itemData.created_by = itemData.createdBy
          delete itemData.createdBy
        }
        if (itemData.nextSeason !== undefined) {
          itemData.next_season = itemData.nextSeason || null
          delete itemData.nextSeason
        }
        if (itemData.nextSeasonRelease !== undefined) {
          console.log('🔍 ULTRA DEBUG - nextSeasonRelease mapping:', {
            original: itemData.nextSeasonRelease,
            type: typeof itemData.nextSeasonRelease,
            is_empty: itemData.nextSeasonRelease === '',
            is_null: itemData.nextSeasonRelease === null,
            is_undefined: itemData.nextSeasonRelease === undefined,
            mapped: itemData.nextSeasonRelease === '' ? null : itemData.nextSeasonRelease,
            FINAL_VALUE: itemData.nextSeasonRelease === '' ? null : itemData.nextSeasonRelease,
            BEFORE_DELETE: itemData.nextSeasonRelease
          })
          // Convert empty string to null for proper database storage
          itemData.next_season_release = itemData.nextSeasonRelease === '' ? null : itemData.nextSeasonRelease
          console.log('🔍 ULTRA DEBUG - nextSeasonRelease after mapping:', {
            next_season_release: itemData.next_season_release,
            type: typeof itemData.next_season_release,
            is_null: itemData.next_season_release === null,
            is_undefined: itemData.next_season_release === undefined
          })
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
          console.log('🔍 ULTRA DEBUG - extraLink processing:', {
            original_extraLink: itemData.extraLink,
            type: typeof itemData.extraLink,
            is_empty: itemData.extraLink === '',
            is_null: itemData.extraLink === null,
            is_undefined: itemData.extraLink === undefined,
            mapped_to: 'extra_link'
          })
          
          // Only set extra_link if it's not empty
          if (itemData.extraLink && itemData.extraLink.trim() !== '') {
            itemData.extra_link = itemData.extraLink
          } else {
            itemData.extra_link = null
          }
          
          delete itemData.extraLink
          console.log('🔍 ULTRA DEBUG - extraLink after mapping:', {
            extra_link: itemData.extra_link,
            type: typeof itemData.extra_link,
            is_null: itemData.extra_link === null,
            is_undefined: itemData.extra_link === undefined
          })
        }
        
        
        // Use store methods to ensure proper state updates
        if (isEditing.value && props.item) {
          console.log('🔍 ULTRA DEBUG - Final data being sent to store:', {
            id: props.item.id,
            watchlist_release_date: itemData.watchlist_release_date,
            next_season_release: itemData.next_season_release,
            watchlist_number: itemData.watchlist_number,
            extra_link: itemData.extra_link,
            is_airing: itemData.is_airing,
            watchlist_type: itemData.watchlist_type,
            type_watchlist_release: typeof itemData.watchlist_release_date,
            type_next_season: typeof itemData.next_season_release,
            type_watchlist_number: typeof itemData.watchlist_number,
            type_extra_link: typeof itemData.extra_link,
            is_null_watchlist: itemData.watchlist_release_date === null,
            is_null_next: itemData.next_season_release === null,
            is_null_watchlist_number: itemData.watchlist_number === null,
            is_null_extra_link: itemData.extra_link === null,
            is_undefined_watchlist: itemData.watchlist_release_date === undefined,
            is_undefined_next: itemData.next_season_release === undefined,
            is_undefined_watchlist_number: itemData.watchlist_number === undefined,
            is_undefined_extra_link: itemData.extra_link === undefined,
            FULL_ITEM_DATA: itemData
          })
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
    
    // Body scroll lock functionality
    const lockBodyScroll = () => {
      document.body.style.overflow = 'hidden'
    }
    
    const unlockBodyScroll = () => {
      document.body.style.overflow = ''
    }
    
    // Lock body scroll when modal mounts
    onMounted(() => {
      lockBodyScroll()
    })
    
    // Unlock body scroll when modal unmounts
    onUnmounted(() => {
      unlockBodyScroll()
    })
    
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
      
      // Auto-fetch TMDB info for series
      if (form.category === 'series') {
        console.log('🔍 Auto-fetching TMDB info for series:', form.title)
        await checkSeriesAPI()
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
      const file = event.target.files[0]
      if (!file) return
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        error.value = 'Please select a valid image file'
        return
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        error.value = 'Image file too large. Maximum size is 10MB'
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        // Generate custom path based on title and category
        const safeTitle = form.title.replace(/[^a-zA-Z0-9\s\-_\.]/g, '').trim() || 'item'
        const timestamp = Date.now()
        const extension = file.name.split('.').pop() || 'jpg'
        const customPath = `images_downloads/uploads/${safeTitle}_${timestamp}.${extension}`
        
        const result = await mediaApi.uploadImage(file, customPath)
        
        if (result.success) {
          uploadedImagePath.value = result.saved
          form.path = result.saved
          form.imageUrl = result.saved
        } else {
          error.value = result.error || 'Failed to upload image'
        }
      } catch (err) {
        error.value = err.message || 'Failed to upload image'
      } finally {
        loading.value = false
      }
    }
    
    const getImagePreviewUrl = () => {
      if (uploadedImagePath.value) {
        // Ensure we don't double-add /storage/ prefix
        if (uploadedImagePath.value.startsWith('storage/')) {
          return `/${uploadedImagePath.value}`
        }
        // Use the API route instead of storage symlink
        // uploadedImagePath.value already contains 'images_downloads/uploads/...'
        return `/${uploadedImagePath.value}`
      }
      if (form.imageUrl) {
        // Handle both URLs and relative paths
        if (form.imageUrl.startsWith('http')) {
          return form.imageUrl
        }
        // Ensure we don't double-add /storage/ prefix
        if (form.imageUrl.startsWith('storage/')) {
          return `/${form.imageUrl}`
        }
        // Use the API route instead of storage symlink
        // form.imageUrl already contains 'images_downloads/uploads/...'
        return `/${form.imageUrl}`
      }
      return ''
    }
    
    const handleImageError = (event) => {
      // Hide the broken image
      event.target.style.display = 'none'
      
      // Show error message
      error.value = 'Failed to load image: ' + event.target.src
    }
    
    const handleImageLoad = (event) => {
      // Clear any previous error
      if (error.value && error.value.includes('Failed to load image')) {
        error.value = ''
      }
    }
    
    const handleImageLoadStart = (event) => {
      // Image loading started
    }
    
    const handleImageLoadEnd = (event) => {
      // Image loading ended
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
    }
    
    // Computed property for template condition
    const shouldShowImagePreview = computed(() => {
      return !!(form.imageUrl || uploadedImagePath.value)
    })
    
    const handlePreferencesChanged = (preferences) => {
      // Clear current API results to force a new search with new preferences
      apiResults.value = []
    }
    
    const toggleSeriesDetails = () => {
      seriesDetailsExpanded.value = !seriesDetailsExpanded.value
    }
    
    // TMDB API check function
    const checkSeriesAPI = async () => {
      if (!form.title || form.title.trim() === '') {
        apiError.value = 'Please enter a series title first'
        return
      }
      
      console.log('🔍 Starting TMDB API check for:', form.title)
      
      apiLoading.value = true
      apiError.value = ''
      apiSuccess.value = false
      
      try {
        console.log('📡 Calling checkSeriesInfo API...')
        const response = await mediaApi.checkSeriesInfo(form.title)
        console.log('📡 API Response:', response)
        
        if (response.success && response.data) {
          const seriesData = response.data
          console.log('📊 Series Data received:', seriesData)
          
          // Update form with TMDB data
          if (seriesData.tmdb_id) {
            form.tmdbId = seriesData.tmdb_id
            console.log('✅ Set tmdbId:', seriesData.tmdb_id)
          }
          if (seriesData.is_airing !== undefined) {
            form.isAiring = seriesData.is_airing
            console.log('✅ Set isAiring:', seriesData.is_airing)
          }
          if (seriesData.next_episode) {
            form.nextSeason = seriesData.next_episode.season_number
            form.nextSeasonRelease = seriesData.next_episode.air_date
            form.nextSeasonName = seriesData.next_episode.name
            console.log('✅ Set next season info:', {
              season: seriesData.next_episode.season_number,
              release: seriesData.next_episode.air_date,
              name: seriesData.next_episode.name
            })
          }
          if (seriesData.last_air_date) {
            form.lastAirDate = seriesData.last_air_date
            console.log('✅ Set lastAirDate:', seriesData.last_air_date)
          }
          if (seriesData.number_of_seasons) {
            form.totalSeasons = seriesData.number_of_seasons
            console.log('✅ Set totalSeasons:', seriesData.number_of_seasons)
          }
          if (seriesData.number_of_episodes) {
            form.totalEpisodes = seriesData.number_of_episodes
            console.log('✅ Set totalEpisodes:', seriesData.number_of_episodes)
          }
          if (seriesData.status) {
            form.seriesStatus = seriesData.status
            console.log('✅ Set seriesStatus:', seriesData.status)
          }
          if (seriesData.networks && seriesData.networks.length > 0) {
            form.networks = seriesData.networks.join(', ')
            console.log('✅ Set networks:', seriesData.networks.join(', '))
          }
          if (seriesData.created_by && seriesData.created_by.length > 0) {
            form.createdBy = seriesData.created_by.join(', ')
            console.log('✅ Set createdBy:', seriesData.created_by.join(', '))
          }
          if (seriesData.overview) {
            form.description = seriesData.overview
            console.log('✅ Set description')
          }
          if (seriesData.genres && seriesData.genres.length > 0) {
            form.genre = seriesData.genres.join(', ')
            console.log('✅ Set genre:', seriesData.genres.join(', '))
          }
          if (seriesData.poster_path) {
            form.imageUrl = seriesData.poster_path
            form.path = seriesData.poster_path
            console.log('✅ Set imageUrl:', seriesData.poster_path)
          }
          
          console.log('📝 Final form state:', form)
          
          apiSuccess.value = true
          setTimeout(() => {
            apiSuccess.value = false
          }, 3000)
        } else {
          console.error('❌ API returned error:', response.error)
          apiError.value = response.error || 'Failed to fetch series information'
        }
      } catch (err) {
        console.error('❌ TMDB API check failed:', err)
        apiError.value = err.message || 'Failed to check series information'
      } finally {
        apiLoading.value = false
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
      imageUploadRef,
      uploadedImagePath,
      apiLoading,
      apiError,
      apiSuccess,
      seriesDetailsExpanded,
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
      handlePreferencesChanged,
      toggleSeriesDetails,
      checkSeriesAPI
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
  overflow: hidden;
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
  padding: 12px;
  border-radius: 12px;
  animation: slideInUp 0.3s ease-out;
  max-width: 1000px;
  width: 90%;
  height: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid #404040;
  display: flex;
  flex-direction: column;
}

@media (min-width: 769px) {
  .modal-content {
    max-height: none;
    overflow: visible;
  }
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
    max-height: none;
    overflow: visible;
    margin: 0;
    border-radius: 8px 8px 0 0;
    width: 100%;
    max-width: 100%;
  }
}

.modal-content h2 {
  margin: 0 0 16px 0;
  text-align: center;
  color: #e0e0e0;
  font-size: 1.3rem;
}

/* Form Areas */
.form-area {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #404040;
}

.category-area {
  background: transparent;
  border: none;
  padding: 2px 4px;
  min-height: 30px;
  margin-bottom: 4px;
}

.title-area {
  background: transparent;
  border: none;
  padding: 2px 4px;
  min-height: 30px;
  margin-bottom: 4px;
}

.details-area {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.2);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 8px;
  align-items: end;
  padding: 8px;
}

.button-area {
  background: rgba(156, 39, 176, 0.1);
  border: 1px solid rgba(156, 39, 176, 0.2);
  text-align: center;
  padding: 8px;
}

.control-row-2 {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.control-row-3 {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #404040;
}

.control-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.control-buttons button {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  min-height: 44px;
  min-width: 100px;
}

.save-btn {
  background: #e8f4fd;
  color: #1a1a1a;
}

.save-btn:hover:not(:disabled) {
  background: #d1e7f7;
}

.cancel-btn {
  background: #404040;
  color: #d0d0d0;
  border: 1px solid #555;
}

.cancel-btn:hover:not(:disabled) {
  background: #4a4a4a;
}

.delete-btn {
  background: #e74c3c;
  color: #1a1a1a;
  border: 1px solid #c0392b;
}

.delete-btn:hover:not(:disabled) {
  background: #c0392b;
}

/* Main Form Area */
.main-form-area {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}

.form-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-column-left,
.form-column-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Watchlist and Game Fields */
.watchlist-fields,
.game-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #1a1a1a;
  border-radius: 6px;
  border: 1px solid #404040;
}

/* Collapsible Sections */
.collapsible-sections {
  margin-top: 16px;
}

.collapsible-section {
  margin-bottom: 12px;
}

.collapsible-header {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #404040;
  border-radius: 6px;
  padding: 12px 16px;
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.collapsible-header:hover {
  background: #2a2a2a;
  border-color: #555;
}

.collapsible-header.expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: none;
}

.collapsible-content {
  background: #1a1a1a;
  border: 1px solid #404040;
  border-top: none;
  border-radius: 0 0 6px 6px;
  padding: 16px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

/* Image Input Group */
.image-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.image-input-group input {
  flex: 1;
}

.upload-btn {
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
  white-space: nowrap;
}

.upload-btn:hover:not(:disabled) {
  background: #d1e7f7;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 4px;
  font-weight: 500;
  color: #d0d0d0;
  font-size: 13px;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
  background: #3a3a3a;
  color: #e0e0e0;
  min-height: 36px;
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
  padding: 8px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
  background: #3a3a3a;
  color: #fff;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
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

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    max-width: 100%;
    padding: 16px;
    max-height: 95vh;
  }
  
  .control-row-1 {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .control-row-2 {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .form-columns {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .watchlist-fields,
  .game-fields {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .control-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .control-buttons button {
    width: 100%;
  }
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

/* API Check Styles */
.api-check-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.api-check-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  align-self: flex-start;
}

.api-check-btn:hover:not(:disabled) {
  background: #0056b3;
}

.api-check-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.api-error {
  color: #dc3545;
  font-size: 14px;
  padding: 8px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.api-success {
  color: #155724;
  font-size: 14px;
  padding: 8px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
}
</style>

