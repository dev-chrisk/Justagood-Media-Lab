import axios from 'axios'

// Create axios instance for books API
const booksApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for debugging
booksApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  
  console.log('📚 Books API Request:', {
    url: config.url,
    method: config.method,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    data: config.data,
    token: token ? `${token.substring(0, 20)}...` : 'none'
  })
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Response interceptor for debugging
booksApi.interceptors.response.use(
  (response) => {
    console.log('📚 Books API Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    return response
  },
  (error) => {
    console.log('📚 Books API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
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
      console.log('📚 Adding book with data:', bookData)
      
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
      
      console.log('📚 Cleaned book data:', cleanData)
      
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
      console.log('📚 Updating book:', bookId, bookData)
      
      const response = await booksApi.put(`/books/${bookId}`, bookData)
      return response.data
    } catch (error) {
      console.error('📚 Update book failed:', error)
      throw error
    }
  },

  // Delete a book
  async deleteBook(bookId) {
    try {
      console.log('📚 Deleting book:', bookId)
      
      const response = await booksApi.delete(`/books/${bookId}`)
      return response.data
    } catch (error) {
      console.error('📚 Delete book failed:', error)
      throw error
    }
  }
}

export default booksApiFunctions
