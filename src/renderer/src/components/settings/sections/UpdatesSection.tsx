// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { RefreshCw, Download, CheckCircle, GitBranch } from 'lucide-react'
import { Card } from '../SectionHelpers'
import { useUpdateCheck } from '../../../hooks/useUpdateCheck'

// Status-specific semantic colors — these are intentional fixed colors, not theme tokens
const STATUS_COLOR = {
  error: { text: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
  warning: { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
  success: { text: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
  accent: {
    text: 'var(--color-accent)',
    bg: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
    border: 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
  },
  purple: { text: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' }
}

function ActionBtn({
  onClick,
  disabled,
  color,
  icon,
  label
}: {
  onClick?: () => void
  disabled?: boolean
  color: keyof typeof STATUS_COLOR
  icon: React.ReactNode
  label: string
}): React.ReactElement {
  const c = STATUS_COLOR[color]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`
      }}
    >
      {icon}
      {label}
    </button>
  )
}

const UpdatesSection = (): React.ReactElement => {
  const {
    updateStatus,
    updateMessage,
    updateVersion,
    githubVersion,
    githubStatus,
    githubMessage,
    handleCheckForUpdates,
    handleDownloadUpdate,
    checkGitHubVersion
  } = useUpdateCheck()

  const updateMsgColor =
    updateStatus === 'error'
      ? STATUS_COLOR.error.text
      : updateStatus === 'available'
        ? STATUS_COLOR.warning.text
        : updateStatus === 'ready'
          ? STATUS_COLOR.success.text
          : 'var(--color-text-muted)'

  return (
    <section>
      <Card>
        {/* Auto-updater */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Check for updates
              </p>
              <p
                className="text-xs mt-0.5 leading-relaxed"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Check for and download new versions of Unreal Launcher
              </p>
              {updateMessage && (
                <p className="text-xs mt-2" style={{ color: updateMsgColor }}>
                  {updateMessage}
                </p>
              )}
            </div>
            <div className="shrink-0 flex gap-2">
              {(updateStatus === 'idle' ||
                updateStatus === 'no-update' ||
                updateStatus === 'error') && (
                <ActionBtn
                  onClick={handleCheckForUpdates}
                  color="accent"
                  icon={<RefreshCw size={12} />}
                  label="Check"
                />
              )}
              {updateStatus === 'checking' && (
                <ActionBtn
                  disabled
                  color="accent"
                  icon={<RefreshCw size={12} className="animate-spin" />}
                  label="Checking…"
                />
              )}
              {updateStatus === 'available' && (
                <ActionBtn
                  onClick={handleDownloadUpdate}
                  color="success"
                  icon={<Download size={12} />}
                  label={`v${updateVersion}`}
                />
              )}
              {updateStatus === 'downloading' && (
                <ActionBtn
                  disabled
                  color="success"
                  icon={<Download size={12} className="animate-pulse" />}
                  label="Downloading…"
                />
              )}
              {updateStatus === 'ready' && (
                <ActionBtn
                  onClick={() => window.electronAPI?.installUpdate?.()}
                  color="purple"
                  icon={<CheckCircle size={12} />}
                  label="Install"
                />
              )}
            </div>
          </div>
        </div>

        {/* GitHub version check */}
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                GitHub version check
              </p>
              <p
                className="text-xs mt-0.5 leading-relaxed"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Check the latest release version on GitHub
              </p>
              {githubVersion && (
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Latest on GitHub: v{githubVersion}
                </p>
              )}
              {githubMessage && (
                <p
                  className="text-xs mt-2"
                  style={{
                    color:
                      githubStatus === 'error' ? STATUS_COLOR.error.text : 'var(--color-text-muted)'
                  }}
                >
                  {githubMessage}
                </p>
              )}
            </div>
            <div className="shrink-0 flex gap-2">
              {(githubStatus === 'idle' ||
                githubStatus === 'success' ||
                githubStatus === 'error') && (
                <ActionBtn
                  onClick={checkGitHubVersion}
                  color={githubStatus === 'error' ? 'error' : 'purple'}
                  icon={
                    githubStatus === 'error' ? <RefreshCw size={12} /> : <GitBranch size={12} />
                  }
                  label={
                    githubStatus === 'success'
                      ? 'Recheck'
                      : githubStatus === 'error'
                        ? 'Retry'
                        : 'Check'
                  }
                />
              )}
              {githubStatus === 'checking' && (
                <ActionBtn
                  disabled
                  color="purple"
                  icon={<RefreshCw size={12} className="animate-spin" />}
                  label="Checking…"
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}

export default UpdatesSection
