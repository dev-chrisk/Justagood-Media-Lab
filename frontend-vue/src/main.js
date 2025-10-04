import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import './styles/global.css'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth before mounting
console.log('🚀 APP INIT: Starting application initialization')
console.log('🚀 APP INIT: Environment check:', {
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  viteApiUrl: import.meta.env.VITE_API_URL,
  currentUrl: window.location.href,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
})

const authStore = useAuthStore()
console.log('🚀 APP INIT: Auth store created, calling initializeAuth...')

authStore.initializeAuth().then(() => {
  console.log('🚀 APP INIT: Auth initialization successful, mounting app')
  app.mount('#app')
  console.log('🚀 APP INIT: App mounted successfully')
}).catch((error) => {
  console.error('🚀 APP INIT: Auth initialization failed:', error)
  console.log('🚀 APP INIT: Mounting app anyway, user will see login form')
  // Mount app anyway, user will see login form
  app.mount('#app')
  console.log('🚀 APP INIT: App mounted after auth failure')
})

