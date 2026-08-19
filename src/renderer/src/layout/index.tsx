// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar, Titlebar } from '../components'
import { useNavigationPersist, useGlobalShortcuts } from '../hooks'
import { CommandPalette } from '../components/ui/CommandPalette'
import { LegalModal, LegalTabType } from '../components/ui/LegalModal'
import { CURRENT_LEGAL_VERSION } from '../utils/legalConstants'
import { loadSettings } from '../utils/settings'

const LayoutWrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  // Persist the current route on every navigation so the app restores it on next launch
  useNavigationPersist()

  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  // Legal / Terms & Privacy Policy state
  const [legalModalOpen, setLegalModalOpen] = useState(() => {
    try {
      const settings = loadSettings()
      const accepted = settings.acceptedLegalVersion || String(settings.acceptedLegalPolicyVersion || '')
      return accepted !== CURRENT_LEGAL_VERSION
    } catch {
      return false
    }
  })
  const [legalModalMandatory, setLegalModalMandatory] = useState(() => {
    try {
      const settings = loadSettings()
      const accepted = settings.acceptedLegalVersion || String(settings.acceptedLegalPolicyVersion || '')
      return accepted !== CURRENT_LEGAL_VERSION
    } catch {
      return false
    }
  })
  const [legalModalTab, setLegalModalTab] = useState<LegalTabType>('terms')

  // Ctrl+K while the window is focused — renderer handles it directly
  useGlobalShortcuts({ onCommandPalette: openPalette })

  // When the window was hidden (tray) the palette opened in its own mini-window.
  // If the user triggers trigger-open-command-palette or open-command-palette, open inline.
  useEffect(() => {
    if (!window.electronAPI?.onOpenCommandPalette) return
    return window.electronAPI.onOpenCommandPalette(openPalette)
  }, [openPalette])

  useEffect(() => {
    const handler = () => openPalette()
    window.addEventListener('trigger-open-command-palette', handler)
    return () => window.removeEventListener('trigger-open-command-palette', handler)
  }, [openPalette])

  // Listen for global open-legal-modal events triggered anywhere in the app
  useEffect(() => {
    const handleOpenLegal = (e: Event): void => {
      const customEvent = e as CustomEvent<{ tab?: LegalTabType }>
      setLegalModalTab(customEvent.detail?.tab || 'terms')
      setLegalModalMandatory(false)
      setLegalModalOpen(true)
    }
    window.addEventListener('open-legal-modal', handleOpenLegal)
    return () => window.removeEventListener('open-legal-modal', handleOpenLegal)
  }, [])

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
      <div id="app-scale-root" className="w-full h-full flex flex-col">
        <div className="flex-1 flex min-h-0">
          {/* Sidebar is chrome — keep select-none */}
          <div className="select-none">
            <Sidebar />
          </div>
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            {/* Titlebar is chrome — keep select-none */}
            <div className="select-none">
              <Titlebar />
            </div>
            <div className="flex-1 min-h-0 min-w-0 p-3.5 pt-1 flex flex-col">
              <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">{children}</div>
            </div>
          </div>
        </div>
      </div>

      {/* In-app command palette — portal-rendered, available on every page */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />

      {/* In-app Legal / Terms & Privacy Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        isMandatory={legalModalMandatory}
        initialTab={legalModalTab}
        onClose={() => setLegalModalOpen(false)}
        onAccept={() => {
          setLegalModalOpen(false)
          setLegalModalMandatory(false)
        }}
      />
    </div>
  )
}

export default LayoutWrapper
