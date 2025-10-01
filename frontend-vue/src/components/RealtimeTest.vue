<template>
  <div class="realtime-test">
    <h3>Real-time Sync Test</h3>
    <div class="status">
      <span :class="['status-indicator', isConnected ? 'connected' : 'disconnected']"></span>
      {{ isConnected ? 'Connected' : 'Disconnected' }}
    </div>
    <div class="last-update">
      Last update: {{ lastUpdate || 'Never' }}
    </div>
    <div class="update-count">
      Updates received: {{ updateCount }}
    </div>
    <div class="test-actions">
      <button @click="addTestItem" :disabled="!isLoggedIn">Add Test Item</button>
      <button @click="clearTestItems" :disabled="!isLoggedIn">Clear Test Items</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import realtimeService from '@/services/realtime'

export default {
  name: 'RealtimeTest',
  setup() {
    const authStore = useAuthStore()
    const mediaStore = useMediaStore()
    
    const lastUpdate = ref(null)
    const updateCount = ref(0)
    const isConnected = ref(false)
    
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    
    const handleRealtimeUpdate = (data) => {
      console.log('Test component received update:', data)
      lastUpdate.value = new Date().toLocaleTimeString()
      updateCount.value++
    }
    
    const addTestItem = async () => {
      try {
        await mediaStore.addMediaItem({
          title: `Test Item ${Date.now()}`,
          category: 'game',
          release: new Date().toISOString().split('T')[0],
          rating: 8,
          platforms: 'PC',
          genre: 'Test',
          count: 1,
          is_airing: false,
          spielzeit: 0
        })
      } catch (error) {
        console.error('Error adding test item:', error)
      }
    }
    
    const clearTestItems = async () => {
      try {
        const testItems = mediaStore.mediaData.filter(item => 
          item.title.startsWith('Test Item')
        )
        const ids = testItems.map(item => item.id)
        if (ids.length > 0) {
          await mediaStore.batchDeleteMediaItems(ids)
        }
      } catch (error) {
        console.error('Error clearing test items:', error)
      }
    }
    
    let statusInterval = null
    
    onMounted(() => {
      // Add listener for real-time updates
      realtimeService.addListener('test-component', handleRealtimeUpdate)
      
      // Check connection status periodically
      const updateStatus = () => {
        isConnected.value = realtimeService.isConnected.value
      }
      
      updateStatus()
      statusInterval = setInterval(updateStatus, 1000)
    })
    
    onUnmounted(() => {
      realtimeService.removeListener('test-component')
      if (statusInterval) {
        clearInterval(statusInterval)
      }
    })
    
    return {
      isLoggedIn,
      lastUpdate,
      updateCount,
      isConnected,
      addTestItem,
      clearTestItems
    }
  }
}
</script>

<style scoped>
.realtime-test {
  padding: 20px;
  border: 1px solid #333;
  border-radius: 8px;
  margin: 20px 0;
  background: #2a2a2a;
}

.status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #666;
}

.status-indicator.connected {
  background: #4CAF50;
}

.status-indicator.disconnected {
  background: #f44336;
}

.last-update,
.update-count {
  margin: 5px 0;
  color: #ccc;
}

.test-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.test-actions button {
  padding: 8px 16px;
  background: #4a9eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-actions button:disabled {
  background: #666;
  cursor: not-allowed;
}

.test-actions button:hover:not(:disabled) {
  background: #3a8eef;
}
</style>


