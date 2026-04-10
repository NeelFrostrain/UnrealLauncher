import { motion } from 'framer-motion'
import type { FC, ReactElement } from 'react'
import { useState, memo } from 'react'
import { Play, FolderOpen, XCircle } from 'lucide-react'
import type { EngineCardProps } from '../../types'
import { generateGradient } from '@renderer/utils/generateGradient'

interface EngineCardComponentProps extends EngineCardProps {
  onLaunch: (exePath: string) => void
  onOpenDir: (dirPath: string) => void
  onDelete: (dirPath: string) => void
}

const EngineCard: FC<EngineCardComponentProps> = memo(
  ({ version, exePath, directoryPath, folderSize, lastLaunch, gradient, onLaunch, onOpenDir, onDelete }): ReactElement => {
    const [currentGradient] = useState(gradient || generateGradient())
    const [launching, setLaunching] = useState(false)
    const [calculating, setCalculating] = useState(false)
    const [currentSize, setCurrentSize] = useState(folderSize)

    const handleLaunch = async (): Promise<void> => {
      setLaunching(true)
      await onLaunch(exePath)
      setTimeout(() => setLaunching(false), 3000)
    }

    const handleCalculateSize = async (): Promise<void> => {
      if (calculating) return
      setCalculating(true)
      setCurrentSize('Calculating...')
      if (window.electronAPI) {
        const result = await window.electronAPI.calculateEngineSize(directoryPath)
        setCurrentSize(result.success && result.size ? result.size : 'Error')
      }
      setCalculating(false)
    }

    return (
      <motion.div
        className="w-full h-36 overflow-hidden flex select-text"
        style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* Gradient panel */}
        <div
          className="w-48 p-5 h-full flex flex-col justify-between relative select-none"
          style={{ background: currentGradient, borderRight: '1px solid var(--color-border)' }}
        >
          <div className="absolute z-0 inset-0 bg-black/10 backdrop-blur-[1px]" />
          <div className="relative z-10">
            <p className="opacity-80 uppercase text-[10px] font-bold tracking-[0.2em] text-white">Version</p>
          </div>
          <h1 className="text-4xl z-20 font-black tracking-tight mt-1 text-white">{version}</h1>
        </div>

        {/* Info panel */}
        <div className="flex-1 h-full flex flex-col p-4 justify-between"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 50%, transparent)' }}>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Unreal Engine {version}
              </h3>
              <p className="text-[11px] mt-1 font-mono truncate" style={{ color: 'var(--color-text-muted)' }} title={directoryPath}>
                {directoryPath}
              </p>
            </div>
            <button
              onClick={() => onDelete(directoryPath)}
              className="flex p-1 transition-colors cursor-pointer hover:text-red-400 rounded-md ml-2"
              style={{ color: 'var(--color-text-muted)' }}
              title="Remove from list"
            >
              <XCircle size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    Size
                  </span>
                  {currentSize.startsWith('~') && (
                    <button
                      onClick={handleCalculateSize}
                      disabled={calculating}
                      className="text-[8px] px-1 py-0.5 rounded cursor-pointer disabled:opacity-50 transition-colors"
                      style={{ color: 'color-mix(in srgb, var(--color-accent) 90%, white)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' }}
                      title="Calculate exact size"
                    >
                      calc
                    </button>
                  )}
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{currentSize}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  Usage
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{lastLaunch}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onOpenDir(directoryPath)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', color: 'var(--color-text-secondary)' }}
                title="Open in Explorer"
              >
                <FolderOpen size={14} />
                Directory
              </button>
              <button
                onClick={handleLaunch}
                disabled={launching}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold transition-all shadow-lg ${launching ? 'cursor-not-allowed' : 'cursor-pointer'} hover:scale-105 ease-in-out duration-100`}
                style={{
                  borderRadius: 'var(--radius)',
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-accent)',
                  boxShadow: launching ? 'none' : '0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)'
                }}
                title="Launch Engine"
              >
                <Play size={14} className={launching ? 'animate-pulse' : ''} />
                {launching ? 'Launching...' : 'Launch'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
)

EngineCard.displayName = 'EngineCard'
export default EngineCard
