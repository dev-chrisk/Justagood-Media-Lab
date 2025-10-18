import { createRouter, createWebHistory } from 'vue-router'

// Lazy load components
const MediaLibrary = () => import('@/views/MediaLibrary.vue')

const routes = [
  {
    path: '/',
    name: 'MediaLibrary',
    component: MediaLibrary,
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  try {
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    
    // If route requires auth and user is not logged in
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      // Redirect to home page (which shows login form)
      next('/')
    } 
    else {
      next()
    }
  } catch (error) {
    // If there's an error, just proceed to avoid blocking navigation
    next()
  }
})

export default router

