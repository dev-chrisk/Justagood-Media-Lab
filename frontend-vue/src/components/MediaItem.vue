<template>
  <div class="media-item" @click="editItem">
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
        <span v-if="item.release" class="media-release">
          <span v-if="isWatchlistItem && item.release" :class="getWatchlistReleaseStatusClass()">
            {{ getWatchlistReleaseStatus() }}
          </span>
          <span v-else>
            {{ formatDate(item.release) }}
          </span>
        </span>
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
        <span class="airing-badge">
          <span class="airing-dot"></span>
          Airing
        </span>
        <span v-if="item.nextSeason" class="next-season">S{{ item.nextSeason }}</span>
        <span v-if="item.nextSeasonRelease" class="countdown">
          {{ getNextSeasonCountdown() }}
        </span>
      </div>
      
      <!-- Watchlist Type Tag -->
      <div v-if="showWatchlistTag" class="watchlist-type-tag">
        <span class="type-tag" :class="getTypeTagClass()">
          {{ getTypeTagText() }}
        </span>
      </div>
    </div>
    
    <!-- Edit indicator -->
    <div class="edit-indicator">
      <span class="edit-icon">✏️</span>
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
  emits: ['edit'],
  computed: {
    showWatchlistTag() {
      // Show tag only if item is in watchlist category or marked as new
      return this.item.category === 'watchlist' || this.item.isNew === true
    },
    
    isWatchlistItem() {
      // Check if this is a watchlist item
      return this.item.category === 'watchlist' || this.item.isNew === true
    }
  },
  methods: {
    getImageUrl(path) {
      // Handle different image path formats
      if (!path) return ''
      
      // If it's already a full URL, return as is
      if (path.startsWith('http')) {
        return path
      }
      
      // If it starts with /, it's already a relative path
      if (path.startsWith('/')) {
        return path
      }
      
      // For uploaded images, they should be accessible via /storage/
      // The path from the database is relative to storage/app/public
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
    
    editItem() {
      this.$emit('edit', this.item)
    },
    
    getWatchlistReleaseStatus() {
      if (!this.item.release) return ''
      
      const releaseDate = new Date(this.item.release)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day
      releaseDate.setHours(0, 0, 0, 0) // Reset time to start of day
      
      const timeDiff = releaseDate.getTime() - today.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (daysDiff > 0) {
        // Future release - show countdown
        if (daysDiff === 1) {
          return 'Tomorrow!'
        } else if (daysDiff <= 7) {
          return `${daysDiff} days left`
        } else if (daysDiff <= 30) {
          return `${daysDiff} days left`
        } else {
          return `${Math.ceil(daysDiff / 30)} months left`
        }
      } else if (daysDiff === 0) {
        // Released today
        return 'Released today!'
      } else {
        // Already released - show status based on type
        const type = this.getTypeTagText().toLowerCase()
        if (type === 'game') {
          return 'Unplayed yet'
        } else if (type === 'series' || type === 'movie') {
          return 'Unwatched yet'
        } else if (type === 'buecher') {
          return 'Unread yet'
        } else {
          return 'Unconsumed yet'
        }
      }
    },
    
    getWatchlistReleaseStatusClass() {
      if (!this.item.release) return ''
      
      const releaseDate = new Date(this.item.release)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day
      releaseDate.setHours(0, 0, 0, 0) // Reset time to start of day
      
      const timeDiff = releaseDate.getTime() - today.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (daysDiff > 0) {
        // Future release - countdown
        return 'countdown'
      } else if (daysDiff === 0) {
        // Released today
        return 'released-today'
      } else {
        // Already released - unconsumed
        return 'unconsumed'
      }
    },
    
    getTypeTagText() {
      // Use manually set watchlistType or watchlist_type if available
      const watchlistType = this.item.watchlistType || this.item.watchlist_type
      if (watchlistType) {
        return watchlistType.charAt(0).toUpperCase() + watchlistType.slice(1)
      }
      
      // Fallback to auto-detection if no manual type is set
      if (this.item.genre) {
        const genre = this.item.genre.toLowerCase()
        if (genre.includes('game') || genre.includes('gaming') || this.item.platforms?.toLowerCase().includes('steam') || this.item.platforms?.toLowerCase().includes('ps') || this.item.platforms?.toLowerCase().includes('xbox')) {
          return 'Game'
        }
        if (genre.includes('series') || genre.includes('tv') || genre.includes('episode') || this.item.isAiring) {
          return 'Series'
        }
        if (genre.includes('movie') || genre.includes('film') || genre.includes('cinema')) {
          return 'Movie'
        }
        if (genre.includes('book') || genre.includes('literature') || genre.includes('novel') || genre.includes('author')) {
          return 'Bücher'
        }
      }
      
      // Fallback based on platforms
      if (this.item.platforms) {
        const platforms = this.item.platforms.toLowerCase()
        if (platforms.includes('steam') || platforms.includes('ps') || platforms.includes('xbox') || platforms.includes('nintendo') || platforms.includes('pc')) {
          return 'Game'
        }
        if (platforms.includes('netflix') || platforms.includes('hulu') || platforms.includes('disney') || platforms.includes('hbo')) {
          return 'Series'
        }
        if (platforms.includes('cinema') || platforms.includes('theater')) {
          return 'Movie'
        }
        if (platforms.includes('book') || platforms.includes('kindle') || platforms.includes('audible') || platforms.includes('author')) {
          return 'Bücher'
        }
      }
      
      // Default fallback
      return 'Media'
    },
    
    getTypeTagClass() {
      const type = this.getTypeTagText().toLowerCase()
      return `type-${type}`
    },
    
    getNextSeasonCountdown() {
      if (!this.item.nextSeasonRelease) return ''
      
      const releaseDate = new Date(this.item.nextSeasonRelease)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      releaseDate.setHours(0, 0, 0, 0)
      
      const timeDiff = releaseDate.getTime() - today.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (daysDiff > 0) {
        if (daysDiff === 1) {
          return 'Tomorrow!'
        } else if (daysDiff <= 7) {
          return `${daysDiff} days`
        } else if (daysDiff <= 30) {
          return `${daysDiff} days`
        } else {
          return `${Math.ceil(daysDiff / 30)} months`
        }
      } else if (daysDiff === 0) {
        return 'Today!'
      } else {
        return 'Released'
      }
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
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #404040;
}

.media-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  border-color: #4a9eff;
  background: #333333;
}

.media-item:active {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .media-item:hover {
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    border-color: #404040;
    background: #2d2d2d;
  }
  
  .media-item:active {
    transform: scale(0.98);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }
}

.media-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

/* Better aspect ratio for 3-column layout on mobile */
@media (max-width: 768px) {
  .media-image {
    height: 180px;
  }
}

@media (max-width: 480px) {
  .media-image {
    height: 160px;
  }
}

@media (max-width: 360px) {
  .media-image {
    height: 140px;
  }
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

/* Optimize padding for mobile 3-column layout */
@media (max-width: 768px) {
  .media-info {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .media-info {
    padding: 8px;
  }
}

@media (max-width: 360px) {
  .media-info {
    padding: 6px;
  }
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
  transition: color 0.2s ease;
}

/* Optimize title size for mobile 3-column layout */
@media (max-width: 768px) {
  .media-title {
    font-size: 13px;
    margin: 0 0 6px 0;
  }
}

@media (max-width: 480px) {
  .media-title {
    font-size: 12px;
    margin: 0 0 4px 0;
  }
}

@media (max-width: 360px) {
  .media-title {
    font-size: 11px;
    margin: 0 0 4px 0;
  }
}

.media-item:hover .media-title {
  color: #4a9eff;
}

.media-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #a0a0a0;
}

/* Optimize meta info for mobile 3-column layout */
@media (max-width: 768px) {
  .media-meta {
    font-size: 11px;
    margin-bottom: 6px;
  }
}

@media (max-width: 480px) {
  .media-meta {
    font-size: 10px;
    margin-bottom: 4px;
  }
}

@media (max-width: 360px) {
  .media-meta {
    font-size: 9px;
    margin-bottom: 4px;
  }
}

.media-release {
  font-weight: 500;
}

/* Watchlist release status styles */
.media-release .countdown {
  color: #4a9eff;
  font-weight: 600;
}

.media-release .released-today {
  color: #27ae60;
  font-weight: 600;
}

.media-release .unconsumed {
  color: #e67e22;
  font-weight: 600;
  font-style: italic;
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

/* Optimize platform/genre info for mobile 3-column layout */
@media (max-width: 768px) {
  .media-platforms,
  .media-genre {
    font-size: 10px;
    margin-bottom: 3px;
  }
}

@media (max-width: 480px) {
  .media-platforms,
  .media-genre {
    font-size: 9px;
    margin-bottom: 2px;
  }
}

@media (max-width: 360px) {
  .media-platforms,
  .media-genre {
    font-size: 8px;
    margin-bottom: 2px;
  }
}

.media-airing {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.airing-badge {
  background: #27ae60;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.airing-dot {
  width: 6px;
  height: 6px;
  background: #2ecc71;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.next-season {
  background: #3498db;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.countdown {
  background: #e67e22;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.edit-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}

.media-item:hover .edit-indicator {
  opacity: 1;
  background: rgba(74, 158, 255, 0.9);
}

.edit-icon {
  font-size: 14px;
  color: white;
}

/* Always show edit indicator on touch devices */
@media (hover: none) and (pointer: coarse) {
  .edit-indicator {
    opacity: 1;
    background: rgba(74, 158, 255, 0.8);
  }
}

/* Watchlist Type Tags */
.watchlist-type-tag {
  margin-top: 8px;
  display: flex;
  justify-content: flex-start;
}

.type-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-game {
  background: #4CAF50;
  color: white;
}

.type-series {
  background: #2196F3;
  color: white;
}

.type-movie {
  background: #FF9800;
  color: white;
}

.type-buecher {
  background: #8B4513;
  color: white;
}

.type-media {
  background: #9C27B0;
  color: white;
}
</style>

