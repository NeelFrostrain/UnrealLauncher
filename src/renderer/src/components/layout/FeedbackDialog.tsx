import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Paperclip, Send, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import config from '../../../../config'

const DISCORD_WEBHOOK = config.discordWebhook
const MAX_FILES = 5
const MAX_FILE_BYTES = 2 * 1024 * 1024

type Mode = 'report' | 'suggestion'

interface Attachment {
  file: File
  preview: string | null
}

export default function FeedbackDialog({ onClose }: { onClose: () => void }): React.ReactElement {
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

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      setFileError('')
      const next = [...attachments]
      for (const file of Array.from(files)) {
        if (next.length >= MAX_FILES) {
          setFileError(`Max ${MAX_FILES} attachments`)
          break
        }
        if (file.size > MAX_FILE_BYTES) {
          setFileError(`"${file.name}" exceeds 2 MB`)
          continue
        }
        next.push({
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        })
      }
      setAttachments(next)
    },
    [attachments]
  )

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
      // Convert attachments to base64 so they can cross the IPC bridge
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        className="w-full max-w-lg mx-4 flex flex-col overflow-hidden"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          maxHeight: '90vh'
        }}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
      >
        {/* Accent line */}
        <div
          className="h-px w-full transition-all duration-300"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {/* Type toggle */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)'
            }}
          >
            {(['report', 'suggestion'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setStatus('idle')
                }}
                className="px-3 py-1 text-xs font-semibold cursor-pointer transition-all"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.7)',
                  backgroundColor:
                    mode === m
                      ? `color-mix(in srgb, ${accentColor} 15%, var(--color-surface-elevated))`
                      : 'transparent',
                  color: mode === m ? accentColor : 'var(--color-text-muted)',
                  border:
                    mode === m
                      ? `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`
                      : '1px solid transparent'
                }}
              >
                {m === 'report' ? 'Bug Report' : 'Suggestion'}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 cursor-pointer"
            style={{
              borderRadius: 'calc(var(--radius) * 0.5)',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)'
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="your@email.com"
              type="email"
            />
          </div>
          <Field
            label="Title *"
            value={title}
            onChange={setTitle}
            placeholder={
              mode === 'report' ? 'Brief description of the bug' : 'What would you like to see?'
            }
          />
          <div className="flex flex-col gap-1">
            <label
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={
                mode === 'report'
                  ? 'Steps to reproduce, expected vs actual behavior...'
                  : 'Describe your idea in detail...'
              }
              className="w-full resize-none text-xs px-3 py-2.5 outline-none"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Attachments ({attachments.length}/{MAX_FILES})
              </label>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={attachments.length >= MAX_FILES}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium cursor-pointer disabled:opacity-40"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.5)',
                  backgroundColor: 'var(--color-surface-card)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <Paperclip size={10} /> Attach
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.log"
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>
            {fileError && (
              <p className="text-[10px]" style={{ color: '#f87171' }}>
                {fileError}
              </p>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    className="relative group flex items-center gap-1.5 px-2 py-1.5"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.6)',
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {a.preview ? (
                      <img src={a.preview} alt="" className="w-8 h-8 object-cover rounded" />
                    ) : (
                      <div
                        className="w-8 h-8 flex items-center justify-center rounded"
                        style={{ backgroundColor: 'var(--color-surface-elevated)' }}
                      >
                        <Paperclip size={12} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    )}
                    <span
                      className="text-[10px] max-w-[80px] truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {a.file.name}
                    </span>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="p-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#f87171' }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-3 px-5 py-3.5"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {status === 'error' && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#f87171' }}>
              <AlertCircle size={13} /> {errorMsg}
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4ade80' }}>
              <CheckCircle size={13} /> Sent!
            </div>
          )}
          {(status === 'idle' || status === 'sending') && (
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              * required
            </p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium cursor-pointer"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: accentColor,
                color: 'var(--color-text-primary)'
              }}
            >
              {status === 'sending' ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send size={12} /> Submit
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-[10px] uppercase tracking-wider font-semibold"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs px-3 py-2 outline-none"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          fontFamily: 'inherit'
        }}
      />
    </div>
  )
}
