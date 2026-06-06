// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar, Titlebar } from '../components'
import { useNavigationPersist } from '../hooks/useNavigationPersist'
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts'
import { CommandPalette } from '../components/ui/CommandPalette'

const LayoutWrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  // Persist the current route on every navigation so the app restores it on next launch
  useNavigationPersist()

  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  // Ctrl+K while the window is focused — renderer handles it directly
  useGlobalShortcuts({ onCommandPalette: openPalette })

  // When the window was hidden (tray) the palette opened in its own mini-window.
  // If the user somehow triggers open-command-palette in the main window, open inline.
  useEffect(() => {
    if (!window.electronAPI?.onOpenCommandPalette) return
    return window.electronAPI.onOpenCommandPalette(openPalette)
  }, [openPalette])

  // palette-navigate: routed here after the mini palette window executes a nav command
  useEffect(() => {
    if (!window.electronAPI?.onPaletteNavigate) return
    return window.electronAPI.onPaletteNavigate((route) => {
      navigate(route)
    })
  }, [navigate])

  // palette-action: routed here after the mini palette window executes an action command.
  // Each page listens for this CustomEvent and runs the appropriate handler.
  useEffect(() => {
    if (!window.electronAPI?.onPaletteAction) return
    return window.electronAPI.onPaletteAction((commandId) => {
      window.dispatchEvent(new CustomEvent('palette-action', { detail: { commandId } }))
    })
  }, [])

  return (
    // select-none is intentionally removed from the root to allow text selection in log viewers,
    // file editors, and other content areas. Chrome elements apply it locally where needed.
    <div
      className="w-screen h-screen p-px overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
    >
      <div
        id="app-scale-root"
        className="w-full h-full flex flex-col"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex-1 flex min-h-0">
          {/* Sidebar is chrome — keep select-none */}
          <div className="select-none">
            <Sidebar />
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Titlebar is chrome — keep select-none */}
            <div className="select-none">
              <Titlebar />
            </div>
            <div className="flex-1 min-h-0 p-3.5 pt-1 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
            </div>
          </div>
        </div>
      </div>

      {/* In-app command palette — portal-rendered, available on every page */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  )
}

export default LayoutWrapper
