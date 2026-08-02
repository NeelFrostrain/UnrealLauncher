// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useState, useEffect, useRef } from 'react'
import { Terminal, Trash2, ChevronDown, ChevronUp, ArrowDown, GripHorizontal } from 'lucide-react'

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
        return 'text-emerald-400 font-medium'
      case 'warning':
        return 'text-amber-400 font-medium'
      case 'error':
        return 'text-rose-400 font-medium'
      default:
        return 'text-[var(--color-text-secondary)] font-normal'
    }
  }

  return (
    <div
      className="mt-auto border flex flex-col shrink-0 select-text transition-all duration-150 rounded-lg overflow-hidden shadow-lg"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface-card)',
        height: isMinimized ? '38px' : `${height}px`
      }}
    >
      {/* Resizable Drag Handle Header */}
      <div
        onMouseDown={handleMouseDown}
        className="h-9 px-3 flex items-center justify-between border-b cursor-row-resize select-none shrink-0 transition-colors hover:bg-[var(--color-surface-elevated)]"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface-card)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <GripHorizontal size={14} className="text-[var(--color-text-muted)] cursor-row-resize" />
          <div className="flex items-center gap-1.5">
            <Terminal size={13} style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Execution Log Terminal
            </span>
          </div>
          {isLive && (
            <span
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-engine-version) 12%, transparent)',
                color: 'var(--color-engine-version)',
                borderColor: 'color-mix(in srgb, var(--color-engine-version) 25%, transparent)'
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--color-engine-version)' }}
              />
              LIVE STREAM
            </span>
          )}
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold"
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
            title={autoScroll ? 'Auto-scroll Enabled' : 'Auto-scroll Disabled'}
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
            title="Clear Logs"
            className="p-1 rounded text-xs transition-colors cursor-pointer hover:text-rose-400"
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
          className="flex-1 p-3 overflow-y-auto font-mono text-[11px] space-y-1.5 leading-relaxed"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          {logs.length === 0 ? (
            <div
              className="italic text-center py-6 select-none text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Execution log terminal ready. Real-time installation and verification logs will stream
              here.
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2.5">
                <span
                  className="shrink-0 select-none text-[10px] opacity-60 font-mono"
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
