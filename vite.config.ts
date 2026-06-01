import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/merchant/',
  server: {
    port: 3000,
    proxy: {
      '/service': {
        target: 'http://198.23.133.86:50025',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://198.23.133.86:50025',
        changeOrigin: true,
      },
      '/oem': {
        target: 'http://198.23.133.86:50025',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
