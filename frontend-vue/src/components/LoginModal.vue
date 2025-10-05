<template>
  <div class="modal" @click="closeModal">
    <div class="modal-content auth-modal" @click.stop>
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            type="email" 
            id="email"
            v-model="form.email" 
            required
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password:</label>
          <input 
            type="password" 
            id="password"
            v-model="form.password" 
            required
            :disabled="loading"
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="modal-buttons">
          <button type="submit" :disabled="loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
          <button type="button" @click="closeModal" :disabled="loading">
            Cancel
          </button>
        </div>
        
        <!-- Debug buttons removed for production -->
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'LoginModal',
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    
    const form = reactive({
      email: '',
      password: ''
    })
    
    const loading = ref(false)
    const error = ref('')
    
    const handleLogin = async () => {
      loading.value = true
      error.value = ''
      
      try {
        const result = await authStore.login(form.email, form.password)
        
        if (result.success) {
          emit('success', result)
        } else {
          error.value = result.error
        }
      } catch (err) {
        error.value = err.message || 'Login failed'
      } finally {
        loading.value = false
      }
    }
    
    const closeModal = () => {
      emit('close')
    }
    
    const checkLocalDB = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/check-db')
        const data = await response.json()
        alert(`Local DB: ${data.success ? '✅ Connected' : '❌ Error'}\nUsers: ${data.user_count}\nError: ${data.error || 'None'}`)
      } catch (err) {
        alert(`Local DB Check Failed: ${err.message}`)
      }
    }
    
    const checkProdDB = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://teabubble.attrebi.ch')
        const response = await fetch(`${baseUrl}/api/check-db`)
        const data = await response.json()
        alert(`Prod DB: ${data.success ? '✅ Connected' : '❌ Error'}\nUsers: ${data.user_count}\nError: ${data.error || 'None'}`)
      } catch (err) {
        alert(`Prod DB Check Failed: ${err.message}`)
      }
    }
    
    const deleteAllUsers = async () => {
      if (!confirm('⚠️ WARNING: This will delete ALL users! Are you sure?')) {
        return
      }
      
      try {
        const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://teabubble.attrebi.ch')
        const response = await fetch(`${baseUrl}/api/delete-all-users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        const data = await response.json()
        alert(`Delete Result: ${data.success ? '✅ Success' : '❌ Error'}\nDeleted: ${data.deleted_count} users\nError: ${data.error || 'None'}`)
      } catch (err) {
        alert(`Delete Failed: ${err.message}`)
      }
    }
    
    return {
      form,
      loading,
      error,
      handleLogin,
      closeModal,
      checkLocalDB,
      checkProdDB,
      deleteAllUsers
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
}

.modal-content {
  background: #2d2d2d;
  padding: 24px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid #404040;
}

.auth-modal h2 {
  margin: 0 0 20px 0;
  text-align: center;
  color: #e0e0e0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #d0d0d0;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
  background: #3a3a3a;
  color: #e0e0e0;
}

.form-group input:focus {
  outline: none;
  border-color: #4a9eff;
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
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
}

.modal-buttons button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.modal-buttons button[type="submit"] {
  background: #4a9eff;
  color: white;
}

.modal-buttons button[type="submit"]:hover:not(:disabled) {
  background: #3a8eef;
}

.modal-buttons button[type="button"] {
  background: #3a3a3a;
  color: #d0d0d0;
  border: 1px solid #555;
}

.modal-buttons button[type="button"]:hover:not(:disabled) {
  background: #4a4a4a;
}

.modal-buttons button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.debug-buttons {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #555;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.debug-btn {
  padding: 6px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #3a3a3a;
  color: #d0d0d0;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.debug-btn:hover:not(:disabled) {
  background: #4a4a4a;
}

.debug-btn.danger {
  background: #4a2a2a;
  border-color: #e74c3c;
  color: #ff6b6b;
}

.debug-btn.danger:hover:not(:disabled) {
  background: #5a3a3a;
}

.debug-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

