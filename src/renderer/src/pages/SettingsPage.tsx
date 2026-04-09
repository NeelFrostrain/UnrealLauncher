import { useState, useEffect, useRef } from 'react'
import PageWrapper from '../layout/PageWrapper'
import AboutPage from './AboutPage'
import {
  Activity,
  Database,
  FolderOpen,
  Zap,
  X,
  RefreshCw,
  Download,
  CheckCircle,
  GitBranch,
  Info,
  Trash2
} from 'lucide-react'
import { getSetting, setSetting } from '../utils/settings'
import { useTheme } from '../utils/ThemeContext'
import { loadPersistedRadius } from '../utils/theme'
import { SettingRow, Toggle, SectionHeader, Card } from '../components/settings/SectionHelpers'
import AppearanceSection from '../components/settings/AppearanceSection'

// ── Helper types and functions ────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

const SettingsPage = (): React.ReactElement => {
  const {
    activeThemeId,
    customOverrides,
    setTheme,
    setOverride,
    resetOverrides,
    profiles,
    activeProfileId,
    saveAsProfile,
    applyProfile,
    updateProfile,
    deleteProfile
  } = useTheme()
  const [autoCloseOnLaunch, setAutoCloseOnLaunch] = useState(() => getSetting('autoCloseOnLaunch'))
  const [tracerAutoStart, setTracerAutoStart] = useState(false)
  const [tracerRunning, setTracerRunning] = useState(false)
  const [tracerDataDir, setTracerDataDir] = useState('')
  const [tracerMerge, setTracerMerge] = useState(true)
  const [clearing, setClearing] = useState<'app' | 'tracer' | null>(null)
  // Profile UI state
  const [savingProfile, setSavingProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  // Radius
  const [radius, setRadius] = useState(() => loadPersistedRadius())
  // Updates
  const [appVersion, setAppVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateVersion, setUpdateVersion] = useState('')
  const [githubVersion, setGithubVersion] = useState('')
  const [githubStatus, setGithubStatus] = useState<GithubStatus>('idle')
  const [githubMessage, setGithubMessage] = useState('')
  // About modal
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    window.electronAPI.getTracerStartup().then(setTracerAutoStart)
    window.electronAPI.isTracerRunning().then(setTracerRunning)
    window.electronAPI.getTracerDataDir().then(setTracerDataDir)
    window.electronAPI.getTracerMerge().then(setTracerMerge)
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then(setAppVersion)
    }
    const interval = setInterval(() => {
      window.electronAPI.isTracerRunning().then(setTracerRunning)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSaveProfile = (): void => {
    const name = newProfileName.trim() || `Profile ${profiles.length + 1}`
    saveAsProfile(name)
    setNewProfileName('')
    setSavingProfile(false)
  }

  const handleStartEdit = (id: string, currentName: string): void => {
    setEditingProfileId(id)
    setEditingName(currentName)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  const handleFinishEdit = (): void => {
    if (editingProfileId && editingName.trim()) {
      updateProfile(editingProfileId, { name: editingName.trim() })
    }
    setEditingProfileId(null)
  }

  const handleClearAppData = async (): Promise<void> => {
    if (!confirm('Clear all saved engines and projects? This cannot be undone.')) return
    setClearing('app')
    await window.electronAPI.clearAppData()
    setClearing(null)
  }

  const handleClearTracerData = async (): Promise<void> => {
    if (!confirm('Clear all tracer history? This cannot be undone.')) return
    setClearing('tracer')
    await window.electronAPI.clearTracerData()
    setClearing(null)
  }

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
    <PageWrapper>
      <div className="flex-1 overflow-y-auto">
        {/* Page title */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Settings
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Customize your Unreal Launcher experience
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-7">
          <AppearanceSection
            activeThemeId={activeThemeId}
            customOverrides={customOverrides}
            setTheme={setTheme}
            setOverride={setOverride}
            resetOverrides={resetOverrides}
            profiles={profiles}
            activeProfileId={activeProfileId}
            applyProfile={applyProfile}
            deleteProfile={deleteProfile}
            radius={radius}
            setRadius={setRadius}
            savingProfile={savingProfile}
            setSavingProfile={setSavingProfile}
            newProfileName={newProfileName}
            setNewProfileName={setNewProfileName}
            editingProfileId={editingProfileId}
            editingName={editingName}
            setEditingName={setEditingName}
            nameInputRef={nameInputRef}
            handleSaveProfile={handleSaveProfile}
            handleStartEdit={handleStartEdit}
            handleFinishEdit={handleFinishEdit}
          />

          {/* ── Launch Behavior ── */}
          <section>
            <SectionHeader
              icon={<Zap size={13} className="text-yellow-300" />}
              label="Launch"
              accent="bg-yellow-500/20"
            />
            <Card>
              <SettingRow
                label="Auto-close on launch"
                description="Close the launcher automatically when opening a project or engine."
                last
              >
                <Toggle
                  on={autoCloseOnLaunch}
                  onChange={() => {
                    const next = !autoCloseOnLaunch
                    setAutoCloseOnLaunch(next)
                    setSetting('autoCloseOnLaunch', next)
                  }}
                />
              </SettingRow>
            </Card>
          </section>

          {/* ── Session Tracer ── */}
          <section>
            <SectionHeader
              icon={<Activity size={13} className="text-green-300" />}
              label="Session Tracer"
              accent="bg-green-500/20"
            />
            <Card>
              <SettingRow
                label="Run tracer on startup"
                description="Start the background tracer with Windows. Tracks engine and project usage."
              >
                <Toggle
                  on={tracerAutoStart}
                  onChange={async () => {
                    const next = !tracerAutoStart
                    setTracerAutoStart(next)
                    setSetting('tracerAutoStart', next)
                    await window.electronAPI.setTracerStartup(next)
                    setTimeout(
                      async () => setTracerRunning(await window.electronAPI.isTracerRunning()),
                      1500
                    )
                  }}
                  color="green"
                />
              </SettingRow>

              <SettingRow
                label="Sync tracer data on scan"
                description="Pull new entries from the tracer into the launcher on each scan."
              >
                <Toggle
                  on={tracerMerge}
                  onChange={async () => {
                    const next = !tracerMerge
                    setTracerMerge(next)
                    await window.electronAPI.setTracerMerge(next)
                  }}
                  color="green"
                />
              </SettingRow>

              {/* Status footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${tracerRunning ? 'bg-green-400' : 'bg-white/20'}`}
                  />
                  <span className="text-[11px] text-white/40">
                    {tracerRunning ? 'Running' : 'Not running'}
                  </span>
                </div>
                {tracerDataDir && (
                  <button
                    onClick={() => window.electronAPI.openDirectory(tracerDataDir)}
                    className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    <FolderOpen size={12} />
                    Open data folder
                  </button>
                )}
              </div>
            </Card>
          </section>

          {/* ── Data ── */}
          <section>
            <SectionHeader
              icon={<Database size={13} className="text-red-300" />}
              label="Data"
              accent="bg-red-500/20"
            />
            <Card>
              <SettingRow
                label="Clear app data"
                description="Remove all saved engines and projects. Files on disk are not affected."
              >
                <button
                  onClick={handleClearAppData}
                  disabled={clearing === 'app'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/18 text-red-400 border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 size={12} />
                  {clearing === 'app' ? 'Clearing…' : 'Clear'}
                </button>
              </SettingRow>
              <SettingRow
                label="Clear tracer data"
                description="Remove all engine and project history recorded by the tracer."
                last
              >
                <button
                  onClick={handleClearTracerData}
                  disabled={clearing === 'tracer'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/18 text-red-400 border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 size={12} />
                  {clearing === 'tracer' ? 'Clearing…' : 'Clear'}
                </button>
              </SettingRow>
            </Card>
          </section>

          {/* ── Updates ── */}
          <section>
            <SectionHeader
              icon={<RefreshCw size={13} className="text-blue-300" />}
              label="Updates"
              accent="bg-blue-500/20"
            />
            <Card>
              {/* Check for updates */}
              <div className="px-5 py-4 border-b border-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/85">Check for updates</p>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                      Check for and download new versions of Unreal Launcher
                    </p>
                    {updateMessage && (
                      <p
                        className={`text-xs mt-2 ${
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
                  <div className="shrink-0 flex gap-2">
                    {(updateStatus === 'idle' ||
                      updateStatus === 'no-update' ||
                      updateStatus === 'error') && (
                      <button
                        onClick={handleCheckForUpdates}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 hover:bg-blue-500/18 text-blue-400 border border-blue-500/20 transition-all cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        Check
                      </button>
                    )}
                    {updateStatus === 'checking' && (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/5 text-blue-400/50 border border-blue-500/15 cursor-not-allowed"
                      >
                        <RefreshCw size={12} className="animate-spin" />
                        Checking…
                      </button>
                    )}
                    {updateStatus === 'available' && (
                      <button
                        onClick={handleDownloadUpdate}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 hover:bg-green-500/18 text-green-400 border border-green-500/20 transition-all cursor-pointer"
                      >
                        <Download size={12} />v{updateVersion}
                      </button>
                    )}
                    {updateStatus === 'downloading' && (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/5 text-green-400/50 border border-green-500/15 cursor-not-allowed"
                      >
                        <Download size={12} className="animate-pulse" />
                        Downloading…
                      </button>
                    )}
                    {updateStatus === 'ready' && (
                      <button
                        onClick={() => window.electronAPI?.installUpdate?.()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/18 text-purple-400 border border-purple-500/20 transition-all cursor-pointer"
                      >
                        <CheckCircle size={12} />
                        Install
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Check GitHub version */}
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/85">GitHub version check</p>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                      Check the latest release version on GitHub
                    </p>
                    {githubVersion && (
                      <p className="text-xs text-white/50 mt-2">
                        Latest on GitHub: v{githubVersion}
                      </p>
                    )}
                    {githubMessage && (
                      <p
                        className={`text-xs mt-2 ${githubStatus === 'error' ? 'text-red-400' : 'text-white/50'}`}
                      >
                        {githubMessage}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex gap-2">
                    {(githubStatus === 'idle' ||
                      githubStatus === 'success' ||
                      githubStatus === 'error') && (
                      <button
                        onClick={checkGitHubVersion}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          githubStatus === 'error'
                            ? 'bg-red-500/10 hover:bg-red-500/18 text-red-400 border border-red-500/20'
                            : 'bg-purple-500/10 hover:bg-purple-500/18 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {githubStatus === 'error' ? (
                          <RefreshCw size={12} />
                        ) : (
                          <GitBranch size={12} />
                        )}
                        {githubStatus === 'success'
                          ? 'Recheck'
                          : githubStatus === 'error'
                            ? 'Retry'
                            : 'Check'}
                      </button>
                    )}
                    {githubStatus === 'checking' && (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/5 text-purple-400/50 border border-purple-500/15 cursor-not-allowed"
                      >
                        <RefreshCw size={12} className="animate-spin" />
                        Checking…
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* ── About ── */}
          <section>
            <SectionHeader
              icon={<Info size={13} className="text-cyan-300" />}
              label="About"
              accent="bg-cyan-500/20"
            />
            <Card>
              <SettingRow
                label="About Unreal Launcher"
                description="View information about the application, features, and changelog"
                last
              >
                <button
                  onClick={() => setShowAbout(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/18 text-cyan-400 border border-cyan-500/20 transition-all cursor-pointer"
                >
                  <Info size={12} />
                  View About
                </button>
              </SettingRow>
            </Card>
          </section>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border shadow-2xl"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              borderColor: 'var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white/90">About Unreal Launcher</h2>
              <button
                onClick={() => setShowAbout(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <AboutPage modal />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default SettingsPage
