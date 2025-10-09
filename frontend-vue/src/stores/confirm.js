import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfirmStore = defineStore('confirm', () => {
  // State
  const show = ref(false)
  const title = ref('Confirm Action')
  const message = ref('')
  const resolve = ref(null)

  // Actions
  function showConfirm(confirmData) {
    return new Promise((res) => {
      title.value = confirmData.title || 'Confirm Action'
      message.value = confirmData.message || ''
      show.value = true
      resolve.value = res
    })
  }

  function confirm() {
    if (resolve.value) {
      resolve.value(true)
      resolve.value = null
    }
    show.value = false
  }

  function cancel() {
    if (resolve.value) {
      resolve.value(false)
      resolve.value = null
    }
    show.value = false
  }

  return {
    // State
    show,
    title,
    message,
    
    // Actions
    showConfirm,
    confirm,
    cancel
  }
})


































