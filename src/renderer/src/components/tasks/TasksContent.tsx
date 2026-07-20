import React, { useMemo, useState } from 'react'
import {
  RefreshCw,
  Trash2,
  FolderOpen,
  AlertTriangle,
  Cpu,
  HardDrive,
  Layers,
  ChevronUp,
  ChevronDown,
  Clock
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
  selectedPids: number[]
  onToggleSelectPid: (pid: number) => void
  onSelectAll: (pids: number[]) => void
  onDeselectAll: () => void
}

type SortKey = 'name' | 'pid' | 'type' | 'memory' | 'cpu'
type SortDirection = 'asc' | 'desc'

export default function TasksContent({
  processes,
  loading,
  searchQuery,
  currentTab,
  killingPid,
  onKill,
  onOpenFolder,
  selectedPids,
  onToggleSelectPid,
  onSelectAll,
  onDeselectAll
}: TasksContentProps): React.ReactElement {
  const [sortKey, setSortKey] = useState<SortKey>('memory')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB'
    const mb = bytes / (1024 * 1024)
    if (mb >= 1024) {
      return (mb / 1024).toFixed(2) + ' GB'
    }
    return mb.toFixed(1) + ' MB'
  }

  const formatCpuTime = (cpuSeconds?: number): string => {
    if (cpuSeconds === undefined || cpuSeconds === null) return '0.0s'
    if (cpuSeconds < 60) return cpuSeconds.toFixed(1) + 's'
    const mins = Math.floor(cpuSeconds / 60)
    const secs = (cpuSeconds % 60).toFixed(0)
    return `${mins}m ${secs}s`
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

    // Sort
    return [...filtered].sort((a, b) => {
      let multiplier = sortDirection === 'asc' ? 1 : -1
      if (sortKey === 'name') {
        return multiplier * a.name.localeCompare(b.name)
      }
      if (sortKey === 'pid') {
        return multiplier * (a.pid - b.pid)
      }
      if (sortKey === 'type') {
        const typeOrder = { editor: 0, build: 1, service: 2, other: 3 }
        return multiplier * (typeOrder[a.type] - typeOrder[b.type])
      }
      if (sortKey === 'memory') {
        return multiplier * (a.memoryBytes - b.memoryBytes)
      }
      if (sortKey === 'cpu') {
        return multiplier * ((a.cpuSeconds || 0) - (b.cpuSeconds || 0))
      }
      return 0
    })
  }, [processes, searchQuery, currentTab, sortKey, sortDirection])

  // Analytics metrics
  const metrics = useMemo(() => {
    let totalMemVal = 0
    let maxCpuVal = -1
    let topCpuProc: SystemProcess | null = null

    filteredProcesses.forEach((p) => {
      totalMemVal += p.memoryBytes
      if (p.cpuSeconds !== undefined && p.cpuSeconds > maxCpuVal) {
        maxCpuVal = p.cpuSeconds
        topCpuProc = p
      }
    })

    return {
      totalMem: formatBytes(totalMemVal),
      totalCount: filteredProcesses.length,
      topCpu: topCpuProc
        ? `${(topCpuProc as SystemProcess).name} (${formatCpuTime(maxCpuVal)})`
        : 'None'
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

  // Get max cpu time for progress bar sizes
  const maxCpu = useMemo(() => {
    const maxVal = Math.max(...filteredProcesses.map((p) => p.cpuSeconds || 0), 0)
    return maxVal > 0 ? maxVal : 1
  }, [filteredProcesses])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const allFilteredPids = useMemo(() => filteredProcesses.map((p) => p.pid), [filteredProcesses])
  const isAllSelected = useMemo(() => {
    if (allFilteredPids.length === 0) return false
    return allFilteredPids.every((pid) => selectedPids.includes(pid))
  }, [allFilteredPids, selectedPids])

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      onDeselectAll()
    } else {
      onSelectAll(allFilteredPids)
    }
  }

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null
    return sortDirection === 'asc' ? (
      <ChevronUp size={12} className="inline ml-1 text-blue-400" />
    ) : (
      <ChevronDown size={12} className="inline ml-1 text-blue-400" />
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden select-none">
      {/* Metrics Summary */}
      <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className="grid grid-cols-3 gap-4">
          <div
            className="p-4 flex items-center justify-between transition-all hover:scale-[1.01]"
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
            className="p-4 flex items-center justify-between transition-all hover:scale-[1.01]"
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
            className="p-4 flex items-center justify-between transition-all hover:scale-[1.01]"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Top CPU Task
              </p>
              <p
                className="text-sm font-semibold mt-2 truncate max-w-[180px]"
                style={{ color: 'var(--color-text-primary)' }}
                title={metrics.topCpu}
              >
                {metrics.topCpu}
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
              <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
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
              className="grid grid-cols-12 gap-4 px-6 py-3 font-medium text-xs border-b sticky top-0 z-10 items-center"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-muted)'
              }}
            >
              {/* Checkbox */}
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAllToggle}
                  className="rounded border-white/10 bg-white/5 cursor-pointer accent-blue-600 w-3.5 h-3.5"
                />
              </div>
              <div
                className="col-span-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('name')}
              >
                Process / Executable {renderSortIndicator('name')}
              </div>
              <div
                className="col-span-1 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('pid')}
              >
                PID {renderSortIndicator('pid')}
              </div>
              <div
                className="col-span-2 text-center cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('type')}
              >
                Category {renderSortIndicator('type')}
              </div>
              <div
                className="col-span-2 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('memory')}
              >
                Memory Usage {renderSortIndicator('memory')}
              </div>
              <div
                className="col-span-2 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('cpu')}
              >
                CPU Time {renderSortIndicator('cpu')}
              </div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Process Rows */}
            {filteredProcesses.map((proc) => {
              const details = getTypeBadgeDetails(proc.type)
              const memPercent = Math.min((proc.memoryBytes / maxMemory) * 100, 100)
              const cpuPercent = Math.min(((proc.cpuSeconds || 0) / maxCpu) * 100, 100)
              const isSelected = selectedPids.includes(proc.pid)

              return (
                <div
                  key={proc.pid}
                  className={`grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-white/[0.02] transition-all group border-b ${
                    isSelected ? 'bg-blue-500/[0.025]' : ''
                  }`}
                  style={{
                    fontSize: '13px',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  {/* Checkbox Column */}
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectPid(proc.pid)}
                      className="rounded border-white/10 bg-white/5 cursor-pointer accent-blue-600 w-3.5 h-3.5"
                    />
                  </div>

                  {/* Process Name & Path */}
                  <div className="col-span-3 min-w-0">
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
                    className="col-span-1 text-right font-mono text-sm select-all"
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
                  <div className="col-span-2 flex flex-col gap-1 pr-2">
                    <div className="flex justify-between items-baseline text-xs font-medium">
                      <span style={{ color: 'var(--color-text-primary)' }}>
                        {formatBytes(proc.memoryBytes)}
                      </span>
                    </div>
                    <div
                      className="w-full h-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${memPercent}%`,
                          backgroundColor: details.text,
                          boxShadow: `0 0 4px ${details.glow}`
                        }}
                      />
                    </div>
                  </div>

                  {/* CPU Time Column with subtle timeline bar */}
                  <div className="col-span-2 flex flex-col gap-1 pr-2">
                    <div className="flex justify-between items-baseline text-xs font-medium">
                      <span
                        style={{ color: 'var(--color-text-primary)' }}
                        className="flex items-center gap-1"
                      >
                        <Clock size={11} className="text-pink-400" />
                        {formatCpuTime(proc.cpuSeconds)}
                      </span>
                    </div>
                    <div
                      className="w-full h-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${cpuPercent}%`,
                          backgroundColor: '#ec4899',
                          boxShadow: `0 0 4px rgba(236, 72, 153, 0.4)`
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
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                No Processes Found
              </p>
              <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
                No processes matching the current filter were detected. Try adjusting your search or
                filter settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
