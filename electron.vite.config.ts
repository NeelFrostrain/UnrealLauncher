import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      minify: true // minify main process too
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-core': ['react', 'react-dom', 'react-router-dom'],
            framer: ['framer-motion'],
            lucide: ['lucide-react'],
            state: ['zustand']
          }
        }
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // strip console.log in production
          drop_debugger: true,
          passes: 2 // two compression passes
        }
      },
      sourcemap: false,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1000
    },
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'framer-motion']
    }
  }
})
