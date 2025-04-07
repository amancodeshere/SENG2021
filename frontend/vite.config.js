import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), //shadcsn 
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://seng2021-production-e448.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})