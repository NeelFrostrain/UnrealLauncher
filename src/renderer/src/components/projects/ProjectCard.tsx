import { useEffect, useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Project } from '../../types'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import StorageIcon from '@mui/icons-material/Storage'
import { resolveAsset } from '../../utils/resolveAsset'

// Cleans up raw GUIDs like {1C06A...} → shows as "Custom" or short version tag
const formatVersion = (v: string): string => {
  if (!v || v === 'Unknown') return '?'
  // GUID format — not a real version string
  if (v.startsWith('{') || v.length > 12) return 'Custom'
  return v
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  } catch { return dateString }
}

const ProjectCard = memo(
  ({
    createdAt,
    lastOpenedAt,
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
    const [hovered, setHovered] = useState(false)

    useEffect(() => {
      const load = async (): Promise<void> => {
        if (thumbnail && window.electronAPI) {
          const dataUrl = await window.electronAPI.loadImage(thumbnail)
          setImageSrc(dataUrl ?? resolveAsset(undefined))
        } else {
          setImageSrc(resolveAsset(undefined))
        }
      }
      load()
    }, [thumbnail])

    useEffect(() => { setCurrentSize(size) }, [size])

    const handleLaunch = async (): Promise<void> => {
      if (!projectPath) return
      setLaunching(true)
      await onLaunch(projectPath)
      setTimeout(() => setLaunching(false), 3000)
    }

    const dateLabel = lastOpenedAt ? formatDate(lastOpenedAt) : createdAt
    const dateType = lastOpenedAt ? 'Opened' : 'Created'
    const versionLabel = formatVersion(version)

    return (
      <motion.div
        className="relative w-full h-48 rounded-lg overflow-hidden cursor-pointer select-none bg-[#111] border-black/5 hover:border-blue-600 border-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        {/* Thumbnail */}
        <img
          src={imageSrc}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover bg-center"
          onError={(e) => { e.currentTarget.src = resolveAsset(undefined) }}
        />

        {/* Persistent gradient — bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between">
          {/* Version */}
          <div className="bg-black/65 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-[10px] font-mono text-blue-400 tracking-wider">
            UE {versionLabel}
          </div>

          {/* Favorite */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={() => projectPath && onToggleFavorite(projectPath)}
            className="flex p-1.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-colors"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite
              ? <StarIcon sx={{ fontSize: 14 }} className="text-yellow-400" />
              : <StarBorderIcon sx={{ fontSize: 14 }} className="text-white/40" />
            }
          </motion.button>
        </div>

        {/* Launching overlay */}
        <AnimatePresence>
          {launching && (
            <motion.div
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mb-2" />
              <p className="text-xs text-white/70 tracking-wide">Launching…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover actions — slide up from middle */}
        <AnimatePresence>
          {hovered && !launching && (
            <motion.div
              className="absolute inset-x-0 z-20 flex items-center justify-center gap-2"
              style={{ top: '30%' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              <motion.button
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={handleLaunch}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-bold shadow-lg shadow-blue-600/40 transition-colors cursor-pointer"
              >
                <PlayArrowIcon sx={{ fontSize: 14 }} />
                Launch
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={() => projectPath && onOpenDir(projectPath)}
                className="flex p-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm transition-colors cursor-pointer"
                title="Open Folder"
              >
                <FolderOpenIcon sx={{ fontSize: 14 }} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={() => projectPath && onDelete(projectPath)}
                className="flex p-2 rounded-md bg-white/10 hover:bg-red-500/25 border border-white/15 hover:border-red-500/40 backdrop-blur-sm transition-colors cursor-pointer text-white/50 hover:text-red-400"
                title="Remove from list"
              >
                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom info — always visible */}
        <div className="absolute bottom-0 inset-x-0 z-10 px-3 py-2.5">
          <p className="text-sm font-semibold text-white truncate mb-1.5" title={name}>
            {name}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-white/45">
              <AccessTimeIcon sx={{ fontSize: 10 }} />
              <span className="text-[10px]">{dateType} {dateLabel}</span>
            </div>
            <div className="flex items-center gap-1 text-white/45">
              <StorageIcon sx={{ fontSize: 10 }} />
              <span className="text-[10px] font-mono">{currentSize}</span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
)

ProjectCard.displayName = 'ProjectCard'
export default ProjectCard
