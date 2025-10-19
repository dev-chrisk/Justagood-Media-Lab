<template>
  <header class="main-header">
    <div class="header-left">
      <button class="mobile-sidebar-toggle" @click="$emit('toggleMobileSidebar')">☰</button>
    </div>
    <div class="header-center">
      <div class="search-container">
        <input 
          type="text" 
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          placeholder="Search..." 
        />
        <button class="search-clear" @click="$emit('clearSearch')">×</button>
      </div>
    </div>
    <div class="header-right">
      <div class="edit-mode-container">
        <button 
          class="edit-mode-toggle" 
          :class="{ active: editMode }"
          @click="$emit('toggleEditMode')"
          :title="editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'"
        >
          <span class="edit-icon">{{ editMode ? '✓' : '✏️' }}</span>
          <span class="edit-text">{{ editMode ? 'Done' : 'Edit' }}</span>
        </button>
      </div>
      <div class="sort-container">
        <select :value="sortBy" @change="$emit('update:sortBy', $event.target.value)">
          <option value="order_asc">Original order ↑</option>
          <option value="order_desc">Original order ↓</option>
          <option value="title_asc">Title A-Z</option>
          <option value="title_desc">Title Z-A</option>
          <option value="release_asc">Release ↑</option>
          <option value="release_desc">Release ↓</option>
          <option value="api_rating_asc">API Rating ↑</option>
          <option value="api_rating_desc">API Rating ↓</option>
          <option value="personal_rating_asc">Personal Rating ↑</option>
          <option value="personal_rating_desc">Personal Rating ↓</option>
          <option value="airing_desc">Airing first</option>
          <option value="airing_asc">Finished first</option>
        </select>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'MainHeader',
  props: {
    searchQuery: {
      type: String,
      default: ''
    },
    sortBy: {
      type: String,
      default: 'order_asc'
    },
    editMode: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'update:searchQuery',
    'update:sortBy',
    'toggleMobileSidebar',
    'clearSearch',
    'toggleEditMode'
  ]
}
</script>

<style scoped>
/* Main Header Styles */
.main-header {
  background: #2d2d2d;
  padding: 8px 20px;
  border-bottom: 1px solid #505050;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 0 0 auto;
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 0 20px;
}

.mobile-sidebar-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  color: #a0a0a0;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 500px;
}

.search-container input {
  padding: 10px 35px 10px 12px;
  border: 1px solid #555;
  border-radius: 20px;
  font-size: 14px;
  width: 100%;
  outline: none;
  transition: border-color 0.2s;
  background: #3a3a3a;
  color: #e0e0e0;
  min-height: 30px;
  height: 30px;
}

.search-container input:focus {
  border-color: #e8f4fd;
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  font-size: 16px;
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 0 0 auto;
}

.edit-mode-container {
  display: flex;
  align-items: center;
}

.edit-mode-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 6px;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-height: 44px;
}

.edit-mode-toggle:hover {
  background: #4a4a4a;
  border-color: #666;
  transform: translateY(-1px);
}

.edit-mode-toggle.active {
  background: #e8f4fd;
  border-color: #e8f4fd;
  color: #1a1a1a;
}

.edit-mode-toggle.active:hover {
  background: #d1e7f7;
  border-color: #d1e7f7;
}

.edit-icon {
  font-size: 16px;
  line-height: 1;
}

.edit-text {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sort-container {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #a0a0a0;
}

.sort-container select {
  padding: 8px 10px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
  background: #3a3a3a;
  color: #e0e0e0;
  cursor: pointer;
  min-height: 44px;
}

/* Responsive Design */
@media (min-width: 1281px) {
  .main-header {
    padding: 8px 24px;
    height: 44px;
  }
  
  .header-right {
    gap: 20px;
  }
  
  .search-container input {
    max-width: 500px;
    min-height: 28px;
    height: 28px;
    padding: 8px 35px 8px 12px;
  }
}

@media (max-width: 1280px) and (min-width: 769px) {
  .main-header {
    padding: 8px 20px;
    height: 44px;
  }
  
  .header-right {
    gap: 15px;
  }
  
  .search-container input {
    max-width: 400px;
    min-height: 30px;
    height: 30px;
    padding: 10px 35px 10px 12px;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .main-header {
    padding: 8px 18px;
    height: 44px;
  }
  
  .header-right {
    gap: 12px;
  }
  
  .search-container input {
    max-width: 350px;
    min-height: 32px;
    height: 32px;
    padding: 8px 35px 8px 12px;
  }
}

@media (max-width: 900px) and (min-width: 769px) {
  .main-header {
    padding: 8px 16px;
    height: 44px;
  }
  
  .header-right {
    gap: 10px;
  }
  
  .search-container input {
    max-width: 300px;
    min-height: 32px;
    height: 32px;
    padding: 8px 35px 8px 12px;
  }
}

@media (max-width: 768px) {
  .mobile-sidebar-toggle {
    display: flex;
  }
  
  .main-header {
    padding: 8px 12px;
    min-height: 44px;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  
  .header-left {
    flex: 0 0 auto;
    justify-content: flex-start;
  }
  
  .header-center {
    flex: 1;
    padding: 0 8px;
    min-width: 120px;
    justify-content: center;
  }
  
  .header-right {
    flex: 0 0 auto;
    flex-direction: row;
    gap: 6px;
    align-items: center;
  }
  
  .search-container input {
    max-width: 250px;
    font-size: 16px;
    padding: 8px 12px;
    min-height: 28px;
    height: 28px;
  }
  
  .edit-mode-toggle {
    padding: 6px 8px;
    font-size: 12px;
    min-height: 36px;
  }
  
  .edit-icon {
    font-size: 14px;
  }
  
  .edit-text {
    font-size: 11px;
  }
  
  .sort-container {
    font-size: 12px;
    gap: 4px;
  }
  
  .sort-container select {
    padding: 6px 8px;
    font-size: 12px;
    min-height: 36px;
  }
}

@media (max-width: 480px) {
  .main-header {
    padding: 6px 8px;
    min-height: 40px;
    gap: 6px;
  }
  
  .header-center {
    padding: 0 4px;
    min-width: 100px;
  }
  
  .search-container input {
    max-width: 180px;
    font-size: 16px;
    padding: 6px 10px;
    min-height: 24px;
    height: 24px;
  }
  
  .header-right {
    gap: 4px;
  }
  
  .sort-container {
    font-size: 11px;
    gap: 3px;
  }
  
  .sort-container select {
    font-size: 11px;
    padding: 4px 6px;
    min-height: 32px;
  }
}

@media (max-width: 360px) {
  .main-header {
    padding: 4px 6px;
    min-height: 36px;
    gap: 4px;
  }
  
  .header-center {
    padding: 0 2px;
    min-width: 80px;
  }
  
  .search-container input {
    max-width: 140px;
    font-size: 16px;
    padding: 4px 8px;
    min-height: 20px;
    height: 20px;
  }
  
  .header-right {
    gap: 2px;
  }
  
  .sort-container {
    font-size: 10px;
    gap: 2px;
  }
  
  .sort-container select {
    font-size: 10px;
    padding: 3px 4px;
    min-height: 28px;
  }
}

/* Touch-specific improvements */
@media (hover: none) and (pointer: coarse) {
  .mobile-sidebar-toggle,
  .search-clear {
    min-height: 44px;
  }
  
  .mobile-sidebar-toggle,
  .search-clear {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
}
</style>
