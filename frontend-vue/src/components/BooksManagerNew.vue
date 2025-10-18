<template>
  <div class="books-manager">
    <!-- Header -->
    <div class="books-header">
      <h1>📚 Books Library</h1>
      <div class="header-actions">
        <button 
          @click="showAddModal = true" 
          class="add-book-btn"
          :disabled="loading"
        >
          <span class="btn-icon">+</span>
          Add Book
        </button>
        <button 
          @click="refreshBooks" 
          class="refresh-btn"
          :disabled="loading"
        >
          <span class="btn-icon">🔄</span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && books.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Loading books...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h3>Error Loading Books</h3>
      <p>{{ error }}</p>
      <button @click="refreshBooks" class="retry-btn">Try Again</button>
    </div>

    <!-- Books Grid -->
    <div v-else-if="books.length > 0" class="books-grid">
      <div 
        v-for="book in books" 
        :key="book.id" 
        class="book-card"
        @click="editBook(book)"
      >
        <div class="book-cover">
          <img 
            v-if="book.thumbnail" 
            :src="book.thumbnail" 
            :alt="book.title"
            @error="handleImageError"
          />
          <div v-else class="no-cover">
            <span class="book-icon">📚</span>
          </div>
        </div>
        
        <div class="book-info">
          <h3 class="book-title">{{ book.title }}</h3>
          <p class="book-author">{{ book.author }}</p>
          <div class="book-meta">
            <span v-if="book.publishedDate" class="book-year">
              {{ formatYear(book.publishedDate) }}
            </span>
            <span v-if="book.pageCount" class="book-pages">
              {{ book.pageCount }} pages
            </span>
          </div>
          <div v-if="book.averageRating" class="book-rating">
            <span class="stars">{{ formatRating(book.averageRating) }}</span>
            <span class="rating-text">{{ book.averageRating }}/5</span>
          </div>
        </div>
        
        <div class="book-actions">
          <button @click.stop="editBook(book)" class="action-btn edit">
            ✏️
          </button>
          <button @click.stop="deleteBook(book.id)" class="action-btn delete">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>No Books Yet</h3>
      <p>Start building your book collection by adding your first book!</p>
      <button @click="showAddModal = true" class="add-first-btn">
        Add Your First Book
      </button>
    </div>

    <!-- Add/Edit Book Modal -->
    <div v-if="showAddModal || editingBook" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingBook ? 'Edit Book' : 'Add New Book' }}</h2>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Search Section -->
          <div class="search-section">
            <h3>Search for Book</h3>
            <div class="search-input-group">
              <input
                v-model="searchQuery"
                @input="searchBooks"
                type="text"
                placeholder="Search for a book title..."
                class="search-input"
                :disabled="searching"
              />
              <button 
                @click="searchBooks" 
                class="search-btn"
                :disabled="searching || !searchQuery.trim()"
              >
                {{ searching ? '🔍' : '🔍' }}
              </button>
            </div>
            
            <!-- Search Results -->
            <div v-if="searchResults.length > 0" class="search-results">
              <h4>Search Results ({{ searchResults.length }})</h4>
              <div class="result-list">
                <div 
                  v-for="result in searchResults" 
                  :key="result.id"
                  class="result-item"
                  @click="selectBook(result)"
                >
                  <div class="result-cover">
                    <img 
                      v-if="result.thumbnail" 
                      :src="result.thumbnail" 
                      :alt="result.title"
                    />
                    <div v-else class="no-cover-small">📚</div>
                  </div>
                  <div class="result-info">
                    <h4>{{ result.title }}</h4>
                    <p>{{ result.author }}</p>
                    <p v-if="result.publishedDate" class="result-year">
                      {{ formatYear(result.publishedDate) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Manual Entry Section -->
          <div class="manual-entry-section">
            <h3>Or Enter Manually</h3>
            <form @submit.prevent="saveBook" class="book-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="title">Title *</label>
                  <input
                    id="title"
                    v-model="bookForm.title"
                    type="text"
                    required
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label for="author">Author *</label>
                  <input
                    id="author"
                    v-model="bookForm.author"
                    type="text"
                    required
                    class="form-input"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="publishedDate">Published Date</label>
                  <input
                    id="publishedDate"
                    v-model="bookForm.publishedDate"
                    type="text"
                    placeholder="2023"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label for="pageCount">Pages</label>
                  <input
                    id="pageCount"
                    v-model.number="bookForm.pageCount"
                    type="number"
                    class="form-input"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="isbn">ISBN</label>
                  <input
                    id="isbn"
                    v-model="bookForm.isbn"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label for="rating">Rating (1-5)</label>
                  <input
                    id="rating"
                    v-model.number="bookForm.rating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    class="form-input"
                  />
                </div>
              </div>
              
              <div class="form-group">
                <label for="description">Description</label>
                <textarea
                  id="description"
                  v-model="bookForm.description"
                  rows="3"
                  class="form-textarea"
                ></textarea>
              </div>
              
              <div class="form-actions">
                <button type="button" @click="closeModal" class="cancel-btn">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="save-btn"
                  :disabled="saving"
                >
                  {{ saving ? 'Saving...' : (editingBook ? 'Update Book' : 'Add Book') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { simpleGoogleBooksApi } from '@/services/simpleApi'
import { mediaApi } from '@/services/api'
import { useMediaStore } from '@/stores/media'

export default {
  name: 'BooksManagerNew',
  setup() {
    const mediaStore = useMediaStore()
    
    // State
    const books = ref([])
    const loading = ref(false)
    const error = ref('')
    const showAddModal = ref(false)
    const editingBook = ref(null)
    const saving = ref(false)
    
    // Search state
    const searchQuery = ref('')
    const searchResults = ref([])
    const searching = ref(false)
    
    // Form state
    const bookForm = reactive({
      title: '',
      author: '',
      publishedDate: '',
      pageCount: null,
      isbn: '',
      rating: null,
      description: '',
      thumbnail: ''
    })

    // Methods
    const loadBooks = async () => {
      loading.value = true
      error.value = ''
      
      try {
        const data = await mediaApi.getMedia()
        
        // Filter only books from the media data
        books.value = data.filter(item => 
          item.category === 'buecher' || 
          item.watchlistType === 'buecher' ||
          (item.category === 'watchlist' && item.watchlistType === 'buecher')
        )
      } catch (err) {
        error.value = err.message || 'Failed to load books'
      } finally {
        loading.value = false
      }
    }

    const searchBooks = async () => {
      if (!searchQuery.value.trim()) {
        searchResults.value = []
        return
      }

      searching.value = true
      
      try {
        const result = await simpleGoogleBooksApi.searchBooks(searchQuery.value, 10)
        
        if (result.success) {
          searchResults.value = result.data
        } else {
          console.warn('📚 [BooksManager] Search failed:', result.error)
          searchResults.value = []
        }
      } catch (err) {
        console.error('📚 [BooksManager] Search error:', err)
        searchResults.value = []
      } finally {
        searching.value = false
      }
    }

    const selectBook = (book) => {
      
      // Populate form with selected book data
      bookForm.title = book.title
      bookForm.author = book.author
      bookForm.publishedDate = book.publishedDate || ''
      bookForm.pageCount = book.pageCount || null
      bookForm.isbn = book.isbn || ''
      bookForm.rating = book.averageRating || null
      bookForm.description = book.description || ''
      bookForm.thumbnail = book.thumbnail || ''
      
      // Clear search
      searchQuery.value = ''
      searchResults.value = []
    }

    const saveBook = async () => {
      saving.value = true
      
      try {
        const bookData = {
          title: bookForm.title,
          author: bookForm.author,
          category: 'buecher',
          release: bookForm.publishedDate || new Date().toISOString().split('T')[0],
          rating: bookForm.rating || null,
          genre: 'Book',
          platforms: 'Book',
          description: bookForm.description,
          path: bookForm.thumbnail,
          isbn: bookForm.isbn,
          pageCount: bookForm.pageCount,
          watchlistType: 'buecher'
        }

        let response
        if (editingBook.value) {
          response = await mediaStore.updateMediaItem(editingBook.value.id, bookData)
        } else {
          response = await mediaStore.addMediaItem(bookData)
        }

        await loadBooks()
        closeModal()
      } catch (err) {
        // Handle duplicate error specifically
        if (err.response?.status === 409 && err.response?.data?.duplicate) {
          error.value = err.response.data.error || 'Ein Eintrag mit diesem Titel und dieser Kategorie existiert bereits.'
        } else if (err.isDuplicate) {
          error.value = err.message
        } else {
          error.value = err.message || 'Failed to save book'
        }
      } finally {
        saving.value = false
      }
    }

    const editBook = (book) => {
      editingBook.value = book
      
      // Populate form with book data
      bookForm.title = book.title || ''
      bookForm.author = book.author || ''
      bookForm.publishedDate = book.release || ''
      bookForm.pageCount = book.pageCount || null
      bookForm.isbn = book.isbn || ''
      bookForm.rating = book.rating || null
      bookForm.description = book.description || ''
      bookForm.thumbnail = book.path || ''
      
      showAddModal.value = true
    }

    const deleteBook = async (bookId) => {
      if (!confirm('Are you sure you want to delete this book?')) {
        return
      }

      loading.value = true
      
      try {
        const response = await mediaApi.deleteMedia(bookId)
        
        if (response.success) {
          await loadBooks()
        } else {
          throw new Error(response.error || 'Failed to delete book')
        }
      } catch (err) {
        console.error('📚 [BooksManager] Error deleting book:', err)
        error.value = err.message || 'Failed to delete book'
      } finally {
        loading.value = false
      }
    }

    const refreshBooks = () => {
      loadBooks()
    }

    const closeModal = () => {
      showAddModal.value = false
      editingBook.value = null
      searchQuery.value = ''
      searchResults.value = []
      
      // Reset form
      Object.keys(bookForm).forEach(key => {
        if (typeof bookForm[key] === 'string') {
          bookForm[key] = ''
        } else {
          bookForm[key] = null
        }
      })
    }

    const handleImageError = (event) => {
      event.target.style.display = 'none'
    }

    const formatYear = (dateString) => {
      if (!dateString) return ''
      const year = new Date(dateString).getFullYear()
      return isNaN(year) ? dateString : year.toString()
    }

    const formatRating = (rating) => {
      if (!rating) return ''
      const stars = Math.round(rating)
      return '★'.repeat(stars) + '☆'.repeat(5 - stars)
    }

    // Lifecycle
    onMounted(() => {
      loadBooks()
    })

    return {
      // State
      books,
      loading,
      error,
      showAddModal,
      editingBook,
      saving,
      searchQuery,
      searchResults,
      searching,
      bookForm,
      
      // Methods
      loadBooks,
      searchBooks,
      selectBook,
      saveBook,
      editBook,
      deleteBook,
      refreshBooks,
      closeModal,
      handleImageError,
      formatYear,
      formatRating
    }
  }
}
</script>

<style scoped>
.books-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.books-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #333;
}

.books-header h1 {
  color: #e0e0e0;
  margin: 0;
  font-size: 2.5rem;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.add-book-btn, .refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.add-book-btn:hover, .refresh-btn:hover {
  background: #d1e7f7;
  transform: translateY(-2px);
}

.add-book-btn:disabled, .refresh-btn:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 16px;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-top: 4px solid #e8f4fd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-state h3, .empty-state h3 {
  color: #e0e0e0;
  margin-bottom: 10px;
}

.error-state p, .empty-state p {
  color: #b0b0b0;
  margin-bottom: 20px;
}

.retry-btn, .add-first-btn {
  padding: 12px 24px;
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
  transition: all 0.3s ease-in-out;
}

/* Smooth animations for book cards */
.books-grid > * {
  animation: fadeInUp 0.4s ease-out;
  transition: all 0.3s ease-in-out;
}

/* Fade in animation for new book items */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth hover effects for book cards */
.books-grid > *:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* Responsive Design for 6 columns */
@media (max-width: 1200px) {
  .books-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }
}

@media (max-width: 900px) {
  .books-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
}

@media (max-width: 768px) {
  .books-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.book-card {
  background: transparent;
  border-radius: 12px;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  position: relative;
  aspect-ratio: 16/9;
  min-height: 120px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.book-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
}

/* Image fills entire card with text overlay */
.book-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
  overflow: hidden;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-cover, .no-cover-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #444;
  color: #888;
  font-size: 3rem;
}

.no-cover-small {
  font-size: 1.5rem;
  height: 60px;
}

.book-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.book-title {
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.3;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.book-author {
  color: #ffffff;
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.book-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 0.8rem;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.book-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.stars {
  color: #ffd700;
}

.rating-text {
  color: #b0b0b0;
}

.book-actions {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.book-card:hover .book-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn.edit {
  background: #e8f4fd;
  color: #1a1a1a;
}

.action-btn.delete {
  background: #ff4757;
  color: #1a1a1a;
}

.action-btn:hover {
  transform: scale(1.1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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
  padding: 20px;
}

.modal-content {
  background: #2a2a2a;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #444;
  animation: slideInUp 0.3s ease-out;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #444;
}

.modal-header h2 {
  color: #e0e0e0;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #e0e0e0;
}

.modal-body {
  padding: 20px;
}

.search-section, .manual-entry-section {
  margin-bottom: 30px;
}

.search-section h3, .manual-entry-section h3 {
  color: #e0e0e0;
  margin-bottom: 15px;
}

.search-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px;
  background: #333;
  border: 1px solid #555;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
  border-color: #e8f4fd;
}

.search-btn {
  padding: 12px 20px;
  background: #e8f4fd;
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.search-btn:disabled {
  background: #666;
  cursor: not-allowed;
}

.search-results h4 {
  color: #e0e0e0;
  margin-bottom: 15px;
}

.result-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #444;
  border-radius: 8px;
}

.result-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: background 0.2s;
}

.result-item:hover {
  background: #333;
}

.result-item:last-child {
  border-bottom: none;
}

.result-cover {
  width: 60px;
  height: 80px;
  background: #444;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-info h4 {
  color: #e0e0e0;
  margin: 0 0 5px 0;
  font-size: 1rem;
}

.result-info p {
  color: #b0b0b0;
  margin: 0 0 5px 0;
  font-size: 0.9rem;
}

.result-year {
  color: #888;
  font-size: 0.8rem;
}

.book-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: #e0e0e0;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input, .form-textarea {
  padding: 12px;
  background: #333;
  border: 1px solid #555;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 16px;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #e8f4fd;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-btn, .save-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
}

.cancel-btn {
  background: #666;
  color: #e0e0e0;
}

.save-btn {
  background: #e8f4fd;
  color: #1a1a1a;
}

.save-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

/* Responsive behavior for image overlay layout */
@media (max-width: 768px) {
  .book-info {
    padding: 12px;
  }
  
  .book-title {
    font-size: 1rem;
  }
  
  .book-author {
    font-size: 0.8rem;
  }
  
  .no-cover {
    font-size: 2rem;
  }
  
  .books-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .books-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .book-info {
    padding: 10px;
  }
  
  .book-title {
    font-size: 0.9rem;
  }
  
  .book-author {
    font-size: 0.7rem;
  }
  
  .book-meta {
    font-size: 0.7rem;
  }
  
  .no-cover {
    font-size: 1.5rem;
  }
}

@media (max-width: 360px) {
  .book-info {
    padding: 8px;
  }
  
  .book-title {
    font-size: 0.8rem;
  }
  
  .book-author {
    font-size: 0.6rem;
  }
  
  .book-meta {
    font-size: 0.6rem;
  }
  
  .no-cover {
    font-size: 1.2rem;
  }
}
</style>
