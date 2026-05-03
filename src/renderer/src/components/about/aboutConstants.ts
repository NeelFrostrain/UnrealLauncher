// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
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
    desc: 'Finds UE4 & UE5 installs and .uproject files automatically across common paths'
  },
  {
    icon: Zap,
    label: 'One-Click Launch',
    desc: 'Start any engine or project instantly — no Epic Games Launcher needed'
  },
  {
    icon: LayoutGrid,
    label: 'List & Grid View',
    desc: 'Toggle between flat list and thumbnail grid for projects, preference persisted'
  },
  {
    icon: Star,
    label: 'Favorites & Recent',
    desc: 'Pin projects with a star and track recently opened ones by actual timestamp'
  },
  {
    icon: HardDrive,
    label: 'Size Calculation',
    desc: 'Background worker thread calculates folder sizes without blocking the UI'
  },
  {
    icon: Cpu,
    label: 'UE Tracer',
    desc: 'Rust background process tracking engine and project usage, merges on scan'
  },
  {
    icon: Store,
    label: 'Fab Browser',
    desc: 'Browse downloaded Fab marketplace assets — plugins, content packs, projects'
  },
  {
    icon: GitIcon,
    label: 'Git Integration',
    desc: 'Detect git status, branch, remote URL, and initialize new repos with UE .gitignore'
  },
  {
    icon: FileText,
    label: 'Log Viewer',
    desc: 'Tail the latest .log file from Saved/Logs directly inside the app'
  },
  {
    icon: Palette,
    label: 'Theme System',
    desc: 'Built-in themes, per-token color overrides, saveable profiles, radius & font controls'
  },
  {
    icon: Search,
    label: 'Search & Filter',
    desc: 'Real-time project name search with tab-based filtering (All / Recent / Favorites)'
  },
  {
    icon: Package,
    label: 'Batch Import',
    desc: 'Import up to 20 projects at once from a single folder selection'
  },
  {
    icon: RefreshCw,
    label: 'Auto Updates',
    desc: 'GitHub Releases-based updater with download and install flow built in'
  },
  {
    icon: Activity,
    label: 'Performance',
    desc: 'Scroll virtualization, worker threads, and lazy-loaded pages keep the UI fast'
  },
  {
    icon: Shield,
    label: 'Single Instance',
    desc: 'Second launch focuses the existing window instead of opening a duplicate'
  },
  {
    icon: Settings,
    label: 'Plugin Browser',
    desc: 'Lists all installed marketplace plugins per engine version'
  }
]

export const FEATURE_COUNTS = [
  {
    category: 'Engine Management',
    count: 7,
    num: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.22)'
  },
  {
    category: 'Project Management',
    count: 12,
    num: '#4ade80',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.22)'
  },
  {
    category: 'Fab Marketplace',
    count: 4,
    num: '#f472b6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.22)'
  },
  {
    category: 'UE Tracer',
    count: 5,
    num: '#fb923c',
    bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.22)'
  },
  {
    category: 'Appearance & Theming',
    count: 7,
    num: '#c084fc',
    bg: 'rgba(192,132,252,0.08)',
    border: 'rgba(192,132,252,0.22)'
  },
  {
    category: 'System & UX',
    count: 9,
    num: '#22d3ee',
    bg: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.22)'
  }
]

export const ARCHITECTURE_LAYERS = [
  {
    title: 'Renderer Process',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.06)',
    border: 'rgba(96,165,250,0.22)',
    items: [
      'React 19 + TypeScript',
      'Tailwind CSS 4 + Framer Motion',
      'Zustand (navigation state)',
      'React Router v7 + React Window'
    ]
  },
  {
    title: 'Main Process',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.06)',
    border: 'rgba(192,132,252,0.22)',
    items: [
      'Electron 39 + Node.js',
      '7 IPC handler modules',
      'Worker threads (scan + sizing)',
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
      'scan_engines / find_uproject',
      'get_folder_size (recursive)',
      'git_status / validate_engine'
    ]
  },
  {
    title: 'Rust Tracer Binary',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.06)',
    border: 'rgba(248,113,113,0.22)',
    items: [
      'Detached background process',
      'Tracks engine & project usage',
      'Writes to Tracer/*.json',
      ...(typeof window !== 'undefined' && window.electronAPI?.platform === 'win32'
        ? ['Windows registry Run key support']
        : [])
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
    channels: ['project-read-log', 'project-git-status', 'project-git-init']
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
      'engines-set-registry'
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
  { path: 'save\\engines.json', desc: 'Saved engine list', color: '#60a5fa' },
  { path: 'save\\projects.json', desc: 'Saved project list', color: '#4ade80' },
  { path: 'save\\settings.json', desc: 'App settings + Fab cache path', color: '#fbbf24' },
  { path: 'Tracer\\engines.json', desc: 'Tracer-collected engine data', color: '#fb923c' },
  { path: 'Tracer\\projects.json', desc: 'Tracer-collected project data', color: '#f87171' }
]

export const TECH_STACK = [
  { label: 'React 19', color: '#22d3ee' },
  { label: 'TypeScript 5.9', color: '#60a5fa' },
  { label: 'Electron 39', color: '#c084fc' },
  { label: 'Vite 7', color: '#fbbf24' },
  { label: 'Tailwind CSS 4', color: '#38bdf8' },
  { label: 'Zustand 5', color: '#fb923c' },
  { label: 'Framer Motion 12', color: '#f472b6' },
  { label: 'React Router 7', color: '#4ade80' },
  { label: 'React Window 2', color: '#2dd4bf' },
  { label: 'Rust (napi-rs)', color: '#f87171' },
  { label: 'electron-updater', color: '#818cf8' },
  { label: 'regedit', color: '#94a3b8' }
]
