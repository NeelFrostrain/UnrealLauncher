import PageWrapper from '../layout/PageWrapper'
import PageTitleBar from '../components/PageTitlebar'
import {
  Github,
  Zap,
  Package,
  Activity,
  AlertCircle,
  BookOpen,
  Code,
  Download,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { useState } from 'react'

const AboutPage = (): React.ReactElement => {
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'no-update' | 'error'
  >('idle')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateVersion, setUpdateVersion] = useState('')

  const handleCheckForUpdates = async (): Promise<void> => {
    if (!window.electronAPI?.checkForUpdates) return

    setUpdateStatus('checking')
    setUpdateMessage('Checking for updates...')

    const result = await window.electronAPI.checkForUpdates()

    if (result.success && result.updateInfo) {
      setUpdateStatus('available')
      setUpdateVersion(result.updateInfo.version)
      setUpdateMessage(`Version ${result.updateInfo.version} is available!`)
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
              A modern, lightweight launcher for managing Unreal Engine
              installations and projects. Built with Electron, React, and
              TypeScript for a fast and responsive experience.
            </p>
          </div> */}

          {/* Features */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <Zap size={20} className="text-blue-400" />
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Package className="text-blue-400" size={20} />
                  <h3 className="text-sm font-semibold text-white/90">Engine Management</h3>
                </div>
                <p className="text-xs text-white/50">
                  Scan and manage multiple Unreal Engine versions (UE4 & UE5)
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Activity className="text-purple-400" size={20} />
                  <h3 className="text-sm font-semibold text-white/90">Project Tracking</h3>
                </div>
                <p className="text-xs text-white/50">
                  Automatically find and organize your Unreal projects with thumbnails
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Zap className="text-green-400" size={20} />
                  <h3 className="text-sm font-semibold text-white/90">Quick Launch</h3>
                </div>
                <p className="text-xs text-white/50">
                  Launch engines and projects with a single click
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Code className="text-yellow-400" size={20} />
                  <h3 className="text-sm font-semibold text-white/90">Size Calculation</h3>
                </div>
                <p className="text-xs text-white/50">
                  Calculate exact folder sizes with background processing
                </p>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-green-400" />
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
            </div>
          </div>

          {/* Known Issues */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-yellow-400" />
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
                <span className="text-sm font-mono text-white/90">1.5.0</span>
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

          {/* Update Section */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <RefreshCw size={20} className="text-blue-400" />
              Updates
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-white/90 mb-1">Check for updates</p>
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
                      <RefreshCw size={16} />
                      Check for Updates
                    </button>
                  )}
                  {updateStatus === 'checking' && (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/50 border border-blue-500/50 rounded-lg text-sm cursor-not-allowed"
                    >
                      <RefreshCw size={16} className="animate-spin" />
                      Checking...
                    </button>
                  )}
                  {updateStatus === 'available' && (
                    <button
                      onClick={handleDownloadUpdate}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 border border-green-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      <Download size={16} />
                      Download v{updateVersion}
                    </button>
                  )}
                  {updateStatus === 'downloading' && (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-green-600/50 border border-green-500/50 rounded-lg text-sm cursor-not-allowed"
                    >
                      <Download size={16} className="animate-pulse" />
                      Downloading...
                    </button>
                  )}
                  {updateStatus === 'ready' && (
                    <button
                      onClick={handleInstallUpdate}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle size={16} />
                      Install & Restart
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() =>
                  window.electronAPI.openExternal('https://github.com/NeelFrostrain/UnrealLauncher')
                }
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <Github size={16} />
                View on GitHub
              </button>
              <button
                onClick={() =>
                  window.electronAPI.openExternal(
                    'https://github.com/NeelFrostrain/UnrealLauncher/issues'
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <AlertCircle size={16} />
                Report Issue
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
