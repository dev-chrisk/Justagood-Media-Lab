<template>
  <div class="media-item" :class="getCategoryClass()" :style="getCategoryStyle()" @click="editItem">
    <div class="media-image">
      <img 
        v-if="item.path" 
        :src="getImageUrl(item.path)" 
        :alt="item.title"
        @error="handleImageError"
      />
      <div v-else class="no-image">
        <span class="no-image-icon">{{ getCategoryIcon() }}</span>
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
      
      <div v-if="item.description" class="media-description">
        {{ item.description }}
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
      
      // If it's already a full URL, ensure it uses HTTPS
      if (path.startsWith('http')) {
        return path.startsWith('http://') ? path.replace('http://', 'https://') : path
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
    },
    
    getCategoryClass() {
      const category = this.item.category?.toLowerCase()
      if (category === 'movies' || category === 'movie') return 'category-movies'
      if (category === 'books' || category === 'buecher') return 'category-books'
      if (category === 'series' || category === 'tv') return 'category-series'
      if (category === 'games' || category === 'game') return 'category-games'
      return 'category-default'
    },
    
    getCategoryIcon() {
      const category = this.item.category?.toLowerCase()
      if (category === 'movies' || category === 'movie') return '🎬'
      if (category === 'books' || category === 'buecher') return '📚'
      if (category === 'series' || category === 'tv') return '📺'
      if (category === 'games' || category === 'game') return '🎮'
      return '📁'
    },
    
    getCategoryStyle() {
      const category = this.item.category?.toLowerCase()
      if (category === 'games' || category === 'game') {
        const rating = this.item.rating || 0
        return this.getGameStyleByRating(rating)
      }
      return {}
    },
    
    getGameStyleByRating(rating) {
      // Rating-basierte Styles für Games
      if (rating >= 4.5) {
        // Legendary Games - Gold/Platinum Effekte
        return {
          '--game-primary': '#ffd700',
          '--game-secondary': '#ffed4e',
          '--game-accent': '#ff6b35',
          '--game-glow': '0 0 20px rgba(255, 215, 0, 0.6)',
          '--game-border': '3px solid #ffd700'
        }
      } else if (rating >= 4.0) {
        // Excellent Games - Cyan/Blue Effekte
        return {
          '--game-primary': '#00d4ff',
          '--game-secondary': '#4a9eff',
          '--game-accent': '#00ff88',
          '--game-glow': '0 0 15px rgba(0, 212, 255, 0.5)',
          '--game-border': '3px solid #00d4ff'
        }
      } else if (rating >= 3.5) {
        // Good Games - Green Effekte
        return {
          '--game-primary': '#00ff88',
          '--game-secondary': '#4caf50',
          '--game-accent': '#8bc34a',
          '--game-glow': '0 0 12px rgba(0, 255, 136, 0.4)',
          '--game-border': '3px solid #00ff88'
        }
      } else if (rating >= 3.0) {
        // Average Games - Orange Effekte
        return {
          '--game-primary': '#ff9800',
          '--game-secondary': '#ffc107',
          '--game-accent': '#ff5722',
          '--game-glow': '0 0 10px rgba(255, 152, 0, 0.3)',
          '--game-border': '3px solid #ff9800'
        }
      } else if (rating >= 2.0) {
        // Poor Games - Red Effekte
        return {
          '--game-primary': '#ff5722',
          '--game-secondary': '#f44336',
          '--game-accent': '#d32f2f',
          '--game-glow': '0 0 8px rgba(255, 87, 34, 0.3)',
          '--game-border': '3px solid #ff5722'
        }
      } else {
        // Unrated/Bad Games - Gray Effekte
        return {
          '--game-primary': '#9e9e9e',
          '--game-secondary': '#757575',
          '--game-accent': '#616161',
          '--game-glow': '0 0 5px rgba(158, 158, 158, 0.2)',
          '--game-border': '3px solid #9e9e9e'
        }
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

.media-description {
  font-size: 10px;
  color: #888;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  font-style: italic;
}

/* Optimize platform/genre info for mobile 3-column layout */
@media (max-width: 768px) {
  .media-platforms,
  .media-genre {
    font-size: 10px;
    margin-bottom: 3px;
  }
  
  .media-description {
    font-size: 9px;
    margin-bottom: 3px;
    -webkit-line-clamp: 1;
  }
}

@media (max-width: 480px) {
  .media-platforms,
  .media-genre {
    font-size: 9px;
    margin-bottom: 2px;
  }
  
  .media-description {
    font-size: 8px;
    margin-bottom: 2px;
  }
}

@media (max-width: 360px) {
  .media-platforms,
  .media-genre {
    font-size: 8px;
    margin-bottom: 2px;
  }
  
  .media-description {
    font-size: 7px;
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

/* ===========================================
   CATEGORY-SPECIFIC CARD DESIGNS
   =========================================== */

/* Movies - DVD Hülle Design */
.category-movies {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid #444;
  border-radius: 12px;
  position: relative;
  overflow: visible;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

/* DVD Plastikrahmen */
.category-movies::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 50%, #b8b8b8 100%);
  border-radius: 16px;
  z-index: -2;
  box-shadow: 
    inset 0 2px 4px rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

/* DVD Innenrahmen mit buntem Gradient */
.category-movies::after {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
  border-radius: 14px;
  z-index: -1;
  opacity: 0.4;
}

.category-movies .media-image {
  border-radius: 8px 8px 0 0;
  position: relative;
  overflow: hidden;
}


.category-movies .media-info {
  background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
  border-radius: 0 0 8px 8px;
  position: relative;
}

.category-movies .media-title {
  color: #f0f0f0;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.category-movies:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5);
}

/* DVD Hülle Details */
.category-movies .media-image {
  position: relative;
}

/* DVD Center Ring Simulation */
.category-movies .media-image::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  background: radial-gradient(circle, transparent 20px, rgba(0, 0, 0, 0.1) 21px, rgba(0, 0, 0, 0.1) 30px, transparent 31px);
  opacity: 0.6;
  pointer-events: none;
}

/* DVD Hülle Glanz-Effekt */
.category-movies .media-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    transparent 30%, 
    transparent 70%, 
    rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

/* Books - Buch Cover Design */
.category-books {
  background: #f8f6f0;
  border: 3px solid #8B4513;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 6px 20px rgba(139, 69, 19, 0.3);
  transform-style: preserve-3d;
}

.category-books::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(139, 69, 19, 0.1) 0%, 
    transparent 2%, 
    transparent 98%, 
    rgba(139, 69, 19, 0.1) 100%);
  border-radius: 5px;
  pointer-events: none;
}

.category-books .media-image {
  border-radius: 4px 4px 0 0;
  border-bottom: 2px solid #8B4513;
  position: relative;
}

.category-books .media-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255,255,255,0.1) 0%, 
    transparent 50%, 
    rgba(0,0,0,0.1) 100%);
  pointer-events: none;
}

