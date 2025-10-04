<template>
  <div v-if="show" class="message-overlay" @click="closeMessage">
    <div class="message-box" :class="messageType" @click.stop>
      <div class="message-header">
        <span class="message-icon">{{ icon }}</span>
        <h3 class="message-title">{{ title }}</h3>
        <button class="close-btn" @click="closeMessage">✕</button>
      </div>
      <div class="message-body">
        <p>{{ message }}</p>
        <div v-if="details" class="message-details">
          <pre>{{ details }}</pre>
        </div>
      </div>
      <div class="message-footer">
        <button class="btn btn-primary" @click="closeMessage">OK</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'MessageBox',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'info', // success, error, warning, info
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      required: true
    },
    details: {
      type: String,
      default: ''
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const closeMessage = () => {
      emit('close')
    }

    const icon = computed(() => {
      switch (props.type) {
        case 'success': return '✅'
        case 'error': return '❌'
        case 'warning': return '⚠️'
        case 'info': return 'ℹ️'
        default: return 'ℹ️'
      }
    })

    const messageType = computed(() => {
      return `message-${props.type}`
    })

    return {
      closeMessage,
      icon,
      messageType
    }
  }
}
</script>

<style scoped>
.message-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.message-box {
  background: #2d2d2d;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border-left: 4px solid #1a73e8;
}

.message-success {
  border-left-color: #4CAF50;
}

.message-error {
  border-left-color: #f44336;
}

.message-warning {
  border-left-color: #FF9800;
}

.message-info {
  border-left-color: #1a73e8;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 0;
  border-bottom: 1px solid #404040;
  margin-bottom: 20px;
}

.message-icon {
  font-size: 1.5rem;
}

.message-title {
  margin: 0;
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 600;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  color: #cccccc;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #404040;
  color: #ffffff;
}

.message-body {
  padding: 0 24px;
}

.message-body p {
  margin: 0 0 16px 0;
  color: #e0e0e0;
  line-height: 1.5;
}

.message-details {
  background: #1a1a1a;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
}

.message-details pre {
  margin: 0;
  color: #999;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #404040;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.btn-primary {
  background: #1a73e8;
  color: #ffffff;
}

.btn-primary:hover {
  background: #1557b0;
}

@media (max-width: 768px) {
  .message-box {
    margin: 10px;
    max-width: calc(100% - 20px);
  }
  
  .message-header,
  .message-body,
  .message-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>




















