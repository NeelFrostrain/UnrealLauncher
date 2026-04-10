import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  X, RefreshCw, FileText, AlertCircle, AlertTriangle,
  ChevronDown, Search, Terminal, Pause, Play
} from 'lucide-react'
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
  timestamp: string
}

const MAX_LINES = 5000

let _seq = 0
function parseLine(raw: string): LogLine {
  const id = ++_seq
  // UE format: [2024.01.01-12.00.00:000][  0]LogCategory: Verbosity: Message
  const m = raw.match(/^\[(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}:\d+)\]\[\s*\d+\](\w+):\s*(?:(\w+):\s*)?(.*)$/)
  if (m) {
    const [, ts, cat, verb, msg] = m
    const v = (verb ?? '').toLowerCase()
    const level: LogLevel =
      v === 'error' || v === 'fatal' ? 'error'
      : v === 'warning' ? 'warning'
      : v === 'display' || v === 'log' || v === '' ? 'info'
      : 'verbose'
    // Format timestamp: 2024.01.01-12.00.00:000 → 12:00:00
    const timePart = ts.split('-')[1]?.replace(/\./g, ':').split(':').slice(0, 3).join(':') ?? ''
    return { id, raw, level, category: cat, message: msg ?? '', timestamp: timePart }
  }
  const lower = raw.toLowerCase()
  const level: LogLevel =
    lower.includes('error:') || lower.includes('fatal:') ? 'error'
    : lower.includes('warning:') ? 'warning'
    : lower.includes('log:') ? 'info'
    : 'verbose'
  return { id, raw, level, category: '', message: raw, timestamp: '' }
}

const LEVEL_CONFIG: Record<LogLevel, { color: string; bg: string; badge: string }> = {
  error:   { color: '#f87171', bg: 'rgba(248,113,113,0.06)', badge: 'ERR' },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.05)',  badge: 'WRN' },
  info:    { color: 'var(--color-text-secondary)', bg: 'transparent', badge: '' },
  verbose: { color: 'var(--color-text-muted)',     bg: 'transparent', badge: '' },
}

type Filter = LogLevel | 'all'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'error',   label: 'Errors' },
  { id: 'warning', label: 'Warnings' },
  { id: 'info',    label: 'Info' },
  { id: 'verbose', label: 'Verbose' },
]

// Font size steps in px
const FONT_SIZES = [10, 11, 12, 13, 14]

