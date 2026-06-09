import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node22.20',
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
      target: 'node22.20',
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
          manualChunks(id) {
            if (!id) return undefined
            const normalizedId = id.replace(/\\\\/g, '/')
            if (normalizedId.includes('/node_modules/')) {
              if (normalizedId.includes('framer-motion')) return 'framer'
              if (normalizedId.includes('lucide-react')) return 'lucide'
              if (normalizedId.includes('zustand')) return 'state'
              return 'vendor'
            }
            if (normalizedId.includes('/src/renderer/src/pages/')) {
              return 'page-' + normalizedId.split('/src/renderer/src/pages/').pop()?.split('.')[0]
            }
            return undefined
          }
        }
      },
      target: 'es2020',
      minify: 'esbuild',
      cssCodeSplit: true,
      sourcemap: false,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1000
    },
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        'framer-motion',
        'lucide-react'
      ]
    }
  }
})
