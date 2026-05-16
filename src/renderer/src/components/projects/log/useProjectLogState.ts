// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { getSetting } from '../../../utils/settings'

export type LogLevel = 'error' | 'warning' | 'info' | 'verbose'
export type Filter = LogLevel | 'all'

export interface LogLine {
  id: number
  raw: string
  level: LogLevel
  category: string
  message: string
  timestamp: string
}

export const MAX_LINES = 5000
export const FONT_SIZES = [10, 11, 12, 13, 14]

let _seq = 0
export function parseLine(raw: string): LogLine {
  const id = ++_seq
  const m = raw.match(
    /^\[(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}:\d+)\]\[\s*\d+\](\w+):\s*(?:(\w+):\s*)?(.*)$/
  )
  if (m) {
    const [, ts, cat, verb, msg] = m
    const v = (verb ?? '').toLowerCase()
    const level: LogLevel =
      v === 'error' || v === 'fatal' ? 'error'
      : v === 'warning' ? 'warning'
      : v === 'display' || v === 'log' || v === '' ? 'info'
      : 'verbose'
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

export function useProjectLogState(projectPath: string, onClose: () => void) {
  const [lines, setLines] = useState<LogLine[]>([])
  const [logPath, setLogPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [sizeKb, setSizeKb] = useState(0)
  const [live, setLive] = useState(true)
  const [fontSizeIdx, setFontSizeIdx] = useState(1)

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
    setLines((prev) => {
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
      if ((e.ctrlKey || e.metaKey) && e.key === '=') { e.preventDefault(); setFontSizeIdx((i) => Math.min(i + 1, FONT_SIZES.length - 1)) }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); setFontSizeIdx((i) => Math.max(i - 1, 0)) }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); setFontSizeIdx(1) }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const counts = useMemo(() => ({
    error: lines.filter((l) => l.level === 'error').length,
    warning: lines.filter((l) => l.level === 'warning').length
  }), [lines])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (filter === 'all' && !q) return lines
    return lines.filter((l) => {
      if (filter !== 'all' && l.level !== filter) return false
      if (q && !l.raw.toLowerCase().includes(q)) return false
      return true
    })
  }, [lines, filter, search])

  return {
    lines, logPath, loading, filter, setFilter, search, setSearch,
    autoScroll, setAutoScroll, sizeKb, live, setLive, fontSizeIdx, setFontSizeIdx,
    maxLines, logScrollRef, counts, filtered, poll
  }
}
