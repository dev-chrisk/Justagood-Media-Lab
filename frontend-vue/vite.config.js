import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read package.json to get version
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    host: 'localhost',
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://teabubble.attrebi.ch',
        changeOrigin: true
      },
      '/data': {
        target: process.env.VITE_API_URL || 'https://teabubble.attrebi.ch',
        changeOrigin: true
      }
    }
  }
})

