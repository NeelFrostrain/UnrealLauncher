import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { config as loadEnv } from 'dotenv'

// Load .env file before build config is processed
loadEnv()

// Load environment variables for build-time substitution
const env = process.env

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __DISCORD_STARTUP_WEBHOOK__: JSON.stringify(env.DISCORD_STARTUP_WEBHOOK_URL || ''),
      __DISCORD_WEBHOOK__: JSON.stringify(env.DISCORD_WEBHOOK_URL || ''),
      // Embed Discord client ID so it's available in production builds without .env
      'process.env.DISCORD_CLIENT_ID': JSON.stringify(
        env.DISCORD_CLIENT_ID || env.VITE_DISCORD_CLIENT_ID || '1507980570725191740'
      )
    },
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
      include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'lucide-react']
    }
  }
})
