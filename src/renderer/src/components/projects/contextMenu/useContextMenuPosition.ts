// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useCallback, useLayoutEffect, useState } from 'react'

/**
 * Hook to calculate submenu position relative to parent menu
 * Handles viewport boundaries and auto-repositioning
 */
export function useContextMenuPosition(
  anchorRef: React.RefObject<HTMLButtonElement | null>,
  subRef: React.RefObject<HTMLDivElement | null>,
  parentLeft: number,
  parentWidth: number
): { top: number; left: number } {
  const [pos, setPos] = useState({ top: -9999, left: -9999 })

  const recalc = useCallback(() => {
    if (!anchorRef.current || !subRef.current) return

    const anchor = anchorRef.current.getBoundingClientRect()
    const subH = subRef.current.offsetHeight
    const subW = subRef.current.offsetWidth

    // Calculate vertical position
    let t = anchor.top
    if (t + subH > window.innerHeight - 8) {
      t = window.innerHeight - subH - 8
    }

    // Calculate horizontal position (try right side first, then left)
    let l = parentLeft + parentWidth - 4
    if (l + subW > window.innerWidth - 8) {
      l = parentLeft - subW + 4
    }

    setPos((prev) => (prev.top === t && prev.left === l ? prev : { top: t, left: l }))
  }, [anchorRef, subRef, parentLeft, parentWidth])

  useLayoutEffect(() => {
    recalc()

    if (!subRef.current) return

    // Recalculate on resize
    const ro = new ResizeObserver(recalc)
    ro.observe(subRef.current)

    return () => ro.disconnect()
  }, [recalc])

  return pos
}
