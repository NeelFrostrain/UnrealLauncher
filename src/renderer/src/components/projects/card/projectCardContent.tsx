// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Database, GitBranch } from 'lucide-react'
import { resolveAsset } from '../../utils/resolveAsset'
import { formatVersion, formatDate } from '../projectUtils'

interface ProjectCardContentProps {
  displayName: string
  imageSrc: string
  version: string
  gitInitialized: boolean
  gitBranch: string
  createdAt: string
  lastOpenedAt: string | undefined
  size: string
  hovered: boolean
  launching: boolean
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

/**
 * Renders the project card content (thumbnail, badges, info)
 */
export function ProjectCardContent({
  displayName,
  imageSrc,
  version,
  gitInitialized,
  gitBranch,
  createdAt,
  lastOpenedAt,
  size,
  hovered,
  launching,
  onImageError
}: ProjectCardContentProps) {
  const dateLabel = lastOpenedAt ? formatDate(lastOpenedAt) : createdAt
  const dateType = lastOpenedAt ? 'Opened' : 'Created'

  return (
    <>
      {/* Thumbnail */}
      <img
        src={imageSrc}
        alt={displayName}
        className="absolute inset-0 w-full h-full object-cover bg-center"
        style={{
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 400ms ease'
        }}
        onError={onImageError}
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

      {/* Top badges */}
      <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between">
        <div
          className="bg-black/65 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono tracking-wider"
          style={{
            borderRadius: 'calc(var(--radius) * 0.5)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'color-mix(in srgb, var(--color-accent) 90%, white)'
          }}
        >
          UE {formatVersion(version)}
        </div>
        {gitInitialized && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 bg-black/65 backdrop-blur-md"
            style={{
              borderRadius: 'calc(var(--radius) * 0.5)',
              border: '1px solid rgba(52,211,153,0.3)',
              color: '#34d399'
            }}
          >
            <GitBranch size={9} />
            <span className="text-[9px] font-mono">{gitBranch}</span>
          </div>
        )}
      </div>

      {/* Launching overlay */}
      <AnimatePresence>
        {launching && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin mb-2"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                borderTopColor: 'var(--color-accent)'
              }}
            />
            <p
              className="text-xs tracking-wide"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Launching…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && !launching && (
          <motion.div
            className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-3 gap-2 py-3 bg-linear-to-t from-black/85 to-transparent"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <p className="w-full text-center text-xs opacity-60">
              L-Click: Launch | R-Click: Options
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info */}
      <div
        className={`absolute bottom-0 inset-x-0 z-10 px-3 py-2.5 transition-opacity duration-150 ${hovered ? 'opacity-0' : 'opacity-100'}`}
      >
        <p className="text-sm font-semibold text-white truncate mb-1.5" title={displayName}>
          {displayName}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <Clock size={10} />
            <span className="text-[10px]">
              {dateType} {dateLabel}
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <Database size={10} />
            <span className="text-[10px] font-mono">{size}</span>
          </div>
        </div>
      </div>
    </>
  )
}
