<template>
  <div v-if="show" class="confirm-overlay" @click="closeDialog">
    <div class="confirm-dialog" @click.stop>
      <div class="confirm-header">
        <h3 class="confirm-title">{{ title }}</h3>
        <button class="close-btn" @click="closeDialog">✕</button>
      </div>
      <div class="confirm-body">
        <p>{{ message }}</p>
      </div>
      <div class="confirm-footer">
        <button class="btn btn-secondary" @click="closeDialog">Cancel</button>
        <button class="btn btn-danger" @click="confirmAction">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Confirm Action'
    },
    message: {
      type: String,
      required: true
    }
  },
  emits: ['confirm', 'close'],
  setup(props, { emit }) {
    const closeDialog = () => {
      emit('close')
    }

    const confirmAction = () => {
      emit('confirm')
      closeDialog()
    }

    return {
      closeDialog,
      confirmAction
    }
  }
}
</script>

<style scoped>
.confirm-overlay {
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

.confirm-dialog {
  background: #2d2d2d;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border-left: 4px solid #f44336;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  border-bottom: 1px solid #404040;
  margin-bottom: 20px;
}

.confirm-title {
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

.confirm-body {
  padding: 0 24px;
}

.confirm-body p {
  margin: 0 0 16px 0;
  color: #e0e0e0;
  line-height: 1.5;
}

.confirm-footer {
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

.btn-danger {
  background: #f44336;
  color: #ffffff;
}

.btn-danger:hover {
  background: #d32f2f;
}

@media (max-width: 768px) {
  .confirm-dialog {
    margin: 10px;
    max-width: calc(100% - 20px);
  }
  
  .confirm-header,
  .confirm-body,
  .confirm-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>




































