import { useEffect, useState, memo } from 'react'
import { motion } from 'framer-motion'
import type { Project } from '../types'
import { FolderOpen, Play, Trash2, Star, StarOff } from 'lucide-react'
import ProjectCardButton from './ProjectCardButton'
import { resolveAsset } from '../utils/resolveAsset'

const ProjectCard = memo(({
  createdAt,
  name,
  size,
  version,
  thumbnail,
  projectPath,
  isFavorite,
  onToggleFavorite,
  onLaunch,
  onOpenDir,
  onDelete
}: Project & {
  isFavorite: boolean
  onToggleFavorite: (projectPath: string) => void
  onLaunch: (projectPath: string) => void
  onOpenDir: (dirPath: string) => void
  onDelete: (projectPath: string) => void
}) => {
  const [launching, setLaunching] = useState(false)
  const [currentSize, setCurrentSize] = useState(size)
  const [imageSrc, setImageSrc] = useState<string>(resolveAsset(undefined))

  useEffect(() => {
    const loadThumbnail = async (): Promise<void> => {
      if (thumbnail && window.electronAPI) {
        const dataUrl = await window.electronAPI.loadImage(thumbnail)
        if (dataUrl) {
          setImageSrc(dataUrl)
        } else {
          setImageSrc(resolveAsset(undefined))
        }
      } else {
        setImageSrc(resolveAsset(undefined))
      }
    }

    loadThumbnail()
  }, [thumbnail])

  useEffect(() => {
    setCurrentSize(size)
  }, [size])

  const handleLaunch = async (): Promise<void> => {
    if (!projectPath) return
    setLaunching(true)
    await onLaunch(projectPath)
    setTimeout(() => setLaunching(false), 3000)
  }

  return (
    <motion.div
      className="w-full h-52 bg-[#121212] rounded-md border border-white/10 cursor-pointer overflow-hidden hover:border-blue-500/50 hover:bg-[#1a1a1a] transition-all duration-200 ease-in-out group relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {launching && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-white/90 font-medium">Launching...</p>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-20 flex items-center justify-center gap-4 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ProjectCardButton
          icon={<Play size={16} />}
          onClick={handleLaunch}
          title="Launch Project"
        />
        <ProjectCardButton
          icon={isFavorite ? <Star size={16} /> : <StarOff size={16} />}
          onClick={() => projectPath && onToggleFavorite(projectPath)}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        />
        <ProjectCardButton
          icon={<FolderOpen size={16} />}
          onClick={() => projectPath && onOpenDir(projectPath)}
          title="Open Directory"
        />
        <ProjectCardButton
          icon={<Trash2 size={16} />}
          onClick={() => projectPath && onDelete(projectPath)}
          title="Remove from list"
        />
      </div>

      <div className="w-full h-28 relative overflow-hidden">
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover opacity-100 group-hover:opacity-40 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = resolveAsset(undefined)
          }}
        />
        <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-xs font-mono text-blue-500">
          {version.length > 10 ? version.slice(0, 5) + '...' : version}
        </div>
      </div>

      <div className="w-full h-0.5 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>

      <div className="w-full p-3 flex flex-col justify-between h-[calc(100%-114px)]">
        <p
          className="text-sm font-semibold truncate text-gray-200 uppercase tracking-wider"
          title={name}
        >
          {name}
        </p>

        <div className="flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Created</span>
            <span className="text-xs text-gray-400">{createdAt}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Size</span>
            <span className="text-xs text-gray-400 font-mono">{currentSize}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

ProjectCard.displayName = 'ProjectCard'

export default ProjectCard
