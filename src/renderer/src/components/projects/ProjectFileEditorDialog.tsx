// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Save, RefreshCw, FileCode2, Settings2, AlertTriangle,
  Search, ChevronUp, ChevronDown, Replace, CaseSensitive
} from 'lucide-react'
import { useToast } from '../ui/ToastContext'

interface Props {
  mode: 'config' | 'uproject'
  projectPath: string
  projectName: string
  onClose: () => void
}

// ── Find bar state ─────────────────────────────────────────────────────────────
interface FindState {
  open: boolean
  query: string
  replaceQuery: string
  caseSensitive: boolean
  showReplace: boolean
  matchIndex: number
}

function getMatches(text: string, query: string, caseSensitive: boolean): number[] {
  if (!query) return []
  const positions: number[] = []
  const haystack = caseSensitive ? text : text.toLowerCase()
  const needle = caseSensitive ? query : query.toLowerCase()
  let idx = 0
  while (idx < haystack.length) {
    const found = haystack.indexOf(needle, idx)
    if (found === -1) break
    positions.push(found)
    idx = found + needle.length
  }
  return positions
}

export default function ProjectFileEditorDialog({
  mode, projectPath, projectName, onClose
}: Props): React.ReactElement {
  const { addToast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const findInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  const [filePath, setFilePath] = useState('')
  const [content, setContent] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [find, setFind] = useState<FindState>({
    open: false, query: '', replaceQuery: '',
    caseSensitive: false, showReplace: false, matchIndex: 0
  })

  const isDirty = content !== original

  // ── Matches ────────────────────────────────────────────────────────────────
  const matches = useMemo(
    () => getMatches(content, find.query, find.caseSensitive),
    [content, find.query, find.caseSensitive]
  )
  const matchCount = matches.length
  const currentMatch = matchCount > 0 ? Math.min(find.matchIndex, matchCount - 1) : -1

  // ── Scroll textarea to current match ──────────────────────────────────────
  const scrollToMatch = useCallback((idx: number) => {
    const ta = textareaRef.current
    if (!ta || !matches[idx] === undefined) return
    const pos = matches[idx]
    // Set selection to highlight the match
    ta.focus()
    ta.setSelectionRange(pos, pos + find.query.length)
    // Estimate line height to scroll
    const lines = content.substring(0, pos).split('\n').length - 1
    const lineHeight = 17 // ~1.7 * 10px font
    ta.scrollTop = Math.max(0, lines * lineHeight - ta.clientHeight / 2)
  }, [matches, content, find.query])

  const goToMatch = useCallback((delta: 1 | -1) => {
    if (!matchCount) return
    const next = ((currentMatch + delta) + matchCount) % matchCount
    setFind(f => ({ ...f, matchIndex: next }))
    scrollToMatch(next)
  }, [matchCount, currentMatch, scrollToMatch])

  // ── Load file ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const resolved = mode === 'config'
        ? await window.electronAPI.projectResolveConfigPath(projectPath)
        : await window.electronAPI.projectResolveUprojectPath(projectPath)
      if (!resolved.success) { setError(resolved.error ?? 'Could not resolve file path'); setLoading(false); return }
      setFilePath(resolved.filePath)
      const result = await window.electronAPI.projectReadTextFile(resolved.filePath)
      const text = result.success ? result.content : ''
      setContent(text)
      setOriginal(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load file')
    }
    setLoading(false)
  }, [mode, projectPath])

  useEffect(() => { load() }, [load])

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+F — open find
      if (ctrl && e.key === 'f') {
        e.preventDefault()
        setFind(f => ({ ...f, open: true, showReplace: false }))
        setTimeout(() => findInputRef.current?.focus(), 50)
        return
      }
      // Ctrl+H — open find+replace
      if (ctrl && e.key === 'h') {
        e.preventDefault()
        setFind(f => ({ ...f, open: true, showReplace: true }))
        setTimeout(() => findInputRef.current?.focus(), 50)
        return
      }
      // Ctrl+S — save
      if (ctrl && e.key === 's') {
        e.preventDefault()
        handleSave()
        return
      }
      // Escape — close find bar first, then dialog
      if (e.key === 'Escape') {
        if (find.open) { setFind(f => ({ ...f, open: false, query: '' })); return }
        if (!isDirty) onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [find.open, isDirty, content])

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!filePath || saving) return
    if (mode === 'uproject') {
      try { JSON.parse(content) } catch {
        addToast('Invalid JSON — fix syntax errors before saving', 'error'); return
      }
    }
    setSaving(true)
    const result = await window.electronAPI.projectWriteTextFile(filePath, content)
    setSaving(false)
    if (result.success) { setOriginal(content); addToast('File saved', 'success') }
    else addToast(result.error ?? 'Failed to save file', 'error')
  }, [filePath, content, mode, saving, addToast])

  // ── Replace ────────────────────────────────────────────────────────────────
  const handleReplaceOne = useCallback(() => {
    if (currentMatch < 0 || !find.query) return
    const pos = matches[currentMatch]
    const newContent =
      content.substring(0, pos) +
      find.replaceQuery +
      content.substring(pos + find.query.length)
    setContent(newContent)
    // Stay on same index (next match shifts into place)
  }, [content, matches, currentMatch, find.query, find.replaceQuery])

  const handleReplaceAll = useCallback(() => {
    if (!find.query) return
    const flags = find.caseSensitive ? 'g' : 'gi'
    const escaped = find.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const newContent = content.replace(new RegExp(escaped, flags), find.replaceQuery)
    const count = matches.length
    setContent(newContent)
    addToast(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`, 'success')
  }, [content, find.query, find.replaceQuery, find.caseSensitive, matches.length, addToast])

  const fileName = filePath ? filePath.split(/[/\\]/).pop() ?? '' : ''
  const isJson = mode === 'uproject'
  const Icon = mode === 'config' ? Settings2 : FileCode2
  const iconColor = mode === 'config' ? '#94a3b8' : 'var(--color-accent)'

  return createPortal(
    <motion.div
      className="fixed inset-0 z-10002 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => { if (e.target === e.currentTarget && !isDirty) onClose() }}
    >
      <motion.div
        className="flex flex-col w-full max-w-3xl"
        style={{
          height: '82vh',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)'
        }}
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div
            className="w-7 h-7 flex items-center justify-center shrink-0"
            style={{
              borderRadius: 'calc(var(--radius) * 0.6)',
              backgroundColor: `color-mix(in srgb, ${iconColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${iconColor} 25%, transparent)`
            }}
          >
            <Icon size={14} style={{ color: iconColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {mode === 'config' ? 'Edit Default Config' : 'Edit .uproject File'}
            </p>
            <p className="text-[10px] font-mono truncate" style={{ color: 'var(--color-text-muted)' }}>
              {fileName || projectName}
            </p>
          </div>
          {isDirty && (
            <span
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 shrink-0"
              style={{
                borderRadius: 'calc(var(--radius) * 0.5)',
                backgroundColor: 'color-mix(in srgb, #f59e0b 12%, transparent)',
                color: '#f59e0b',
                border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)'
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unsaved
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1.5 cursor-pointer"
            style={{
              borderRadius: 'calc(var(--radius) * 0.5)',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)'
            }}
            title={isDirty ? 'Close (unsaved changes will be lost)' : 'Close (Esc)'}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── File path bar ── */}
        {filePath && (
          <div
            className="px-4 py-1.5 shrink-0 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}
          >
            <span className="text-[10px] font-mono truncate flex-1" style={{ color: 'var(--color-text-muted)' }}>
              {filePath}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {isJson && (
                <span className="text-[9px] px-1.5 py-px font-mono"
                  style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)' }}>
                  JSON
                </span>
              )}
              {/* Find button */}
              <button
                onClick={() => { setFind(f => ({ ...f, open: !f.open, showReplace: false })); setTimeout(() => findInputRef.current?.focus(), 50) }}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] cursor-pointer transition-colors"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.4)',
                  backgroundColor: find.open ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'var(--color-surface-card)',
                  color: find.open ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  border: `1px solid ${find.open ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)' : 'var(--color-border)'}`
                }}
                title="Find (Ctrl+F)"
              >
                <Search size={10} />
                <span>Find</span>
                <span className="opacity-50 ml-0.5">Ctrl+F</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Find / Replace bar ── */}
        <AnimatePresence>
          {find.open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="shrink-0 overflow-hidden"
              style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}
            >
              <div className="px-3 py-2 flex flex-col gap-1.5">
                {/* Find row */}
                <div className="flex items-center gap-2">
                  <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <input
                    ref={findInputRef}
                    type="text"
                    placeholder="Find…"
                    value={find.query}
                    onChange={(e) => setFind(f => ({ ...f, query: e.target.value, matchIndex: 0 }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); goToMatch(e.shiftKey ? -1 : 1) }
                      if (e.key === 'Escape') setFind(f => ({ ...f, open: false, query: '' }))
                    }}
                    className="flex-1 bg-transparent outline-none text-xs font-mono"
                    style={{ color: 'var(--color-text-primary)' }}
                    autoFocus
                  />

                  {/* Match count */}
                  {find.query && (
                    <span className="text-[10px] shrink-0 font-mono" style={{ color: matchCount > 0 ? 'var(--color-text-muted)' : '#f87171' }}>
                      {matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : 'No matches'}
                    </span>
                  )}

                  {/* Case sensitive toggle */}
                  <button
                    onClick={() => setFind(f => ({ ...f, caseSensitive: !f.caseSensitive, matchIndex: 0 }))}
                    className="p-1 cursor-pointer transition-colors"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.4)',
                      backgroundColor: find.caseSensitive ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)' : 'transparent',
                      color: find.caseSensitive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      border: `1px solid ${find.caseSensitive ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)' : 'transparent'}`
                    }}
                    title="Case sensitive (Alt+C)"
                  >
                    <CaseSensitive size={13} />
                  </button>

                  {/* Prev / Next */}
                  <button onClick={() => goToMatch(-1)} disabled={matchCount === 0} className="p-1 cursor-pointer disabled:opacity-30" style={{ color: 'var(--color-text-muted)' }} title="Previous (Shift+Enter)">
                    <ChevronUp size={13} />
                  </button>
                  <button onClick={() => goToMatch(1)} disabled={matchCount === 0} className="p-1 cursor-pointer disabled:opacity-30" style={{ color: 'var(--color-text-muted)' }} title="Next (Enter)">
                    <ChevronDown size={13} />
                  </button>

                  {/* Toggle replace */}
                  <button
                    onClick={() => setFind(f => ({ ...f, showReplace: !f.showReplace }))}
                    className="p-1 cursor-pointer transition-colors"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.4)',
                      backgroundColor: find.showReplace ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
                      color: find.showReplace ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      border: `1px solid ${find.showReplace ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)' : 'transparent'}`
                    }}
                    title="Toggle replace (Ctrl+H)"
                  >
                    <Replace size={13} />
                  </button>

                  {/* Close find */}
                  <button onClick={() => setFind(f => ({ ...f, open: false, query: '' }))} className="p-1 cursor-pointer" style={{ color: 'var(--color-text-muted)' }} title="Close (Esc)">
                    <X size={12} />
                  </button>
                </div>

                {/* Replace row */}
                <AnimatePresence>
                  {find.showReplace && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex items-center gap-2 overflow-hidden"
                    >
                      <Replace size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <input
                        ref={replaceInputRef}
                        type="text"
                        placeholder="Replace with…"
                        value={find.replaceQuery}
                        onChange={(e) => setFind(f => ({ ...f, replaceQuery: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleReplaceOne() }}
                        className="flex-1 bg-transparent outline-none text-xs font-mono"
                        style={{ color: 'var(--color-text-primary)' }}
                      />
                      <button
                        onClick={handleReplaceOne}
                        disabled={matchCount === 0}
                        className="px-2 py-0.5 text-[10px] cursor-pointer disabled:opacity-40"
                        style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                      >
                        Replace
                      </button>
                      <button
                        onClick={handleReplaceAll}
                        disabled={matchCount === 0}
                        className="px-2 py-0.5 text-[10px] cursor-pointer disabled:opacity-40"
                        style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                      >
                        Replace All
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-xs">Loading…</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
              <AlertTriangle size={28} style={{ color: '#f87171', opacity: 0.7 }} />
              <p className="text-sm font-medium" style={{ color: '#f87171' }}>Failed to load file</p>
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
              <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer"
                style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full resize-none outline-none p-4 text-xs font-mono"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-primary)',
                lineHeight: 1.7,
                tabSize: 4,
                minHeight: 0
              }}
              placeholder={
                mode === 'config'
                  ? '[/Script/Engine.RendererSettings]\n...'
                  : '{\n  "FileVersion": 3,\n  "EngineAssociation": "5.3",\n  ...\n}'
              }
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <p className="text-[10px] flex-1" style={{ color: 'var(--color-text-muted)' }}>
            {isJson ? 'JSON' : 'INI'}
            {' · Ctrl+S save · Ctrl+F find · Ctrl+H replace'}
            {isDirty && ' · Unsaved changes'}
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs cursor-pointer"
            style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            {isDirty ? 'Discard' : 'Close'}
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving || loading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-40"
            style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            {saving ? <><RefreshCw size={12} className="animate-spin" /> Saving…</> : <><Save size={12} /> Save</>}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
