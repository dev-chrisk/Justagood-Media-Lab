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
const authStore = useAuthStore()

authStore.initializeAuth().then(() => {
  app.mount('#app')
}).catch((error) => {
  console.error('Auth initialization failed:', error)
  // Mount app anyway, user will see login form
  app.mount('#app')
})

