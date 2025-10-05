import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  // Load initial state from localStorage
  const loadSidebarState = () => {
    try {
      const saved = localStorage.getItem('sidebarState')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          collapsed: parsed.collapsed || false,
          mobileOpen: false // Always start with mobile sidebar closed
        }
      }
    } catch (err) {
      console.error('Failed to load sidebar state from localStorage:', err)
    }
    return { collapsed: false, mobileOpen: false }
  }

  // Save state to localStorage
  const saveSidebarState = (state) => {
    try {
      localStorage.setItem('sidebarState', JSON.stringify({
        collapsed: state.collapsed
        // Don't save mobileOpen as it should always start closed
      }))
    } catch (err) {
      console.error('Failed to save sidebar state to localStorage:', err)
    }
  }

  // Initialize state from localStorage
  const initialState = loadSidebarState()
  
  // State
  const collapsed = ref(initialState.collapsed)
  const mobileOpen = ref(initialState.mobileOpen)

  // Watch for changes and persist to localStorage
  watch(collapsed, (newValue) => {
    saveSidebarState({ collapsed: newValue, mobileOpen: mobileOpen.value })
  }, { immediate: false })

  // Actions
  const toggleSidebar = () => {
    collapsed.value = !collapsed.value
  }

  const toggleMobileSidebar = () => {
    mobileOpen.value = !mobileOpen.value
  }

  const closeMobileSidebar = () => {
    mobileOpen.value = false
  }

  const setCollapsed = (value) => {
    collapsed.value = value
  }

  const setMobileOpen = (value) => {
    mobileOpen.value = value
  }

  // Reset sidebar state to defaults
  const resetSidebarState = () => {
    collapsed.value = false
    mobileOpen.value = false
    // Clear from localStorage
    localStorage.removeItem('sidebarState')
  }

  // Getters
  const isCollapsed = computed(() => collapsed.value)
  const isMobileOpen = computed(() => mobileOpen.value)

  return {
    // State
    collapsed,
    mobileOpen,
    
    // Actions
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    setCollapsed,
    setMobileOpen,
    resetSidebarState,
    
    // Getters
    isCollapsed,
    isMobileOpen
  }
})
