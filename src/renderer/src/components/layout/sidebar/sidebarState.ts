// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const MIN_WIDTH = 180
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 288
const COLLAPSED_WIDTH = 52

/**
 * Custom hook for managing Sidebar state and drag behavior
 */
export function useSidebarState() {
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  })
  const [width, setWidth] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('sidebarWidth') || '', 10)
    return isNaN(saved) ? DEFAULT_WIDTH : Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, saved))
  })

  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const collapsedRef = useRef(collapsed)

  // Keep ref in sync with state
  useEffect(() => {
    collapsedRef.current = collapsed
  }, [collapsed])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (collapsedRef.current) return
      dragging.current = true
      startX.current = e.clientX
      startWidth.current = width
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [width]
  )

  useEffect(() => {
    const onMove = (e: MouseEvent): void => {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      const next = startWidth.current + delta
      // Snap to collapsed when dragged far enough left
      if (next < MIN_WIDTH - 40) {
        dragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        collapsedRef.current = true
        setCollapsed(true)
        localStorage.setItem('sidebarCollapsed', 'true')
        return
      }
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)))
    }

    const onUp = (): void => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setWidth((w) => {
        localStorage.setItem('sidebarWidth', String(w))
        return w
      })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const toggleCollapse = (): void => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebarCollapsed', String(!prev))
      return !prev
    })
  }

  const handleNavClick = (basePath: string): void => {
    const saved = localStorage.getItem('lastVisitedPath') ?? ''
    const lastPath = saved.startsWith(basePath) ? saved : basePath
    navigate(lastPath)
  }

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width

  return {
    collapsed,
    width,
    currentWidth,
    location,
    onMouseDown,
    toggleCollapse,
    handleNavClick,
    MIN_WIDTH,
    MAX_WIDTH,
    COLLAPSED_WIDTH
  }
}
