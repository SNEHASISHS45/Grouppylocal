import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          cloudinary: ['cloudinary'],
          vendor: ['react-router-dom', 'framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 550
  }
})