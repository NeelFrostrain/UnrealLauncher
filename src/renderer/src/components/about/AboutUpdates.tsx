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
    const currentVersion = appVersion || '1.7.0'

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
      <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
        <RefreshCw size={20} className="text-blue-400" />
        Updates
      </h2>
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
        {/* Auto-Update */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-white/90 mb-1">Auto-Update Check</p>
            {updateMessage && (
              <p
                className={`text-xs ${updateStatus === 'error' ? 'text-red-400' : updateStatus === 'available' ? 'text-yellow-400' : updateStatus === 'ready' ? 'text-green-400' : 'text-white/50'}`}
              >
                {updateMessage}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {(updateStatus === 'idle' ||
              updateStatus === 'no-update' ||
              updateStatus === 'error') && (
              <button
                onClick={handleCheckForUpdates}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 border border-blue-500/50 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <RefreshCw size={16} /> Check Updates
              </button>
            )}
            {updateStatus === 'checking' && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/50 border border-blue-500/50 rounded-lg text-sm cursor-not-allowed"
              >
                <RefreshCw size={16} className="animate-spin" /> Checking...
              </button>
            )}
            {updateStatus === 'available' && (
              <button
                onClick={handleDownloadUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 border border-green-500/50 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <Download size={16} /> Download v{updateVersion}
              </button>
            )}
            {updateStatus === 'downloading' && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-green-600/50 border border-green-500/50 rounded-lg text-sm cursor-not-allowed"
              >
                <Download size={16} className="animate-pulse" /> Downloading...
              </button>
            )}
            {updateStatus === 'ready' && (
              <button
                onClick={() => window.electronAPI?.installUpdate?.()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <CheckCircle size={16} /> Install &amp; Restart
              </button>
            )}
          </div>
        </div>

        {/* GitHub Version */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-white/90 mb-1">GitHub Version Check</p>
              {githubVersion && (
                <p className="text-xs text-white/50">Latest on GitHub: v{githubVersion}</p>
              )}
              {githubMessage && <p className="text-xs text-white/70 mt-1">{githubMessage}</p>}
            </div>
            <div className="flex gap-2">
              {(githubStatus === 'idle' ||
                githubStatus === 'success' ||
                githubStatus === 'error') && (
                <button
                  onClick={checkGitHubVersion}
                  className={`flex items-center gap-2 px-4 py-2 ${githubStatus === 'error' ? 'bg-red-600 hover:bg-red-500 border-red-500/50' : 'bg-purple-600 hover:bg-purple-500 border-purple-500/50'} border rounded-lg text-sm transition-colors cursor-pointer`}
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
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/50 border border-purple-500/50 rounded-lg text-sm cursor-not-allowed"
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
