// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useState, useEffect, useRef } from 'react'
import { Terminal, Trash2, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react'

export interface LogEntry {
  timestamp: string
  text: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface CompileTerminalProps {
  logs: LogEntry[]
  onClearLogs: () => void
  isLive: boolean
}

export const CompileTerminal = ({
  logs,
  onClearLogs,
  isLive
}: CompileTerminalProps): React.ReactElement => {
  const [height, setHeight] = useState(180)
  const [isMinimized, setIsMinimized] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(180)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && !isMinimized && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll, isMinimized])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    startY.current = e.clientY
    startHeight.current = height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return
      const deltaY = startY.current - moveEvent.clientY
      const newHeight = Math.min(Math.max(startHeight.current + deltaY, 100), 500)
      setHeight(newHeight)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-emerald-400 font-semibold'
      case 'warning':
        return 'text-amber-400 font-semibold'
      case 'error':
        return 'text-rose-400 font-semibold'
      default:
        return 'text-[var(--color-text-secondary)]'
    }
  }

  return (
    <div
      className="mt-auto border flex flex-col shrink-0 select-text transition-all duration-150 rounded-lg overflow-hidden"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface-card)',
        height: isMinimized ? '36px' : `${height}px`
      }}
    >
      {/* Resizable Top Drag Bar & Controls */}
      <div
        onMouseDown={handleMouseDown}
        className="h-9 px-3 flex items-center justify-between border-b cursor-row-resize select-none shrink-0"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface-card)'
        }}
      >
        <div className="flex items-center gap-2">
          <Terminal size={14} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Execution Terminal
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE STREAM
            </span>
          )}
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)'
            }}
          >
            {logs.length} Lines
          </span>
        </div>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => setAutoScroll((prev) => !prev)}
            title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
            className="p-1 rounded text-xs transition-colors cursor-pointer"
            style={{
              color: autoScroll ? 'var(--color-accent)' : 'var(--color-text-muted)',
              backgroundColor: autoScroll
                ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
                : 'transparent'
            }}
          >
            <ArrowDown size={13} />
          </button>
          <button
            onClick={onClearLogs}
            title="Clear Log Output"
            className="p-1 rounded text-xs transition-colors cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setIsMinimized((prev) => !prev)}
            title={isMinimized ? 'Expand Terminal' : 'Minimize Terminal'}
            className="p-1 rounded text-xs transition-colors cursor-pointer ml-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {isMinimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      {!isMinimized && (
        <div
          className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          {logs.length === 0 ? (
            <div
              className="italic text-center py-4 select-none"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Terminal ready. Logs will stream here during installation and verification.
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 leading-relaxed">
                <span
                  className="shrink-0 select-none text-[10px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  [{log.timestamp}]
                </span>
                <span className={`break-all ${getLogColor(log.type)}`}>{log.text}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  )
}
