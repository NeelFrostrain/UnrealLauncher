// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import {
  Zap,
  GitBranch,
  BookOpen,
  Code,
  MessageCircle,
  AlertTriangle,
  ExternalLink,
  Package,
  Activity,
  Palette,
  Star,
  HardDrive,
  FolderOpen,
  FileText,
  Search,
  RefreshCw,
  Shield,
  Settings
} from 'lucide-react'
import PageWrapper from '../layout/PageWrapper'
import { useAppVersion } from '../hooks/useAppVersion'
import config from '../../../config'

// ── Static data ─────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Version', value: (v: string) => `v${v}` },
  { label: 'IPC Channels', value: () => '34+' },
  { label: 'Features', value: () => '58' },
  { label: 'License', value: () => 'Proprietary' }
]

const FEATURES = [
  { icon: FolderOpen, label: 'Auto-Scan', color: '#60a5fa' },
  { icon: Zap, label: 'One-Click Launch', color: '#fbbf24' },
  { icon: Star, label: 'Favorites & Recent', color: '#f472b6' },
  { icon: HardDrive, label: 'Size Calculation', color: '#4ade80' },
  { icon: Activity, label: 'UE Tracer', color: '#fb923c' },
  { icon: GitBranch, label: 'Git Integration', color: '#a78bfa' },
  { icon: FileText, label: 'Log Viewer', color: '#22d3ee' },
  { icon: Palette, label: 'Theme System', color: '#e879f9' },
  { icon: Search, label: 'Search & Filter', color: '#60a5fa' },
  { icon: Package, label: 'Fab Browser', color: '#f472b6' },
  { icon: RefreshCw, label: 'Auto Updates', color: '#4ade80' },
  { icon: Shield, label: 'Single Instance', color: '#fbbf24' },
  { icon: Settings, label: 'Plugin Browser', color: '#a78bfa' }
]

const TECH = [
  { label: 'Electron', color: '#60a5fa' },
  { label: 'React 19', color: '#61dafb' },
  { label: 'TypeScript', color: '#3178c6' },
  { label: 'Vite', color: '#fbbf24' },
  { label: 'Tailwind CSS', color: '#38bdf8' },
  { label: 'framer-motion', color: '#e879f9' },
  { label: 'lucide-react', color: '#f472b6' },
  { label: 'Rust (Tracer)', color: '#fb923c' },
  { label: 'NAPI-RS', color: '#4ade80' }
]

const LINKS = [
  { label: 'GitHub', icon: GitBranch, url: config.githubRepo, color: 'var(--color-text-secondary)', border: 'var(--color-border)', bg: 'var(--color-surface-card)' },
  { label: 'Changelog', icon: BookOpen, url: `${config.githubRepo}/blob/main/CHANGELOG.md`, color: 'var(--color-text-secondary)', border: 'var(--color-border)', bg: 'var(--color-surface-card)' },
  { label: 'Contribute', icon: Code, url: `${config.githubRepo}/blob/main/docs/CONTRIBUTING.md`, color: 'var(--color-text-secondary)', border: 'var(--color-border)', bg: 'var(--color-surface-card)' },
  { label: 'Issues', icon: AlertTriangle, url: `${config.githubRepo}/issues`, color: 'var(--color-text-secondary)', border: 'var(--color-border)', bg: 'var(--color-surface-card)' },
  { label: 'Discord', icon: MessageCircle, url: config.discordInvite, color: '#818cf8', border: 'rgba(99,102,241,0.3)', bg: 'rgba(99,102,241,0.08)' },
  { label: 'Ko-fi', icon: ExternalLink, url: config.kofi, color: '#fb923c', border: 'rgba(251,146,60,0.3)', bg: 'rgba(251,146,60,0.08)' }
]

// ── Card helper ──────────────────────────────────────────────────────────────

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement => (
  <div
    className={`rounded-lg border ${className}`}
    style={{ backgroundColor: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)' }}
  >
    {children}
  </div>
)

// ── Page ─────────────────────────────────────────────────────────────────────

const AboutPage = ({ modal = false }: { modal?: boolean }): React.ReactElement => {
  const version = useAppVersion()

  const content = (
    <div className="space-y-5 pb-6 m-5">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-xl px-6 py-7"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 14%, transparent), color-mix(in srgb, var(--color-accent) 5%, var(--color-surface-elevated)))',
          border: '1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border))'
        }}
      >
        {/* Glow blobs */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ backgroundColor: 'var(--color-accent)', opacity: 0.08, filter: 'blur(40px)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full pointer-events-none"
          style={{ backgroundColor: 'var(--color-accent)', opacity: 0.06, filter: 'blur(32px)' }}
        />
        <div className="relative text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            Unreal Launcher
          </h1>
          <p className="text-sm max-w-md mx-auto leading-relaxed mb-5" style={{ color: 'var(--color-text-muted)' }}>
            A lightweight desktop app for discovering, launching, and managing Unreal Engine
            installations and projects — no Epic Games Launcher required.
          </p>
          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {STATS.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 80%, transparent)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {value(version)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features + Tech in two columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Features */}
        <Card>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Features
            </h2>
          </div>
          <div className="p-3 grid grid-cols-1 gap-1">
            {FEATURES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 50%, transparent)' }}
              >
                <Icon size={13} style={{ color, flexShrink: 0 }} />
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          {/* Tech stack */}
          <Card>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Built With
              </h2>
            </div>
            <div className="p-3 flex flex-wrap gap-1.5">
              {TECH.map(({ label, color }) => (
                <span
                  key={label}
                  className="text-[11px] font-mono px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${color}14`, color, border: `1px solid ${color}28` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </Card>

          {/* Links */}
          <Card>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Links
              </h2>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {LINKS.map(({ label, icon: Icon, url, color, border, bg }) => (
                <button
                  key={label}
                  onClick={() => window.electronAPI.openExternal(url)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-opacity cursor-pointer hover:opacity-80"
                  style={{ color, borderColor: border, backgroundColor: bg }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </Card>

          {/* Made by */}
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Made with ♥ by{' '}
              <button
                onClick={() => window.electronAPI.openExternal(config.githubRepo.split('/').slice(0, 4).join('/'))}
                className="transition-colors cursor-pointer hover:opacity-80"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Neel Frostrain
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  if (modal) return content

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto py-4 px-4">
        <div className="max-w-3xl mx-auto">{content}</div>
      </div>
    </PageWrapper>
  )
}

export default AboutPage
