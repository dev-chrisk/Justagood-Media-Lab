<template>
  <div class="vue-app">
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" :class="{ show: sidebarStore.mobileOpen }" @click="sidebarStore.closeMobileSidebar"></div>
    
    <!-- Sidebar -->
    <Sidebar
      :collapsed="sidebarStore.collapsed"
      :mobile-open="sidebarStore.mobileOpen"
      :is-logged-in="isLoggedIn"
      :user-name="userName"
      :current-category="currentCategory"
      :category-counts="categoryCounts"
      :platforms="platforms"
      :genres="genres"
      :categories="categories"
      @toggle="sidebarStore.toggleSidebar"
      @set-category="setCategory"
      @navigate-to-calendar="navigateToCalendar"
      @navigate-to-profile="navigateToProfile"
      @toggle-platform-filter="togglePlatformFilter"
      @toggle-genre-filter="toggleGenreFilter"
      @clear-filters="clearFilters"
      @show-login="showLoginModal = true"
      @show-register="showRegisterModal = true"
      @logout="logout"
    />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <MainHeader
        v-model:search-query="searchQuery"
        v-model:grid-columns="gridColumns"
        v-model:sort-by="sortBy"
        @toggle-mobile-sidebar="sidebarStore.toggleMobileSidebar"
        @clear-search="clearSearch"
      />

      <!-- Content Area -->
      <main class="content-area">
        <div class="calendar-view">
          <!-- Calendar Header -->
          <div class="calendar-header">
            <button class="month-nav-btn" @click="previousMonth" :disabled="isLoading">
              <span class="nav-icon">‹</span>
            </button>
            
            <div class="month-year-display">
              <h2 class="month-name">{{ currentMonthName }}</h2>
              <span class="year">{{ currentYear }}</span>
            </div>
            
            <button class="month-nav-btn" @click="nextMonth" :disabled="isLoading">
              <span class="nav-icon">›</span>
            </button>
          </div>

          <!-- Calendar Grid -->
          <div class="calendar-container">
            <div class="calendar-grid">
              <!-- Weekday Headers -->
              <div class="weekday-header" v-for="day in weekdays" :key="day">
                {{ day }}
              </div>
              
              <!-- Calendar Days -->
              <div 
                v-for="day in calendarDays" 
                :key="`${day.date}-${day.month}`"
                class="calendar-day"
                :class="{
                  'other-month': !day.isCurrentMonth,
                  'today': day.isToday,
                  'weekend': day.isWeekend,
                  'has-events': day.hasEvents
                }"
                @click="selectDay(day)"
              >
                <span class="day-number">{{ day.day }}</span>
                <div v-if="day.hasEvents" class="event-indicator">
                  <div class="event-dot"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Day Info -->
          <div v-if="selectedDay" class="selected-day-info">
            <h3>{{ formatSelectedDay(selectedDay) }}</h3>
            <div class="day-events">
              <p v-if="!selectedDay.events || selectedDay.events.length === 0" class="no-events">
                No events scheduled for this day
              </p>
              <div v-else class="events-list">
                <div v-for="event in selectedDay.events" :key="event.id" class="event-item">
                  <span class="event-time">{{ event.time }}</span>
                  <span class="event-title">{{ event.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modals -->
    <LoginModal 
      v-if="showLoginModal" 
      @close="showLoginModal = false"
      @switch-to-register="switchToRegister"
      @login-success="handleLoginSuccess"
    />
    <RegisterModal 
      v-if="showRegisterModal" 
      @close="showRegisterModal = false"
      @register-success="handleRegisterSuccess"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebarStore } from '@/stores/sidebar'
import MainHeader from '@/components/MainHeader.vue'
import LoginModal from '@/components/LoginModal.vue'
import RegisterModal from '@/components/RegisterModal.vue'
import { useAuthStore } from '@/stores/auth.js'
import { useMediaStore } from '@/stores/media.js'

export default {
  name: 'Calendar',
  components: {
    Sidebar,
    MainHeader,
    LoginModal,
    RegisterModal
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const mediaStore = useMediaStore()
    const sidebarStore = useSidebarStore()

    // State
    // Sidebar state is now managed globally in useSidebarStore
    const showLoginModal = ref(false)
    const showRegisterModal = ref(false)
    const searchQuery = ref('')
    const gridColumns = ref(4)
    const sortBy = ref('title')
    
    // Calendar specific state
    const currentDate = ref(new Date())
    const selectedDay = ref(null)
    const isLoading = ref(false)
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    // Computed
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const userName = computed(() => authStore.user?.name || '')
    const currentCategory = computed(() => 'calendar')
    const categoryCounts = computed(() => ({}))
    const platforms = computed(() => [])
    const genres = computed(() => [])
    const categories = computed(() => [
      { key: 'game', name: 'Games', icon: '🎮' },
      { key: 'series', name: 'Series', icon: '📺' },
      { key: 'movie', name: 'Movies', icon: '🎬' },
      { key: 'watchlist', name: 'Watchlist', icon: '❤️' }
    ])

    const currentYear = computed(() => currentDate.value.getFullYear())
    const currentMonth = computed(() => currentDate.value.getMonth())
    const currentMonthName = computed(() => currentDate.value.toLocaleDateString('en-US', { month: 'long' }))
    
    const calendarDays = computed(() => {
      const year = currentYear.value
      const month = currentMonth.value
      
      // Get first day of month and calculate starting day of week
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDate = new Date(firstDay)
      
      // Adjust to start from Monday (0 = Sunday, 1 = Monday)
      const dayOfWeek = firstDay.getDay()
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startDate.setDate(startDate.getDate() - mondayOffset)
      
      const days = []
      const today = new Date()
      
      // Generate 42 days (6 weeks) to fill the grid
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        
        const isCurrentMonth = date.getMonth() === month
        const isToday = date.toDateString() === today.toDateString()
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        
        days.push({
          date: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          fullDate: new Date(date),
          isCurrentMonth,
          isToday,
          isWeekend,
          hasEvents: hasEventsForDate(date),
          events: getEventsForDate(date)
        })
      }
      
      return days
    })

    // Methods
    // Sidebar methods are now managed globally in useSidebarStore

    const setCategory = () => {
      // Not used in calendar view
    }

    const clearSearch = () => {
      searchQuery.value = ''
    }


    const navigateToCalendar = () => {
      // Already on calendar
    }

    const navigateToProfile = () => {
      router.push('/profile')
      sidebarStore.closeMobileSidebar()
    }

    const togglePlatformFilter = () => {
      // Not used in calendar view
    }

    const toggleGenreFilter = () => {
      // Not used in calendar view
    }

    const clearFilters = () => {
      mediaStore.clearFilters()
    }

    const logout = () => {
      authStore.logout()
    }

    const switchToRegister = () => {
      showLoginModal.value = false
      showRegisterModal.value = true
    }

    const handleLoginSuccess = () => {
      showLoginModal.value = false
    }

    const handleRegisterSuccess = () => {
      showRegisterModal.value = false
    }

    const previousMonth = () => {
      isLoading.value = true
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
      selectedDay.value = null
      setTimeout(() => {
        isLoading.value = false
      }, 150)
    }
    
    const nextMonth = () => {
      isLoading.value = true
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
      selectedDay.value = null
      setTimeout(() => {
        isLoading.value = false
      }, 150)
    }
    
    const selectDay = (day) => {
      if (day.isCurrentMonth) {
        selectedDay.value = day
      }
    }
    
    const formatSelectedDay = (day) => {
      const date = day.fullDate
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    
    const hasEventsForDate = (date) => {
      // Placeholder for event checking logic
      // This would typically check against a store or API
      const day = date.getDate()
      const month = date.getMonth()
      return (day % 7 === 0) || (day === 15) || (day === 25)
    }
    
    const getEventsForDate = (date) => {
      // Placeholder for event data
      const day = date.getDate()
      const events = []
      
      if (day % 7 === 0) {
        events.push({
          id: 1,
          title: 'Weekly Review',
          time: '10:00'
        })
      }
      
      if (day === 15) {
        events.push({
          id: 2,
          title: 'Team Meeting',
          time: '14:00'
        })
      }
      
      if (day === 25) {
        events.push({
          id: 3,
          title: 'Project Deadline',
          time: '17:00'
        })
      }
      
      return events
    }

    // Lifecycle
    onMounted(() => {
      // Set today as selected by default
      const today = new Date()
      const todayDay = calendarDays.value.find(day => 
        day.isToday && day.isCurrentMonth
      )
      if (todayDay) {
        selectedDay.value = todayDay
      }
    })

    return {
      // State
      showLoginModal,
      showRegisterModal,
      searchQuery,
      gridColumns,
      sortBy,
      currentDate,
      selectedDay,
      isLoading,
      weekdays,
      
      // Computed
      isLoggedIn,
      userName,
      currentCategory,
      categoryCounts,
      platforms,
      genres,
      categories,
      currentYear,
      currentMonth,
      currentMonthName,
      calendarDays,
      
      // Methods
      setCategory,
      clearSearch,
      navigateToCalendar,
      navigateToProfile,
      togglePlatformFilter,
      toggleGenreFilter,
      clearFilters,
      logout,
      switchToRegister,
      handleLoginSuccess,
      handleRegisterSuccess,
      previousMonth,
      nextMonth,
      selectDay,
      formatSelectedDay,
      hasEventsForDate,
      getEventsForDate,
      
      // Sidebar Store
      sidebarStore
    }
  }
}
</script>

<style scoped>
/* Layout System */
.vue-app {
  display: flex;
  height: 100vh;
  background: #1a1a1a;
  color: #e0e0e0;
  overflow: hidden;
}

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.mobile-overlay.show {
  display: block;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1a1a1a;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #1a1a1a;
}

.calendar-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  color: #e0e0e0;
  overflow: hidden;
  border-radius: 8px;
  margin: 0;
}

