<template>
  <div class="media-item" @click="showDetails">
    <div class="media-image">
      <img 
        v-if="item.path" 
        :src="getImageUrl(item.path)" 
        :alt="item.title"
        @error="handleImageError"
      />
      <div v-else class="no-image">
        <span class="no-image-icon">📁</span>
      </div>
    </div>
    
    <div class="media-info">
      <h3 class="media-title">{{ item.title }}</h3>
      <div class="media-meta">
        <span v-if="item.release" class="media-release">{{ formatDate(item.release) }}</span>
        <span v-if="item.rating" class="media-rating">
          {{ '★'.repeat(Math.max(0, Math.min(5, Math.floor(item.rating)))) }}{{ '☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, Math.floor(item.rating))))) }}
        </span>
      </div>
      
      <div v-if="item.platforms" class="media-platforms">
        {{ item.platforms }}
      </div>
      
      <div v-if="item.genre" class="media-genre">
        {{ item.genre }}
      </div>
      
      <div v-if="item.isAiring" class="media-airing">
        <span class="airing-badge">Airing</span>
        <span v-if="item.nextSeason">S{{ item.nextSeason }}</span>
      </div>
    </div>
    
    <div class="media-actions">
      <button class="action-btn edit-btn" @click.stop="editItem" title="Edit">
        ✏️
      </button>
      <button class="action-btn delete-btn" @click.stop="deleteItem" title="Delete">
        🗑️
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MediaItem',
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  emits: ['edit', 'delete'],
  methods: {
    getImageUrl(path) {
      // Handle different image path formats
      if (path.startsWith('http')) {
        return path
      }
      if (path.startsWith('/')) {
        return path
      }
      return `/storage/${path}`
    },
    
    handleImageError(event) {
      event.target.style.display = 'none'
      event.target.nextElementSibling?.classList.add('show')
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },
    
    showDetails() {
      // Show item details modal
      console.log('Show details for:', this.item.title)
    },
    
    editItem() {
      this.$emit('edit', this.item)
    },
    
    deleteItem() {
      this.$emit('delete', this.item)
    }
  }
}
</script>

<style scoped>
.media-item {
  position: relative;
  background: #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid #404040;
}

.media-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.media-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.media-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #3a3a3a;
  color: #a0a0a0;
}

.no-image-icon {
  font-size: 48px;
}

.media-info {
  padding: 12px;
}

.media-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.media-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #a0a0a0;
}

.media-release {
  font-weight: 500;
}

.media-rating {
  color: #ffc107;
  font-size: 14px;
}

.media-platforms,
.media-genre {
  font-size: 11px;
  color: #a0a0a0;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.media-airing {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.airing-badge {
  background: #e74c3c;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.media-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.media-item:hover .media-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 4px;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
  color: #e0e0e0;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.edit-btn:hover {
  background: #4a9eff;
  color: white;
}

.delete-btn:hover {
  background: #e74c3c;
  color: white;
}
</style>

