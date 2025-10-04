<template>
  <div class="books-page">
    <BooksManagerNew />
  </div>
</template>

<script>
import BooksManagerNew from '@/components/BooksManagerNew.vue'

export default {
  name: 'Books',
  components: {
    BooksManagerNew
  }
}
</script>

<style scoped>
.books-page {
  min-height: 100vh;
  background: #1a1a1a;
  color: #e0e0e0;
}
</style>



