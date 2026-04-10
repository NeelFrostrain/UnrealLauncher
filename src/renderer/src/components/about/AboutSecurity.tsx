import { AlertTriangle, BookOpen } from 'lucide-react'

export const AboutSecurity = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <AlertTriangle size={20} className="text-red-400" />
      Security
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
        <BookOpen size={16} />
        Read Security Policy
      </button>
    </div>
  </div>
)
