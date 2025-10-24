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
      <!-- Labels Container - All labels in one row above title -->
      <div class="labels-container">
        <!-- Category Type Tag for Watchlist Items -->
        <div v-if="isWatchlistItem && getTypeTagText()" class="category-type-tag">
          {{ getCategoryIcon() }}
        </div>
        
        <!-- Watchlist Series Type Tags -->
        <div v-if="isWatchlistItem && item.watchlist_series_type === 'new_season'" class="watchlist-tag new-season">
          📺 {{ item.watchlist_season_info || 'New Season' }}
        </div>
        
        <!-- Airing Status (only for non-watchlist series) -->
        <div v-if="isSeries && !isWatchlistItem && item.is_airing" class="status-badge airing">
          🔴 Airing
        </div>
        <div v-else-if="isSeries && !isWatchlistItem && item.series_status" class="status-badge finished">
          {{ getStatusIcon() }} {{ item.series_status }}
        </div>
        
        <!-- Season Information -->
        <div v-if="isSeries && item.is_airing && item.next_season" class="season-info">
          📺 S{{ item.next_season }}
        </div>
        
        <!-- Days Left Counter -->
        <div v-if="isWatchlistItem && item.release" class="days-left">
          ⏰ {{ getWatchlistDaysLeft() }}
        </div>
        <div v-else-if="isSeries && item.is_airing && item.next_season_release" class="days-left">
          ⏰ {{ getDaysLeftText() }}
        </div>
      </div>
      
      <!-- Title Container - Always stays at bottom -->
      <div class="title-container">
        <h3 class="media-title">{{ item.title }}</h3>
      </div>
    </div>
    
    <!-- Series Extra Link Button -->
    <div v-if="isSeries && !isWatchlistItem && item.extra_link" class="series-extra-button" @click.stop="openExtraLink">
      <span class="extra-link-icon">🔗</span>
      <span class="extra-link-text">Extra Link</span>
    </div>
    
    <!-- Watchlist Extra Link Button -->
    <div v-if="isWatchlistItem && item.extra_link" class="watchlist-extra-button" @click.stop="openExtraLink">
      <span class="extra-link-icon">🔗</span>
      <span class="extra-link-text">Go to Link</span>
    </div>
    
    
    <!-- Heart Toggle Button for Airing Series -->
    <div v-if="shouldShowHeartButton" class="heart-toggle-button" @click.stop="handleHeartClick">
      <span class="heart-icon" :class="{ active: isInWatchlist }">
        {{ isInWatchlist ? '❤️' : '🤍' }}
      </span>
      <span class="heart-text">
        {{ isInWatchlist ? 'In Watchlist' : 'Add to Watchlist' }}
      </span>
    </div>
    
    <!-- Star Rating in Edit Mode -->
    <div v-if="editMode" class="star-rating-overlay">
      <StarRating
        :rating="item.personal_rating || 0"
        :edit-mode="editMode"
        :item-id="item.id"
        @rating-changed="handleRatingChanged"
      />
    </div>
    
    <!-- Edit indicator -->
    <div class="edit-indicator">
      <span class="edit-icon">✏️</span>
    </div>
  </div>
</template>

<script>
import { mediaApi } from '@/services/api'
import StarRating from '@/components/StarRating.vue'

