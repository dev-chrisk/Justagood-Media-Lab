import { createRouter, createWebHistory } from 'vue-router'

// Lazy load components
const MediaLibrary = () => import('@/views/MediaLibrary.vue')
const Books = () => import('@/views/Books.vue')
const Profile = () => import('@/views/Profile.vue')
const Statistics = () => import('@/views/Statistics.vue')
const Calendar = () => import('@/views/Calendar.vue')
const Features = () => import('@/views/Features.vue')

const routes = [
  {
    path: '/',
    name: 'MediaLibrary',
    component: MediaLibrary,
    meta: { requiresAuth: false }
  },
  {
    path: '/books',
    name: 'Books',
    component: Books,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: { requiresAuth: false }
  },
  {
    path: '/features',
    name: 'Features',
    component: Features,
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

