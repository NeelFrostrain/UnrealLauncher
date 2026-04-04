import PageWrapper from '../layout/PageWrapper'
import GitHubIcon from '@mui/icons-material/GitHub'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import TimelineIcon from '@mui/icons-material/Timeline'
import WarningIcon from '@mui/icons-material/Warning'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import CodeIcon from '@mui/icons-material/Code'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useEffect, useState } from 'react'

const AboutPage = (): React.ReactElement => {
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'no-update' | 'error'
  >('idle')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateVersion, setUpdateVersion] = useState('')
  const [githubVersion, setGithubVersion] = useState('')
  const [githubStatus, setGithubStatus] = useState<'idle' | 'checking' | 'success' | 'error'>(
    'idle'
  )
  const [githubMessage, setGithubMessage] = useState('')
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    const loadAppVersion = async (): Promise<void> => {
      if (window.electronAPI?.getAppVersion) {
        try {
          const version = await window.electronAPI.getAppVersion()
          setAppVersion(version)
        } catch (error) {
          console.error('Failed to get app version:', error)
        }
      }
    }

    void loadAppVersion()
  }, [])

  const checkGitHubVersion = async (): Promise<string> => {
    setGithubStatus('checking')

    try {
      if (!window.electronAPI?.checkGithubVersion) {
        throw new Error('GitHub version check is not available')
      }

      const result = await window.electronAPI.checkGithubVersion()

      if (!result.success) {
        throw new Error(result.error || 'GitHub version check failed')
      }

      const latestVersion = result.latestVersion || ''
      const currentVersion = result.currentVersion || appVersion || '1.7.0'

      if (!latestVersion) {
        throw new Error('Latest release version not found')
      }

      setGithubVersion(latestVersion)

      if (compareVersions(latestVersion, currentVersion)) {
        setGithubStatus('success')
        return `New version ${latestVersion} available on GitHub!`
      }

      if (compareVersions(currentVersion, latestVersion)) {
        setGithubStatus('success')
        return `Installed version ${currentVersion} is newer than GitHub latest ${latestVersion}.`
      }

      setGithubStatus('success')
      return `You have the latest version (${currentVersion}). GitHub latest is ${latestVersion}.`
    } catch (error) {
      setGithubStatus('error')
      console.error('Failed to check GitHub version:', error)
      return `Failed to check GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  const compareVersions = (version1: string, version2: string): boolean => {
    const v1 = version1.split('.').map(Number)
    const v2 = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0
      const num2 = v2[i] || 0

      if (num1 > num2) return true
      if (num1 < num2) return false
    }

    return false // versions are equal
  }

  const handleCheckForUpdates = async (): Promise<void> => {
    if (!window.electronAPI?.checkForUpdates) return

    setUpdateStatus('checking')
    setUpdateMessage('Checking for updates...')

    const result = await window.electronAPI.checkForUpdates()
    const currentVersion =
      appVersion ||
      (window.electronAPI?.getAppVersion ? await window.electronAPI.getAppVersion() : '1.7.0')

    if (result.success && result.updateInfo) {
      const latestVersion = String(result.updateInfo.version || '').replace(/^v/i, '')
      const isUpdateNewer = compareVersions(latestVersion, currentVersion)
      const isCurrentNewer = compareVersions(currentVersion, latestVersion)

      if (isUpdateNewer) {
        setUpdateStatus('available')
        setUpdateVersion(latestVersion)
        setUpdateMessage(`Version ${latestVersion} is available!`)
      } else if (isCurrentNewer || latestVersion === currentVersion) {
        setUpdateStatus('no-update')
        setUpdateMessage(
          `No update available. Installed version ${currentVersion} is newer or equal to ${latestVersion}.`
        )
      } else {
        setUpdateStatus('no-update')
        setUpdateMessage(result.message || 'You are using the latest version')
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

  const handleInstallUpdate = (): void => {
    if (!window.electronAPI?.installUpdate) return
    window.electronAPI.installUpdate()
  }
  return (
    <PageWrapper>
      {/* <PageTitleBar title="About" description="Information about Unreal Launcher" /> */}

      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
          {/* Header */}
          {/* <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50">
              <span className="text-4xl font-black text-white">UL</span>
            </div>
            <h1 className="text-4xl font-black bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Unreal Launcher
            </h1>
            <p className="text-white/50 text-sm max-w-xl mx-auto">
              A lightweight Electron desktop app for discovering, launching, and managing Unreal
              Engine installations and projects. Built with TypeScript, Vite, and Electron for a
              fast and responsive experience.
            </p>
          </div> */}

          {/* Features */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <FlashOnIcon sx={{ fontSize: 20 }} className="text-blue-400" />
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Inventory2Icon className="text-blue-400" sx={{ fontSize: 20 }} />
                  <h3 className="text-sm font-semibold text-white/90">Engine Management</h3>
                </div>
                <p className="text-xs text-white/50">
                  Scan and manage multiple Unreal Engine versions (UE4 & UE5)
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <TimelineIcon className="text-purple-400" sx={{ fontSize: 20 }} />
                  <h3 className="text-sm font-semibold text-white/90">Project Tracking</h3>
                </div>
                <p className="text-xs text-white/50">
                  Automatically find and organize your Unreal projects with thumbnails
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <FlashOnIcon className="text-green-400" sx={{ fontSize: 20 }} />
                  <h3 className="text-sm font-semibold text-white/90">Quick Launch</h3>
                </div>
                <p className="text-xs text-white/50">
                  Launch engines and projects with a single click
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <CodeIcon className="text-yellow-400" sx={{ fontSize: 20 }} />
                  <h3 className="text-sm font-semibold text-white/90">Size Calculation</h3>
                </div>
                <p className="text-xs text-white/50">
                  Calculate exact folder sizes with background processing
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <RefreshIcon className="text-orange-400" sx={{ fontSize: 20 }} />
                  <h3 className="text-sm font-semibold text-white/90">Recent Projects</h3>
                </div>
                <p className="text-xs text-white/50">
                  Sorted by actual last-opened time using Saved/Logs timestamps
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <WarningIcon className="text-cyan-400" sx={{ fontSize: 20 }} />
                  <h3 className="text-sm font-semibold text-white/90">Toast Notifications</h3>
                </div>
                <p className="text-xs text-white/50">
                  Real-time feedback for all user actions and operations
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <MenuBookIcon className="text-pink-400" sx={{ fontSize: 20 }} />
                  <h3 className="text-sm font-semibold text-white/90">Settings Page</h3>
                </div>
                <p className="text-xs text-white/50">Customize app behavior and user preferences</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <TimelineIcon className="text-indigo-400" sx={{ fontSize: 20 }} />
                  <h3 className="text-sm font-semibold text-white/90">Smooth Animations</h3>
                </div>
                <p className="text-xs text-white/50">
                  Beautiful framer-motion animations throughout the interface
                </p>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <MenuBookIcon sx={{ fontSize: 20 }} className="text-green-400" />
              How to Use
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">
                  1. Scan for Engines &amp; Projects
                </h3>
                <p className="text-xs text-white/50">
                  Click &quot;Scan for Engines&quot; or &quot;Scan for Projects&quot; to
                  automatically detect installations. The app searches common locations and
                  calculates sizes in the background.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">2. Add Manually</h3>
                <p className="text-xs text-white/50">
                  Use &quot;Add Engine&quot; or &quot;Add Project&quot; buttons to manually select
                  folders if they&apos;re in custom locations.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">3. Launch & Manage</h3>
                <p className="text-xs text-white/50">
                  Click the Launch button to start engines or projects. Hover over cards to access
                  additional options like opening directories or removing from the list.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">4. Track Usage</h3>
                <p className="text-xs text-white/50">
                  The app automatically tracks when you last launched each engine, helping you
                  manage your installations.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">5. Use Favorites</h3>
                <p className="text-xs text-white/50">
                  Click the heart icon on project cards to add them to your favorites. Access your
                  favorite projects quickly from the Favorites tab.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">6. Customize Settings</h3>
                <p className="text-xs text-white/50">
                  Visit the Settings page to customize app behavior, including auto-close on launch
                  and other preferences.
                </p>
              </div>
            </div>
          </div>

          {/* Known Issues */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <WarningIcon sx={{ fontSize: 20 }} className="text-yellow-400" />
              Known Issues & Notes
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
              <div className="flex gap-3">
                <span className="text-yellow-400 mt-0.5">•</span>
                <p className="text-xs text-white/50">
                  Size calculation may take time for large folders (30+ GB). The app remains
                  responsive during calculation.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400 mt-0.5">•</span>
                <p className="text-xs text-white/50">
                  Removing engines or projects from the list does NOT delete files from disk - only
                  removes them from the launcher.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400 mt-0.5">•</span>
                <p className="text-xs text-white/50">
                  Project thumbnails are loaded from Saved/AutoScreenshot.png if available.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400 mt-0.5">•</span>
                <p className="text-xs text-white/50">
                  The app scans these default paths: D:\Engine\UnrealEditors, C:\Program Files\Epic
                  Games, Documents\Unreal Projects
                </p>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4">Technical Details</h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Version</span>
                <span className="text-sm font-mono text-white/90">1.7.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Framework</span>
                <span className="text-sm text-white/90">Electron 39.2.6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">UI Library</span>
                <span className="text-sm text-white/90">React 19.2.1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Language</span>
                <span className="text-sm text-white/90">TypeScript 5.9.3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Build Tool</span>
                <span className="text-sm text-white/90">Vite 7.2.6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">License</span>
                <span className="text-sm text-white/90">MIT</span>
              </div>
            </div>
          </div>

          {/* Contributing */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <GitHubIcon sx={{ fontSize: 20 }} className="text-green-400" />
              Contributing
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <p className="text-xs text-white/50">
                We welcome contributions! Help make Unreal Launcher better for everyone.
              </p>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">How to Contribute</h3>
                <ul className="text-xs text-white/50 space-y-1 ml-4">
                  <li>• Fork the repository</li>
                  <li>• Create a feature branch</li>
                  <li>• Make your changes and run tests</li>
                  <li>• Open a pull request</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">Development Guidelines</h3>
                <ul className="text-xs text-white/50 space-y-1 ml-4">
                  <li>
                    • Run <code className="bg-white/10 px-1 rounded">npm run lint</code> before
                    committing
                  </li>
                  <li>• Ensure TypeScript types are correct</li>
                  <li>• Update documentation for new features</li>
                  <li>• Test on multiple platforms when possible</li>
                </ul>
              </div>
              <button
                onClick={() =>
                  window.electronAPI.openExternal(
                    'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CONTRIBUTING.md'
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 border border-green-500/50 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <MenuBookIcon sx={{ fontSize: 16 }} />
                Read Contributing Guide
              </button>
            </div>
          </div>

          {/* Code of Conduct */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <WarningIcon sx={{ fontSize: 20 }} className="text-blue-400" />
              Code of Conduct
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <p className="text-xs text-white/50">
                This project is governed by a Code of Conduct to ensure a welcoming environment for
                everyone.
              </p>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">Our Standards</h3>
                <ul className="text-xs text-white/50 space-y-1 ml-4">
                  <li>• Use welcoming and inclusive language</li>
                  <li>• Be respectful of differing viewpoints</li>
                  <li>• Show empathy towards community members</li>
                  <li>• Focus on what&apos;s best for the community</li>
                </ul>
              </div>
              <button
                onClick={() =>
                  window.electronAPI.openExternal(
                    'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CODE_OF_CONDUCT.md'
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 border border-blue-500/50 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <MenuBookIcon sx={{ fontSize: 16 }} />
                Read Code of Conduct
              </button>
            </div>
          </div>

          {/* Security */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <WarningIcon sx={{ fontSize: 20 }} className="text-red-400" />
              Security
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <p className="text-xs text-white/50">
                If you discover a security vulnerability, please report it privately.
              </p>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">Reporting</h3>
                <p className="text-xs text-white/50">
                  Send security reports to:{' '}
                  <code className="bg-white/10 px-1 rounded">nfrostrain@gmail.com</code>
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/90">Supported Versions</h3>
                <p className="text-xs text-white/50">
                  Security fixes are only applied to the current stable release.
                </p>
              </div>
              <button
                onClick={() =>
                  window.electronAPI.openExternal(
                    'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/SECURITY.md'
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 border border-red-500/50 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <MenuBookIcon sx={{ fontSize: 16 }} />
                Read Security Policy
              </button>
            </div>
          </div>

          {/* Support & Donations */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <FlashOnIcon sx={{ fontSize: 20 }} className="text-purple-400" />
              Support the Project
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <p className="text-xs text-white/50">
                Your support helps keep Unreal Launcher growing and allows more time to build
                features.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => window.electronAPI.openExternal('https://ko-fi.com/neelfrostrain')}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 border border-orange-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  <span>☕</span>
                  Ko-fi
                </button>
                <button
                  onClick={() =>
                    window.electronAPI.openExternal('https://github.com/sponsors/NeelFrostrain')
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 border border-pink-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  <span>💖</span>
                  GitHub Sponsors
                </button>
              </div>
              <p className="text-xs text-white/40">
                Also consider starring ⭐ the repo and sharing it with your friends!
              </p>
              <button
                onClick={() =>
                  window.electronAPI.openExternal(
                    'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/DONATE.md'
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <MenuBookIcon sx={{ fontSize: 16 }} />
                More Ways to Support
              </button>
            </div>
          </div>

          {/* Update Section */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <RefreshIcon sx={{ fontSize: 20 }} className="text-blue-400" />
              Updates
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              {/* Auto-Update Check */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-white/90 mb-1">Auto-Update Check</p>
                  {updateMessage && (
                    <p
                      className={`text-xs ${
                        updateStatus === 'error'
                          ? 'text-red-400'
                          : updateStatus === 'available'
                            ? 'text-yellow-400'
                            : updateStatus === 'ready'
                              ? 'text-green-400'
                              : 'text-white/50'
                      }`}
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
                      <RefreshIcon sx={{ fontSize: 16 }} />
                      Check Updates
                    </button>
                  )}
                  {updateStatus === 'checking' && (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/50 border border-blue-500/50 rounded-lg text-sm cursor-not-allowed"
                    >
                      <RefreshIcon sx={{ fontSize: 16 }} className="animate-spin" />
                      Checking...
                    </button>
                  )}
                  {updateStatus === 'available' && (
                    <button
                      onClick={handleDownloadUpdate}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 border border-green-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      <DownloadIcon sx={{ fontSize: 16 }} />
                      Download v{updateVersion}
                    </button>
                  )}
                  {updateStatus === 'downloading' && (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-green-600/50 border border-green-500/50 rounded-lg text-sm cursor-not-allowed"
                    >
                      <DownloadIcon sx={{ fontSize: 16 }} className="animate-pulse" />
                      Downloading...
                    </button>
                  )}
                  {updateStatus === 'ready' && (
                    <button
                      onClick={handleInstallUpdate}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                      Install & Restart
                    </button>
                  )}
                </div>
              </div>

              {/* GitHub Version Check */}
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
                    {githubStatus === 'idle' && (
                      <button
                        onClick={async () => {
                          const message = await checkGitHubVersion()
                          setGithubMessage(message)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                      >
                        <GitHubIcon sx={{ fontSize: 16 }} />
                        Check GitHub
                      </button>
                    )}
                    {githubStatus === 'checking' && (
                      <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/50 border border-purple-500/50 rounded-lg text-sm cursor-not-allowed"
                      >
                        <RefreshIcon sx={{ fontSize: 16 }} className="animate-spin" />
                        Checking...
                      </button>
                    )}
                    {githubStatus === 'success' && (
                      <button
                        onClick={async () => {
                          const message = await checkGitHubVersion()
                          setGithubMessage(message)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                      >
                        <GitHubIcon sx={{ fontSize: 16 }} />
                        Recheck
                      </button>
                    )}
                    {githubStatus === 'error' && (
                      <button
                        onClick={async () => {
                          const message = await checkGitHubVersion()
                          setGithubMessage(message)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 border border-red-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                      >
                        <RefreshIcon sx={{ fontSize: 16 }} />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Changelog */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <MenuBookIcon sx={{ fontSize: 20 }} className="text-yellow-400" />
              What&apos;s New (dev)
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-green-400">✅ Added</h3>
                <ul className="text-xs text-white/50 space-y-1 ml-4">
                  <li>• Recent Projects tab now sorted by actual last-opened time from Saved/Logs</li>
                  <li>• Migrated all icons from lucide-react to MUI icons-material</li>
                  <li>• GitHub Version Check: compare installed vs latest GitHub release</li>
                  <li>• App Version IPC: renderer now reads the real app version</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-400">🛠️ Fixed</h3>
                <ul className="text-xs text-white/50 space-y-1 ml-4">
                  <li>• lastOpenedAt was missing from ProjectData type — now flows to renderer correctly</li>
                  <li>• ProjectCard useEffect missing async wrapper caused a parse error on await</li>
                  <li>• Log scanner now only reads top-level Saved/Logs files, not subdirectories</li>
                  <li>• Recent tab no longer falls back to createdAt for projects never opened</li>
                </ul>
              </div>
              <button
                onClick={() =>
                  window.electronAPI.openExternal(
                    'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CHANGELOG.md'
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 border border-yellow-500/50 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <MenuBookIcon sx={{ fontSize: 16 }} />
                View Full Changelog
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() =>
                  window.electronAPI.openExternal('https://github.com/NeelFrostrain/UnrealLauncher')
                }
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <GitHubIcon sx={{ fontSize: 16 }} />
                GitHub
              </button>
              <button
                onClick={() =>
                  window.electronAPI.openExternal(
                    'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CHANGELOG.md'
                  )
                }
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <MenuBookIcon sx={{ fontSize: 16 }} />
                Changelog
              </button>
              <button
                onClick={() =>
                  window.electronAPI.openExternal(
                    'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CONTRIBUTING.md'
                  )
                }
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <CodeIcon sx={{ fontSize: 16 }} />
                Contribute
              </button>
              <button
                onClick={() =>
                  window.electronAPI.openExternal(
                    'https://github.com/NeelFrostrain/UnrealLauncher/issues'
                  )
                }
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <WarningIcon sx={{ fontSize: 16 }} />
                Issues
              </button>
              <button
                onClick={() => window.electronAPI.openExternal('https://ko-fi.com/neelfrostrain')}
                className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <span>☕</span>
                Donate
              </button>
            </div>
            <p className="text-xs text-white/40 flex items-center justify-center gap-1.5 tracking-wide uppercase font-medium">
              <span>Made By</span>
              <button
                onClick={() => {
                  window.electronAPI.openExternal('https://github.com/NeelFrostrain')
                }}
                className="text-white/80 hover:text-white transition-colors cursor-default"
              >
                Neel Frostrain
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default AboutPage
