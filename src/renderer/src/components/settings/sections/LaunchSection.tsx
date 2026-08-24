// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect } from 'react'
import { FolderOpen, Trash2, RefreshCw, Cpu } from 'lucide-react'
import { Card, SettingRow, Toggle } from '../SectionHelpers'
import { getSetting, setSetting } from '../../../utils/settings'

interface LaunchSectionProps {
  autoCloseOnLaunch: boolean
  onToggle: () => void
  backgroundCloseOnClose: boolean
  onToggleBackgroundClose: () => void
}

const LaunchSection = ({
  autoCloseOnLaunch,
  onToggle,
  backgroundCloseOnClose,
  onToggleBackgroundClose
}: LaunchSectionProps): React.ReactElement => {
  const [clearingLogs, setClearingLogs] = useState(false)
  const [showTitlebarButtons, setShowTitlebarButtons] = useState(() =>
    getSetting('showTitlebarButtons')
  )
  const [launchPauseDuration, setLaunchPauseDuration] = useState(() =>
    getSetting('launchPauseDuration')
  )
  const [gpuDisabled, setGpuDisabled] = useState(true)
  const [showRestartBanner, setShowRestartBanner] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [preferredIde, setPreferredIde] = useState<'vs' | 'rider'>(
    () => getSetting('preferredIde') || 'vs'
  )

  const handleIdeChange = (ide: 'vs' | 'rider'): void => {
    setPreferredIde(ide)
    setSetting('preferredIde', ide)
  }

  const [riderPath, setRiderPath] = useState(() => getSetting('riderPath') || '')

  const handleRiderPathChange = (val: string): void => {
    setRiderPath(val)
    setSetting('riderPath', val)
  }

  const handleBrowseRider = async (): Promise<void> => {
    try {
      const res = await window.electronAPI.selectFile([
        { name: 'Executable Files', extensions: ['exe'] }
      ])
      if (res) {
        handleRiderPathChange(res)
      }
    } catch {
      /* ignore */
    }
  }

  const [discordRpcEnabled, setDiscordRpcEnabled] = useState(
    () => getSetting('discordRpcEnabled') ?? true
  )

  const handleDiscordRpcToggle = async (): Promise<void> => {
    const next = !discordRpcEnabled
    setDiscordRpcEnabled(next)
    setSetting('discordRpcEnabled', next)
    await window.electronAPI.saveMainSettings({ discordRpcEnabled: next })
  }

  useEffect(() => {
    window.electronAPI.getMainSettings().then((s) => {
      if (s && s.disableGpu !== undefined) setGpuDisabled(s.disableGpu as boolean)
      if (s && s.discordRpcEnabled !== undefined)
        setDiscordRpcEnabled(s.discordRpcEnabled as boolean)
    })
  }, [])

  const handleGpuToggle = async (): Promise<void> => {
    const next = !gpuDisabled
    setGpuDisabled(next)
    await window.electronAPI.saveMainSettings({ disableGpu: next })
    setShowRestartBanner(true)
  }

  const handleRestart = async (): Promise<void> => {
    setRestarting(true)
    await window.electronAPI.relaunchApp()
  }

  const handleClearLogs = async (): Promise<void> => {
    if (!confirm('Clear all saved app log files?')) return
    setClearingLogs(true)
    try {
      await window.electronAPI.clearLogs()
    } finally {
      setClearingLogs(false)
    }
  }

  return (
    <section className="w-full">
      <Card>
        <SettingRow
          label="Discord Rich Presence"
          description="Display your current Unreal Engine project and launcher activity on your Discord profile in real time."
        >
          <Toggle on={discordRpcEnabled} onChange={handleDiscordRpcToggle} />
        </SettingRow>
        <SettingRow
          label="Auto-close on launch"
          description="Close the launcher automatically when opening a project or engine."
        >
          <Toggle on={autoCloseOnLaunch} onChange={onToggle} />
        </SettingRow>
        <SettingRow
          label="Run in background on close"
          description="Keep Unreal Launcher running in the system tray instead of quitting when the window is closed."
        >
          <Toggle on={backgroundCloseOnClose} onChange={onToggleBackgroundClose} />
        </SettingRow>
        <SettingRow
          // className='flex flex-col'
          label="Disable GPU process"
          description="Runs rendering on CPU to eliminate the dedicated GPU process and save ~70–90 MB RAM. Requires restart to take effect."
        >
          <Toggle on={gpuDisabled} onChange={handleGpuToggle} />
        </SettingRow>
        {showRestartBanner && (
          <div
            className="mt-2 mx-2 flex items-center justify-between gap-3 px-4 py-3 rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)'
            }}
          >
            <div className="flex items-center gap-2">
              <Cpu size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                GPU setting changed — restart required
              </span>
            </div>
            <button
              onClick={handleRestart}
              disabled={restarting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-accent)',
                color: '#000'
              }}
            >
              <RefreshCw size={11} className={restarting ? 'animate-spin' : ''} />
              {restarting ? 'Stopping...' : 'Force Stop'}
            </button>
          </div>
        )}
        <SettingRow
          label="Preferred C++ IDE (.sln)"
          description="Choose your primary IDE for opening solution files (.sln)."
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleIdeChange('vs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer border ${
                preferredIde === 'vs'
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'bg-[var(--color-surface-card)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Visual Studio (VS)
            </button>
            <button
              onClick={() => handleIdeChange('rider')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer border ${
                preferredIde === 'rider'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-[var(--color-surface-card)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              JetBrains Rider
            </button>
          </div>
        </SettingRow>
        {preferredIde === 'rider' && (
          <SettingRow
            label="JetBrains Rider Executable Path"
            description="Custom rider64.exe path if auto-detection does not find your installation."
          >
            <div className="flex items-center gap-2 w-72">
              <input
                type="text"
                value={riderPath}
                onChange={(e) => handleRiderPathChange(e.target.value)}
                placeholder="Auto-detected or C:\...\rider64.exe"
                className="w-full text-xs px-2.5 py-1.5 rounded border focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <button
                onClick={handleBrowseRider}
                className="px-2.5 py-1.5 text-xs font-semibold rounded border cursor-pointer shrink-0 transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Browse
              </button>
            </div>
          </SettingRow>
        )}
        <SettingRow
          label="Launch pause duration"
          description="Set a safety delay (in seconds) between project launches to prevent double-launching processes."
        >
          <div
            className="flex items-center gap-3 select-none px-2 py-0.5"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <input
              type="number"
              min={0}
              max={60}
              step={5}
              value={launchPauseDuration}
              onChange={(e) => {
                let val = Number(e.target.value)

                if (isNaN(val)) val = 0
                val = Math.max(0, Math.min(60, val))

                setLaunchPauseDuration(val)
                setSetting('launchPauseDuration', val)
              }}
              className="no-spinner w-12 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-start outline-none"
            />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Sec
            </span>
          </div>
        </SettingRow>
        {/* Registry scan and extra animations toggles removed per request */}
        <SettingRow
          label="Show Feedback & Discord buttons"
          description="Display the Feedback and Discord buttons in the titlebar."
        >
          <Toggle
            on={showTitlebarButtons}
            onChange={() => {
              const next = !showTitlebarButtons
              setShowTitlebarButtons(next)
              setSetting('showTitlebarButtons', next)
            }}
          />
        </SettingRow>
        <SettingRow
          label="Show app logs"
          description="Open the saved logs folder for startup, scans, launches, settings, and UI activity."
        >
          <button
            onClick={() => window.electronAPI.openLogsFolder()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)'
            }}
          >
            <FolderOpen size={12} />
            Open Logs
          </button>
        </SettingRow>
        <SettingRow
          label="Clear all logs"
          description="Delete saved app log files from the logs folder."
          last
        >
          <button
            onClick={handleClearLogs}
            disabled={clearingLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'rgba(248,113,113,0.1)',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,0.2)'
            }}
          >
            <Trash2 size={12} />
            {clearingLogs ? 'Clearing...' : 'Clear Logs'}
          </button>
        </SettingRow>
      </Card>
    </section>
  )
}

export default LaunchSection
