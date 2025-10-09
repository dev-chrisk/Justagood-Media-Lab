<template>
  <div v-if="show" class="input-overlay" @click="closeDialog">
    <div class="input-dialog" @click.stop>
      <div class="input-header">
        <h3 class="input-title">{{ title }}</h3>
        <button class="close-btn" @click="closeDialog">✕</button>
      </div>
      <div class="input-body">
        <p class="input-message">{{ message }}</p>
        <input 
          v-model="inputValue" 
          :type="inputType"
          :placeholder="placeholder"
          class="input-field"
          @keyup.enter="confirmAction"
          ref="inputRef"
        />
      </div>
      <div class="input-footer">
        <button class="btn btn-secondary" @click="closeDialog">Cancel</button>
        <button class="btn btn-primary" @click="confirmAction">OK</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, watch } from 'vue'

export default {
  name: 'InputDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Input Required'
    },
    message: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      default: ''
    },
    inputType: {
      type: String,
      default: 'text'
    },
    defaultValue: {
      type: String,
      default: ''
    }
  },
  emits: ['confirm', 'close'],
  setup(props, { emit }) {
    const inputValue = ref('')
    const inputRef = ref(null)

    const closeDialog = () => {
      emit('close')
    }

    const confirmAction = () => {
      emit('confirm', inputValue.value)
      closeDialog()
    }

    // Focus input when dialog opens
    watch(() => props.show, async (newVal) => {
      if (newVal) {
        inputValue.value = props.defaultValue
        await nextTick()
        if (inputRef.value) {
          inputRef.value.focus()
          inputRef.value.select()
        }
      }
    })

    return {
      inputValue,
      inputRef,
      closeDialog,
      confirmAction
    }
  }
}
</script>

<style scoped>
.input-overlay {
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

.input-dialog {
  background: #2d2d2d;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border-left: 4px solid #1a73e8;
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  border-bottom: 1px solid #404040;
  margin-bottom: 20px;
}

.input-title {
  margin: 0;
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 600;
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

.input-body {
  padding: 0 24px;
}

.input-message {
  margin: 0 0 16px 0;
  color: #e0e0e0;
  line-height: 1.5;
}

.input-field {
  width: 100%;
  padding: 12px;
  background: #1a1a1a;
  border: 1px solid #404040;
  border-radius: 6px;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.input-field:focus {
  border-color: #1a73e8;
}

.input-field::placeholder {
  color: #999;
}

.input-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

.btn-secondary {
  background: #404040;
  color: #ffffff;
}

.btn-secondary:hover {
  background: #555555;
}

.btn-primary {
  background: #1a73e8;
  color: #ffffff;
}

.btn-primary:hover {
  background: #1557b0;
}

@media (max-width: 768px) {
  .input-dialog {
    margin: 10px;
    max-width: calc(100% - 20px);
  }
  
  .input-header,
  .input-body,
  .input-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>


































