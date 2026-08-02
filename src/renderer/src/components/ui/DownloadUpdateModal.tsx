// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React from 'react'
import { createPortal } from 'react-dom'
import { Download, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

interface DownloadUpdateModalProps {
  isOpen: boolean
  status: 'checking' | 'downloading' | 'ready' | 'error'
  version?: string
  message?: string
  onInstall?: () => void
  onClose?: () => void
}

export function DownloadUpdateModal({
  isOpen,
  status,
  version,
  message,
  onInstall,
  onClose
}: DownloadUpdateModalProps): React.ReactElement | null {
  if (!isOpen) return null

  const isDownloading = status === 'downloading' || status === 'checking'
  const isReady = status === 'ready'
  const isError = status === 'error'

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="flex flex-col overflow-hidden w-full"
        style={{
          maxWidth: 460,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)'
        }}
      >
        {/* Titlebar header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div
            className="p-2 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: isError
                ? 'rgba(239,68,68,0.15)'
                : isReady
                  ? 'rgba(74,222,128,0.15)'
                  : 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
              color: isError ? '#ef4444' : isReady ? '#4ade80' : 'var(--color-accent)',
              border: `1px solid ${
                isError
                  ? 'rgba(239,68,68,0.3)'
                  : isReady
                    ? 'rgba(74,222,128,0.3)'
                    : 'color-mix(in srgb, var(--color-accent) 30%, transparent)'
              }`
            }}
          >
            {isDownloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isReady ? (
              <CheckCircle2 size={18} />
            ) : isError ? (
              <AlertCircle size={18} />
            ) : (
              <Download size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-base font-semibold flex items-center gap-1.5"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {isDownloading
                ? 'Downloading Update...'
                : isReady
                  ? 'Update Ready to Install'
                  : isError
                    ? 'Update Error'
                    : 'Software Update'}
              <Sparkles size={14} style={{ color: 'var(--color-accent)' }} />
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {version ? `Unreal Launcher v${version}` : 'Unreal Launcher Update'}
            </p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 flex flex-col items-center justify-center text-center gap-4">
          {isDownloading && (
            <>
              {/* Spinner & Pulsing animation */}
              <div className="relative flex items-center justify-center my-2">
                <div
                  className="w-16 h-16 rounded-full animate-ping opacity-20 absolute"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center border-2"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderColor: 'var(--color-accent)'
                  }}
                >
                  <Download
                    size={22}
                    className="animate-bounce"
                    style={{ color: 'var(--color-accent)' }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Downloading update packages, please wait...
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {message ||
                    'Please do not close Unreal Launcher while the update is downloading.'}
                </p>
              </div>
            </>
          )}

          {isReady && (
            <div className="space-y-2 my-1">
              <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>
                Update downloaded successfully!
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Click <strong>Install & Restart</strong> to update Unreal Launcher now.
              </p>
            </div>
          )}

          {isError && (
            <div className="space-y-2 my-1">
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                Update Download Failed
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {message || 'An error occurred while downloading the update.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3.5 shrink-0"
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}
        >
          {isReady && (
            <button
              onClick={onInstall}
              className="px-4 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer hover:opacity-90"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-accent)'
              }}
            >
              Install & Restart
            </button>
          )}
          {(isReady || isError) && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
