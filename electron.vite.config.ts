import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()], // keeps Node built-ins out of the bundle
    build: {
      minify: true,
      rollupOptions: {
        // Ensure all Node built-ins stay external — not bundled
        external: [
          'electron',
          'path',
          'fs',
          'os',
          'child_process',
          'worker_threads',
          'crypto',
          'http',
          'https',
          'net',
          'stream',
          'util',
          'events',
          'url'
        ]
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
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
          drop_console: true,
          drop_debugger: true,
          passes: 1 // one pass is sufficient; 2 passes doubles build time for <1% gain
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
