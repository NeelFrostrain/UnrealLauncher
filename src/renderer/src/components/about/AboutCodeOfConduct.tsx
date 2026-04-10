import { AlertTriangle, BookOpen } from 'lucide-react'

export const AboutCodeOfConduct = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <AlertTriangle size={20} className="text-blue-400" />
      Code of Conduct
    </h2>
    <div
      className="p-6 space-y-4"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
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
        <BookOpen size={16} />
        Read Code of Conduct
      </button>
    </div>
  </div>
)
