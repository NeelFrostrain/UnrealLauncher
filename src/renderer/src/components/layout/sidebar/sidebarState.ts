// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const MIN_WIDTH = 180
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 288
const COLLAPSED_WIDTH = 52

export function clampSidebarWidth(targetWidth: number, viewportWidth: number): number {
  const maxAllowed = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, viewportWidth - 320))
  return Math.min(maxAllowed, Math.max(MIN_WIDTH, targetWidth))
}

/**
 * Custom hook for managing Sidebar state and drag behavior
 */
export function useSidebarState(): {
  collapsed: boolean
  width: number
  currentWidth: number
  isDragging: boolean
  location: ReturnType<typeof useLocation>
  onMouseDown: (e: React.MouseEvent) => void
  toggleCollapse: () => void
  handleNavClick: (basePath: string) => void
  MIN_WIDTH: number
  MAX_WIDTH: number
  COLLAPSED_WIDTH: number
} {
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true'
    } catch {
      return false
    }
  })
  const [width, setWidth] = useState<number>(() => {
    try {
      const saved = parseInt(localStorage.getItem('sidebarWidth') || '', 10)
      const initial = isNaN(saved) ? DEFAULT_WIDTH : saved
      const vpWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
      return clampSidebarWidth(initial, vpWidth)
    } catch {
      return DEFAULT_WIDTH
    }
  })
  const [isDragging, setIsDragging] = useState(false)

  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const collapsedRef = useRef(collapsed)

  // Keep ref in sync with state
  useEffect(() => {
    collapsedRef.current = collapsed
  }, [collapsed])

  // Clamp width when window resizes so main content is never squished
  useEffect(() => {
    const onResize = (): void => {
      setWidth((current) => clampSidebarWidth(current, window.innerWidth))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (collapsedRef.current) return
      dragging.current = true
      setIsDragging(true)
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
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        collapsedRef.current = true
        setCollapsed(true)
        try {
          localStorage.setItem('sidebarCollapsed', 'true')
        } catch {
          /* ignore */
        }
        return
      }
      setWidth(clampSidebarWidth(next, window.innerWidth))
    }

    const onUp = (): void => {
      if (!dragging.current) return
      dragging.current = false
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setWidth((w) => {
        try {
          localStorage.setItem('sidebarWidth', String(w))
        } catch {
          /* ignore */
        }
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
      const next = !prev
      try {
        localStorage.setItem('sidebarCollapsed', String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const handleNavClick = (basePath: string): void => {
    let saved = ''
    try {
      saved = localStorage.getItem('lastVisitedPath') ?? ''
    } catch {
      /* ignore */
    }
    const lastPath = saved.startsWith(basePath) ? saved : basePath
    navigate(lastPath)
  }

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width

  return {
    collapsed,
    width,
    currentWidth,
    isDragging,
    location,
    onMouseDown,
    toggleCollapse,
    handleNavClick,
    MIN_WIDTH,
    MAX_WIDTH,
    COLLAPSED_WIDTH
  }
}
