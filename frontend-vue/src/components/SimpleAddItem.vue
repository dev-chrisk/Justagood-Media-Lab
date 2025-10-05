<template>
  <div class="simple-add-item">
    <h3>Simple Add Item Test</h3>
    <form @submit.prevent="addItem">
      <div>
        <label>Title:</label>
        <input v-model="form.title" type="text" required />
      </div>
      <div>
        <label>Category:</label>
        <select v-model="form.category">
          <option value="game">Game</option>
          <option value="movie">Movie</option>
          <option value="series">Series</option>
        </select>
      </div>
      <div>
        <label>Release:</label>
        <input v-model="form.release" type="date" />
      </div>
      <div>
        <label>Count:</label>
        <input v-model="form.count" type="number" min="0" />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Adding...' : 'Add Item' }}
      </button>
    </form>
    
    <div v-if="result" class="result" :class="result.success ? 'success' : 'error'">
      {{ result.message }}
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'SimpleAddItem',
  setup() {
    const loading = ref(false)
    const result = ref(null)
    
    const form = reactive({
      title: 'Test Game',
      category: 'game',
      release: '2003-01-01',
      count: 1
    })
    
    const addItem = async () => {
      loading.value = true
      result.value = null
      
      try {
        // First login
        const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://teabubble.attrebi.ch')
        const loginResponse = await fetch(`${baseUrl}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'admin@example.com',
            password: 'admin123'
          })
        })
        
        if (!loginResponse.ok) {
          throw new Error('Login failed')
        }
        
        const loginData = await loginResponse.json()
        const token = loginData.token
        
        // Add item
        const addResponse = await fetch(`${baseUrl}/api/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(form)
        })
        
        const addData = await addResponse.json()
        
        if (addData.success) {
          result.value = {
            success: true,
            message: `Success! Item added with ID: ${addData.data.id}`
          }
        } else {
          result.value = {
            success: false,
            message: `Error: ${JSON.stringify(addData)}`
          }
        }
      } catch (error) {
        result.value = {
          success: false,
          message: `Error: ${error.message}`
        }
      } finally {
        loading.value = false
      }
    }
    
    return {
      form,
      loading,
      result,
      addItem
    }
  }
}
</script>

<style scoped>
.simple-add-item {
  padding: 20px;
  border: 1px solid #ccc;
  margin: 20px;
  border-radius: 5px;
}

.simple-add-item form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.simple-add-item form div {
  display: flex;
  flex-direction: column;
}

.simple-add-item label {
  font-weight: bold;
  margin-bottom: 5px;
}

.simple-add-item input,
.simple-add-item select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.simple-add-item button {
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.simple-add-item button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 10px;
  padding: 10px;
  border-radius: 3px;
}

.result.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
