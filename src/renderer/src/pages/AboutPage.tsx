import PageWrapper from '../layout/PageWrapper'
import AboutFeatures from '../components/about/AboutFeatures'
import AboutUsage from '../components/about/AboutUsage'
import { AboutFooter } from '../components/about/AboutInfo'
import { Sparkles, GitBranch, ExternalLink } from 'lucide-react'

const highlights = [
  {
    emoji: '🎨',
    title: 'Theme System',
    desc: 'Built-in themes, per-token overrides, saveable profiles, and border radius control'
  },
  {
    emoji: '🔤',
    title: 'Font Customization',
    desc: 'Choose font family and size for the entire UI'
  },
  { emoji: '⚡', title: 'Splash Screen', desc: 'Animated loading screen on startup' },
  { emoji: '📐', title: 'Resizable Sidebar', desc: 'Drag to resize or collapse the sidebar' },
  {
    emoji: '🦀',
    title: 'UE Tracer',
    desc: 'Rust background process tracking engine and project usage'
  },
  {
    emoji: '🧵',
    title: 'Worker Threads',
    desc: 'Scanning and size calculation run off the main thread'
  }
]

const WhatsNew = (): React.ReactElement => (
  <div>
    <h2
      className="text-xl font-bold mb-4 flex items-center gap-2"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <Sparkles size={20} className="text-yellow-400" />
      What&apos;s New in v1.9.0
    </h2>
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
      {/* Banner */}
      <div
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent)'
        }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            v1.9_dev — 17 commits ahead of main
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Branch comparison: v1.9_dev → main
          </p>
        </div>
        <button
          onClick={() =>
            window.electronAPI.openExternal(
              'https://github.com/NeelFrostrain/UnrealLauncher/compare/main...v1.9_dev'
            )
          }
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-colors hover:bg-white/5"
          style={{
            color: 'var(--color-accent)',
            borderColor: 'color-mix(in srgb, var(--color-accent) 35%, transparent)'
          }}
        >
          <GitBranch size={12} />
          Compare on GitHub
          <ExternalLink size={11} />
        </button>
      </div>

      {/* Highlights */}
      <div
        className="p-6 grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
      >
        {highlights.map(({ emoji, title, desc }) => (
          <div key={title} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base">{emoji}</span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </span>
            </div>
            <p className="text-xs ml-7" style={{ color: 'var(--color-text-muted)' }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const AboutPage = ({ modal = false }: { modal?: boolean }): React.ReactElement => {
  const content = (
    <div className="space-y-6 pb-8 p-5">
      <WhatsNew />
      <AboutFeatures />
      <AboutUsage />
      <AboutFooter />
    </div>
  )

  if (modal) return content

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="max-w-4xl mx-auto">{content}</div>
      </div>
    </PageWrapper>
  )
}

export default AboutPage
