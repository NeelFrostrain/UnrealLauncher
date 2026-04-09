import { useEffect, useState } from 'react'
import { Minus, Square, Minimize2, X } from 'lucide-react'

const Titlebar = (): React.ReactElement => {
  const [isMaximized, setIsMaximized] = useState(false)

  const handleMinimize = (): void => {
    window.electronAPI?.windowMinimize()
  }

  const handleMaximize = (): void => {
    window.electronAPI?.windowMaximize()
    setIsMaximized((prev) => !prev)
  }

  const handleClose = (): void => {
    window.electronAPI?.windowClose()
  }

  useEffect(() => {
    const updateState = async (): Promise<void> => {
      const maximized = await window.electronAPI?.windowIsMaximized()
      setIsMaximized(!!maximized)
    }

    updateState()

    const interval = setInterval(updateState, 500)
    return () => clearInterval(interval)
  }, [])

  const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties
  const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

  return (
    <div className="w-full h-10 bg-[#1a1a1a] border-b border-white/10 flex items-center px-1 select-none">
      <div className="flex-1 h-full flex items-center gap-2" style={dragStyle}></div>

      <div className="flex items-center gap-0.5" style={noDragStyle}>
        <button
          onClick={handleMinimize}
          className="w-11 h-9 flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-9 flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Minimize2 size={13} /> : <Square size={13} />}
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-9 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
          aria-label="Close"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default Titlebar
