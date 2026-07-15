// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Activity,
  RefreshCw,
  Trash2,
  FolderOpen,
  Search,
  Cpu,
  HardDrive,
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'
import { useToast } from '../components/ui/ToastContext'

interface SystemProcess {
  pid: number
  name: string
  memoryBytes: number
  cpuSeconds?: number
  path?: string
  type: 'editor' | 'build' | 'service' | 'other'
}

export default function TasksPage(): React.ReactElement {
  const [processes, setProcesses] = useState<SystemProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [killingPid, setKillingPid] = useState<number | null>(null)
  const { addToast } = useToast()

  const loadProcesses = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await window.electronAPI.taskManagerGetProcesses()
      // Sort processes: editors first, then build tools, services, and memory usage descending
      const sorted = [...res].sort((a, b) => {
        const typeOrder = { editor: 0, build: 1, service: 2, other: 3 }
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type]
        }
        return b.memoryBytes - a.memoryBytes
      })
      setProcesses(sorted)
    } catch (err) {
      console.error(err)
      addToast('Failed to fetch running processes', 'error')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadProcesses()

    // Auto-refresh every 4 seconds
    const interval = setInterval(() => {
      loadProcesses(true)
    }, 4000)

    return () => clearInterval(interval)
  }, [loadProcesses])

  const handleKill = async (pid: number, name: string) => {
    setKillingPid(pid)
    try {
      const res = await window.electronAPI.taskManagerKillProcess(pid)
      if (res.success) {
        addToast(`Process ${name} (PID: ${pid}) terminated successfully`, 'success')
        // Optimistic update
        setProcesses((prev) => prev.filter((p) => p.pid !== pid))
      } else {
        addToast(res.error || 'Failed to kill process', 'error')
      }
    } catch (err) {
      console.error(err)
      addToast('Error trying to kill process', 'error')
    } finally {
      setKillingPid(null)
    }
  }

  const handleOpenFolder = async (filePath: string) => {
    try {
      const parts = filePath.split(/[/\\]/)
      parts.pop()
      const dirPath = parts.join('\\')
      const res = await window.electronAPI.openDirectory(dirPath)
      if (res.error) {
        addToast(res.error, 'error')
      } else {
        addToast('Opened process directory in explorer', 'success')
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to open directory', 'error')
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB'
    const mb = bytes / (1024 * 1024)
    if (mb >= 1024) {
      return (mb / 1024).toFixed(2) + ' GB'
    }
    return mb.toFixed(1) + ' MB'
  }

  const filteredProcesses = useMemo(() => {
    return processes.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pid.toString().includes(searchQuery) ||
        (p.path && p.path.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [processes, searchQuery])

  // Analytics metrics
  const metrics = useMemo(() => {
    let totalMemVal = 0
    let editorsCount = 0
    let buildsCount = 0
    let servicesCount = 0

    processes.forEach((p) => {
      totalMemVal += p.memoryBytes
      if (p.type === 'editor') editorsCount++
      else if (p.type === 'build') buildsCount++
      else if (p.type === 'service') servicesCount++
    })

    return {
      totalMemVal,
      totalMem: formatBytes(totalMemVal),
      editorsCount,
      buildsCount,
      servicesCount,
      totalCount: processes.length
    }
  }, [processes])

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

  // Get max memory used by a single process for relative bar sizes (default to 1GB minimum)
  const maxMemory = useMemo(() => {
    const maxVal = Math.max(...processes.map((p) => p.memoryBytes), 0)
    return maxVal > 0 ? maxVal : 1024 * 1024 * 1024
  }, [processes])

  return (
    <div
      className="flex-1 flex flex-col min-h-0 overflow-hidden p-6 space-y-6 select-none relative"
      style={{
        fontFamily: 'var(--font-family)',
        color: 'var(--color-text-primary)',
        fontSize: 'var(--font-size)'
      }}
    >
      {/* Background Decorative Radial Glows */}
      <div
        className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full pointer-events-none blur-[150px] opacity-10"
        style={{
          background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)'
        }}
      />
      <div
        className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none blur-[120px] opacity-5"
        style={{
          background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)'
        }}
      />

      {/* Header Section */}
      <div className="flex justify-between items-center shrink-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center p-1.5 rounded-lg"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)'
              }}
            >
              <Activity size={18} style={{ color: 'var(--color-accent)' }} />
            </span>
            <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              System Task Manager
            </h1>
          </div>
          <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Real-time process monitor mapping active memory allocations, compiling workloads, and system statuses.
          </p>
        </div>

        {/* Filter and controls */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-2 px-3 py-1.5 w-64 transition-all focus-within:border-blue-500/50"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search tasks, PID, paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-xs focus:ring-0 focus:outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
          <button
            onClick={() => loadProcesses()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold cursor-pointer transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Scan System
          </button>
        </div>
      </div>

      {/* Metrics Row (Redesigned with Radial Glows and Modern Borders) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0 z-10">
        {[
          {
            label: 'Active System Tasks',
            value: metrics.totalCount,
            desc: 'Monitored background executables',
            icon: <Layers size={14} />,
            accent: 'var(--color-accent)'
          },
          {
            label: 'Running Editors',
            value: metrics.editorsCount,
            desc: 'Unreal Engine working instances',
            icon: <Play size={14} />,
            accent: '#3b82f6'
          },
          {
            label: 'Shader Compilers',
            value: metrics.buildsCount,
            desc: 'Shader compiling workers active',
            icon: <Cpu size={14} />,
            accent: '#ec4899'
          },
          {
            label: 'Total RAM Footprint',
            value: metrics.totalMem,
            desc: 'Combined memory footprint',
            icon: <HardDrive size={14} />,
            accent: '#10b981'
          }
        ].map((card, idx) => (
          <div
            key={idx}
            className="p-5 flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5 group"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            {/* Hover Glow effect */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: `radial-gradient(80px circle at top right, color-mix(in srgb, ${card.accent} 15%, transparent), transparent)`
              }}
            />
            {/* Top Indicator Glow Bar */}
            <div
              className="absolute top-0 left-0 w-full h-[2px] opacity-60"
              style={{ backgroundColor: card.accent }}
            />

            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {card.label}
              </span>
              <span style={{ color: card.accent }}>{card.icon}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-black leading-none">{card.value}</span>
              <Sparkles size={10} className="opacity-0 group-hover:opacity-60 transition-opacity text-amber-400" />
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Main Process List Grid (Redesigned with Premium Columns & Visual Bars) */}
      <div
        className="flex-1 flex flex-col min-h-0 overflow-hidden z-10"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Table Header */}
        <div
          className="grid grid-cols-12 gap-4 px-6 py-3 font-black text-[9px] uppercase tracking-widest border-b select-none shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)',
            color: 'var(--color-text-muted)'
          }}
        >
          <div className="col-span-4">Process / Executable</div>
          <div className="col-span-2 text-right">PID</div>
          <div className="col-span-2 text-center">Category</div>
          <div className="col-span-3">RAM Memory Allocations</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-24 space-y-4">
              <RefreshCw className="animate-spin text-blue-500" size={32} />
              <div className="text-center space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--color-text-primary)' }}>
                  Interrogating Registry
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Building real-time process usage mappings...
                </p>
              </div>
            </div>
          ) : filteredProcesses.length > 0 ? (
            filteredProcesses.map((proc) => {
              const details = getTypeBadgeDetails(proc.type)
              const percent = Math.min((proc.memoryBytes / maxMemory) * 100, 100)

              return (
                <div
                  key={proc.pid}
                  className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-white/[0.015] transition-all relative group"
                  style={{
                    fontSize: 'calc(var(--font-size) * 0.85)',
                    borderBottom: '1px solid var(--color-border)'
                  }}
                >
                  {/* Left Accent indicator dot */}
                  <div
                    className="absolute left-0 top-0 w-[3px] h-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: details.text }}
                  />

                  {/* Name & Path */}
                  <div className="col-span-4 min-w-0 pr-4">
                    <div className="font-extrabold truncate flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block shrink-0 animate-pulse"
                        style={{
                          backgroundColor: details.text,
                          boxShadow: `0 0 8px ${details.glow}`
                        }}
                      />
                      {proc.name}
                    </div>
                    {proc.path && (
                      <div
                        className="text-[10px] truncate mt-1 flex items-center gap-1 select-all"
                        style={{ color: 'var(--color-text-muted)', fontFamily: 'Consolas, monospace' }}
                        title={proc.path}
                      >
                        <ArrowUpRight size={10} className="opacity-40" />
                        {proc.path}
                      </div>
                    )}
                  </div>

                  {/* PID */}
                  <div
                    className="col-span-2 text-right font-mono text-xs pr-2 select-all"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {proc.pid}
                  </div>

                  {/* Category Type Badge */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className="px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded-full"
                      style={{
                        backgroundColor: details.bg,
                        color: details.text,
                        border: details.border
                      }}
                    >
                      {details.label}
                    </span>
                  </div>

                  {/* Memory Usage with Bar Indicator */}
                  <div className="col-span-3 flex flex-col gap-1.5 pr-4 justify-center">
                    <div className="flex justify-between items-baseline text-[10px] font-extrabold">
                      <span style={{ color: 'var(--color-text-primary)' }}>
                        {formatBytes(proc.memoryBytes)}
                      </span>
                      <span className="opacity-40 font-mono text-[9px]">
                        {percent.toFixed(0)}%
                      </span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: details.text,
                          boxShadow: `0 0 6px ${details.glow}`
                        }}
                      />
                    </div>
                  </div>

                  {/* Operations Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                    {proc.path && (
                      <button
                        onClick={() => handleOpenFolder(proc.path!)}
                        className="p-2 cursor-pointer hover:bg-white/5 opacity-50 hover:opacity-100 transition-all"
                        style={{
                          borderRadius: 'var(--radius)',
                          color: 'var(--color-text-secondary)'
                        }}
                        title="Open file directory"
                      >
                        <FolderOpen size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleKill(proc.pid, proc.name)}
                      disabled={killingPid === proc.pid}
                      className="p-2 cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all disabled:opacity-30"
                      style={{
                        borderRadius: 'var(--radius)'
                      }}
                      title="Terminate Process"
                    >
                      {killingPid === proc.pid ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div
              className="flex flex-col items-center justify-center p-20 space-y-4 text-center"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <AlertTriangle size={36} className="opacity-50 text-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-extrabold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                  No Active Unreal Processes
                </p>
                <p className="text-xs max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No editors or builders matching the filter were detected. Launch a project or compile shaders to visualize process load!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
