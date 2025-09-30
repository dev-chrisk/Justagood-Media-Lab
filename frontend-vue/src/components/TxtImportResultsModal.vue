<template>
  <div v-if="show && results" class="modal" @click="$emit('close')">
    <div class="modal-content results-modal" @click.stop>
      <h2>📊 TXT Import Ergebnisse</h2>
      <div class="results-summary">
        <div class="summary-item">
          <span class="summary-label">Kategorie:</span>
          <span class="summary-value">{{ results.categoryName }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Titel in Datei:</span>
          <span class="summary-value">{{ results.totalInFile }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Bereits vorhanden:</span>
          <span class="summary-value existing">{{ results.existingItems.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Fehlende Titel:</span>
          <span class="summary-value missing">{{ results.missingItems.length }}</span>
        </div>
      </div>

      <div v-if="results.missingItems.length > 0" class="missing-items">
        <h3>❌ Fehlende Titel ({{ results.missingItems.length }}):</h3>
        <div class="items-list">
          <div 
            v-for="(item, index) in results.missingItems" 
            :key="index"
            class="missing-item"
          >
            {{ item }}
          </div>
        </div>
      </div>

      <div v-if="results.existingItems.length > 0" class="existing-items">
        <h3>✅ Bereits vorhanden ({{ results.existingItems.length }}):</h3>
        <div class="items-list">
          <div 
            v-for="(item, index) in results.existingItems" 
            :key="index"
            class="existing-item"
          >
            {{ item }}
          </div>
        </div>
      </div>

      <div class="modal-buttons">
        <button type="button" @click="$emit('close')">
          Schließen
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TxtImportResultsModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    results: {
      type: Object,
      default: null
    }
  },
  emits: ['close']
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

.results-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin: 0 0 15px 0;
  color: #e0e0e0;
  font-size: 20px;
}

/* Results Modal Styles */
.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
  padding: 20px;
  background: #3a3a3a;
  border-radius: 8px;
  border: 1px solid #555;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-label {
  font-size: 12px;
  color: #a0a0a0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
}

.summary-value.existing {
  color: #27ae60;
}

.summary-value.missing {
  color: #e74c3c;
}

.missing-items,
.existing-items {
  margin: 20px 0;
}

.missing-items h3,
.existing-items h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #e0e0e0;
}

.items-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #555;
  border-radius: 4px;
  background: #2d2d2d;
}

.missing-item,
.existing-item {
  padding: 8px 12px;
  border-bottom: 1px solid #404040;
  font-size: 14px;
  color: #e0e0e0;
}

.missing-item:last-child,
.existing-item:last-child {
  border-bottom: none;
}

.missing-item {
  background: rgba(231, 76, 60, 0.1);
  border-left: 3px solid #e74c3c;
}

.existing-item {
  background: rgba(39, 174, 96, 0.1);
  border-left: 3px solid #27ae60;
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
  .results-summary {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .modal-content {
    padding: 20px;
    width: 95%;
  }
}
</style>




