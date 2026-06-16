// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, FolderOpen, X } from 'lucide-react'
import type { Project } from '../../types'
import { usePageVisibility } from '../../hooks/usePageVisibility'

interface RunningProjectsBannerProps {
  /** Full project list used to resolve path → name */
  allProjects: Project[]
}

const POLL_MS = 6000

/**
 * Polls getRunningProjects every 6 s and shows a slim banner when one or more
 * Unreal Editor processes are running. Each chip shows the project name and
 * lets the user click to open the project folder.
 */
export function RunningProjectsBanner({
  allProjects
}: RunningProjectsBannerProps): React.ReactElement | null {
  const [runningPaths, setRunningPaths] = useState<string[]>([])
  const [dismissed, setDismissed] = useState(false)

  const poll = useCallback(async () => {
    try {
      const paths = await window.electronAPI.getRunningProjects()
      setRunningPaths(paths ?? [])
      if (paths && paths.length > 0) setDismissed(false)
    } catch {
      /* native module unavailable — ignore */
    }
  }, [])

  const isVisible = usePageVisibility()

  useEffect(() => {
    if (!isVisible) return undefined
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [poll, isVisible])

  const visible = !dismissed && runningPaths.length > 0

  const resolveName = (p: string): string => {
    const match = allProjects.find(
      (proj) =>
        proj.projectPath?.replace(/\\/g, '/').toLowerCase() === p.replace(/\\/g, '/').toLowerCase()
    )
    return match?.name || p.split(/[/\\]/).pop() || p
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="running-banner"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="overflow-hidden shrink-0"
        >
          <div
            className="flex items-center gap-2.5 px-3 py-2 mb-2"
            style={{
              backgroundColor: 'color-mix(in srgb, #4ade80 6%, var(--color-surface-card))',
              border: '1px solid color-mix(in srgb, #4ade80 20%, transparent)',
              borderRadius: 'var(--radius)'
            }}
          >
            {/* Pulsing dot + label */}
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ backgroundColor: '#4ade80' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: '#4ade80' }}
                />
              </span>
              <Activity size={12} style={{ color: '#4ade80' }} />
              <span className="text-xs font-medium" style={{ color: '#4ade80' }}>
                Running
              </span>
            </span>

            {/* Project chips */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {runningPaths.map((p) => (
                <button
                  key={p}
                  title={p}
                  onClick={() => window.electronAPI.openDirectory(p)}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium cursor-pointer transition-colors shrink-0"
                  style={{
                    borderRadius: 'calc(var(--radius) * 0.5)',
                    backgroundColor: 'color-mix(in srgb, #4ade80 12%, transparent)',
                    border: '1px solid color-mix(in srgb, #4ade80 28%, transparent)',
                    color: '#4ade80'
                  }}
                >
                  <FolderOpen size={10} />
                  {resolveName(p)}
                </button>
              ))}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss running projects banner"
              className="shrink-0 p-0.5 cursor-pointer"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
