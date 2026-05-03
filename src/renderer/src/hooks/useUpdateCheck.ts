// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useEffect } from 'react'
import { APP_VERSION } from '../utils/appVersion'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'no-update'
  | 'error'
type GithubStatus = 'idle' | 'checking' | 'success' | 'error'

export interface UseUpdateCheckReturn {
  appVersion: string
  updateStatus: UpdateStatus
  updateMessage: string
  updateVersion: string
  githubVersion: string
  githubStatus: GithubStatus
  githubMessage: string
  handleCheckForUpdates: () => Promise<void>
  handleDownloadUpdate: () => Promise<void>
  checkGitHubVersion: () => Promise<void>
}

function compareVersions(v1: string, v2: string): boolean {
  const a = v1.split('.').map(Number)
  const b = v2.split('.').map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true
    if ((a[i] || 0) < (b[i] || 0)) return false
  }
  return false
}

export function useUpdateCheck(): UseUpdateCheckReturn {
  const [appVersion, setAppVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateVersion, setUpdateVersion] = useState('')
  const [githubVersion, setGithubVersion] = useState('')
  const [githubStatus, setGithubStatus] = useState<GithubStatus>('idle')
  const [githubMessage, setGithubMessage] = useState('')

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then(setAppVersion)
    }
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    if (!window.electronAPI?.checkForUpdates) return
    setUpdateStatus('checking')
    setUpdateMessage('Checking for updates...')

    const result = await window.electronAPI.checkForUpdates()
    const currentVersion = appVersion || APP_VERSION

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

  return {
    appVersion,
    updateStatus,
    updateMessage,
    updateVersion,
    githubVersion,
    githubStatus,
    githubMessage,
    handleCheckForUpdates,
    handleDownloadUpdate,
    checkGitHubVersion
  }
}
