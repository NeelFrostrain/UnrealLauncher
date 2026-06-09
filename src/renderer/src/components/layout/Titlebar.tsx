// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState } from 'react'
import { Minus, Square, Minimize2, X, MessageSquarePlus, MessageCircle } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import FeedbackDialog from './FeedbackDialog'
import { getSetting } from '../../utils/settings'
import { usePageVisibility } from '../../hooks/usePageVisibility'
import config from '../../../../config'

// const IS_MAC = navigator.platform.toLowerCase().includes('mac')
// const MOD = IS_MAC ? '⌘' : 'Ctrl'

// function Kbd({ k }: { k: string }): React.ReactElement {
//   return (
//     <kbd
//       className="inline-flex items-center justify-center px-1 py-0.5 text-[10px] font-mono font-semibold rounded select-none"
//       style={{
//         backgroundColor: 'var(--color-surface-card)',
//         border: '1px solid var(--color-border)',
//         color: 'var(--color-text-secondary)',
//         boxShadow: '0 1px 0 var(--color-border)',
//         minWidth: 20
//       }}
//     >
//       {k}
//     </kbd>
//   )
// }

const Titlebar = (): React.ReactElement => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [showButtons, setShowButtons] = useState(() => getSetting('showTitlebarButtons'))

  const handleMinimize = (): void => window.electronAPI?.windowMinimize()
  const handleMaximize = (): void => {
    window.electronAPI?.windowMaximize()
    setIsMaximized((prev) => !prev)
  }
  const handleClose = (): void => window.electronAPI?.windowClose()

  const isVisible = usePageVisibility()

  useEffect(() => {
    const update = async (): Promise<void> => {
      const maximized = await window.electronAPI?.windowIsMaximized()
      setIsMaximized(!!maximized)
    }
    update()
    if (!isVisible) return undefined

    const interval = setInterval(update, 500)

    // React to setting changes from the Settings page
    const onSettingChanged = (): void => setShowButtons(getSetting('showTitlebarButtons'))
    window.addEventListener('app-settings-changed', onSettingChanged)

    return () => {
      clearInterval(interval)
      window.removeEventListener('app-settings-changed', onSettingChanged)
    }
  }, [isVisible])

  const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties
  const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

  return (
    <>
      <div
        className="w-full h-8 flex items-center select-none shrink-0"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        {/* <div className='flex mx-2 justify-center items-center'>
              <Kbd k={MOD} /> <span className='text-[10px] font-mono' style={{color: 'var(--color-text-secondary)'}}>+</span> <Kbd k="K" />
        </div>
         */}

        {/* Draggable region */}
        <div className="flex-1 h-full" style={drag} />

        {/* Feedback + Discord */}
        {showButtons && (
          <div className="flex items-center h-full gap-0.5 px-1" style={noDrag}>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium cursor-pointer transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                color: 'var(--color-text-muted)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-surface-card)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="Feedback"
            >
              <MessageSquarePlus size={13} />
              Feedback
            </button>
            <button
              onClick={() => window.electronAPI.openExternal(config.discordInvite)}
              className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-semibold cursor-pointer transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                color: '#7289da',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  'color-mix(in srgb, #5865F2 10%, transparent)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="Join Discord"
            >
              <MessageCircle size={13} />
              Discord
            </button>
            {/* Divider */}
            <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>
        )}

        {/* Window controls */}
        <div className="flex items-center h-full" style={noDrag}>
          <button
            onClick={handleMinimize}
            className="w-11 h-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)'
              e.currentTarget.style.backgroundColor = 'var(--color-surface-card)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleMaximize}
            className="w-11 h-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)'
              e.currentTarget.style.backgroundColor = 'var(--color-surface-card)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 size={12} /> : <Square size={12} />}
          </button>
          <button
            onClick={handleClose}
            className="w-11 h-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {feedbackOpen && <FeedbackDialog onClose={() => setFeedbackOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

export default Titlebar
