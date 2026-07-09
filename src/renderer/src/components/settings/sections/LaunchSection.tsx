// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState } from 'react'
import { FolderOpen, Trash2 } from 'lucide-react'
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
