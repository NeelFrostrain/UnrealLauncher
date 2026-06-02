import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src'),
      'main': path.resolve(__dirname, './src/main'),
      'preload': path.resolve(__dirname, './src/preload')
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
  }
})
