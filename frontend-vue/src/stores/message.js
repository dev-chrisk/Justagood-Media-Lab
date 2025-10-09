import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMessageStore = defineStore('message', () => {
  // State
  const show = ref(false)
  const type = ref('info')
  const title = ref('')
  const message = ref('')
  const details = ref('')

  // Actions
  function showMessage(messageData) {
    type.value = messageData.type || 'info'
    title.value = messageData.title || ''
    message.value = messageData.message || ''
    details.value = messageData.details || ''
    show.value = true
  }

  function showSuccess(message, title = 'Success', details = '') {
    showMessage({ type: 'success', title, message, details })
  }

  function showError(message, title = 'Error', details = '') {
    showMessage({ type: 'error', title, message, details })
  }

  function showWarning(message, title = 'Warning', details = '') {
    showMessage({ type: 'warning', title, message, details })
  }

  function showInfo(message, title = 'Info', details = '') {
    showMessage({ type: 'info', title, message, details })
  }

  function closeMessage() {
    show.value = false
    // Clear data after animation
    setTimeout(() => {
      type.value = 'info'
      title.value = ''
      message.value = ''
      details.value = ''
    }, 300)
  }

  return {
    // State
    show,
    type,
    title,
    message,
    details,
    
    // Actions
    showMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeMessage
  }
})


































