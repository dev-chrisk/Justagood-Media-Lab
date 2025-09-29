import { createRouter, createWebHistory } from 'vue-router'

// Lazy load components
const MediaLibrary = () => import('@/views/MediaLibrary.vue')
const Profile = () => import('@/views/Profile.vue')
const Statistics = () => import('@/views/Statistics.vue')

const routes = [
  {
    path: '/',
    name: 'MediaLibrary',
    component: MediaLibrary,
    meta: { requiresAuth: false }
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
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  // For now, allow all navigation
  // Auth guard can be added later
  next()
})

export default router

