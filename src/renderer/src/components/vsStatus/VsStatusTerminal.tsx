// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useState, useEffect, useRef } from 'react'
import {
  Terminal,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowDownToLine,
  GripHorizontal,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react'

export interface LogEntry {
  timestamp: string
  text: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface VsStatusTerminalProps {
  logs: LogEntry[]
  onClearLogs: () => void
  isLive: boolean
}

/* ── Per-type styling using only theme-safe Tailwind classes ─────────────── */
const LOG_META = {
  info: {
    icon: <Info size={10} />,
    iconClass: 'text-[var(--color-text-muted)]',
    textClass: 'text-[var(--color-text-secondary)]',
    prefix: 'INFO'
  },
  success: {
    icon: <CheckCircle2 size={10} />,
    iconClass: 'text-emerald-400',
    textClass: 'text-emerald-400',
    prefix: 'OK'
  },
  warning: {
    icon: <AlertTriangle size={10} />,
    iconClass: 'text-amber-400',
    textClass: 'text-amber-400',
    prefix: 'WARN'
  },
  error: {
    icon: <XCircle size={10} />,
    iconClass: 'text-rose-400',
    textClass: 'text-rose-400',
    prefix: 'ERR'
  }
} as const

export const VsStatusTerminal = ({
  logs,
  onClearLogs,
  isLive
}: VsStatusTerminalProps): React.ReactElement => {
  const [height, setHeight] = useState(200)
  const [isMinimized, setIsMinimized] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(200)
  const logsEndRef = useRef<HTMLDivElement>(null)

  /* Auto-scroll */
  useEffect(() => {
    if (autoScroll && !isMinimized && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll, isMinimized])

  /* Drag-to-resize */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    startY.current = e.clientY
    startHeight.current = height

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      setHeight(Math.min(Math.max(startHeight.current + (startY.current - ev.clientY), 80), 560))
    }
    const onUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className="shrink-0 select-text flex flex-col overflow-hidden transition-[height] duration-150"
      style={{
        height: isMinimized ? '37px' : `${height}px`,
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface-card)'
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        onMouseDown={handleMouseDown}
        className="h-9 px-3 flex items-center justify-between cursor-row-resize select-none shrink-0"
        style={{
          borderBottom: isMinimized ? 'none' : '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-elevated)'
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-2">
          <GripHorizontal size={13} style={{ color: 'var(--color-text-muted)' }} />
          <Terminal size={12} style={{ color: 'var(--color-accent)' }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Output
          </span>

          {/* LIVE badge */}
          {isLive && (
            <span
              className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                color: 'var(--color-accent)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)'
              }}
            >
              <CircleDot size={8} className="animate-pulse" />
              Live
            </span>
          )}

          {/* Line count */}
          {logs.length > 0 && (
            <span
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)'
              }}
            >
              {logs.length}
            </span>
          )}
        </div>

        {/* Right — controls */}
        <div className="flex items-center gap-0.5" onMouseDown={(e) => e.stopPropagation()}>
          {/* Auto-scroll */}
          <button
            onClick={() => setAutoScroll((p) => !p)}
            title={autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
            className="p-1.5 rounded transition-colors cursor-pointer"
            style={{
              color: autoScroll ? 'var(--color-accent)' : 'var(--color-text-muted)',
              backgroundColor: autoScroll
                ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)'
                : 'transparent'
            }}
          >
            <ArrowDownToLine size={12} />
          </button>

          {/* Clear */}
          <button
            onClick={onClearLogs}
            title="Clear output"
            className="p-1.5 rounded transition-colors cursor-pointer hover:text-rose-400"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Trash2 size={12} />
          </button>

          {/* Divider */}
          <span className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

          {/* Collapse / Expand */}
          <button
            onClick={() => setIsMinimized((p) => !p)}
            title={isMinimized ? 'Expand' : 'Collapse'}
            className="p-1.5 rounded transition-colors cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {isMinimized ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* ── Log viewport ─────────────────────────────────────────── */}
      {!isMinimized && (
        <div
          className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          {logs.length === 0 ? (
            /* Empty state */
            <div
              className="h-full flex flex-col items-center justify-center gap-2 select-none py-10"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Terminal size={20} style={{ color: 'var(--color-border)', opacity: 0.6 }} />
              <p className="text-[11px] italic">Waiting for output…</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {logs.map((log, i) => {
                  const meta = LOG_META[log.type]
                  return (
                    <tr
                      key={i}
                      style={{
                        backgroundColor:
                          i % 2 === 0
                            ? 'transparent'
                            : 'color-mix(in srgb, var(--color-border) 30%, transparent)'
                      }}
                    >
                      {/* Line number */}
                      <td
                        className="text-right align-top select-none pr-3 pl-3 py-0.5 font-mono"
                        style={{
                          color: 'var(--color-text-muted)',
                          borderRight: '1px solid var(--color-border)',
                          width: '2.5rem',
                          fontSize: '10px',
                          opacity: 0.5
                        }}
                      >
                        {i + 1}
                      </td>

                      {/* Timestamp */}
                      <td
                        className="pl-3 pr-2 py-0.5 align-top whitespace-nowrap select-none"
                        style={{
                          color: 'var(--color-text-muted)',
                          fontSize: '10px',
                          width: '6.5rem'
                        }}
                      >
                        {log.timestamp}
                      </td>

                      {/* Level badge */}
                      <td
                        className="px-2 py-0.5 align-top whitespace-nowrap select-none"
                        style={{ width: '3.5rem' }}
                      >
                        <span
                          className={`flex items-center gap-1 font-bold ${meta.iconClass}`}
                          style={{ fontSize: '10px' }}
                        >
                          {meta.icon}
                          {meta.prefix}
                        </span>
                      </td>

                      {/* Message */}
                      <td className={`pl-1 pr-4 py-0.5 align-top break-all ${meta.textClass}`}>
                        {log.text}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  )
}
