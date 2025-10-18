<template>
  <div class="media-item" :class="getCategoryClass()" :style="getCategoryStyle()" @click="editItem">
    <div class="media-image">
      <img 
        v-if="item.image_url || item.path" 
        :src="getImageUrl(item.image_url || item.path)" 
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
    
    <!-- Series Extra Link Button -->
    <div v-if="isSeries && item.extra_link" class="series-extra-button" @click.stop="openExtraLink">
      <span class="extra-link-icon">🔗</span>
      <span class="extra-link-text">Extra Link</span>
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
    },
    
    isSeries() {
      // Check if this is a series item
      return this.item.category === 'series' || this.item.watchlist_type === 'series'
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
      // Ensure we don't double-add /storage/ prefix
      if (path.startsWith('storage/')) {
        return `/${path}`
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
    
    editItem() {
      this.$emit('edit', this.item)
    },
    
    openExtraLink() {
      if (this.item.extra_link) {
        window.open(this.item.extra_link, '_blank', 'noopener,noreferrer')
      }
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
      const category = this.item.category?.toLowerCase() || this.item.category_name?.toLowerCase()
      if (category === 'movies' || category === 'movie') return 'category-movies'
      if (category === 'books' || category === 'buecher' || category === 'book') return 'category-books'
      if (category === 'series' || category === 'tv' || category === 'serie') return 'category-series'
      if (category === 'games' || category === 'game' || category === 'spiele') return 'category-games'
      if (category === 'watchlist') return 'category-watchlist'
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
          '--game-secondary': '#e8f4fd',
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
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  aspect-ratio: 16/9;
  min-height: 120px;
  width: 100%;
  contain: layout;
}

.media-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
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
  
  /* Disable category-specific hover effects on touch devices */
  .category-movies:hover,
  .category-books:hover,
  .category-series:hover,
  .category-games:hover,
  .category-watchlist:hover,
  .category-default:hover {
    transform: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* Image fills entire card with text overlay */
.media-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.media-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

/* Responsive behavior for image overlay layout */
@media (max-width: 768px) {
  .media-info {
    padding: 12px;
  }
  
}

@media (max-width: 480px) {
  .media-info {
    padding: 10px;
  }
  
  .media-title {
    font-size: 0.9rem;
  }
  
  .media-meta {
    font-size: 0.8rem;
  }
  
  .no-image-icon {
    font-size: 1.5rem;
  }
}

@media (max-width: 360px) {
  .media-info {
    padding: 8px;
  }
  
  .media-title {
    font-size: 0.8rem;
  }
  
  .media-meta {
    font-size: 0.7rem;
  }
  
  .no-image-icon {
    font-size: 1.2rem;
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



.media-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
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


.media-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
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
  color: #e8f4fd;
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
  font-size: 12px;
  color: #ffffff;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
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
  color: #1a1a1a;
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
  color: #1a1a1a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.countdown {
  background: #e67e22;
  color: #1a1a1a;
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
  background: rgba(232, 244, 253, 0.9);
}

.edit-icon {
  font-size: 14px;
  color: #1a1a1a;
}

/* Always show edit indicator on touch devices */
@media (hover: none) and (pointer: coarse) {
  .edit-indicator {
    opacity: 1;
    background: rgba(232, 244, 253, 0.8);
  }
}

/* Watchlist Type Tags */
.watchlist-type-tag {
  margin-top: 8px;
  display: flex;
  justify-content: flex-start;
}

/* Series Extra Link Button */
.series-extra-button {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(33, 150, 243, 0.9);
  color: #1a1a1a;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  z-index: 3;
  opacity: 0;
  transform: translateY(-4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.media-item:hover .series-extra-button {
  opacity: 1;
  transform: translateY(0);
}

.series-extra-button:hover {
  background: rgba(33, 150, 243, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.extra-link-icon {
  font-size: 12px;
}

.extra-link-text {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Always show series extra button on touch devices */
@media (hover: none) and (pointer: coarse) {
  .series-extra-button {
    opacity: 1;
    transform: translateY(0);
  }
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
  color: #1a1a1a;
}

.type-series {
  background: #2196F3;
  color: #1a1a1a;
}

.type-movie {
  background: #FF9800;
  color: #1a1a1a;
}

.type-buecher {
  background: #8B4513;
  color: #1a1a1a;
}

.type-media {
  background: #9C27B0;
  color: #1a1a1a;
}

/* ===========================================
   UNIFIED CATEGORY STYLES
   =========================================== */

/* Base category styles - unified approach */
.category-movies,
.category-books,
.category-series,
.category-games,
.category-default {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* All cards now use transparent background with image overlay */

/* Image styling is now handled by the absolute positioning */

/* Overlay is now handled by the text background gradient */

/* Info section styling is now handled by absolute positioning */

/* All text is now white with shadow for overlay effect */

/* All meta text is now white with shadow */

/* All platform/genre text is now white with shadow */

/* Unified hover effects for all categories */



/* Game-specific rating styles (simplified) */
.category-games[style*="--game-primary: #ffd700"] {
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2), var(--game-glow);
}

.category-games[style*="--game-primary: #00d4ff"] {
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.2), var(--game-glow);
}

.category-games[style*="--game-primary: #9e9e9e"] {
  opacity: 0.85;
  filter: grayscale(10%);
}
</style>

