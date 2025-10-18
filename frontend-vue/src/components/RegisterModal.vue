<template>
  <div class="modal" @click="closeModal">
    <div class="modal-content auth-modal" @click.stop>
      <h2>Register</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Name:</label>
          <input 
            type="text" 
            id="name"
            v-model="form.name" 
            required
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="username">Username:</label>
          <input 
            type="text" 
            id="username"
            v-model="form.username" 
            required
            :disabled="loading"
          />
        </div>
        
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
            minlength="8"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="passwordConfirm">Confirm Password:</label>
          <input 
            type="password" 
            id="passwordConfirm"
            v-model="form.passwordConfirm" 
            required
            minlength="8"
            :disabled="loading"
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="modal-buttons">
          <button type="submit" :disabled="loading || !isFormValid">
            {{ loading ? 'Registering...' : 'Register' }}
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
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'RegisterModal',
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    
    const form = reactive({
      name: '',
      username: '',
      email: '',
      password: '',
      passwordConfirm: ''
    })
    
    const loading = ref(false)
    const error = ref('')
    
    const isFormValid = computed(() => {
      return form.name && 
             form.username &&
             form.email && 
             form.password && 
             form.passwordConfirm && 
             form.password === form.passwordConfirm &&
             form.password.length >= 8
    })
    
    const handleRegister = async () => {
      if (!isFormValid.value) {
        error.value = 'Please fill in all fields and ensure passwords match'
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        const result = await authStore.register(
          form.name, 
          form.username,
          form.email, 
          form.password, 
          form.passwordConfirm
        )
        
        if (result.success) {
          emit('success')
        } else {
          error.value = result.error
        }
      } catch (err) {
        error.value = err.message || 'Registration failed'
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
      isFormValid,
      handleRegister,
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
}

.form-group input:focus {
  outline: none;
  border-color: #e8f4fd;
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
  background: #27ae60;
  color: #1a1a1a;
}

.modal-buttons button[type="submit"]:hover:not(:disabled) {
  background: #229954;
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