/* Calendar Header */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
  min-height: 80px;
}

.month-nav-btn {
  background: #3a3a3a;
  border: 1px solid #505050;
  color: #e0e0e0;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 24px;
  font-weight: bold;
}

.month-nav-btn:hover:not(:disabled) {
  background: #4a9eff;
  border-color: #4a9eff;
  color: white;
}

.month-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.month-year-display {
  text-align: center;
  flex: 1;
  margin: 0 20px;
}

.month-name {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: #e0e0e0;
}

.year {
  font-size: 18px;
  color: #a0a0a0;
  font-weight: 400;
}

/* Calendar Container */
.calendar-container {
  flex: 1;
  padding: 20px 30px;
  overflow: auto;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #404040;
  border-radius: 8px;
  overflow: hidden;
  min-height: 500px;
}

/* Weekday Headers */
.weekday-header {
  background: #3a3a3a;
  color: #a0a0a0;
  padding: 15px 10px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Calendar Days */
.calendar-day {
  background: #2d2d2d;
  min-height: 80px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  position: relative;
  border: 1px solid transparent;
}

.calendar-day:hover {
  background: #3a3a3a;
  border-color: #4a9eff;
}

.calendar-day.other-month {
  background: #1a1a1a;
  color: #666;
}

.calendar-day.other-month:hover {
  background: #2a2a2a;
}

.calendar-day.today {
  background: #1e3a5f;
  border-color: #4a9eff;
}

.calendar-day.today .day-number {
  color: #4a9eff;
  font-weight: bold;
}

.calendar-day.weekend {
  background: #252525;
}

.calendar-day.has-events {
  border-left: 3px solid #4a9eff;
}

.day-number {
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.event-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.event-dot {
  width: 6px;
  height: 6px;
  background: #4a9eff;
  border-radius: 50%;
}

/* Selected Day Info */
.selected-day-info {
  background: #2d2d2d;
  border-top: 1px solid #404040;
  padding: 20px 30px;
  min-height: 120px;
}

.selected-day-info h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #e0e0e0;
  font-weight: 500;
}

.no-events {
  color: #a0a0a0;
  font-style: italic;
  margin: 0;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #3a3a3a;
  border-radius: 6px;
  border-left: 3px solid #4a9eff;
}

.event-time {
  font-size: 12px;
  color: #4a9eff;
  font-weight: 600;
  min-width: 50px;
}

.event-title {
  font-size: 14px;
  color: #e0e0e0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .calendar-header {
    padding: 15px 20px;
    min-height: 70px;
  }
  
  .month-name {
    font-size: 24px;
  }
  
  .year {
    font-size: 16px;
  }
  
  .month-nav-btn {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .calendar-container {
    padding: 15px 20px;
  }
  
  .calendar-day {
    min-height: 60px;
    padding: 6px;
  }
  
  .day-number {
    font-size: 14px;
  }
  
  .weekday-header {
    padding: 10px 5px;
    font-size: 12px;
  }
  
  .selected-day-info {
    padding: 15px 20px;
    min-height: 100px;
  }
  
  .selected-day-info h3 {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .calendar-header {
    padding: 10px 15px;
    min-height: 60px;
  }
  
  .month-name {
    font-size: 20px;
  }
  
  .year {
    font-size: 14px;
  }
  
  .month-nav-btn {
    width: 35px;
    height: 35px;
    font-size: 18px;
  }
  
  .calendar-container {
    padding: 10px 15px;
  }
  
  .calendar-day {
    min-height: 50px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 12px;
  }
  
  .weekday-header {
    padding: 8px 3px;
    font-size: 11px;
  }
}
</style>
