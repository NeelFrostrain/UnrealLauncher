// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { BookOpen, Zap } from 'lucide-react'

export const AboutSupport = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
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
      <p className="text-xs text-white/50">
        Your support helps keep Unreal Launcher growing and allows more time to build features.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => window.electronAPI.openExternal('https://ko-fi.com/neelfrostrain')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 border border-orange-500/50 rounded-lg text-sm transition-colors cursor-pointer"
        >
          <span>☕</span> Ko-fi
        </button>
        <button
          onClick={() =>
            window.electronAPI.openExternal('https://github.com/sponsors/NeelFrostrain')
          }
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 border border-pink-500/50 rounded-lg text-sm transition-colors cursor-pointer"
        >
          <span>💖</span> GitHub Sponsors
        </button>
      </div>
      <p className="text-xs text-white/40">
        Also consider starring ⭐ the repo and sharing it with your friends!
      </p>
      <button
        onClick={() =>
          window.electronAPI.openExternal(
            'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/DONATE.md'
          )
        }
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-lg text-sm transition-colors cursor-pointer"
      >
        <BookOpen size={16} />
        More Ways to Support
      </button>
    </div>
  </div>
)
