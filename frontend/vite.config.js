import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://seng2021-production-e448.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})
