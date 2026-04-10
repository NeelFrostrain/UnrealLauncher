import { AlertTriangle } from 'lucide-react'

const knownIssues = [
  'Size calculation may take time for large folders (30+ GB). The app remains responsive during calculation.',
  'Removing engines or projects from the list does NOT delete files from disk - only removes them from the launcher.',
  'Project thumbnails are loaded from Saved/AutoScreenshot.png if available.',
  'The app scans these default paths: D:\\Engine\\UnrealEditors, C:\\Program Files\\Epic Games, Documents\\Unreal Projects'
]

export const AboutKnownIssues = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <AlertTriangle size={20} className="text-yellow-400" />
      Known Issues &amp; Notes
    </h2>
    <div
      className="p-6 space-y-3"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
      {knownIssues.map((issue) => (
        <div key={issue} className="flex gap-3">
          <span className="text-yellow-400 mt-0.5">•</span>
          <p className="text-xs text-white/50">{issue}</p>
        </div>
      ))}
    </div>
  </div>
)
