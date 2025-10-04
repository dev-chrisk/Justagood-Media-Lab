<template>
  <div class="books-manager">
    <div class="books-header">
      <h2>📚 Books Manager</h2>
      <button @click="showAddForm = true" class="add-book-btn">
        + Add Book
      </button>
    </div>

    <!-- Add Book Form -->
    <div v-if="showAddForm" class="add-book-form">
      <h3>Add New Book</h3>
      <form @submit.prevent="addBook">
        <div class="form-group">
          <label>Title *</label>
          <input v-model="newBook.title" type="text" required />
        </div>
        
        <div class="form-group">
          <label>Author</label>
          <input v-model="newBook.author" type="text" />
        </div>
        
        <div class="form-group">
          <label>Release Year</label>
          <input v-model="newBook.release" type="number" min="1900" max="2030" />
        </div>
        
        <div class="form-group">
          <label>Rating (0-10)</label>
          <input v-model="newBook.rating" type="number" min="0" max="10" />
        </div>
        
        <div class="form-group">
          <label>Count</label>
          <input v-model="newBook.count" type="number" min="0" value="1" />
        </div>
        
        <div class="form-group">
          <label>Genre</label>
          <input v-model="newBook.genre" type="text" />
        </div>
        
        <div class="form-group">
          <label>Link</label>
          <input v-model="newBook.link" type="url" />
        </div>
        
        <div class="form-actions">
          <button type="submit" :disabled="loading">
            {{ loading ? 'Adding...' : 'Add Book' }}
          </button>
          <button type="button" @click="cancelAdd">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Books List -->
    <div class="books-list">
      <div v-if="loading" class="loading">
        Loading books...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
        <button @click="loadBooks">Retry</button>
      </div>
      
      <div v-else-if="books.length === 0" class="no-books">
        No books found. Add your first book!
      </div>
      
      <div v-else class="books-grid">
        <div v-for="book in books" :key="book.id" class="book-card">
          <h4>{{ book.title }}</h4>
          <p v-if="book.author"><strong>Author:</strong> {{ book.author }}</p>
          <p v-if="book.release"><strong>Year:</strong> {{ formatYear(book.release) }}</p>
          <p v-if="book.rating"><strong>Rating:</strong> {{ book.rating }}/10</p>
          <p v-if="book.genre"><strong>Genre:</strong> {{ book.genre }}</p>
          <p><strong>Count:</strong> {{ book.count }}</p>
          
          <div class="book-actions">
            <button @click="editBook(book)" class="edit-btn">Edit</button>
            <button @click="deleteBook(book.id)" class="delete-btn">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Debug Info -->
    <div v-if="debugMode" class="debug-info">
      <h4>🐛 Debug Info</h4>
      <pre>{{ JSON.stringify({ books: books.length, loading, error, showAddForm }, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import booksApi from '@/services/booksApi'

export default {
  name: 'BooksManager',
  setup() {
    const books = ref([])
    const loading = ref(false)
    const error = ref('')
    const showAddForm = ref(false)
    const debugMode = ref(true) // Enable debug mode
    
    const newBook = ref({
      title: '',
      author: '',
      release: '',
      rating: '',
      count: 1,
      genre: '',
      link: ''
    })

    // Load books
    const loadBooks = async () => {
      loading.value = true
      error.value = ''
      
      try {
        const response = await booksApi.getBooks()
        
        if (response.success) {
          books.value = response.data
        } else {
          error.value = response.error || 'Failed to load books'
        }
      } catch (err) {
        error.value = err.message || 'Failed to load books'
      } finally {
        loading.value = false
      }
    }

    // Add book
    const addBook = async () => {
      loading.value = true
      error.value = ''
      
      try {
        const response = await booksApi.addBook(newBook.value)
        
        if (response.success) {
          books.value.unshift(response.data)
          resetForm()
          showAddForm.value = false
        } else {
          error.value = response.error || 'Failed to add book'
        }
      } catch (err) {
        error.value = err.message || 'Failed to add book'
      } finally {
        loading.value = false
      }
    }

    // Edit book
    const editBook = (book) => {
      // TODO: Implement edit functionality
      alert('Edit functionality coming soon!')
    }

    // Delete book
    const deleteBook = async (bookId) => {
      
      if (!confirm('Are you sure you want to delete this book?')) {
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        const response = await booksApi.deleteBook(bookId)
        console.log('📚 Book deleted:', response)
        
        if (response.success) {
          books.value = books.value.filter(book => book.id !== bookId)
        } else {
          error.value = response.error || 'Failed to delete book'
        }
      } catch (err) {
        console.error('📚 Error deleting book:', err)
        error.value = err.message || 'Failed to delete book'
      } finally {
        loading.value = false
      }
    }

    // Reset form
    const resetForm = () => {
      newBook.value = {
        title: '',
        author: '',
        release: '',
        rating: '',
        count: 1,
        genre: '',
        link: ''
      }
    }

    // Cancel add
    const cancelAdd = () => {
      resetForm()
      showAddForm.value = false
    }

    // Format year
    const formatYear = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.getFullYear()
    }

    // Load books on mount
    onMounted(() => {
      console.log('📚 BooksManager mounted, loading books...')
      loadBooks()
    })

    return {
      books,
      loading,
      error,
      showAddForm,
      newBook,
      debugMode,
      loadBooks,
      addBook,
      editBook,
      deleteBook,
      cancelAdd,
      formatYear
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
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
}

.add-book-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.add-book-btn:hover {
  background: #0056b3;
}

.add-book-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.add-book-form h3 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.form-actions button[type="submit"] {
  background: #28a745;
  color: white;
}

.form-actions button[type="submit"]:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.form-actions button[type="button"] {
  background: #6c757d;
  color: white;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.book-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.book-card h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 18px;
}

.book-card p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.book-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.edit-btn {
  background: #ffc107;
  color: #212529;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.loading, .error, .no-books {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #dc3545;
}

.debug-info {
  margin-top: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 5px;
  border-left: 4px solid #007bff;
}

.debug-info pre {
  background: #e9ecef;
  padding: 10px;
  border-radius: 3px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
