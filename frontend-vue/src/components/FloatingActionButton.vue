<template>
  <div class="floating-actions">
    <div class="floating-menu" :class="{ show: showMenu }">
      <button class="floating-menu-item" @click="$emit('addNewItem')">
        <span class="menu-icon">➕</span>
        <span class="menu-text">Add Item</span>
      </button>
      <button class="floating-menu-item" @click="$emit('bulkAddItems')">
        <span class="menu-icon">📦</span>
        <span class="menu-text">Bulk Add</span>
      </button>
      <button class="floating-menu-item" @click="$emit('importFromTxt')">
        <span class="menu-icon">📄</span>
        <span class="menu-text">Import from TXT</span>
      </button>
      <button class="floating-menu-item" @click="$emit('importFromAPI')">
        <span class="menu-icon">🌐</span>
        <span class="menu-text">Import from API</span>
      </button>
      <button class="floating-menu-item" @click="$emit('createCollection')">
        <span class="menu-icon">📚</span>
        <span class="menu-text">Create Collection</span>
      </button>
      <button 
        v-if="showDeleteAll && itemCount > 0"
        class="floating-menu-item delete-all-item" 
        @click="$emit('deleteAllInCategory')"
      >
        <span class="menu-icon">🗑️</span>
        <span class="menu-text">Delete All {{ categoryName }}</span>
        <span class="item-count-badge">({{ itemCount }})</span>
      </button>
    </div>
    <button class="floating-add-btn" @click="$emit('toggleMenu')">
      {{ showMenu ? '✕' : '+' }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'FloatingActionButton',
  props: {
    showMenu: {
      type: Boolean,
      default: false
    },
    showDeleteAll: {
      type: Boolean,
      default: false
    },
    categoryName: {
      type: String,
      default: ''
    },
    itemCount: {
      type: Number,
      default: 0
    }
  },
  emits: [
    'toggleMenu',
    'addNewItem',
    'bulkAddItems',
    'importFromTxt',
    'importFromAPI',
    'createCollection',
    'deleteAllInCategory'
  ]
}
</script>

<style scoped>
/* Floating Action Button Styles */
.floating-actions {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: none;
}

.floating-actions > * {
  pointer-events: auto;
}

.floating-add-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #1a73e8;
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 300;
}

@media (max-width: 768px) {
  .floating-add-btn {
    width: 64px;
    height: 64px;
    font-size: 1.8rem;
    bottom: 80px; /* Move up to avoid mobile browser UI */
  }
}

.floating-add-btn:hover {
  background: #1557b0;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.floating-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 8px;
  display: none;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .floating-menu {
    bottom: 80px;
    right: -10px;
    min-width: 200px;
  }
}

.floating-menu.show {
  display: flex;
}

.floating-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
  min-height: 48px;
}

.floating-menu-item:hover {
  background: #3a3a3a;
  color: #e0e0e0;
}

.menu-icon {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.menu-text {
  font-weight: 500;
}

/* Delete All Item in Floating Menu */
.delete-all-item {
  background: #8B0000 !important;
  border: 1px solid #A52A2A !important;
  color: #ffffff !important;
}

.delete-all-item:hover {
  background: #A52A2A !important;
  border-color: #DC143C !important;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(139, 0, 0, 0.4);
}

.item-count-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
}

/* Touch-specific improvements */
@media (hover: none) and (pointer: coarse) {
  .floating-add-btn {
    width: 64px;
    height: 64px;
    font-size: 1.8rem;
  }
  
  .floating-menu-item {
    min-height: 48px;
    padding: 16px;
  }
  
  .floating-menu-item,
  .floating-add-btn {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
}
</style>




