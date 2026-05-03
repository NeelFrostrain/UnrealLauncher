// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState } from 'react'
import { Info, X } from 'lucide-react'
import AboutPage from '../../pages/AboutPage'
import { SystemInfoGrid } from './SystemInfoGrid'

export interface AboutSectionProps {
  onClose?: () => void
}

export const AboutSection = ({ onClose }: AboutSectionProps): React.ReactElement => {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <section>
        <div
          className="overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)'
          }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                About Unreal Launcher
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Features, architecture, and changelog
              </p>
            </div>
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'color-mix(in srgb, #22d3ee 10%, transparent)',
                color: '#22d3ee',
                border: '1px solid color-mix(in srgb, #22d3ee 20%, transparent)'
              }}
            >
              <Info size={12} />
              View
            </button>
          </div>
          <SystemInfoGrid />
        </div>
      </section>

      {/* About modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 32px 96px rgba(0,0,0,0.7)'
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                About Unreal Launcher
              </h2>
              <button
                onClick={() => setShowAbout(false)}
                className="flex items-center justify-center w-7 h-7 cursor-pointer transition-colors"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.6)',
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <X size={13} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-56px)]">
              <AboutPage modal />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