// ── Log rows — wrapping, fully readable ───────────────────────────────────────
function LogRows({ lines, scrollRef, fontSize }: {
  lines: LogLine[]
  scrollRef: React.RefObject<HTMLDivElement | null>
  fontSize: number
}): React.ReactElement {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto"
      style={{ backgroundColor: 'var(--color-surface-card)', fontFamily: "'JetBrains Mono','Cascadia Code','Fira Code',monospace" }}>
      <div className="py-1">
        {lines.map((line) => {
          const { color, bg, badge } = LEVEL_CONFIG[line.level]
          return (
            <div key={line.id}
              className="flex items-start gap-2 px-3 py-0.5 select-text"
              style={{ backgroundColor: bg, fontSize }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-accent) 4%, var(--color-surface-elevated))')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bg)}
            >
              {/* Compact meta: badge + time + category */}
              <span className="shrink-0 flex items-center gap-1.5 pt-px select-none" style={{ minWidth: 0 }}>
                {badge && (
                  <span style={{ fontSize: fontSize - 2, fontWeight: 800, color, opacity: 0.75, letterSpacing: '0.05em' }}>
                    {badge}
                  </span>
                )}
                {line.timestamp && (
                  <span style={{ fontSize: fontSize - 2, color: 'var(--color-text-muted)', opacity: 0.45, fontVariantNumeric: 'tabular-nums' }}>
                    {line.timestamp}
                  </span>
                )}
                {line.category && (
                  <span style={{ fontSize: fontSize - 2, color: 'color-mix(in srgb, var(--color-accent) 65%, #a78bfa)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {line.category}
                  </span>
                )}
              </span>
              {/* Full message — wraps */}
              <span style={{ color, flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {line.category ? line.message : line.raw}
              </span>
            </div>
          )
        })}
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
  const [fontSizeIdx, setFontSizeIdx] = useState(1) // default 11px

  const maxLines = Math.min(MAX_LINES, Math.max(100, getSetting('logMaxLines')))
  const nextByteRef = useRef(0)
  const logPathRef = useRef('')
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

  useEffect(() => {
    if (!autoScroll) return
    const el = logScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, autoScroll])

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
      if ((e.ctrlKey || e.metaKey) && e.key === '=') { e.preventDefault(); setFontSizeIdx(i => Math.min(i + 1, FONT_SIZES.length - 1)) }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); setFontSizeIdx(i => Math.max(i - 1, 0)) }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); setFontSizeIdx(1) }
    }
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
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="flex flex-col w-full max-w-5xl"
        style={{ height: '84vh', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 32px 96px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)' }}
        initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Title bar ── */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-7 h-7 flex items-center justify-center shrink-0"
            style={{ borderRadius: 'calc(var(--radius) * 0.6)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)' }}>
            <Terminal size={14} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{projectName}</p>
            <p className="text-[10px] font-mono truncate" style={{ color: 'var(--color-text-muted)' }}>{logPath || 'Searching for log…'}</p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-1.5 shrink-0">
            {counts.error > 0 && (
              <button onClick={() => setFilter(f => f === 'error' ? 'all' : 'error')}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold cursor-pointer transition-colors"
                style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: filter === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                <AlertCircle size={10} />{counts.error.toLocaleString()}
              </button>
            )}
            {counts.warning > 0 && (
              <button onClick={() => setFilter(f => f === 'warning' ? 'all' : 'warning')}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold cursor-pointer transition-colors"
                style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: filter === 'warning' ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                <AlertTriangle size={10} />{counts.warning.toLocaleString()}
              </button>
            )}
            <span className="text-[10px] font-mono px-2" style={{ color: 'var(--color-text-muted)' }}>
              {sizeKb.toFixed(1)} KB
            </span>

            {/* Live toggle */}
            <button onClick={() => setLive(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium cursor-pointer"
              style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: live ? 'rgba(74,222,128,0.1)' : 'var(--color-surface-card)', color: live ? '#4ade80' : 'var(--color-text-muted)', border: `1px solid ${live ? 'rgba(74,222,128,0.25)' : 'var(--color-border)'}` }}>
              {live ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live</> : <><Pause size={10} />Paused</>}
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

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-2 px-4 py-2 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}>
          {/* Filter tabs */}
          <div className="flex items-center gap-0.5 p-0.5 shrink-0"
            style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
            {FILTERS.map(tab => (
              <button key={tab.id} onClick={() => setFilter(tab.id)}
                className="px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.6)',
                  backgroundColor: filter === tab.id ? 'color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-elevated))' : 'transparent',
                  color: filter === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  boxShadow: filter === tab.id ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                }}>
                {tab.label}
                {tab.id === 'error' && counts.error > 0 && (
                  <span className="ml-1 text-[9px] px-1 py-px rounded-full" style={{ backgroundColor: 'rgba(248,113,113,0.2)', color: '#f87171' }}>{counts.error}</span>
                )}
                {tab.id === 'warning' && counts.warning > 0 && (
                  <span className="ml-1 text-[9px] px-1 py-px rounded-full" style={{ backgroundColor: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>{counts.warning}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-1.5 flex-1 max-w-xs"
            style={{ borderRadius: 'calc(var(--radius) * 0.6)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
            <Search size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input type="text" placeholder="Search lines…" value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[11px]" style={{ color: 'var(--color-text-primary)' }} />
            {search && (
              <button onClick={() => setSearch('')} className="cursor-pointer shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                <X size={10} />
              </button>
            )}
          </div>

          <div className="flex-1" />

          {/* Zoom */}
          <div className="flex items-center overflow-hidden shrink-0"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', border: '1px solid var(--color-border)' }}>
            <button onClick={() => setFontSizeIdx(i => Math.max(i - 1, 0))}
              disabled={fontSizeIdx === 0}
              className="px-2 py-1 text-xs cursor-pointer disabled:opacity-30 transition-colors"
              style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-muted)' }}
              title="Zoom out (Ctrl -)">A−</button>
            <span className="px-2 text-[10px] font-mono" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-elevated)', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
              {FONT_SIZES[fontSizeIdx]}px
            </span>
            <button onClick={() => setFontSizeIdx(i => Math.min(i + 1, FONT_SIZES.length - 1))}
              disabled={fontSizeIdx === FONT_SIZES.length - 1}
              className="px-2 py-1 text-xs cursor-pointer disabled:opacity-30 transition-colors"
              style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-muted)' }}
              title="Zoom in (Ctrl +)">A+</button>
          </div>

          {/* Auto-scroll */}
          <button onClick={() => setAutoScroll(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium cursor-pointer shrink-0"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: autoScroll ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'var(--color-surface-card)', color: autoScroll ? 'var(--color-accent)' : 'var(--color-text-muted)', border: `1px solid ${autoScroll ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)' : 'var(--color-border)'}` }}>
            <ChevronDown size={11} />
            Auto-scroll
          </button>
        </div>

        {/* ── Log body ── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-muted)' }}>
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Loading log…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2" style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-muted)' }}>
            <FileText size={28} style={{ opacity: 0.3 }} />
            <span className="text-xs">{search ? 'No lines match your search' : 'No log entries found'}</span>
          </div>
        ) : (
          <LogRows lines={filtered} scrollRef={logScrollRef} fontSize={FONT_SIZES[fontSizeIdx]} />
        )}

        {/* ── Status bar ── */}
        <div className="flex items-center justify-between px-4 py-1.5 shrink-0 text-[10px] font-mono"
          style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}>
          <div className="flex items-center gap-3">
            <span>{filtered.length.toLocaleString()} / {lines.length.toLocaleString()} lines</span>
            {search && <span style={{ color: 'var(--color-accent)' }}>"{search}"</span>}
          </div>
          <div className="flex items-center gap-3">
            <span>cap {maxLines.toLocaleString()}</span>
            <span>Esc to close</span>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
