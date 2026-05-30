// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState } from 'react'
import { RefreshCw, Download, CheckCircle, GitBranch } from 'lucide-react'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'no-update'
  | 'error'
type GithubStatus = 'idle' | 'checking' | 'success' | 'error'

function compareVersions(v1: string, v2: string): boolean {
  const a = v1.split('.').map(Number)
  const b = v2.split('.').map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true
    if ((a[i] || 0) < (b[i] || 0)) return false
  }
  return false
}

const AboutUpdates = ({ appVersion }: { appVersion: string }): React.ReactElement => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateVersion, setUpdateVersion] = useState('')
  const [githubVersion, setGithubVersion] = useState('')
  const [githubStatus, setGithubStatus] = useState<GithubStatus>('idle')
  const [githubMessage, setGithubMessage] = useState('')

  const handleCheckForUpdates = async (): Promise<void> => {
    if (!window.electronAPI?.checkForUpdates) return
    setUpdateStatus('checking')
    setUpdateMessage('Checking for updates...')

    const result = await window.electronAPI.checkForUpdates()
    const currentVersion = appVersion || '0.0.0'

    if (result.success && result.updateInfo) {
      const latestVersion = String(result.updateInfo.version || '').replace(/^v/i, '')
      if (compareVersions(latestVersion, currentVersion)) {
        setUpdateStatus('available')
        setUpdateVersion(latestVersion)
        setUpdateMessage(`Version ${latestVersion} is available!`)
      } else {
        setUpdateStatus('no-update')
        setUpdateMessage(
          `No update available. Installed version ${currentVersion} is newer or equal to ${latestVersion}.`
        )
      }
    } else if (result.success) {
      setUpdateStatus('no-update')
      setUpdateMessage(result.message || 'You are using the latest version')
    } else {
      setUpdateStatus('error')
      setUpdateMessage(result.error || 'Failed to check for updates')
    }
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    if (!window.electronAPI?.downloadUpdate) return
    setUpdateStatus('downloading')
    setUpdateMessage('Downloading update...')
    const result = await window.electronAPI.downloadUpdate()
    if (result.success) {
      setUpdateStatus('ready')
      setUpdateMessage('Update downloaded and ready to install')
    } else {
      setUpdateStatus('error')
      setUpdateMessage(result.error || 'Failed to download update')
    }
  }

  const checkGitHubVersion = async (): Promise<void> => {
    setGithubStatus('checking')
    try {
      if (!window.electronAPI?.checkGithubVersion)
        throw new Error('GitHub version check is not available')
      const result = await window.electronAPI.checkGithubVersion()
      if (!result.success) throw new Error(result.error || 'GitHub version check failed')
      setGithubVersion(result.latestVersion || '')
      setGithubStatus('success')
      setGithubMessage(result.message || '')
    } catch (error) {
      setGithubStatus('error')
      setGithubMessage(
        `Failed to check GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return (
    <div>
      <h2
        className="text-xl font-bold mb-4 flex items-center gap-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <RefreshCw size={20} className="text-blue-400" />
        Updates
      </h2>
      <div
        className="p-6 space-y-4"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)'
        }}
      >
        {/* Auto-Update */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Auto-Update Check
            </p>
            {updateMessage && (
              <p
                className="text-xs"
                style={{
                  color:
                    updateStatus === 'error'
                      ? '#f87171'
                      : updateStatus === 'available'
                        ? '#fbbf24'
                        : updateStatus === 'ready'
                          ? '#4ade80'
                          : 'var(--color-text-muted)'
                }}
              >
                {updateMessage}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {(updateStatus === 'idle' ||
              updateStatus === 'no-update' ||
              updateStatus === 'error') && (
              <button
                onClick={handleCheckForUpdates}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 50%, transparent)'
                }}
              >
                <RefreshCw size={16} /> Check Updates
              </button>
            )}
            {updateStatus === 'checking' && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-not-allowed opacity-60"
                style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
              >
                <RefreshCw size={16} className="animate-spin" /> Checking...
              </button>
            )}
            {updateStatus === 'available' && (
              <button
                onClick={handleDownloadUpdate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: '1px solid rgba(22,163,74,0.5)'
                }}
              >
                <Download size={16} /> Download v{updateVersion}
              </button>
            )}
            {updateStatus === 'downloading' && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-not-allowed opacity-60"
                style={{ backgroundColor: '#16a34a', color: 'white' }}
              >
                <Download size={16} className="animate-pulse" /> Downloading...
              </button>
            )}
            {updateStatus === 'ready' && (
              <button
                onClick={() => window.electronAPI?.installUpdate?.()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: '1px solid rgba(124,58,237,0.5)'
                }}
              >
                <CheckCircle size={16} /> Install &amp; Restart
              </button>
            )}
          </div>
        </div>

        {/* GitHub Version */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                GitHub Version Check
              </p>
              {githubVersion && (
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Latest on GitHub: v{githubVersion}
                </p>
              )}
              {githubMessage && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {githubMessage}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {(githubStatus === 'idle' ||
                githubStatus === 'success' ||
                githubStatus === 'error') && (
                <button
                  onClick={checkGitHubVersion}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                  style={{
                    backgroundColor: githubStatus === 'error' ? '#dc2626' : '#7c3aed',
                    color: 'white',
                    border: `1px solid ${githubStatus === 'error' ? 'rgba(220,38,38,0.5)' : 'rgba(124,58,237,0.5)'}`
                  }}
                >
                  {githubStatus === 'error' ? <RefreshCw size={16} /> : <GitBranch size={16} />}
                  {githubStatus === 'success'
                    ? 'Recheck'
                    : githubStatus === 'error'
                      ? 'Retry'
                      : 'Check GitHub'}
                </button>
              )}
              {githubStatus === 'checking' && (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-not-allowed opacity-60"
                  style={{ backgroundColor: '#7c3aed', color: 'white' }}
                >
                  <RefreshCw size={16} className="animate-spin" /> Checking...
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutUpdates
