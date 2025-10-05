import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  // State
  const collapsed = ref(false)
  const mobileOpen = ref(false)

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
    
    // Getters
    isCollapsed,
    isMobileOpen
  }
})
