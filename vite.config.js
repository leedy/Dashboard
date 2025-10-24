import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/nhl': {
        target: 'https://api-web.nhle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nhl/, ''),
        secure: false,
        followRedirects: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Disable caching to ensure fresh data
            proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
            proxyRes.headers['pragma'] = 'no-cache';
            proxyRes.headers['expires'] = '0';
            console.log('Proxy response:', req.url, proxyRes.statusCode);
          });
        }
      },
      '/api/nfl': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nfl/, ''),
        secure: false,
        followRedirects: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('ESPN NFL Proxy response:', req.url, proxyRes.statusCode);
          });
        }
      },
      '/api/queue-times': {
        target: 'https://queue-times.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/queue-times/, ''),
        secure: false,
        followRedirects: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Queue-Times Proxy response:', req.url, proxyRes.statusCode);
          });
        }
      }
    }
  }
})
