<template>
  <div class="books-api-control-panel">
    <div class="control-header">
      <h4>📚 Books API Settings</h4>
      <button 
        class="toggle-btn" 
        @click="toggleExpanded"
        :class="{ expanded: isExpanded }"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </button>
    </div>
    
    <div v-if="isExpanded" class="control-content">
      <div class="form-group">
        <label for="apiProvider">Primary API Provider:</label>
        <select 
          id="apiProvider" 
          v-model="localPreferences.booksApiProvider"
          @change="updatePreferences"
        >
          <option value="wikipedia">Wikipedia (Recommended)</option>
          <option value="google_books">Google Books</option>
          <option value="both">Both APIs</option>
        </select>
        <div class="field-hint">
          Choose your primary source for book information
        </div>
      </div>
      
      <div class="form-group">
        <div class="checkbox-container">
          <input 
            type="checkbox" 
            id="enableFallback" 
            v-model="localPreferences.enableGoogleBooksFallback"
            @change="updatePreferences"
          />
          <label for="enableFallback" class="checkbox-label">
            Enable Google Books Fallback
          </label>
        </div>
        <div class="field-hint">
          Use Google Books when primary API fails
        </div>
      </div>
      
      <div class="api-status">
        <div class="status-item">
          <span class="status-label">Wikipedia:</span>
          <span class="status-value available">✅ Available</span>
        </div>
        <div class="status-item">
          <span class="status-label">Google Books:</span>
          <span class="status-value" :class="googleBooksStatus">
            {{ googleBooksStatus === 'available' ? '✅ Available' : '⚠️ Check API Key' }}
          </span>
        </div>
      </div>
      
      <div class="search-preview">
        <button 
          class="test-search-btn" 
          @click="testSearch"
          :disabled="testing"
        >
          {{ testing ? 'Testing...' : 'Test Search' }}
        </button>
        <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
          {{ testResult.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { unifiedBooksApiService } from '@/services/unifiedBooksApi'

export default {
  name: 'BooksApiControlPanel',
  props: {
    expanded: {
      type: Boolean,
      default: false
    }
  },
  emits: ['preferences-changed'],
  setup(props, { emit }) {
    const isExpanded = ref(props.expanded)
    const testing = ref(false)
    const testResult = ref(null)
    const googleBooksStatus = ref('checking')
    
    const localPreferences = reactive({
      booksApiProvider: 'wikipedia',
      enableGoogleBooksFallback: true
    })
    
    const toggleExpanded = () => {
      isExpanded.value = !isExpanded.value
    }
    
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem('profileData')
        if (saved) {
          const profileData = JSON.parse(saved)
          localPreferences.booksApiProvider = profileData.booksApiProvider || 'wikipedia'
          localPreferences.enableGoogleBooksFallback = profileData.enableGoogleBooksFallback !== false
        }
      } catch (error) {
        console.warn('Failed to load preferences:', error)
      }
    }
    
    const updatePreferences = () => {
      try {
        const saved = localStorage.getItem('profileData')
        const profileData = saved ? JSON.parse(saved) : {}
        
        profileData.booksApiProvider = localPreferences.booksApiProvider
        profileData.enableGoogleBooksFallback = localPreferences.enableGoogleBooksFallback
        
        localStorage.setItem('profileData', JSON.stringify(profileData))
        
        emit('preferences-changed', { ...localPreferences })
        
      } catch (error) {
        console.error('Failed to save preferences:', error)
      }
    }
    
    const testSearch = async () => {
      testing.value = true
      testResult.value = null
      
      try {
        const result = await unifiedBooksApiService.searchBooks('Harry Potter', 3)
        
        if (result.success && result.data.length > 0) {
          testResult.value = {
            success: true,
            message: `✅ Found ${result.data.length} results using ${result.source}`
          }
        } else {
          testResult.value = {
            success: false,
            message: `❌ No results found: ${result.error || 'Unknown error'}`
          }
        }
      } catch (error) {
        testResult.value = {
          success: false,
          message: `❌ Test failed: ${error.message}`
        }
      } finally {
        testing.value = false
      }
    }
    
    const checkGoogleBooksStatus = async () => {
      try {
        // Simple check to see if Google Books API is configured
        const result = await unifiedBooksApiService.getApiStatus()
        googleBooksStatus.value = result.googleBooksAvailable ? 'available' : 'unavailable'
      } catch (error) {
        googleBooksStatus.value = 'unavailable'
      }
    }
    
    onMounted(() => {
      loadPreferences()
      checkGoogleBooksStatus()
    })
    
    return {
      isExpanded,
      localPreferences,
      testing,
      testResult,
      googleBooksStatus,
      toggleExpanded,
      updatePreferences,
      testSearch
    }
  }
}
</script>

<style scoped>
.books-api-control-panel {
  background: #2a2a2a;
  border: 1px solid #404040;
  border-radius: 8px;
  margin: 16px 0;
  overflow: hidden;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #333;
  border-bottom: 1px solid #404040;
  cursor: pointer;
}

.control-header h4 {
  margin: 0;
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 600;
}

.toggle-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 12px;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.toggle-btn.expanded {
  transform: rotate(0deg);
}

.control-content {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #d0d0d0;
  font-size: 13px;
}

.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #3a3a3a;
  color: #e0e0e0;
  font-size: 14px;
}

.form-group select:focus {
  outline: none;
  border-color: #e8f4fd;
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.checkbox-container input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: #e8f4fd;
}

.checkbox-label {
  font-size: 13px;
  color: #d0d0d0;
  line-height: 1.4;
  cursor: pointer;
  margin: 0;
}

.field-hint {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
  font-style: italic;
}

.api-status {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 12px;
  margin: 16px 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  font-size: 12px;
  color: #a0a0a0;
  font-weight: 500;
}

.status-value {
  font-size: 12px;
  font-weight: 500;
}

.status-value.available {
  color: #4caf50;
}

.status-value.unavailable {
  color: #f44336;
}

.status-value.checking {
  color: #ff9800;
}

.search-preview {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #333;
}

.test-search-btn {
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.test-search-btn:hover:not(:disabled) {
  background: #d1e7f7;
}

.test-search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-result {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.test-result.success {
  background: #2d4a2d;
  color: #90ee90;
  border: 1px solid #4a7c4a;
}

.test-result.error {
  background: #4a2a2a;
  color: #ff6b6b;
  border: 1px solid #e74c3c;
}

@media (max-width: 768px) {
  .control-content {
    padding: 12px;
  }
  
  .control-header {
    padding: 10px 12px;
  }
  
  .control-header h4 {
    font-size: 13px;
  }
}
</style>
