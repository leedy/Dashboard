import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow access from any host
    allowedHosts: [
      '.internal.notesin9.com',
      '.notesin9.com',
      '.test',
      '.local',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      // Proxy all /api requests to the backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    host: true, // Allow access from any host
    allowedHosts: [
      '.test',     // Allows pi.test, dev.test, staging.test, etc.
      '.local',    // Allows *.local domains
      'localhost', // Explicit localhost
      '127.0.0.1'  // Explicit loopback
    ]
  }
})
