<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <h2>Oops! Something went wrong</h2>
      <p>{{ errorMessage }}</p>
      <div class="error-actions">
        <button @click="retry" class="retry-btn">Try Again</button>
        <button @click="goHome" class="home-btn">Go Home</button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ErrorBoundary',
  setup() {
    const hasError = ref(false)
    const errorMessage = ref('')
    const router = useRouter()

    onErrorCaptured((error, instance, info) => {
      hasError.value = true
      errorMessage.value = error.message || 'An unexpected error occurred'
      console.error('Error caught by boundary:', error, info)
      return false
    })

    const retry = () => {
      hasError.value = false
      errorMessage.value = ''
      // Force re-render by reloading the page
      window.location.reload()
    }

    const goHome = () => {
      hasError.value = false
      errorMessage.value = ''
      router.push('/')
    }

    return {
      hasError,
      errorMessage,
      retry,
      goHome
    }
  }
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #1a1a1a;
  color: #e0e0e0;
}

.error-content {
  text-align: center;
  padding: 2rem;
  background: #2d2d2d;
  border-radius: 8px;
  border: 1px solid #404040;
  max-width: 500px;
}

.error-content h2 {
  color: #ff6b6b;
  margin-bottom: 1rem;
}

.error-content p {
  margin-bottom: 2rem;
  color: #d0d0d0;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.retry-btn, .home-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.retry-btn {
  background: #e8f4fd;
  color: #1a1a1a;
}

.retry-btn:hover {
  background: #d1e7f7;
}

.home-btn {
  background: #6c757d;
  color: #1a1a1a;
}

.home-btn:hover {
  background: #5a6268;
}
</style>
