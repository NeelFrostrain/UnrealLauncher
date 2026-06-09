import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: true,
      rollupOptions: {
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
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // Build both the main preload and the minimal palette preload
        input: {
          index: resolve('src/preload/index.ts'),
          palette: resolve('src/preload/palette.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    build: {
      rollupOptions: {
        // Two HTML entry points: the full app and the standalone palette window
        input: {
          index: resolve('src/renderer/index.html'),
          palette: resolve('src/renderer/palette.html')
        },
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
          passes: 1
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
