// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useRef, useLayoutEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface GlobalShortcutHandlers {
  /** Called when Ctrl+F is pressed on the projects page */
  onFocusSearch?: () => void
  /** Called when Ctrl+R is pressed */
  onRefresh?: () => void
  /** Called when Ctrl+N is pressed */
  onNew?: () => void
  /** Called when Ctrl+K is pressed — opens the command palette */
  onCommandPalette?: () => void
}

/**
 * Registers global keyboard shortcuts for the entire app.
 *
 * Ctrl/Cmd+1  → Engines page
 * Ctrl/Cmd+2  → Projects page
 * Ctrl/Cmd+3  → Settings page
 * Ctrl/Cmd+R  → Refresh (current page)
 * Ctrl/Cmd+N  → Add new (project or engine, depending on current page)
 * Ctrl/Cmd+F  → Focus search (projects page)
 * Ctrl/Cmd+K  → Command palette
 */
export function useGlobalShortcuts(handlers: GlobalShortcutHandlers = {}): void {
  const navigate = useNavigate()
  const location = useLocation()
  const handlersRef = useRef(handlers)
  // Keep ref current on every render — standard pattern for stable listener closures
  useLayoutEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return

      // Don't fire shortcuts when typing in an input / textarea / contenteditable
      const tag = (e.target as HTMLElement)?.tagName
      const isEditable =
        tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable
      if (isEditable && e.key !== 'Escape') return

      switch (e.key) {
        case '1':
          e.preventDefault()
          navigate('/engines')
          break
        case '2':
          e.preventDefault()
          navigate('/projects')
          break
        case '3':
          e.preventDefault()
          navigate('/settings')
          break
        case 'r':
        case 'R':
          if (!isEditable) {
            e.preventDefault()
            handlersRef.current.onRefresh?.()
          }
          break
        case 'n':
        case 'N':
          if (!isEditable) {
            e.preventDefault()
            handlersRef.current.onNew?.()
          }
          break
        case 'f':
        case 'F':
          if (!isEditable && location.pathname.startsWith('/projects')) {
            e.preventDefault()
            handlersRef.current.onFocusSearch?.()
          }
          break
        case 'k':
        case 'K':
          if (!isEditable) {
            e.preventDefault()
            handlersRef.current.onCommandPalette?.()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, location.pathname])
}
