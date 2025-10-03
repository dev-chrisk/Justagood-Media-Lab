<template>
  <div class="books-page">
    <div class="page-header">
      <h1>📚 Books Library</h1>
      <p>Manage your book collection</p>
    </div>
    
    <BooksManager />
  </div>
</template>

<script>
import BooksManager from '@/components/BooksManager.vue'

export default {
  name: 'Books',
  components: {
    BooksManager
  }
}
</script>

<style scoped>
.books-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  background: white;
  padding: 30px 20px;
  text-align: center;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 2.5rem;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}
</style>
