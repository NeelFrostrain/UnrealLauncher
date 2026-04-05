import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { app, BrowserWindow, dialog } from 'electron'
import https from 'https'
import { compareVersions } from './utils'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

if (process.env.NODE_ENV === 'development') {
  autoUpdater.forceDevUpdateConfig = true
}

export function fetchGitHubLatestRelease(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/NeelFrostrain/UnrealLauncher/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'UnrealLauncher',
        Accept: 'application/vnd.github.v3+json'
      }
    }

    const req = https.request(options, (res) => {
      let rawData = ''
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(rawData)) } catch (err) { reject(err) }
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode}`))
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

export function setupAutoUpdaterEvents(getMainWindow: () => BrowserWindow | null): void {
  autoUpdater.on('update-available', (info) => {
    const win = getMainWindow()
    if (!win || win.isDestroyed()) return
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available. Do you want to download it now?`,
      buttons: ['Download', 'Later']
    }).then((result) => {
      if (result.response === 0) autoUpdater.downloadUpdate()
    })
  })

  autoUpdater.on('update-downloaded', () => {
    const win = getMainWindow()
    if (!win || win.isDestroyed()) return
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The app will restart to install the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('download-progress', progressObj)
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err)
    if (err instanceof Error && (err.message.includes('404') || err.message.includes('latest.yml'))) return
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'Update Error',
        message: 'Failed to check for updates. Please try again later.'
      })
    }
  })
}

export async function handleCheckForUpdates(): Promise<Record<string, unknown>> {
  try {
    if (process.env.NODE_ENV === 'development') {
      try {
        const result = await autoUpdater.checkForUpdates()
        if (result?.updateInfo) return { success: true, updateInfo: result.updateInfo }
        return { success: true, updateInfo: null, message: 'No updates available (Dev mode)' }
      } catch (err) {
        return { success: true, updateInfo: null, message: `Dev mode: ${err instanceof Error ? err.message : 'Update check failed'}` }
      }
    }

    const result = await autoUpdater.checkForUpdates()
    if (!result?.updateInfo) return { success: true, updateInfo: null, message: 'You are using the latest version' }
    return { success: true, updateInfo: result.updateInfo }
  } catch (err) {
    if (err instanceof Error && (err.message.includes('latest.yml') || err.message.includes('404'))) {
      return { success: true, updateInfo: null, message: 'No releases found. Create a GitHub release to enable updates.' }
    }
    return { success: false, error: 'Unable to check for updates. Please try again later.' }
  }
}

export async function handleCheckGithubVersion(currentVersion: string): Promise<Record<string, unknown>> {
  try {
    const release = await fetchGitHubLatestRelease()
    const latestVersion = String(release.tag_name || release.name || '').replace(/^v/i, '')
    if (!latestVersion) return { success: false, error: 'Latest GitHub release tag not found' }

    const updateAvailable = compareVersions(latestVersion, currentVersion)
    let message = ''
    if (updateAvailable) {
      message = `New version ${latestVersion} available on GitHub!`
    } else if (compareVersions(currentVersion, latestVersion)) {
      message = `Installed version ${currentVersion} is newer than GitHub latest ${latestVersion}.`
    } else {
      message = `You have the latest version (${currentVersion}). GitHub latest is ${latestVersion}.`
    }

    return { success: true, latestVersion, currentVersion, updateAvailable, message }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export { autoUpdater }
