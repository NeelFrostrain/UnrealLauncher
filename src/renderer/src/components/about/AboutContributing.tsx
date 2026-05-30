// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { BookOpen, GitBranch } from 'lucide-react'

export const AboutContributing = (): React.ReactElement => (
  <div>
    <h2
      className="text-xl font-bold mb-4 flex items-center gap-2"
      style={{ color: 'var(--color-text-primary)' }}
    >
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
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        We welcome contributions! Help make Unreal Launcher better for everyone.
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          How to Contribute
        </h3>
        <ul className="text-xs space-y-1 ml-4" style={{ color: 'var(--color-text-muted)' }}>
          <li>• Fork the repository</li>
          <li>• Create a feature branch</li>
          <li>• Make your changes and run tests</li>
          <li>• Open a pull request</li>
        </ul>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Development Guidelines
        </h3>
        <ul className="text-xs space-y-1 ml-4" style={{ color: 'var(--color-text-muted)' }}>
          <li>
            • Run{' '}
            <code
              className="px-1 rounded"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-secondary)'
              }}
            >
              npm run lint
            </code>{' '}
            before committing
          </li>
          <li>• Ensure TypeScript types are correct</li>
          <li>• Update documentation for new features</li>
          <li>• Test on multiple platforms when possible</li>
        </ul>
      </div>
      <button
        onClick={() =>
          window.electronAPI.openExternal(
            'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/docs/CONTRIBUTING.md'
          )
        }
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
        style={{
          backgroundColor: '#16a34a',
          color: 'white',
          border: '1px solid rgba(22,163,74,0.5)'
        }}
      >
        <BookOpen size={16} />
        Read Contributing Guide
      </button>
    </div>
  </div>
)
