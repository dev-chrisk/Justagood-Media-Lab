<template>
  <div class="modal" @click="closeModal">
    <div class="modal-content auth-modal" @click.stop>
      <h2>Change Password</h2>
      <form @submit.prevent="handleChangePassword">
        <div class="form-group">
          <label for="newPassword">New Password:</label>
          <input 
            type="password" 
            id="newPassword"
            v-model="form.password" 
            required
            :disabled="loading"
            placeholder="Enter new password (min. 8 characters)"
            minlength="8"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm Password:</label>
          <input 
            type="password" 
            id="confirmPassword"
            v-model="form.password_confirmation" 
            required
            :disabled="loading"
            placeholder="Confirm new password"
            minlength="8"
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="modal-buttons">
          <button type="submit" :disabled="loading">
            {{ loading ? 'Changing...' : 'Change Password' }}
          </button>
          <button type="button" @click="closeModal" :disabled="loading">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'ChangePasswordModal',
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    
    const form = reactive({
      password: '',
      password_confirmation: ''
    })
    
    const loading = ref(false)
    const error = ref('')
    
    const handleChangePassword = async () => {
      // Validate passwords match
      if (form.password !== form.password_confirmation) {
        error.value = 'Passwords do not match'
        return
      }

      // Validate minimum length
      if (form.password.length < 8) {
        error.value = 'Password must be at least 8 characters long'
        return
      }

      loading.value = true
      error.value = ''
      
      try {
        const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : window.location.origin)
        const token = authStore.token

        const response = await fetch(`${baseUrl}/api/change-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            password: form.password,
            password_confirmation: form.password_confirmation
          })
        })

        const data = await response.json()

        if (data.success) {
          emit('success', data)
        } else {
          if (data.errors) {
            error.value = Object.values(data.errors).flat().join(', ')
          } else {
            error.value = data.error || 'Failed to change password'
          }
        }
      } catch (err) {
        error.value = err.message || 'Failed to change password'
      } finally {
        loading.value = false
      }
    }
    
    const closeModal = () => {
      emit('close')
    }
    
    return {
      form,
      loading,
      error,
      handleChangePassword,
      closeModal
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
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #f39c12;
  box-shadow: 0 0 0 2px rgba(243, 156, 18, 0.2);
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
  background: #f39c12;
  color: #1a1a1a;
  font-weight: 600;
}

.modal-buttons button[type="submit"]:hover:not(:disabled) {
  background: #ffb84d;
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
</style>

