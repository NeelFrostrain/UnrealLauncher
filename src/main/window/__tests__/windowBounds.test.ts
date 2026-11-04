// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { describe, it, expect } from 'vitest'
import { computeSafeWindowBounds, type DisplayInfo } from '../windowBoundsHelper'

const primaryDisplay: DisplayInfo = {
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  workArea: { x: 0, y: 0, width: 1920, height: 1040 }
}

const secondaryDisplay: DisplayInfo = {
  bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
  workArea: { x: 1920, y: 0, width: 2560, height: 1400 }
}

const displays = [primaryDisplay, secondaryDisplay]

describe('Window Bounds Clamping & Multi-Monitor Restore', () => {
  it('restores valid window bounds on primary display', () => {
    const result = computeSafeWindowBounds(
      {
        x: 100,
        y: 100,
        width: 1400,
        height: 900,
        isMaximized: false
      },
      displays,
      primaryDisplay
    )

    expect(result.x).toBe(100)
    expect(result.y).toBe(100)
    expect(result.width).toBe(1400)
    expect(result.height).toBe(900)
    expect(result.isMaximized).toBe(false)
  })

  it('restores window on secondary monitor correctly', () => {
    const result = computeSafeWindowBounds(
      {
        x: 2100,
        y: 200,
        width: 1600,
        height: 1000,
        isMaximized: true
      },
      displays,
      primaryDisplay
    )

    expect(result.x).toBe(2100)
    expect(result.y).toBe(200)
    expect(result.isMaximized).toBe(true)
  })

  it('centers window on primary monitor if stranded off-screen (disconnected display)', () => {
    // Coordinates located far out in negative space or unplugged monitor
    const result = computeSafeWindowBounds(
      {
        x: -5000,
        y: -5000,
        width: 1200,
        height: 800,
        isMaximized: false
      },
      displays,
      primaryDisplay
    )

    // Should fall back to centered within primary display workArea (1920x1040)
    expect(result.x).toBe(Math.round((1920 - 1200) / 2))
    expect(result.y).toBe(Math.round((1040 - 800) / 2))
    expect(result.width).toBe(1200)
    expect(result.height).toBe(800)
  })

  it('enforces minWidth (800) and minHeight (550)', () => {
    const result = computeSafeWindowBounds(
      {
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        isMaximized: false
      },
      displays,
      primaryDisplay
    )

    expect(result.width).toBe(800)
    expect(result.height).toBe(550)
  })

  it('calls native clamp function when provided', () => {
    const mockClamp = (
      x: number,
      y: number,
      w: number,
      h: number,
      _sw: number,
      _sh: number
    ) => ({ x: Math.max(0, x), y: Math.max(0, y), width: w, height: h })

    const result = computeSafeWindowBounds(
      {
        x: -10,
        y: 50,
        width: 1200,
        height: 800,
        isMaximized: false
      },
      displays,
      primaryDisplay,
      mockClamp
    )

    expect(result.x).toBe(0)
    expect(result.y).toBe(50)
  })
})
