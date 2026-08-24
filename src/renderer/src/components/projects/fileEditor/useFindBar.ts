// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Find / replace state and logic for ProjectFileEditorDialog.
 * Extracted to keep the dialog component under 200 lines.
 */
import { useState, useCallback, useMemo, useRef, Dispatch, SetStateAction } from 'react'

export interface FindState {
  open: boolean
  query: string
  replaceQuery: string
  caseSensitive: boolean
  showReplace: boolean
  matchIndex: number
}

const INITIAL: FindState = {
  open: false,
  query: '',
  replaceQuery: '',
  caseSensitive: false,
  showReplace: false,
  matchIndex: 0
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

export function useFindBar(
  content: string,
  setContent: (v: string) => void,
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void
): {
  find: FindState
  setFind: Dispatch<SetStateAction<FindState>>
  matches: number[]
  matchCount: number
  currentMatch: number
  findInputRef: React.RefObject<HTMLInputElement>
  replaceInputRef: React.RefObject<HTMLInputElement>
  textareaRef: React.RefObject<HTMLTextAreaElement>
  goToMatch: (delta: 1 | -1) => void
  openFind: (showReplace?: boolean) => void
  closeFind: () => void
  replaceOne: () => void
  replaceAll: () => void
} {
  const [find, setFind] = useState<FindState>(INITIAL)
  const findInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const matches = useMemo(
    () => getMatches(content, find.query, find.caseSensitive),
    [content, find.query, find.caseSensitive]
  )
  const matchCount = matches.length
  const currentMatch = matchCount > 0 ? Math.min(find.matchIndex, matchCount - 1) : -1

  const scrollToMatch = useCallback(
    (idx: number) => {
      const ta = textareaRef.current
      if (!ta || matches[idx] === undefined) return
      const pos = matches[idx]
      ta.focus()
      ta.setSelectionRange(pos, pos + find.query.length)
      const lines = content.substring(0, pos).split('\n').length - 1
      ta.scrollTop = Math.max(0, lines * 17 - ta.clientHeight / 2)
    },
    [matches, content, find.query]
  )

  const goToMatch = useCallback(
    (delta: 1 | -1) => {
      if (!matchCount) return
      const next = (currentMatch + delta + matchCount) % matchCount
      setFind((f) => ({ ...f, matchIndex: next }))
      scrollToMatch(next)
    },
    [matchCount, currentMatch, scrollToMatch]
  )

  const openFind = useCallback((showReplace = false) => {
    setFind((f) => ({ ...f, open: true, showReplace }))
    setTimeout(() => findInputRef.current?.focus(), 50)
  }, [])

  const closeFind = useCallback(() => {
    setFind((f) => ({ ...f, open: false, query: '' }))
  }, [])

  const replaceOne = useCallback(() => {
    if (currentMatch < 0 || !find.query) return
    const pos = matches[currentMatch]
    setContent(
      content.substring(0, pos) + find.replaceQuery + content.substring(pos + find.query.length)
    )
  }, [content, matches, currentMatch, find.query, find.replaceQuery, setContent])

  const replaceAll = useCallback(() => {
    if (!find.query) return
    const flags = find.caseSensitive ? 'g' : 'gi'
    const escaped = find.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const count = matches.length
    setContent(content.replace(new RegExp(escaped, flags), find.replaceQuery))
    onToast(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`, 'success')
  }, [content, find, matches.length, setContent, onToast])

  return {
    find,
    setFind,
    matches,
    matchCount,
    currentMatch,
    findInputRef: findInputRef as React.RefObject<HTMLInputElement>,
    replaceInputRef: replaceInputRef as React.RefObject<HTMLInputElement>,
    textareaRef: textareaRef as React.RefObject<HTMLTextAreaElement>,
    goToMatch,
    openFind,
    closeFind,
    replaceOne,
    replaceAll
  }
}
