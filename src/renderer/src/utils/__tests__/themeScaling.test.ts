// @vitest-environment jsdom
// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadPersistedScale,
  persistScale,
  loadPersistedRadius,
  persistRadius,
  loadPersistedTheme
} from '../themePersistence'
import { applyScale, applyRadius, applyTheme } from '../themeApplication'
import { clampSidebarWidth } from '../../components/layout/sidebar/sidebarState'
import { BUILT_IN_THEMES } from '../themeTokens'

describe('Theme and Scale Hardening', () => {
  let store: Record<string, string> = {}
  const mockStorage = {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value
    },
    removeItem: (key: string): void => {
      delete store[key]
    },
    clear: (): void => {
      store = {}
    }
  }

  beforeEach(() => {
    store = {}
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        value: mockStorage,
        configurable: true,
        writable: true
      })
    } catch {
      // ignore
    }
    document.documentElement.style.cssText = ''
  })

  describe('Scale Clamping', () => {
    it('returns default 1.0 when nothing stored', () => {
      expect(loadPersistedScale()).toBe(1.0)
    })

    it('clamps lower bound to 0.5', () => {
      persistScale(0.2)
      expect(loadPersistedScale()).toBe(0.5)
    })

    it('clamps upper bound to 2.0', () => {
      persistScale(3.5)
      expect(loadPersistedScale()).toBe(2.0)
    })

    it('safely handles NaN and corrupted storage values', () => {
      mockStorage.setItem('unrealLauncherUIScale', 'not-a-number')
      expect(loadPersistedScale()).toBe(1.0)
    })

    it('applies scale to DOM root and calls electronAPI.setZoomFactor', () => {
      const setZoomFactor = vi.fn()
      Object.defineProperty(window, 'electronAPI', {
        value: {
          setZoomFactor,
          getZoomFactor: vi.fn().mockResolvedValue(1.0)
        },
        writable: true,
        configurable: true
      })

      applyScale(1.5)
      expect(document.documentElement.style.getPropertyValue('--ui-scale')).toBe('1.5')
      expect(setZoomFactor).toHaveBeenCalledWith(1.5)

      applyScale(3.0) // should clamp to 2.0
      expect(document.documentElement.style.getPropertyValue('--ui-scale')).toBe('2')
      expect(setZoomFactor).toHaveBeenCalledWith(2.0)
    })
  })

  describe('Radius Clamping', () => {
    it('returns default 8 when nothing stored', () => {
      expect(loadPersistedRadius()).toBe(8)
    })

    it('clamps radius between 0 and 24', () => {
      persistRadius(-5)
      expect(loadPersistedRadius()).toBe(0)
      persistRadius(50)
      expect(loadPersistedRadius()).toBe(24)
    })

    it('handles NaN gracefully', () => {
      mockStorage.setItem('unrealLauncherRadius', 'invalid')
      expect(loadPersistedRadius()).toBe(8)
    })

    it('applies radius to DOM root', () => {
      applyRadius(16)
      expect(document.documentElement.style.getPropertyValue('--radius')).toBe('16px')
    })
  })

  describe('Font Size and Theme Overrides', () => {
    it('sanitizes corrupted font-size override in storage', () => {
      mockStorage.setItem(
        'unrealLauncherTheme',
        JSON.stringify({
          id: 'dark',
          overrides: { 'font-size': '100px' }
        })
      )
      const theme = loadPersistedTheme()
      expect(theme.overrides['font-size']).toBe('24px')
    })

    it('clamps font-size in applyTheme', () => {
      const base = BUILT_IN_THEMES[0].tokens
      applyTheme(base, { 'font-size': '36px' })
      expect(document.documentElement.style.getPropertyValue('--font-size')).toBe('24px')

      applyTheme(base, { 'font-size': '6px' })
      expect(document.documentElement.style.getPropertyValue('--font-size')).toBe('10px')
    })
  })

  describe('Sidebar Width Responsiveness', () => {
    it('clamps sidebar width within min/max bounds', () => {
      expect(clampSidebarWidth(100, 1920)).toBe(180)
      expect(clampSidebarWidth(500, 1920)).toBe(400)
      expect(clampSidebarWidth(288, 1920)).toBe(288)
    })

    it('ensures at least 320px for main content on narrow windows', () => {
      expect(clampSidebarWidth(350, 450)).toBe(180)
      expect(clampSidebarWidth(350, 600)).toBe(280)
    })
  })
})
