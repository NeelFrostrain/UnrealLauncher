import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, RefreshCw, FileText, AlertCircle, AlertTriangle, ChevronDown, Search, Terminal } from 'lucide-react'
import { getSetting } from '../../utils/settings'

interface Props {
  projectName: string
  projectPath: string
  onClose: () => void
}

type LogLevel = 'error' | 'warning' | 'info' | 'verbose'

interface LogLine {
  id: number
  raw: string
  level: LogLevel
  category: string
  message: string
}

const MAX_LINES = 5000
const ROW_H = 20
const OVERSCAN = 30

let _seq = 0
function parseLine(raw: string): LogLine {
  const id = ++_seq
  const m = raw.match(/^\[\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}:\d+\]\[\s*\d+\](\w+):\s*(?:(\w+):\s*)?(.*)$/)
  if (m) {
    const [, cat, verb, msg] = m
    const v = (verb ?? '').toLowerCase()
    const level: LogLevel =
      v === 'error' || v === 'fatal' ? 'error'
      : v === 'warning' ? 'warning'
      : v === 'display' || v === 'log' || v === '' ? 'info'
      : 'verbose'
    return { id, raw, level, category: cat, message: msg ?? '' }
  }
  const lower = raw.toLowerCase()
  const level: LogLevel =
    lower.includes('error:') || lower.includes('fatal:') ? 'error'
    : lower.includes('warning:') ? 'warning'
    : lower.includes('log:') ? 'info'
    : 'verbose'
  return { id, raw, level, category: '', message: raw }
}

// Log level colors — semantic fixed colors, intentionally not theme tokens
const LEVEL_COLOR: Record<LogLevel, string> = {
  error:   '#f87171',
  warning: '#fbbf24',
  info:    'var(--color-text-secondary)',
  verbose: 'var(--color-text-muted)',
}
const LEVEL_BADGE: Partial<Record<LogLevel, string>> = { error: 'ERR', warning: 'WRN' }

type Filter = LogLevel | 'all'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'error', label: 'Errors' },
  { id: 'warning', label: 'Warnings' },
  { id: 'info', label: 'Info' },
  { id: 'verbose', label: 'Verbose' },
]

