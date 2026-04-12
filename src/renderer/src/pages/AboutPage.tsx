// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState } from 'react'
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
  Sparkles,
  Database,
  Layers,
  Terminal,
  Package,
  ChevronDown,
  ChevronRight,
  Rocket,
  Search,
  Settings,
  FolderTree
} from 'lucide-react'
import { SectionHeader, Card } from '../components/settings/SectionHelpers'

// ── Hero ──────────────────────────────────────────────────────────────────────

const Hero = (): React.ReactElement => (
  <div
    className="relative overflow-hidden px-6 py-8 text-center"
    style={{
      background:
        'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 12%, transparent), color-mix(in srgb, var(--color-accent) 4%, var(--color-surface-elevated)))',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)'
    }}
  >
    <div
      className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
      style={{ backgroundColor: 'var(--color-accent)' }}
    />
    <div
      className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none"
      style={{ backgroundColor: 'var(--color-accent)' }}
    />
    <div className="relative">
      <div className="flex items-center justify-center gap-2 mb-3">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Unreal Launcher
        </h1>
      </div>
      <p className="text-sm max-w-lg mx-auto leading-relaxed mb-5" style={{ color: 'var(--color-text-muted)' }}>
        A lightweight Electron desktop app for discovering, launching, and managing Unreal Engine
        installations and projects — no Epic Games Launcher required.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { label: 'Version', value: '2.0.2' },
          { label: 'Features', value: '44' },
          { label: 'IPC Channels', value: '30+' },
          { label: 'License', value: 'Proprietary' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ── Feature grid ──────────────────────────────────────────────────────────────

const features = [
  { icon: <FolderOpen size={14} className="text-blue-400" />,   label: 'Auto-Scan',         desc: 'Finds UE4 & UE5 installs and .uproject files automatically across common paths' },
  { icon: <Zap size={14} className="text-yellow-400" />,        label: 'One-Click Launch',   desc: 'Start any engine or project instantly — no Epic Games Launcher needed' },
  { icon: <LayoutGrid size={14} className="text-purple-400" />, label: 'List & Grid View',   desc: 'Toggle between flat list and thumbnail grid for projects, preference persisted' },
  { icon: <Star size={14} className="text-orange-400" />,       label: 'Favorites & Recent', desc: 'Pin projects with a star and track recently opened ones by actual timestamp' },
  { icon: <HardDrive size={14} className="text-cyan-400" />,    label: 'Size Calculation',   desc: 'Background worker thread calculates folder sizes without blocking the UI' },
  { icon: <Cpu size={14} className="text-green-400" />,         label: 'UE Tracer',          desc: 'Rust background process tracking engine and project usage, merges on scan' },
  { icon: <Store size={14} className="text-pink-400" />,        label: 'Fab Browser',        desc: 'Browse downloaded Fab marketplace assets — plugins, content packs, projects' },
  { icon: <GitIcon size={14} className="text-emerald-400" />,   label: 'Git Integration',    desc: 'Detect git status, branch, remote URL, and initialize new repos with UE .gitignore' },
  { icon: <FileText size={14} className="text-sky-400" />,      label: 'Log Viewer',         desc: 'Tail the latest .log file from Saved/Logs directly inside the app' },
  { icon: <Palette size={14} className="text-rose-400" />,      label: 'Theme System',       desc: 'Built-in themes, per-token color overrides, saveable profiles, radius & font controls' },
  { icon: <Search size={14} className="text-violet-400" />,     label: 'Search & Filter',    desc: 'Real-time project name search with tab-based filtering (All / Recent / Favorites)' },
  { icon: <Package size={14} className="text-amber-400" />,     label: 'Batch Import',       desc: 'Import up to 20 projects at once from a single folder selection' },
  { icon: <RefreshCw size={14} className="text-indigo-400" />,  label: 'Auto Updates',       desc: 'GitHub Releases-based updater with download and install flow built in' },
  { icon: <Activity size={14} className="text-red-400" />,      label: 'Performance',        desc: 'Scroll virtualization, worker threads, and lazy-loaded pages keep the UI fast' },
  { icon: <Shield size={14} className="text-teal-400" />,       label: 'Single Instance',    desc: 'Second launch focuses the existing window instead of opening a duplicate' },
  { icon: <Settings size={14} className="text-slate-400" />,    label: 'Plugin Browser',     desc: 'Lists all installed marketplace plugins per engine version' },
]

const FeatureGrid = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Sparkles size={13} className="text-yellow-300" />}
      label="Features"
      accent="bg-yellow-500/20"
    />
    <div
      className="grid gap-2 overflow-hidden"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        // border: '1px solid var(--color-border)',
        // borderRadius: 'var(--radius)'
      }}
    >
      {features.map(({ icon, label, desc }) => (
        <div
          key={label}
          className="flex flex-col gap-1.5 px-4 py-3 border"
          style={{ backgroundColor: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)' }}
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

// ── Feature counts ────────────────────────────────────────────────────────────

const featureCounts = [
  { category: 'Engine Management',    count: 7,  num: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.22)'   },
  { category: 'Project Management',   count: 12, num: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.22)'   },
  { category: 'Fab Marketplace',      count: 4,  num: '#f472b6', bg: 'rgba(244,114,182,0.08)',  border: 'rgba(244,114,182,0.22)'  },
  { category: 'UE Tracer',            count: 5,  num: '#fb923c', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.22)'   },
  { category: 'Appearance & Theming', count: 7,  num: '#c084fc', bg: 'rgba(192,132,252,0.08)',  border: 'rgba(192,132,252,0.22)'  },
  { category: 'System & UX',          count: 9,  num: '#22d3ee', bg: 'rgba(34,211,238,0.08)',   border: 'rgba(34,211,238,0.22)'   },
]

const FeatureCounts = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Layers size={13} className="text-cyan-300" />}
      label="Feature Breakdown"
      accent="bg-cyan-500/20"
    />
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
      {featureCounts.map(({ category, count, num, bg, border }) => (
        <div
          key={category}
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{category}</span>
          <span className="text-lg font-bold tabular-nums" style={{ color: num }}>{count}</span>
        </div>
      ))}
    </div>
  </section>
)

// ── Architecture ──────────────────────────────────────────────────────────────

const layers = [
  {
    title: 'Renderer Process',
    color: '#60a5fa', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.22)',
    items: ['React 19 + TypeScript', 'Tailwind CSS 4 + Framer Motion', 'Zustand (navigation state)', 'React Router v7 + React Window']
  },
  {
    title: 'Main Process',
    color: '#c084fc', bg: 'rgba(192,132,252,0.06)', border: 'rgba(192,132,252,0.22)',
    items: ['Electron 39 + Node.js', '7 IPC handler modules', 'Worker threads (scan + sizing)', 'JSON file store (userData)']
  },
  {
    title: 'Rust Native Module',
    color: '#fb923c', bg: 'rgba(251,146,60,0.06)', border: 'rgba(251,146,60,0.22)',
    items: ['napi-rs N-API bindings', 'scan_engines / find_uproject', 'get_folder_size (recursive)', 'git_status / validate_engine']
  },
  {
    title: 'Rust Tracer Binary',
    color: '#f87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.22)',
    items: ['Detached background process', 'Tracks engine & project usage', 'Writes to Tracer/*.json', 'Windows registry Run key support']
  },
]

const ArchitectureSection = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Layers size={13} className="text-blue-300" />}
      label="Architecture"
      accent="bg-blue-500/20"
    />
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
      {layers.map(({ title, color, bg, border, items }) => (
        <div
          key={title}
          className="px-4 py-3 space-y-2"
          style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius)' }}
        >
          <p className="text-xs font-semibold" style={{ color }}>{title}</p>
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <ChevronRight size={10} className="mt-0.5 shrink-0" style={{ color }} />
                <span className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
)

// ── IPC modules ───────────────────────────────────────────────────────────────

const ipcModules = [
  { module: 'engines.ts',      color: '#fbbf24', channels: ['scan-engines', 'select-engine-folder', 'launch-engine', 'delete-engine', 'calculate-engine-size', 'scan-marketplace-plugins'] },
  { module: 'projects.ts',     color: '#4ade80', channels: ['scan-projects', 'select-project-folder', 'launch-project', 'launch-project-game', 'open-directory', 'delete-project', 'calculate-project-size', 'calculate-all-project-sizes'] },
  { module: 'projectTools.ts', color: '#38bdf8', channels: ['project-read-log', 'project-git-status', 'project-git-init'] },
  { module: 'fab.ts',          color: '#f472b6', channels: ['fab-get-default-path', 'fab-select-folder', 'fab-scan-folder', 'fab-save-path', 'fab-load-path'] },
  { module: 'tracer.ts',       color: '#fb923c', channels: ['tracer-get-startup', 'tracer-set-startup', 'tracer-is-running', 'tracer-get-data-dir', 'tracer-get-merge', 'tracer-set-merge', 'engines-get-registry', 'engines-set-registry'] },
  { module: 'updates.ts',      color: '#818cf8', channels: ['check-for-updates', 'download-update', 'install-update', 'get-app-version', 'check-github-version'] },
  { module: 'misc.ts',         color: '#94a3b8', channels: ['window-minimize', 'window-maximize', 'window-close', 'open-external', 'send-discord-webhook', 'get-native-status', 'clear-app-data', 'clear-tracer-data'] },
]

const IpcSection = (): React.ReactElement => {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <section>
      <SectionHeader
        icon={<Terminal size={13} className="text-green-300" />}
        label="IPC Modules"
        accent="bg-green-500/20"
      />
      <div
        className="overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)'
        }}
      >
        {ipcModules.map(({ module, color, channels }, idx) => {
          const isOpen = open === module
          const isLast = idx === ipcModules.length - 1
          return (
            <div
              key={module}
              style={!isLast ? { borderBottom: '1px solid var(--color-border)' } : undefined}
            >
              <button
                onClick={() => setOpen(isOpen ? null : module)}
                className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                style={{ backgroundColor: isOpen ? `${color}0f` : 'transparent' }}
                onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = `${color}08` }}
                onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div className="flex items-center gap-2.5">
                  <Terminal size={12} style={{ color }} />
                  <span className="text-xs font-mono font-semibold" style={{ color }}>{module}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {channels.length} channels
                  </span>
                </div>
                {isOpen
                  ? <ChevronDown size={13} style={{ color: 'var(--color-text-muted)' }} />
                  : <ChevronRight size={13} style={{ color: 'var(--color-text-muted)' }} />
                }
              </button>
              {isOpen && (
                <div
                  className="px-4 pb-3 pt-2 flex flex-wrap gap-1.5"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  {channels.map((ch) => (
                    <span
                      key={ch}
                      className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${color}12`,
                        color: 'var(--color-text-secondary)',
                        border: `1px solid ${color}30`
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── Data storage ──────────────────────────────────────────────────────────────

const storageEntries = [
  { path: 'save\\engines.json',    desc: 'Saved engine list',             color: '#60a5fa' },
  { path: 'save\\projects.json',   desc: 'Saved project list',            color: '#4ade80' },
  { path: 'save\\settings.json',   desc: 'App settings + Fab cache path', color: '#fbbf24' },
  { path: 'Tracer\\engines.json',  desc: 'Tracer-collected engine data',  color: '#fb923c' },
  { path: 'Tracer\\projects.json', desc: 'Tracer-collected project data', color: '#f87171' },
]

const DataStorageSection = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Database size={13} className="text-orange-300" />}
      label="Data Storage"
      accent="bg-orange-500/20"
    />
    <Card>
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <FolderTree size={12} style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
          %APPDATA%\Unreal Launcher\
        </span>
      </div>
      {storageEntries.map(({ path, desc, color }, idx) => (
        <div
          key={path}
          className="flex items-center justify-between px-4 py-2.5"
          style={idx < storageEntries.length - 1 ? { borderBottom: '1px solid var(--color-border)' } : undefined}
        >
          <span className="text-[11px] font-mono" style={{ color }}>{path}</span>
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{desc}</span>
        </div>
      ))}
    </Card>
  </section>
)

// ── Stack ─────────────────────────────────────────────────────────────────────

const stack = [
  { label: 'React 19',         color: '#22d3ee' },
  { label: 'TypeScript 5.9',   color: '#60a5fa' },
  { label: 'Electron 39',      color: '#c084fc' },
  { label: 'Vite 7',           color: '#fbbf24' },
  { label: 'Tailwind CSS 4',   color: '#38bdf8' },
  { label: 'Zustand 5',        color: '#fb923c' },
  { label: 'Framer Motion 12', color: '#f472b6' },
  { label: 'React Router 7',   color: '#4ade80' },
  { label: 'React Window 2',   color: '#2dd4bf' },
  { label: 'Rust (napi-rs)',   color: '#f87171' },
  { label: 'electron-updater', color: '#818cf8' },
  { label: 'regedit',          color: '#94a3b8' },
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
            className="text-xs font-mono px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: `${color}12`,
              color,
              border: `1px solid ${color}30`
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
      <Hero />
      <FeatureGrid />
      <FeatureCounts />
      <ArchitectureSection />
      <IpcSection />
      <DataStorageSection />
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
