import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-cname',
      closeBundle() {
        copyFileSync('CNAME', 'dist/CNAME')
      }
    }
  ],
  base: '/', // Use absolute paths for GitHub Pages with custom domain
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  preview: {
    allowedHosts: ['.ngrok-free.dev'],
  },
  server: {
    proxy: {
      // Proxy Blogger RSS feed to avoid CORS in development
      '/api/blogger': {
        target: 'https://blog.romangarms.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/blogger/, '/feeds/posts/default'),
        secure: true
      },
      // The AutoX server only allows romangarms.com as a CORS origin, so in
      // development the user count request goes through here instead.
      '/api/autox': {
        target: 'https://autox.romangarms.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/autox/, ''),
        secure: true
      }
    }
  }
})