// ── Virtualized rows ──────────────────────────────────────────────────────────
function VirtualRows({
  lines,
  scrollRef
}: {
  lines: LogLine[]
  scrollRef: React.RefObject<HTMLDivElement | null>
}): React.ReactElement {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewH, setViewH] = useState(400)
  const rafRef = useRef<number | null>(null)
  const latestScrollTop = useRef(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    setViewH(el.clientHeight)
    const ro = new ResizeObserver(() => {
      if (scrollRef.current) setViewH(scrollRef.current.clientHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [scrollRef])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    latestScrollTop.current = e.currentTarget.scrollTop
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(latestScrollTop.current)
      rafRef.current = null
    })
  }, [])

  const totalH = lines.length * ROW_H
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN)
  const end = Math.min(lines.length, Math.ceil((scrollTop + viewH) / ROW_H) + OVERSCAN)

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto"
      style={{ backgroundColor: 'var(--color-surface-card)', fontFamily: "'JetBrains Mono','Cascadia Code','Fira Code',monospace" }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalH, position: 'relative' }}>
        <div style={{ position: 'absolute', top: start * ROW_H, left: 0, right: 0 }}>
          {lines.slice(start, end).map((line) => (
            <div
              key={line.id}
              className="flex items-center px-3 hover:bg-white/3"
              style={{ height: ROW_H, color: LEVEL_COLOR[line.level], fontSize: 11, lineHeight: `${ROW_H}px` }}
            >
              <span style={{ width: 28, flexShrink: 0, fontSize: 9, fontWeight: 700, opacity: 0.55, textAlign: 'right', marginRight: 8 }}>
                {LEVEL_BADGE[line.level] ?? ''}
              </span>
              {line.category && (
                <span style={{ width: 120, flexShrink: 0, marginRight: 8, fontSize: 10, color: 'color-mix(in srgb, var(--color-accent) 70%, #a78bfa)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {line.category}
                </span>
              )}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {line.category ? line.message : line.raw}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Dialog ────────────────────────────────────────────────────────────────────
export default function ProjectLogDialog({ projectName, projectPath, onClose }: Props): React.ReactElement {
  const [lines, setLines] = useState<LogLine[]>([])
  const [logPath, setLogPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [sizeKb, setSizeKb] = useState(0)
  const [live, setLive] = useState(true)

  const maxLines = Math.min(MAX_LINES, Math.max(100, getSetting('logMaxLines')))

  const nextByteRef = useRef(0)
  const logPathRef = useRef('')
  // This ref is passed to VirtualRows and used for auto-scroll
  const logScrollRef = useRef<HTMLDivElement>(null)

  const poll = useCallback(async (reset = false): Promise<void> => {
    const fromByte = reset ? 0 : nextByteRef.current
    const result = await window.electronAPI.projectReadLog(projectPath, fromByte)
    if (!result) { setLoading(false); return }

    if (result.logPath !== logPathRef.current || reset) {
      logPathRef.current = result.logPath
      nextByteRef.current = result.startByte + new TextEncoder().encode(result.content).length
      setLogPath(result.logPath)
      setSizeKb(result.sizeBytes / 1024)
      setLines(result.content.split('\n').filter(Boolean).map(parseLine).slice(-maxLines))
      setLoading(false)
      return
    }

    if (!result.content) { setSizeKb(result.sizeBytes / 1024); setLoading(false); return }

    nextByteRef.current = result.startByte + new TextEncoder().encode(result.content).length
    setSizeKb(result.sizeBytes / 1024)
    const newLines = result.content.split('\n').filter(Boolean).map(parseLine)
    setLines(prev => {
      const combined = [...prev, ...newLines]
      return combined.length > maxLines ? combined.slice(combined.length - maxLines) : combined
    })
    setLoading(false)
  }, [projectPath, maxLines])

  useEffect(() => { poll(true) }, [poll])

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => poll(false), 5000)
    return () => clearInterval(id)
  }, [live, poll])

  // Auto-scroll: directly scroll the log container to the bottom
  useEffect(() => {
    if (!autoScroll) return
    const el = logScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, autoScroll])

  useEffect(() => {
    const h = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const counts = useMemo(() => ({
    error: lines.filter(l => l.level === 'error').length,
    warning: lines.filter(l => l.level === 'warning').length,
  }), [lines])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (filter === 'all' && !q) return lines
    return lines.filter(l => {
      if (filter !== 'all' && l.level !== filter) return false
      if (q && !l.raw.toLowerCase().includes(q)) return false
      return true
    })
  }, [lines, filter, search])

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="flex flex-col w-full max-w-5xl"
        style={{ height: '82vh', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
        initial={{ scale: 0.97, y: 12 }} animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 flex items-center justify-center shrink-0"
              style={{ borderRadius: 'calc(var(--radius) * 0.6)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)' }}>
              <Terminal size={14} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{projectName}</p>
              <p className="text-[10px] font-mono truncate" style={{ color: 'var(--color-text-muted)' }}>{logPath || 'Searching…'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {counts.error > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium"
                style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                <AlertCircle size={10} />{counts.error}
              </span>
            )}
            {counts.warning > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium"
                style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                <AlertTriangle size={10} />{counts.warning}
              </span>
            )}
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {sizeKb.toFixed(1)} KB · {lines.length.toLocaleString()} lines
            </span>
            <button onClick={() => setLive(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium cursor-pointer"
              style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: live ? 'rgba(52,211,153,0.1)' : 'var(--color-surface-card)', color: live ? '#34d399' : 'var(--color-text-muted)', border: `1px solid ${live ? 'rgba(52,211,153,0.25)' : 'var(--color-border)'}` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: live ? '#4ade80' : 'var(--color-border)' }} />
              {live ? 'Live' : 'Paused'}
            </button>
            <button onClick={() => poll(true)} className="p-1.5 cursor-pointer"
              style={{ borderRadius: 'calc(var(--radius) * 0.5)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-1.5 cursor-pointer"
              style={{ borderRadius: 'calc(var(--radius) * 0.5)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-2 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}>
          <div className="flex items-center gap-1">
            {FILTERS.map(tab => (
              <button key={tab.id} onClick={() => setFilter(tab.id)}
                className="px-2.5 py-1 text-[11px] font-medium cursor-pointer"
                style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: filter === tab.id ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent', color: filter === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)', border: `1px solid ${filter === tab.id ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)' : 'transparent'}` }}>
                {tab.label}
                {tab.id === 'error' && counts.error > 0 && <span className="ml-1 text-[9px] px-1 rounded-full" style={{ backgroundColor: 'rgba(248,113,113,0.2)', color: '#f87171' }}>{counts.error}</span>}
                {tab.id === 'warning' && counts.warning > 0 && <span className="ml-1 text-[9px] px-1 rounded-full" style={{ backgroundColor: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>{counts.warning}</span>}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-1.5 w-48"
            style={{ borderRadius: 'calc(var(--radius) * 0.6)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
            <Search size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input type="text" placeholder="Filter lines…" value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[11px]" style={{ color: 'var(--color-text-primary)' }} />
          </div>
          <button onClick={() => setAutoScroll(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] cursor-pointer"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: autoScroll ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'var(--color-surface-card)', color: autoScroll ? 'var(--color-accent)' : 'var(--color-text-muted)', border: `1px solid ${autoScroll ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)' : 'var(--color-border)'}` }}>
            <ChevronDown size={11} />Scroll
          </button>
        </div>

        {/* Log body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-muted)' }}>
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2" style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-muted)' }}>
            <FileText size={26} />
            <span className="text-xs">{search ? 'No lines match' : 'No log entries found'}</span>
          </div>
        ) : (
          <VirtualRows lines={filtered} scrollRef={logScrollRef} />
        )}

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-1.5 shrink-0 text-[10px]"
          style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}>
          <span>{filtered.length.toLocaleString()} / {lines.length.toLocaleString()} lines (cap: {maxLines.toLocaleString()})</span>
          <span>Esc to close</span>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
