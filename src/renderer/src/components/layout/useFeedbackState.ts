// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useRef, useCallback } from 'react'
import config from '../../../../config'

const DISCORD_WEBHOOK = config.discordWebhook
const MAX_FILES = 5
const MAX_FILE_BYTES = 2 * 1024 * 1024

export type Mode = 'report' | 'suggestion'

export interface Attachment {
  file: File
  preview: string | null
}

export function useFeedbackState(onClose: () => void) {
  const [mode, setMode] = useState<Mode>('report')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [fileError, setFileError] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const accentColor = mode === 'report' ? '#f87171' : '#60a5fa'
  const accentHex = mode === 'report' ? 0xf87171 : 0x60a5fa

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return
    setFileError('')
    const next = [...attachments]
    for (const file of Array.from(files)) {
      if (next.length >= MAX_FILES) { setFileError(`Max ${MAX_FILES} attachments`); break }
      if (file.size > MAX_FILE_BYTES) { setFileError(`"${file.name}" exceeds 2 MB`); continue }
      next.push({ file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null })
    }
    setAttachments(next)
  }, [attachments])

  const removeAttachment = (i: number): void => {
    const next = [...attachments]
    if (next[i].preview) URL.revokeObjectURL(next[i].preview!)
    next.splice(i, 1)
    setAttachments(next)
    setFileError('')
  }

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim() || !description.trim()) return
    setStatus('sending')
    try {
      const files = await Promise.all(
        attachments.map(async (a) => {
          const buf = await a.file.arrayBuffer()
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
          return { name: a.file.name, type: a.file.type, b64 }
        })
      )
      const payload = JSON.stringify({
        webhookUrl: DISCORD_WEBHOOK,
        embed: {
          title: `[${mode === 'report' ? 'Bug Report' : 'Suggestion'}] ${title.trim()}`,
          color: accentHex,
          fields: [
            { name: 'Name', value: name.trim() || '—', inline: true },
            { name: 'Email', value: email.trim() || '—', inline: true },
            { name: 'Description', value: description.trim().slice(0, 1024) }
          ],
          footer: { text: `Unreal Launcher • ${new Date().toLocaleString()}` }
        },
        files
      })
      const result = await window.electronAPI.sendDiscordWebhook(DISCORD_WEBHOOK, payload)
      if (!result.ok) throw new Error(`Discord returned ${result.status}`)
      setStatus('success')
      setTimeout(onClose, 1600)
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Failed to send')
    }
  }

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && status === 'idle'

  return {
    mode, setMode, name, setName, email, setEmail, title, setTitle,
    description, setDescription, attachments, fileError, status, errorMsg,
    fileRef, accentColor, accentHex, MAX_FILES, addFiles, removeAttachment, handleSubmit, canSubmit
  }
}
