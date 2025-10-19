<template>
  <div class="star-rating" :class="{ 'edit-mode': editMode }">
    <div class="stars-container">
      <button
        v-for="star in 10"
        :key="star"
        class="star"
        :class="{ 
          'filled': star <= currentRating,
          'hover': star <= hoverRating,
          'edit-mode': editMode
        }"
        @click="handleStarClick(star)"
        @mouseenter="handleMouseEnter(star)"
        @mouseleave="handleMouseLeave"
        :disabled="!editMode"
        :title="editMode ? `Rate ${star}/10` : `Current rating: ${currentRating}/10`"
      >
        <span class="star-icon">★</span>
        <span class="star-number">{{ star }}</span>
      </button>
    </div>
    <div v-if="editMode && currentRating > 0" class="rating-info">
      <span class="rating-text">{{ currentRating }}/10</span>
      <button 
        class="clear-rating" 
        @click="clearRating"
        title="Clear rating"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StarRating',
  props: {
    rating: {
      type: Number,
      default: 0
    },
    editMode: {
      type: Boolean,
      default: false
    },
    itemId: {
      type: [Number, String],
      required: true
    }
  },
  emits: ['rating-changed'],
  data() {
    return {
      currentRating: this.rating || 0,
      hoverRating: 0
    }
  },
  watch: {
    rating(newRating) {
      this.currentRating = newRating || 0
    }
  },
  methods: {
    handleStarClick(star) {
      if (!this.editMode) return
      
      this.currentRating = star
      
      // Add visual feedback
      this.showSuccessAnimation()
      
      this.$emit('rating-changed', {
        itemId: this.itemId,
        rating: star
      })
    },
    
    showSuccessAnimation() {
      // Create a temporary success indicator
      const successEl = document.createElement('div')
      successEl.innerHTML = '✓'
      successEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #4CAF50;
        color: white;
        padding: 8px 12px;
        border-radius: 50%;
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        animation: successPulse 0.6s ease-out;
        pointer-events: none;
      `
      
      // Add CSS animation
      const style = document.createElement('style')
      style.textContent = `
        @keyframes successPulse {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `
      document.head.appendChild(style)
      
      document.body.appendChild(successEl)
      
      setTimeout(() => {
        document.body.removeChild(successEl)
        document.head.removeChild(style)
      }, 600)
    },
    
    handleMouseEnter(star) {
      if (!this.editMode) return
      this.hoverRating = star
    },
    
    handleMouseLeave() {
      if (!this.editMode) return
      this.hoverRating = 0
    },
    
    clearRating() {
      if (!this.editMode) return
      
      this.currentRating = 0
      this.$emit('rating-changed', {
        itemId: this.itemId,
        rating: 0
      })
    }
  }
}
</script>

<style scoped>
.star-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  animation: starRatingAppear 0.4s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes starRatingAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.star-rating.edit-mode {
  background: rgba(232, 244, 253, 0.15);
  border: 2px solid rgba(232, 244, 253, 0.3);
  box-shadow: 0 8px 25px rgba(232, 244, 253, 0.2);
}

.stars-container {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: center;
}

.star {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  position: relative;
  margin: 2px;
}

.star:disabled {
  cursor: default;
}

.star.edit-mode {
  cursor: pointer;
}

.star.edit-mode:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.star-icon {
  font-size: 24px;
  color: #666;
  transition: all 0.2s ease;
  line-height: 1;
}

.star-number {
  font-size: 12px;
  color: #999;
  font-weight: 700;
  line-height: 1;
  margin-top: 2px;
}

.star.filled .star-icon {
  color: #ffd700;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
  animation: starFill 0.3s ease-out;
}

.star.filled .star-number {
  color: #ffd700;
  font-weight: 700;
  animation: starFill 0.3s ease-out;
}

@keyframes starFill {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.star.hover .star-icon {
  color: #ffed4e;
  text-shadow: 0 0 8px rgba(255, 237, 78, 0.8);
  transform: scale(1.1);
}

.star.hover .star-number {
  color: #ffed4e;
  font-weight: 700;
  transform: scale(1.1);
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
}

.rating-text {
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  font-size: 16px;
  font-weight: 700;
}

.star-rating.edit-mode .rating-text {
  color: #1a1a1a;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.clear-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.clear-rating:hover {
  background: rgba(255, 0, 0, 1);
  transform: scale(1.1);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .star-rating {
    padding: 12px;
    gap: 8px;
  }
  
  .star {
    width: 32px;
    height: 32px;
    margin: 1px;
  }
  
  .star-icon {
    font-size: 20px;
  }
  
  .star-number {
    font-size: 10px;
  }
  
  .rating-info {
    font-size: 12px;
    gap: 8px;
  }
  
  .rating-text {
    font-size: 14px;
  }
  
  .clear-rating {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .star-rating {
    padding: 8px;
    gap: 6px;
  }
  
  .star {
    width: 28px;
    height: 28px;
    margin: 1px;
  }
  
  .star-icon {
    font-size: 18px;
  }
  
  .star-number {
    font-size: 9px;
  }
  
  .rating-info {
    font-size: 11px;
    gap: 6px;
  }
  
  .rating-text {
    font-size: 13px;
  }
  
  .clear-rating {
    width: 18px;
    height: 18px;
    font-size: 9px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .star.edit-mode:hover {
    transform: none;
    background: transparent;
  }
  
  .star.edit-mode:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.3);
  }
}
</style>
