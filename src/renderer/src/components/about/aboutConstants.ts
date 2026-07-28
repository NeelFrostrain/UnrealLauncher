// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import {
  FolderOpen,
  Zap,
  LayoutGrid,
  Star,
  HardDrive,
  Cpu,
  Store,
  GitBranch as GitIcon,
  FileText,
  Palette,
  Search,
  Package,
  RefreshCw,
  Activity,
  Shield,
  Settings
} from 'lucide-react'

export const FEATURES = [
  {
    icon: FolderOpen,
    label: 'Auto-Scan',
    desc: 'Finds UE4 & UE5 installs and .uproject files automatically across common paths & registry'
  },
  {
    icon: Zap,
    label: 'One-Click Launch',
    desc: 'Start any engine version, project, or custom launch configuration instantly'
  },
  {
    icon: Activity,
    label: 'Tasks & Process Manager',
    desc: 'Monitor active Unreal processes, background builds, and engine instances with bulk kill'
  },
  {
    icon: Shield,
    label: 'Project Health & Diagnostics',
    desc: 'Deep structural analysis, missing folder checks, config validation & 1-click cache cleanup'
  },
  {
    icon: Package,
    label: 'Snapshot Manager',
    desc: 'Capture ZIP backup checkpoints of project Config, Content, Source & .uproject with restore'
  },
  {
    icon: LayoutGrid,
    label: 'Asset Usage Analyzer',
    desc: 'Byte-level SipHash duplicate detection and size breakdown of Content folder assets'
  },
  {
    icon: Star,
    label: 'Favorites & Hidden Tabs',
    desc: 'Pin favorite projects and hide non-active projects non-destructively'
  },
  {
    icon: HardDrive,
    label: 'Fast Size Calculation',
    desc: 'Multithreaded Rust folder sizing engine running on non-blocking worker pools'
  },
  {
    icon: Cpu,
    label: 'UE Tracer',
    desc: 'Background process tracking real-time engine and project usage session history'
  },
  {
    icon: Store,
    label: 'Fab Marketplace Browser',
    desc: 'Browse downloaded Fab marketplace plugins, content packs, and project templates'
  },
  {
    icon: GitIcon,
    label: 'Git Integration',
    desc: 'Detect git branch, remote URL, commit status, and initialize UE-ready repositories'
  },
  {
    icon: FileText,
    label: 'Log Viewer & In-App Editor',
    desc: 'Tail Saved/Logs in real time and edit .ini/.uproject files directly inside the launcher'
  },
  {
    icon: Palette,
    label: 'Theme System',
    desc: 'Built-in color profiles, token color overrides, radius & UI scaling controls'
  },
  {
    icon: Search,
    label: 'Search & Advanced Filtering',
    desc: 'Instant search by project name, engine version, path, and sorting modes'
  },
  {
    icon: RefreshCw,
    label: 'Auto Updates & Support',
    desc: 'Built-in download manager, update notifications, and community donation portal'
  },
  {
    icon: Settings,
    label: 'Plugin Browser',
    desc: 'Browse installed marketplace plugins per engine version with 1-click details'
  }
]


export const FEATURE_COUNTS = [
  {
    category: 'Engine Management',
    count: 10,
    num: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.22)'
  },
  {
    category: 'Project & Diagnostics',
    count: 18,
    num: '#4ade80',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.22)'
  },
  {
    category: 'Tasks & Process Control',
    count: 6,
    num: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.22)'
  },
  {
    category: 'Fab Marketplace',
    count: 5,
    num: '#f472b6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.22)'
  },
  {
    category: 'UE Tracer & Telemetry',
    count: 6,
    num: '#fb923c',
    bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.22)'
  },
  {
    category: 'Appearance & System',
    count: 13,
    num: '#c084fc',
    bg: 'rgba(192,132,252,0.08)',
    border: 'rgba(192,132,252,0.22)'
  }
]

