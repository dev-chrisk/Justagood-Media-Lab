import axios from 'axios'
import { API_CONFIG } from '@/config/api'

// Create axios instance for books API
const booksApi = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
booksApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Response interceptor
booksApi.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Books API functions
const booksApiFunctions = {
  // Get all books
  async getBooks() {
    try {
      const response = await booksApi.get('/books')
      return response.data
    } catch (error) {
      console.error('📚 Get books failed:', error)
      throw error
    }
  },

  // Add a new book
  async addBook(bookData) {
    try {
      // Clean up data
      const cleanData = {
        title: bookData.title,
        author: bookData.author || null,
        release: bookData.release || null,
        rating: bookData.rating ? parseInt(bookData.rating) : null,
        count: parseInt(bookData.count) || 1,
        genre: bookData.genre || null,
        link: bookData.link || null,
        path: null,
        discovered: null
      }
      
      // Remove null/empty values
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === null || cleanData[key] === '') {
          delete cleanData[key]
        }
      })
      
      const response = await booksApi.post('/books', cleanData)
      return response.data
    } catch (error) {
      console.error('📚 Add book failed:', error)
      throw error
    }
  },

  // Update a book
  async updateBook(bookId, bookData) {
    try {
      const response = await booksApi.put(`/books/${bookId}`, bookData)
      return response.data
    } catch (error) {
      console.error('Update book failed:', error)
      throw error
    }
  },

  // Delete a book
  async deleteBook(bookId) {
    try {
      const response = await booksApi.delete(`/books/${bookId}`)
      return response.data
    } catch (error) {
      console.error('Delete book failed:', error)
      throw error
    }
  }
}

export default booksApiFunctions