export default {
  name: 'MediaItem',
  components: {
    StarRating
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    editMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['edit', 'watchlist-toggled', 'show-message', 'rating-changed'],
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
    },
    
    isInWatchlist() {
      // Check if this series is already in the watchlist
      // For watchlist category items, they are always in watchlist
      if (this.item.category === 'watchlist') {
        return true
      }
      // For series category, check if they have watchlist properties
      return this.item.is_in_watchlist || false
    },
    
    shouldShowHeartButton() {
      // Show heart button for all series (both in series and watchlist categories)
      return this.isSeries
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
      
      // For uploaded images, use the API route instead of storage symlink
      // The path from the database is relative to storage/app/public
      // Use the images_downloads API route which handles the serving
      if (path.startsWith('storage/')) {
        return `/${path}`
      }
      // path already contains 'images_downloads/uploads/...'
      return `/${path}`
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
      if (!this.editMode) {
        this.$emit('edit', this.item)
      }
    },
    
    handleRatingChanged(ratingData) {
      this.$emit('rating-changed', ratingData)
    },
    
    openExtraLink() {
      if (this.item.extra_link) {
        window.open(this.item.extra_link, '_blank', 'noopener,noreferrer')
      }
    },
    
    getStatusIcon() {
      switch (this.item.series_status) {
        case 'Ended':
          return '✅'
        case 'Canceled':
          return '❌'
        case 'In Production':
          return '🔧'
        default:
          return '📺'
      }
    },
    
    getDaysLeftText() {
      if (!this.item.next_season_release) return ''
      
      const releaseDate = new Date(this.item.next_season_release)
      const today = new Date()
      const timeDiff = releaseDate.getTime() - today.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (daysDiff > 0) {
        return `${daysDiff} day${daysDiff > 1 ? 's' : ''} left`
      } else if (daysDiff === 0) {
        return 'Airs today!'
      } else {
        return `Aired ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} ago`
      }
    },
    
    handleHeartClick() {
      console.log('💖 Heart button clicked!')
      console.log('💖 Button visible:', this.isSeries && this.item.is_airing)
      console.log('💖 Series check:', this.isSeries)
      console.log('💖 Airing check:', this.item.is_airing)
      this.toggleToWatchlist()
    },
    
    async toggleToWatchlist() {
      try {
        console.log('💖 Toggling series to watchlist:', this.item.title)
        console.log('💖 Item details:', {
          id: this.item.id,
          title: this.item.title,
          category: this.item.category,
          is_airing: this.item.is_airing
        })
        
        // Add loading state to heart button
        this.showHeartLoading()
        
        const response = await mediaApi.toggleSeriesToWatchlist(this.item.id)
        
        if (response.success) {
          console.log('💖 Watchlist toggle successful:', response)
          
          // Show success animation
          this.showHeartSuccess()
          
          // Emit event to parent to refresh data and switch category
          this.$emit('watchlist-toggled', {
            seriesId: this.item.id,
            action: response.action,
            watchlistType: response.watchlist_type,
            seasonInfo: response.season_info,
            message: response.message
          })
        } else {
          console.error('❌ Watchlist toggle failed:', response.error)
          this.$emit('show-message', {
            type: 'error',
            text: response.error || 'Failed to toggle watchlist'
          })
        }
      } catch (error) {
        console.error('❌ Watchlist toggle error:', error)
        
        // Check if it's a 400 error with specific message
        if (error.response && error.response.status === 400) {
          const errorMessage = error.response.data?.error || 'Only airing series can be added to watchlist'
          this.$emit('show-message', {
            type: 'error',
            text: errorMessage
          })
        } else {
          this.$emit('show-message', {
            type: 'error',
            text: 'Failed to toggle watchlist'
          })
        }
      }
    },
    
    showHeartLoading() {
      // Add loading animation to heart button
      const heartButton = this.$el.querySelector('.heart-toggle-button')
      if (heartButton) {
        heartButton.style.opacity = '0.7'
        heartButton.style.transform = 'scale(0.95)'
        heartButton.style.transition = 'all 0.2s ease'
      }
    },
    
    showHeartSuccess() {
      // Show success animation
      const heartButton = this.$el.querySelector('.heart-toggle-button')
      if (heartButton) {
        heartButton.style.background = 'rgba(40, 167, 69, 0.9)'
        heartButton.style.transform = 'scale(1.1)'
        heartButton.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.4)'
        
        // Reset after animation
        setTimeout(() => {
          heartButton.style.background = 'rgba(0, 0, 0, 0.8)'
          heartButton.style.transform = 'scale(1)'
          heartButton.style.boxShadow = 'none'
        }, 600)
      }
    },
    
  getWatchlistDaysLeft() {
    // Use watchlist_release_date if available, otherwise fallback to release
    const releaseDate = this.item.watchlist_release_date 
      ? new Date(this.item.watchlist_release_date)
      : (this.item.release ? new Date(this.item.release) : null)
    
    if (!releaseDate) return ''
    
    const today = new Date()
    const timeDiff = releaseDate.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    
    if (daysDiff > 0) {
      return `${daysDiff} day${daysDiff > 1 ? 's' : ''} left`
    } else if (daysDiff === 0) {
      return 'Releases today!'
    } else {
      return `Released ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} ago`
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
      // For watchlist items, use the watchlist type instead of category
      if (this.isWatchlistItem) {
        const watchlistType = this.item.watchlistType || this.item.watchlist_type
        if (watchlistType) {
          const type = watchlistType.toLowerCase()
          if (type === 'movies' || type === 'movie') return '🎬'
          if (type === 'books' || type === 'buecher') return '📚'
          if (type === 'series' || type === 'tv') return '📺'
          if (type === 'games' || type === 'game') return '🎮'
        }
        // Fallback to auto-detection if no manual type is set
        if (this.item.genre) {
          const genre = this.item.genre.toLowerCase()
          if (genre.includes('game') || genre.includes('gaming') || this.item.platforms?.toLowerCase().includes('steam') || this.item.platforms?.toLowerCase().includes('ps') || this.item.platforms?.toLowerCase().includes('xbox')) {
            return '🎮'
          }
          if (genre.includes('book') || genre.includes('buecher')) {
            return '📚'
          }
          if (genre.includes('series') || genre.includes('tv') || genre.includes('tv show')) {
            return '📺'
          }
          if (genre.includes('movie') || genre.includes('film')) {
            return '🎬'
          }
        }
        return '📁' // Default fallback
      }
      
      // For non-watchlist items, use the category
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
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
}

.media-item:active {
  transform: scale(1.02);
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
  justify-content: space-between;
  align-items: flex-start;
  min-height: 80px;
}

.labels-container {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  margin-bottom: 8px;
  align-items: center;
  justify-content: flex-start;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  width: 100%;
  max-width: 100%;
  min-height: 20px;
}

.title-container {
  margin-top: auto;
  width: 100%;
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

/* Adjust thumbnail positioning for series and watchlist items (portrait images) */
.category-series .media-image img,
.category-watchlist .media-image img {
  object-position: center 25%;
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
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  text-align: left;
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

/* Star Rating Overlay */
.star-rating-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  max-width: 90%;
  max-height: 90%;
}

.media-item:hover .star-rating-overlay {
  opacity: 1;
  pointer-events: auto;
}

/* Always show star rating in edit mode */
.media-item.edit-mode .star-rating-overlay {
  opacity: 1;
  pointer-events: auto;
}

/* Disable card click in edit mode */
.media-item.edit-mode {
  cursor: default;
}

.media-item.edit-mode:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* Mobile optimizations for star rating */
@media (max-width: 768px) {
  .star-rating-overlay {
    opacity: 1;
    pointer-events: auto;
  }
  
  .media-item.edit-mode .star-rating-overlay {
    opacity: 1;
  }
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

/* Watchlist Extra Link Button */
.watchlist-extra-button {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 193, 7, 0.9);
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

.media-item:hover .watchlist-extra-button {
  opacity: 1;
  transform: translateY(0);
}

.watchlist-extra-button:hover {
  background: rgba(255, 193, 7, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* Always show watchlist extra button on touch devices */
@media (hover: none) and (pointer: coarse) {
  .watchlist-extra-button {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===========================================
   HEART TOGGLE BUTTON STYLES
   =========================================== */

.heart-toggle-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(-4px);
  backdrop-filter: blur(4px);
  z-index: 10;
}

.media-item:hover .heart-toggle-button {
  opacity: 1;
  transform: translateY(0);
}

.heart-toggle-button:hover {
  background: rgba(220, 53, 69, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

.heart-icon {
  font-size: 14px;
  transition: all 0.2s ease;
}

.heart-icon.active {
  animation: heartbeat 0.6s ease-in-out;
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.heart-text {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Always show heart button on touch devices */
@media (hover: none) and (pointer: coarse) {
  .heart-toggle-button {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===========================================
   LABELS CONTAINER - SINGLE ROW LAYOUT
   =========================================== */

.labels-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* ===========================================
   CATEGORY TYPE TAG STYLES
   =========================================== */

.category-type-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 24px;
  width: 24px;
  height: 24px;
  background: rgba(108, 117, 125, 0.9);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

/* ===========================================
   WATCHLIST TAGS STYLES
   =========================================== */

.watchlist-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.watchlist-tag.new-series {
  background: rgba(40, 167, 69, 0.9);
  color: white;
  box-shadow: 0 1px 4px rgba(40, 167, 69, 0.3);
}

.watchlist-tag.new-season {
  background: rgba(255, 193, 7, 0.9);
  color: #000;
  box-shadow: 0 1px 4px rgba(255, 193, 7, 0.3);
}

/* ===========================================
   SERIES INFORMATION STYLES
   =========================================== */

/* Removed old series-info styles - now using single row layout */

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge.airing {
  background: rgba(220, 53, 69, 0.9);
  color: white;
  box-shadow: 0 1px 4px rgba(220, 53, 69, 0.3);
}

.status-badge.finished {
  background: rgba(40, 167, 69, 0.9);
  color: white;
  box-shadow: 0 1px 4px rgba(40, 167, 69, 0.3);
}

/* Removed old next-season-info styles - now using single row layout */

.days-left {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: rgba(255, 215, 0, 0.9);
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  color: #000;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.season-info {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Removed old series-stats styles - now using single row layout */

.networks {
  display: none; /* Hide networks as requested */
}

.network-icon {
  font-size: 11px;
}

/* Responsive adjustments for labels container */
@media (max-width: 768px) {
  .labels-container {
    gap: 3px;
    margin-bottom: 6px;
  }
  
  .category-type-tag {
    width: 20px;
    height: 20px;
    font-size: 10px;
    padding: 2px;
  }
  
  .watchlist-tag,
  .status-badge,
  .days-left,
  .season-info {
    font-size: 8px;
    padding: 1px 4px;
    max-width: 100px;
  }
  
  .season-info {
    max-width: 60px;
  }
  
  .days-left {
    max-width: 100px;
  }
}

@media (max-width: 480px) {
  .labels-container {
    gap: 2px;
    margin-bottom: 4px;
  }
  
  .category-type-tag {
    width: 18px;
    height: 18px;
    font-size: 9px;
    padding: 1px;
  }
  
  .watchlist-tag,
  .status-badge,
  .days-left,
  .season-info {
    font-size: 7px;
    padding: 1px 3px;
    max-width: 80px;
  }
  
  .season-info {
    max-width: 50px;
  }
  
  .days-left {
    max-width: 80px;
  }
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

