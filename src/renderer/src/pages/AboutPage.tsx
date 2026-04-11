import PageWrapper from '../layout/PageWrapper'
import { AboutFooter } from '../components/about/AboutFooter'
import {
  Zap,
  FolderOpen,
  Star,
  HardDrive,
  Cpu,
  Palette,
  RefreshCw,
  Shield,
  LayoutGrid,
  Activity,
  Store,
  GitBranch as GitIcon,
  FileText,
  Sparkles
} from 'lucide-react'
import { SectionHeader, Card } from '../components/settings/SectionHelpers'

// ── Feature grid ──────────────────────────────────────────────────────────────

const features = [
  { icon: <FolderOpen size={14} className="text-blue-400" />,   label: 'Auto-Scan',        desc: 'Finds UE4 & UE5 installs and .uproject files automatically' },
  { icon: <Zap size={14} className="text-yellow-400" />,        label: 'One-Click Launch',  desc: 'Start any engine or project instantly, no Epic Launcher needed' },
  { icon: <LayoutGrid size={14} className="text-purple-400" />, label: 'List & Grid View',  desc: 'Toggle layouts for projects, preference persisted across sessions' },
  { icon: <Star size={14} className="text-orange-400" />,       label: 'Favorites & Recent',desc: 'Pin projects and track recently opened ones by timestamp' },
  { icon: <HardDrive size={14} className="text-cyan-400" />,    label: 'Size Calculation',  desc: 'Background worker calculates folder sizes without blocking the UI' },
  { icon: <Cpu size={14} className="text-green-400" />,         label: 'UE Tracer',         desc: 'Rust background process tracking engine and project usage' },
  { icon: <Store size={14} className="text-pink-400" />,        label: 'Fab Browser',       desc: 'Browse downloaded Fab marketplace assets directly in the app' },
  { icon: <GitIcon size={14} className="text-emerald-400" />,   label: 'Git Integration',   desc: 'Detect git status, branch, remote URL, and init new repos' },
  { icon: <FileText size={14} className="text-sky-400" />,      label: 'Log Viewer',        desc: 'Tail the latest .log file from Saved/Logs inside the app' },
  { icon: <Palette size={14} className="text-rose-400" />,      label: 'Theme System',      desc: 'Built-in themes, per-token overrides, profiles, radius & font controls' },
  { icon: <RefreshCw size={14} className="text-indigo-400" />,  label: 'Auto Updates',      desc: 'GitHub Releases-based updater with download and install flow' },
  { icon: <Activity size={14} className="text-red-400" />,      label: 'Performance',       desc: 'Scroll virtualization, worker threads, and lazy-loaded pages' },
  { icon: <Shield size={14} className="text-teal-400" />,       label: 'Single Instance',   desc: 'Second launch focuses the existing window instead of duplicating' },
]

const FeatureGrid = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Sparkles size={13} className="text-yellow-300" />}
      label="Features"
      accent="bg-yellow-500/20"
    />
    <div
      className="grid gap-px overflow-hidden"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        backgroundColor: 'var(--color-border)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
      {features.map(({ icon, label, desc }) => (
        <div
          key={label}
          className="flex flex-col gap-1.5 px-4 py-3"
          style={{ backgroundColor: 'var(--color-surface-elevated)' }}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {label}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {desc}
          </p>
        </div>
      ))}
    </div>
  </section>
)

// ── Stack ─────────────────────────────────────────────────────────────────────

const stack = [
  { label: 'React 19',        color: 'text-cyan-400'   },
  { label: 'TypeScript 5.9',  color: 'text-blue-400'   },
  { label: 'Electron 39',     color: 'text-purple-400' },
  { label: 'Vite 7',          color: 'text-yellow-400' },
  { label: 'Tailwind CSS 4',  color: 'text-sky-400'    },
  { label: 'Zustand 5',       color: 'text-orange-400' },
  { label: 'Framer Motion 12',color: 'text-pink-400'   },
  { label: 'Rust (napi-rs)',  color: 'text-red-400'    },
]

const StackSection = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Cpu size={13} className="text-purple-300" />}
      label="Built With"
      accent="bg-purple-500/20"
    />
    <Card>
      <div className="px-5 py-4 flex flex-wrap gap-2">
        {stack.map(({ label, color }) => (
          <span
            key={label}
            className={`text-xs font-mono px-2.5 py-1 rounded-md border ${color}`}
            style={{
              backgroundColor: 'var(--color-surface-card)',
              borderColor: 'var(--color-border)'
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </Card>
  </section>
)

// ── Page ──────────────────────────────────────────────────────────────────────

const AboutPage = ({ modal = false }: { modal?: boolean }): React.ReactElement => {
  const content = (
    <div className="space-y-6 pb-8 p-5">
      <FeatureGrid />
      <StackSection />
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
