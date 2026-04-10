import { Activity, FolderOpen } from 'lucide-react'
import { SectionHeader, Card, SettingRow, Toggle } from '../SectionHelpers'
import { useTracerSettings } from '../../../hooks/useTracerSettings'

const TracerSection = (): React.ReactElement => {
  const {
    tracerAutoStart,
    tracerRunning,
    tracerDataDir,
    tracerMerge,
    handleTracerAutoStartChange,
    handleTracerMergeChange
  } = useTracerSettings()

  return (
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
          <Toggle on={tracerAutoStart} onChange={handleTracerAutoStartChange} color="green" />
        </SettingRow>

        <SettingRow
          label="Sync tracer data on scan"
          description="Pull new entries from the tracer into the launcher on each scan."
        >
          <Toggle on={tracerMerge} onChange={handleTracerMergeChange} color="green" />
        </SettingRow>

        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: tracerRunning ? '#4ade80' : 'var(--color-border)' }}
            />
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {tracerRunning ? 'Running' : 'Not running'}
            </span>
          </div>
          {tracerDataDir && (
            <button
              onClick={() => window.electronAPI.openDirectory(tracerDataDir)}
              className="flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              <FolderOpen size={12} />
              Open data folder
            </button>
          )}
        </div>
      </Card>
    </section>
  )
}

export default TracerSection
