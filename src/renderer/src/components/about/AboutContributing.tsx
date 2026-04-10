import { BookOpen, GitBranch } from 'lucide-react'

export const AboutContributing = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <GitBranch size={20} className="text-green-400" />
      Contributing
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
        We welcome contributions! Help make Unreal Launcher better for everyone.
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90">How to Contribute</h3>
        <ul className="text-xs text-white/50 space-y-1 ml-4">
          <li>• Fork the repository</li>
          <li>• Create a feature branch</li>
          <li>• Make your changes and run tests</li>
          <li>• Open a pull request</li>
        </ul>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90">Development Guidelines</h3>
        <ul className="text-xs text-white/50 space-y-1 ml-4">
          <li>
            • Run <code className="bg-white/10 px-1 rounded">npm run lint</code> before committing
          </li>
          <li>• Ensure TypeScript types are correct</li>
          <li>• Update documentation for new features</li>
          <li>• Test on multiple platforms when possible</li>
        </ul>
      </div>
      <button
        onClick={() =>
          window.electronAPI.openExternal(
            'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CONTRIBUTING.md'
          )
        }
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 border border-green-500/50 rounded-lg text-sm transition-colors cursor-pointer"
      >
        <BookOpen size={16} />
        Read Contributing Guide
      </button>
    </div>
  </div>
)
