import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInputStore = defineStore('input', () => {
  // State
  const show = ref(false)
  const title = ref('Input Required')
  const message = ref('')
  const placeholder = ref('')
  const inputType = ref('text')
  const defaultValue = ref('')
  const resolve = ref(null)

  // Actions
  function showInput(inputData) {
    return new Promise((res) => {
      title.value = inputData.title || 'Input Required'
      message.value = inputData.message || ''
      placeholder.value = inputData.placeholder || ''
      inputType.value = inputData.inputType || 'text'
      defaultValue.value = inputData.defaultValue || ''
      show.value = true
      resolve.value = res
    })
  }

  function confirm(value) {
    if (resolve.value) {
      resolve.value(value)
      resolve.value = null
    }
    show.value = false
  }

  function cancel() {
    if (resolve.value) {
      resolve.value(null)
      resolve.value = null
    }
    show.value = false
  }

  return {
    // State
    show,
    title,
    message,
    placeholder,
    inputType,
    defaultValue,
    
    // Actions
    showInput,
    confirm,
    cancel
  }
})















