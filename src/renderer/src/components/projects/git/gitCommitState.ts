// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback, useRef } from 'react'

interface ChangedFile {
  status: string
  file: string
}

/**
 * Custom hook for managing GitCommitDialog state
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useGitCommitState(projectPath: string, onClose: () => void) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [summary, setSummary] = useState('')
  const [files, setFiles] = useState<ChangedFile[]>([])
  const [commitMsg, setCommitMsg] = useState('')
  const [committing, setCommitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await window.electronAPI.projectGitHasChanges(projectPath)
    setHasChanges(r.hasChanges)
    setSummary(r.summary)
    setFiles(r.fileList ? r.fileList.map((f) => ({ status: f.status, file: f.file })) : [])
    setLoading(false)
    // Only focus input if there are changes to commit
    if (r.hasChanges) setTimeout(() => inputRef.current?.focus(), 60)
  }, [projectPath])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const generateSmartCommit = useCallback(() => {
    if (!files.length) return
    const categories: Record<string, string[]> = {
      code: [],
      config: [],
      asset: [],
      docs: [],
      other: []
    }

    const folderCounts: Record<string, number> = {}

    for (const f of files) {
      const parts = f.file.replace(/\\/g, '/').split('/')
      if (parts.length > 1 && parts[0]) {
        folderCounts[parts[0]] = (folderCounts[parts[0]] || 0) + 1
      }

      const lower = f.file.toLowerCase()
      if (lower.endsWith('.cpp') || lower.endsWith('.h') || lower.endsWith('.cs')) {
        categories.code.push(f.file)
      } else if (lower.endsWith('.ini') || lower.endsWith('.uproject') || lower.endsWith('.uplugin')) {
        categories.config.push(f.file)
      } else if (
        lower.endsWith('.uasset') ||
        lower.endsWith('.umap') ||
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.fbx') ||
        lower.endsWith('.obj')
      ) {
        categories.asset.push(f.file)
      } else if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.json')) {
        categories.docs.push(f.file)
      } else {
        categories.other.push(f.file)
      }
    }

    // Group files by subfolder/module to create meaningful bullet points
    const moduleMap: Record<string, string[]> = {}
    for (const f of files) {
      const norm = f.file.replace(/\\/g, '/')
      const parts = norm.split('/')
      let key = 'General'
      if (parts.length >= 3 && (parts[0].toLowerCase() === 'content' || parts[0].toLowerCase() === 'source')) {
        key = `${parts[0]}/${parts[1]}`
      } else if (parts.length >= 2) {
        key = parts[0]
      }
      if (!moduleMap[key]) moduleMap[key] = []
      const filename = parts[parts.length - 1]
      moduleMap[key].push(filename)
    }

    // Primary classification
    let prefix = 'feat'
    if (categories.code.length > 0) prefix = 'feat'
    else if (categories.asset.length > 0) prefix = 'content'
    else if (categories.config.length > 0 || categories.other.length > 0) prefix = 'chore'
    else if (categories.docs.length > 0) prefix = 'docs'

    // Formulate title
    const topFolder = Object.entries(folderCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'project'
    const title = `${prefix}: update ${topFolder} assets and configuration`

    // Build bullet points for each section
    const bullets: string[] = []

    if (categories.config.length > 0) {
      const names = categories.config.map((p) => p.split(/[/\\]/).pop()).join(', ')
      bullets.push(`- Update configuration (${names})`)
    }

    if (categories.code.length > 0) {
      const names = categories.code.map((p) => p.split(/[/\\]/).pop()).slice(0, 3).join(', ')
      bullets.push(`- Update code logic and classes (${names})`)
    }

    for (const [modName, fileList] of Object.entries(moduleMap)) {
      if (modName === 'Config' || modName === 'Source') continue
      const sampleNames = fileList.slice(0, 3).join(', ')
      const moreCount = fileList.length > 3 ? ` and ${fileList.length - 3} more` : ''
      bullets.push(`- Update ${modName} (${sampleNames}${moreCount})`)
    }

    if (categories.docs.length > 0) {
      bullets.push(`- Update documentation files`)
    }

    const fullMessage = `${title}\n\n${bullets.join('\n')}`
    setCommitMsg(fullMessage)
  }, [files])

  return {
    inputRef,
    loading,
    hasChanges,
    summary,
    files,
    commitMsg,
    setCommitMsg,
    committing,
    setCommitting,
    generateSmartCommit
  }
}
