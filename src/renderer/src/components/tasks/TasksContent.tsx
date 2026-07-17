// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useMemo } from 'react'
import {
  RefreshCw,
  Trash2,
  FolderOpen,
  AlertTriangle,
  Cpu,
  HardDrive,
  Layers
} from 'lucide-react'
import type { ProcessFilterType } from '../../types'

interface SystemProcess {
  pid: number
  name: string
  memoryBytes: number
  cpuSeconds?: number
  path?: string
  type: 'editor' | 'build' | 'service' | 'other'
}

interface TasksContentProps {
  processes: SystemProcess[]
  loading: boolean
  searchQuery: string
  currentTab: ProcessFilterType
  killingPid: number | null
  onKill: (pid: number, name: string) => void
  onOpenFolder: (path: string) => void
}

export default function TasksContent({
  processes,
  loading,
  searchQuery,
  currentTab,
  killingPid,
  onKill,
  onOpenFolder
}: TasksContentProps): React.ReactElement {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB'
    const mb = bytes / (1024 * 1024)
    if (mb >= 1024) {
      return (mb / 1024).toFixed(2) + ' GB'
    }
    return mb.toFixed(1) + ' MB'
  }

  const filteredProcesses = useMemo(() => {
    let filtered = processes

    // Filter by tab
    if (currentTab === 'editors') {
      filtered = filtered.filter((p) => p.type === 'editor')
    } else if (currentTab === 'builds') {
      filtered = filtered.filter((p) => p.type === 'build')
    } else if (currentTab === 'services') {
      filtered = filtered.filter((p) => p.type === 'service')
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.pid.toString().includes(searchQuery) ||
          (p.path && p.path.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    return filtered
  }, [processes, searchQuery, currentTab])

  // Analytics metrics
  const metrics = useMemo(() => {
    const filtered = filteredProcesses
    let totalMemVal = 0
    filtered.forEach((p) => {
      totalMemVal += p.memoryBytes
    })

    return {
      totalMemVal,
      totalMem: formatBytes(totalMemVal),
      totalCount: filtered.length
    }
  }, [filteredProcesses])

  const getTypeBadgeDetails = (type: 'editor' | 'build' | 'service' | 'other') => {
    switch (type) {
      case 'editor':
        return {
          bg: 'rgba(59, 130, 246, 0.08)',
          text: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          glow: 'rgba(59, 130, 246, 0.4)',
          label: 'Unreal Editor'
        }
      case 'build':
        return {
          bg: 'rgba(236, 72, 153, 0.08)',
          text: '#f472b6',
          border: '1px solid rgba(236, 72, 153, 0.25)',
          glow: 'rgba(236, 72, 153, 0.4)',
          label: 'Build System'
        }
      case 'service':
        return {
          bg: 'rgba(16, 185, 129, 0.08)',
          text: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          glow: 'rgba(16, 185, 129, 0.4)',
          label: 'Service/Link'
        }
      default:
        return {
          bg: 'rgba(156, 163, 175, 0.08)',
          text: '#9ca3af',
          border: '1px solid rgba(156, 163, 175, 0.25)',
          glow: 'rgba(156, 163, 175, 0.4)',
          label: 'Process'
        }
    }
  }

  // Get max memory used by a single process for relative bar sizes
  const maxMemory = useMemo(() => {
    const maxVal = Math.max(...filteredProcesses.map((p) => p.memoryBytes), 0)
    return maxVal > 0 ? maxVal : 1024 * 1024 * 1024
  }, [filteredProcesses])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Metrics Summary */}
      <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className="grid grid-cols-3 gap-4">
          <div
            className="p-4 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Active Processes
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                {metrics.totalCount}
              </p>
            </div>
            <Layers size={20} style={{ color: 'var(--color-accent)' }} />
          </div>

          <div
            className="p-4 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Total Memory
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                {metrics.totalMem}
              </p>
            </div>
            <HardDrive size={20} style={{ color: '#10b981' }} />
          </div>

          <div
            className="p-4 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Filter
              </p>
              <p className="text-lg font-bold mt-1 capitalize" style={{ color: 'var(--color-text-primary)' }}>
                {currentTab === 'all' ? 'All Types' : currentTab}
              </p>
            </div>
            <Cpu size={20} style={{ color: '#ec4899' }} />
          </div>
        </div>
      </div>

      {/* Process List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-24 space-y-4">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
            <div className="text-center space-y-1">
              <p
                className="text-sm font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Scanning System
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Building real-time process usage mappings...
              </p>
            </div>
          </div>
        ) : filteredProcesses.length > 0 ? (
          <div className="overflow-y-auto h-full">
            {/* Table Header */}
            <div
              className="grid grid-cols-12 gap-4 px-6 py-3 font-medium text-xs border-b sticky top-0 z-10"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-muted)'
              }}
            >
              <div className="col-span-4">Process / Executable</div>
              <div className="col-span-2 text-right">PID</div>
              <div className="col-span-2 text-center">Category</div>
              <div className="col-span-3">Memory Usage</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Process Rows */}
            {filteredProcesses.map((proc) => {
              const details = getTypeBadgeDetails(proc.type)
              const percent = Math.min((proc.memoryBytes / maxMemory) * 100, 100)

              return (
                <div
                  key={proc.pid}
                  className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-white/[0.015] transition-all group border-b"
                  style={{
                    fontSize: '13px',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  {/* Process Name & Path */}
                  <div className="col-span-4 min-w-0">
                    <div
                      className="font-medium truncate flex items-center gap-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block shrink-0"
                        style={{
                          backgroundColor: details.text,
                          boxShadow: `0 0 6px ${details.glow}`
                        }}
                      />
                      {proc.name}
                    </div>
                    {proc.path && (
                      <div
                        className="text-xs truncate mt-1 select-all font-mono"
                        style={{ color: 'var(--color-text-muted)' }}
                        title={proc.path}
                      >
                        {proc.path}
                      </div>
                    )}
                  </div>

                  {/* PID */}
                  <div
                    className="col-span-2 text-right font-mono text-sm select-all"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {proc.pid}
                  </div>

                  {/* Category Badge */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: details.bg,
                        color: details.text,
                        border: details.border
                      }}
                    >
                      {details.label}
                    </span>
                  </div>

                  {/* Memory Usage with Progress Bar */}
                  <div className="col-span-3 flex flex-col gap-1">
                    <div className="flex justify-between items-baseline text-xs font-medium">
                      <span style={{ color: 'var(--color-text-primary)' }}>
                        {formatBytes(proc.memoryBytes)}
                      </span>
                      <span className="opacity-60 font-mono text-xs">{percent.toFixed(0)}%</span>
                    </div>
                    <div
                      className="w-full h-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: details.text,
                          boxShadow: `0 0 4px ${details.glow}`
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    {proc.path && (
                      <button
                        onClick={() => onOpenFolder(proc.path!)}
                        className="p-1.5 cursor-pointer hover:bg-white/5 opacity-50 hover:opacity-100 transition-all"
                        style={{
                          borderRadius: 'var(--radius)',
                          color: 'var(--color-text-secondary)'
                        }}
                        title="Open file directory"
                      >
                        <FolderOpen size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onKill(proc.pid, proc.name)}
                      disabled={killingPid === proc.pid}
                      className="p-1.5 cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all disabled:opacity-30"
                      style={{
                        borderRadius: 'var(--radius)'
                      }}
                      title="Terminate Process"
                    >
                      {killingPid === proc.pid ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full space-y-4 text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <AlertTriangle size={48} className="opacity-50 text-amber-500" />
            <div className="space-y-2">
              <p
                className="text-lg font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                No Processes Found
              </p>
              <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
                No processes matching the current filter were detected. Try adjusting your search or filter settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}