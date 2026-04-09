import { useEffect, useState } from 'react'
import { Minus, Square, Minimize2, X } from 'lucide-react'

const Titlebar = (): React.ReactElement => {
  const [isMaximized, setIsMaximized] = useState(false)

  const handleMinimize = (): void => window.electronAPI?.windowMinimize()
  const handleMaximize = (): void => {
    window.electronAPI?.windowMaximize()
    setIsMaximized((prev) => !prev)
  }
  const handleClose = (): void => window.electronAPI?.windowClose()

  useEffect(() => {
    const update = async (): Promise<void> => {
      const maximized = await window.electronAPI?.windowIsMaximized()
      setIsMaximized(!!maximized)
    }
    update()
    const interval = setInterval(update, 500)
    return () => clearInterval(interval)
  }, [])

  const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties
  const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

  return (
    <div
      className="w-full h-10 flex items-center select-none shrink-0"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      {/* Draggable empty region */}
      <div className="flex-1 h-full" style={drag} />

      {/* Window controls */}
      <div className="flex items-center h-full" style={noDrag}>
        <button
          onClick={handleMinimize}
          className="w-11 h-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Minimize2 size={12} /> : <Square size={12} />}
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-full flex items-center justify-center text-white/40 hover:text-white hover:bg-red-600/80 transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default Titlebar
