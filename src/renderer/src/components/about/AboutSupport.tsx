// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { BookOpen, Zap } from 'lucide-react'

export const AboutSupport = (): React.ReactElement => (
  <div>
    <h2
      className="text-xl font-bold mb-4 flex items-center gap-2"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <Zap size={20} className="text-purple-400" />
      Support the Project
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
        Your support helps keep Unreal Launcher growing and allows more time to build features.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => window.electronAPI.openExternal('https://ko-fi.com/neelfrostrain')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          style={{
            backgroundColor: '#ea580c',
            color: 'white',
            border: '1px solid rgba(234,88,12,0.5)'
          }}
        >
          <span>☕</span> Ko-fi
        </button>
        <button
          onClick={() =>
            window.electronAPI.openExternal('https://github.com/sponsors/NeelFrostrain')
          }
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          style={{
            backgroundColor: '#db2777',
            color: 'white',
            border: '1px solid rgba(219,39,119,0.5)'
          }}
        >
          <span>💖</span> GitHub Sponsors
        </button>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Also consider starring ⭐ the repo and sharing it with your friends!
      </p>
      <button
        onClick={() =>
          window.electronAPI.openExternal(
            'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/docs/DONATE.md'
          )
        }
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
        style={{
          backgroundColor: '#7c3aed',
          color: 'white',
          border: '1px solid rgba(124,58,237,0.5)'
        }}
      >
        <BookOpen size={16} />
        More Ways to Support
      </button>
    </div>
  </div>
)
