import { motion } from 'framer-motion'
import type { FC, ReactElement } from 'react'
import { useState, memo } from 'react'
import { FolderOpen, Play, SquareX } from 'lucide-react'
import type { EngineCardProps } from '../types'
import { generateGradient } from '@renderer/utils/generateGradient'

interface EngineCardComponentProps extends EngineCardProps {
  onLaunch: (exePath: string) => void
  onOpenDir: (dirPath: string) => void
  onDelete: (dirPath: string) => void
}

const EngineCard: FC<EngineCardComponentProps> = memo(
  ({
    version,
    exePath,
    directoryPath,
    folderSize,
    lastLaunch,
    gradient,
    onLaunch,
    onOpenDir,
    onDelete
  }): ReactElement => {
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
        if (result.success && result.size) {
          setCurrentSize(result.size)
        } else {
          setCurrentSize('Error')
        }
      }

      setCalculating(false)
    }

    return (
      <motion.div
        className="w-full h-30 bg-[#161616] overflow-hidden rounded-md border border-white/5 flex group hover:border-white/10 transition-all duration-150 ease-in-out select-text"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div
          className="w-48 p-5 border-r border-white/10 h-full flex flex-col justify-between relative select-none"
          style={{ background: currentGradient }}
        >
          <div className="absolute z-0 inset-0 bg-black/10 backdrop-blur-[1px]" />

          <div className="relative z-10">
            <p className="opacity-80 uppercase text-[10px] font-bold tracking-[0.2em]">Version</p>
          </div>
          <h1 className="text-4xl z-20 font-black tracking-tight mt-1">{version}</h1>
        </div>

        <div className="flex-1 h-full bg-[#121212]/50 flex flex-col p-4 justify-between">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white/90">Unreal Engine {version}</h3>
              <p
                className="text-[11px] text-white/40 mt-1 font-mono truncate"
                title={directoryPath}
              >
                {directoryPath}
              </p>
            </div>
            <button
              onClick={() => onDelete(directoryPath)}
              className="p-1 hover:bg-white/5 transition-colors cursor-pointer text-white/50 hover:text-red-500/80 rounded-md ml-2"
              title="Remove from list"
            >
              <SquareX size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] uppercase text-white/30 tracking-wide font-semibold">
                    Size
                  </span>
                  {currentSize.startsWith('~') && (
                    <button
                      onClick={handleCalculateSize}
                      disabled={calculating}
                      className="text-[8px] px-1 py-0.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded cursor-pointer disabled:opacity-50 transition-colors"
                      title="Calculate exact size"
                    >
                      calc
                    </button>
                  )}
                </div>
                <span className="text-xs text-white/70">{currentSize}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-white/30 tracking-wide font-semibold">
                  Usage
                </span>
                <span className="text-xs text-white/70">{lastLaunch}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onOpenDir(directoryPath)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-medium transition-all cursor-pointer"
                title="Open in Explorer"
              >
                <FolderOpen size={14} />
                Directory
              </button>
              <button
                onClick={handleLaunch}
                disabled={launching}
                className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold transition-all shadow-lg ${
                  launching
                    ? 'bg-green-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-blue-600/20'
                }`}
                title="Launch Engine"
              >
                <Play size={14} fill="currentColor" className={launching ? 'animate-pulse' : ''} />
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