export const ARCHITECTURE_LAYERS = [
  {
    title: 'Renderer Process',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.06)',
    border: 'rgba(96,165,250,0.22)',
    items: [
      'React 19 + TypeScript 5.9',
      'Tailwind CSS 4 + Lucide Icons',
      'Zustand (navigation & app state)',
      'React Router v7 + Context Providers'
    ]
  },
  {
    title: 'Main Process',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.06)',
    border: 'rgba(192,132,252,0.22)',
    items: [
      'Electron 39 + Node.js',
      '34+ IPC handler channels across 7 modules',
      'Worker pools (sizing + scanning)',
      'JSON file store (userData)'
    ]
  },
  {
    title: 'Rust Native Module',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.06)',
    border: 'rgba(251,146,60,0.22)',
    items: [
      'napi-rs N-API bindings',
      'Zero-syscall metadata fast directory enumeration',
      'Multithreaded folder size calculation',
      'Project Health diagnostics & Zip backup engine',
      'SipHash asset duplicate detection'
    ]
  },
  {
    title: 'Rust Tracer Binary',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.06)',
    border: 'rgba(248,113,113,0.22)',
    items: [
      'Detached background process',
      'Tracks active UE editor & process usage',
      'Writes persistent logs to Tracer/*.json',
      'Windows Registry & launcher manifest discovery'
    ]
  }
]

export const IPC_MODULES = [
  {
    module: 'engines.ts',
    color: '#fbbf24',
    channels: [
      'scan-engines',
      'select-engine-folder',
      'launch-engine',
      'delete-engine',
      'calculate-engine-size',
      'scan-marketplace-plugins'
    ]
  },
  {
    module: 'projects.ts',
    color: '#4ade80',
    channels: [
      'scan-projects',
      'select-project-folder',
      'launch-project',
      'launch-project-game',
      'open-directory',
      'delete-project',
      'calculate-project-size',
      'calculate-all-project-sizes'
    ]
  },
  {
    module: 'projectTools.ts',
    color: '#38bdf8',
    channels: [
      'project-read-log',
      'project-git-status',
      'project-git-init',
      'project-health-check',
      'project-create-snapshot',
      'project-restore-snapshot'
    ]
  },
  {
    module: 'fab.ts',
    color: '#f472b6',
    channels: [
      'fab-get-default-path',
      'fab-select-folder',
      'fab-scan-folder',
      'fab-save-path',
      'fab-load-path'
    ]
  },
  {
    module: 'tracer.ts',
    color: '#fb923c',
    channels: [
      'tracer-get-startup',
      'tracer-set-startup',
      'tracer-is-running',
      'tracer-get-data-dir',
      'tracer-get-merge',
      'tracer-set-merge',
      'engines-get-registry',
      'engines-set-registry',
      'tasks-get-processes',
      'tasks-kill-process'
    ]
  },
  {
    module: 'updates.ts',
    color: '#818cf8',
    channels: [
      'check-for-updates',
      'download-update',
      'install-update',
      'get-app-version',
      'check-github-version'
    ]
  },
  {
    module: 'misc.ts',
    color: '#94a3b8',
    channels: [
      'window-minimize',
      'window-maximize',
      'window-close',
      'open-external',
      'send-discord-webhook',
      'get-native-status',
      'clear-app-data',
      'clear-tracer-data'
    ]
  }
]

export const STORAGE_ENTRIES = [
  { path: 'save\\engines.json', desc: 'Saved engine list and custom aliases', color: '#60a5fa' },
  { path: 'save\\projects.json', desc: 'Saved project metadata, engine overrides & favorites', color: '#4ade80' },
  { path: 'save\\settings.json', desc: 'App settings, Fab cache path & theme profiles', color: '#fbbf24' },
  { path: 'Tracer\\engines.json', desc: 'Tracer-collected engine telemetry data', color: '#fb923c' },
  { path: 'Tracer\\projects.json', desc: 'Tracer-collected project usage history', color: '#f87171' }
]

export const TECH_STACK = [
  { label: 'React 19', color: '#61dafb' },
  { label: 'TypeScript 5.9', color: '#3178c6' },
  { label: 'Electron 39', color: '#478cbf' },
  { label: 'Vite 7', color: '#fbbf24' },
  { label: 'Tailwind CSS 4', color: '#38bdf8' },
  { label: 'Rust (napi-rs)', color: '#fb923c' },
  { label: 'Zustand 5', color: '#a78bfa' },
  { label: 'React Router 7', color: '#4ade80' },
  { label: 'Lucide React', color: '#f472b6' },
  { label: 'electron-updater', color: '#818cf8' }
]

