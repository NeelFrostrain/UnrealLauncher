import { useState } from 'react'
import { Database, Trash2 } from 'lucide-react'
import { SectionHeader, Card, SettingRow } from '../SectionHelpers'

const DataSection = (): React.ReactElement => {
  const [clearing, setClearing] = useState<'app' | 'tracer' | null>(null)

  const handleClearAppData = async (): Promise<void> => {
    if (!confirm('Clear all saved engines and projects? This cannot be undone.')) return
    setClearing('app')
    await window.electronAPI.clearAppData()
    await window.electronAPI.fabSavePath('')
    setClearing(null)
    window.location.reload()
  }

  const handleClearTracerData = async (): Promise<void> => {
    if (!confirm('Clear all tracer history? This cannot be undone.')) return
    setClearing('tracer')
    await window.electronAPI.clearTracerData()
    setClearing(null)
  }

  return (
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
            {clearing === 'app' ? 'Clearing…' : 'Reset All App Data'}
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
  )
}

export default DataSection