.category-books .media-info {
  background: #f8f6f0;
  border-radius: 0 0 4px 4px;
  color: #2c1810;
}

.category-books .media-title {
  color: #2c1810;
  font-family: 'Georgia', serif;
  font-weight: 700;
}

.category-books .media-meta,
.category-books .media-platforms,
.category-books .media-genre {
  color: #5d4037;
}

.category-books:hover {
  transform: translateY(-4px) rotateY(5deg);
  box-shadow: 0 10px 30px rgba(139, 69, 19, 0.4);
}

/* Series - TV Design */
.category-series {
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  border: 2px solid #4a9eff;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(74, 158, 255, 0.2);
}

.category-series::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4a9eff, #00d4ff, #4a9eff);
  animation: tvScan 3s linear infinite;
}

@keyframes tvScan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.category-series .media-image {
  border-radius: 12px 12px 0 0;
  position: relative;
  overflow: hidden;
}

.category-series .media-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, 
    rgba(74, 158, 255, 0.1) 0%, 
    transparent 50%, 
    rgba(0, 212, 255, 0.1) 100%);
  pointer-events: none;
}

.category-series .media-info {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%);
  border-radius: 0 0 12px 12px;
  position: relative;
}

.category-series .media-title {
  color: #e0f2ff;
  text-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
}

.category-series .media-meta {
  color: #4a9eff;
}

.category-series:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 40px rgba(74, 158, 255, 0.3);
  border-color: #00d4ff;
}

/* Games - PC Frame Design mit Rating-basierten Effekten */
.category-games {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 50%, #1a1a1a 100%);
  border: var(--game-border, 3px solid #00ff88);
  border-radius: 8px;
  position: relative;
  box-shadow: var(--game-glow, 0 6px 25px rgba(0, 255, 136, 0.2));
  overflow: hidden; /* Fixed: Verhindert Overflow */
}

.category-games::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, 
    var(--game-primary, #00ff88), 
    var(--game-secondary, #00d4ff), 
    var(--game-accent, #ff6b6b));
  border-radius: 5px;
  z-index: -1;
  opacity: 0.1;
  animation: gameGlow 3s ease-in-out infinite alternate;
}

@keyframes gameGlow {
  0% { opacity: 0.05; }
  100% { opacity: 0.15; }
}

.category-games .media-image {
  border-radius: 4px 4px 0 0;
  position: relative;
  overflow: hidden;
  border-bottom: 2px solid var(--game-primary, #00ff88);
}

.category-games .media-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    var(--game-primary, #00ff88) 0%, 
    transparent 30%, 
    transparent 70%, 
    var(--game-secondary, #00d4ff) 100%);
  opacity: 0.1;
  pointer-events: none;
}

.category-games .media-info {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 0 0 4px 4px;
  position: relative;
  overflow: hidden; /* Fixed: Verhindert Overflow */
}

.category-games .media-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    var(--game-primary, #00ff88), 
    var(--game-secondary, #00d4ff), 
    var(--game-accent, #ff6b6b));
  animation: gameScan 4s linear infinite;
  opacity: 0.8;
}

@keyframes gameScan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.category-games .media-title {
  color: var(--game-primary, #00ff88);
  text-shadow: 0 0 8px var(--game-primary, #00ff88);
  font-family: 'Courier New', monospace;
  font-weight: 700;
}

.category-games .media-meta {
  color: var(--game-secondary, #00d4ff);
}

.category-games .media-platforms,
.category-games .media-genre {
  color: var(--game-accent, #ff6b6b);
}

.category-games:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--game-glow, 0 12px 35px rgba(0, 255, 136, 0.4));
}

/* Rating-spezifische Zusatz-Effekte */
.category-games[style*="--game-primary: #ffd700"] {
  /* Legendary Games - Extra Glow */
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), var(--game-glow);
}

.category-games[style*="--game-primary: #00d4ff"] {
  /* Excellent Games - Cyan Pulse */
  animation: cyanPulse 2s ease-in-out infinite alternate;
}

@keyframes cyanPulse {
  0% { box-shadow: var(--game-glow); }
  100% { box-shadow: var(--game-glow), 0 0 25px rgba(0, 212, 255, 0.4); }
}

.category-games[style*="--game-primary: #9e9e9e"] {
  /* Unrated Games - Subtle Effect */
  opacity: 0.8;
  filter: grayscale(20%);
}

/* Default Category */
.category-default {
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
}
</style>

