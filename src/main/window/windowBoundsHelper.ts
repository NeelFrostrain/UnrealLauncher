// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { SavedWindowBounds } from '../store'

export interface DisplayInfo {
  workArea: { x: number; y: number; width: number; height: number }
  bounds: { x: number; y: number; width: number; height: number }
}

export function computeSafeWindowBounds(
  saved: SavedWindowBounds,
  displays: DisplayInfo[],
  primary: DisplayInfo,
  clampNative?: (
    x: number,
    y: number,
    width: number,
    height: number,
    screenWidth: number,
    screenHeight: number
  ) => { x: number; y: number; width: number; height: number }
): {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
} {
  const safeWidth = Math.max(800, saved.width || 1200)
  const safeHeight = Math.max(550, saved.height || 800)

  // Verify that the saved window bounds intersect at least one active display
  const intersectsDisplay = displays.some((d) => {
    const area = d.workArea
    return (
      saved.x + safeWidth > area.x + 50 &&
      saved.x < area.x + area.width - 50 &&
      saved.y + safeHeight > area.y + 50 &&
      saved.y < area.y + area.height - 50
    )
  })

  if (!intersectsDisplay) {
    const area = primary.workArea
    return {
      x: Math.round(area.x + (area.width - safeWidth) / 2),
      y: Math.round(area.y + (area.height - safeHeight) / 2),
      width: Math.min(safeWidth, area.width),
      height: Math.min(safeHeight, area.height),
      isMaximized: Boolean(saved.isMaximized)
    }
  }

  if (clampNative) {
    try {
      const activeDisplay =
        displays.find((d) => {
          const b = d.bounds
          return (
            saved.x >= b.x &&
            saved.x < b.x + b.width &&
            saved.y >= b.y &&
            saved.y < b.y + b.height
          )
        }) || primary

      const clamped = clampNative(
        saved.x,
        saved.y,
        safeWidth,
        safeHeight,
        activeDisplay.bounds.width,
        activeDisplay.bounds.height
      )
      return {
        x: clamped.x,
        y: clamped.y,
        width: Math.max(800, clamped.width),
        height: Math.max(550, clamped.height),
        isMaximized: Boolean(saved.isMaximized)
      }
    } catch {
      /* fallback below */
    }
  }

  return {
    x: saved.x,
    y: saved.y,
    width: safeWidth,
    height: safeHeight,
    isMaximized: Boolean(saved.isMaximized)
  }
}
