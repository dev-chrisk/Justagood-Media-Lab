<template>
  <div v-if="show" class="modal" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>📄 Import from TXT File</h2>
      <p>Wählen Sie eine .txt Datei mit einer Liste von Titeln aus, um zu prüfen, welche Items in der aktuellen Kategorie fehlen.</p>
      
      <div class="file-upload-area">
        <input 
          type="file" 
          id="txtFileInput"
          accept=".txt"
          @change="handleFileUpload"
          style="display: none"
        />
        <label for="txtFileInput" class="file-upload-label">
          <span class="upload-icon">📁</span>
          <span class="upload-text">TXT-Datei auswählen</span>
          <span class="upload-hint">Eine .txt Datei mit einer Liste von Titeln</span>
        </label>
      </div>
      
      <div class="modal-buttons">
        <button type="button" @click="$emit('close')">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TxtImportModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'fileProcessed'],
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      if (!file.name.toLowerCase().endsWith('.txt')) {
        alert('Bitte wählen Sie eine .txt Datei aus.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        this.$emit('fileProcessed', content)
      }
      reader.readAsText(file, 'UTF-8')
    }
  }
}
</script>

<style scoped>
/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-content h2 {
  margin: 0 0 15px 0;
  color: #e0e0e0;
  font-size: 20px;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #a0a0a0;
  line-height: 1.5;
}

/* TXT Import Modal Styles */
.file-upload-area {
  margin: 20px 0;
  text-align: center;
}

.file-upload-label {
  display: inline-block;
  padding: 40px 20px;
  border: 2px dashed #4a9eff;
  border-radius: 8px;
  background: #2d2d2d;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 300px;
}

.file-upload-label:hover {
  border-color: #3a8eef;
  background: #333333;
}

.upload-icon {
  display: block;
  font-size: 48px;
  margin-bottom: 10px;
}

.upload-text {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 5px;
}

.upload-hint {
  display: block;
  font-size: 12px;
  color: #a0a0a0;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.modal-buttons button {
  padding: 10px 20px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #3a3a3a;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.modal-buttons button:hover {
  background: #4a4a4a;
  border-color: #666;
}

@media (max-width: 768px) {
  .file-upload-label {
    min-width: 250px;
    padding: 30px 15px;
  }
  
  .upload-icon {
    font-size: 36px;
  }
  
  .modal-content {
    padding: 20px;
    width: 95%;
  }
}
</style>




