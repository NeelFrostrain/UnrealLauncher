// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { AlertTriangle } from 'lucide-react'

const knownIssues = [
  'Size calculation may take time for large folders (30+ GB). The app remains responsive during calculation.',
  'Removing engines or projects from the list does NOT delete files from disk - only removes them from the launcher.',
  'Project thumbnails are loaded from Saved/AutoScreenshot.png if available.',
  'The app scans these default paths: D:\\Engine\\UnrealEditors, C:\\Program Files\\Epic Games, Documents\\Unreal Projects'
]

export const AboutKnownIssues = (): React.ReactElement => (
  <div>
    <h2
      className="text-xl font-bold mb-4 flex items-center gap-2"
      style={{ color: 'var(--color-text-primary)' }}
    >
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
          <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {issue}
          </p>
        </div>
      ))}
    </div>
  </div>
)
