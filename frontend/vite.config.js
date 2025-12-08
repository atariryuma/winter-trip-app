import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/winter-trip-app/', // Matches repository name
  server: {
    port: 3000
  }
})
