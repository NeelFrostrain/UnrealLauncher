import { Zap, FolderOpen, Activity, Star, HardDrive, RefreshCw, Palette, Shield, LayoutGrid, Cpu } from 'lucide-react'

const features = [
  {
    icon: <FolderOpen className="text-blue-400" size={20} />,
    title: 'Auto-Scan',
    desc: 'Automatically discovers UE4 & UE5 installs and .uproject files across your drives.'
  },
  {
    icon: <Zap className="text-yellow-400" size={20} />,
    title: 'One-Click Launch',
    desc: 'Launch any Unreal Engine version or project instantly. No Epic Games Launcher required.'
  },
  {
    icon: <LayoutGrid className="text-purple-400" size={20} />,
    title: 'List & Grid View',
    desc: 'Switch between list and grid layouts for projects. Preference saved across sessions.'
  },
  {
    icon: <Star className="text-orange-400" size={20} />,
    title: 'Favorites & Recent',
    desc: 'Pin favorite projects and track recently opened ones sorted by actual last-opened time.'
  },
  {
    icon: <HardDrive className="text-cyan-400" size={20} />,
    title: 'Size Calculation',
    desc: 'Background folder size calculation for engines and projects using worker threads.'
  },
  {
    icon: <Cpu className="text-green-400" size={20} />,
    title: 'UE Tracer',
    desc: 'Background Rust process that tracks engine and project usage, merges data on scan.'
  },
  {
    icon: <Palette className="text-pink-400" size={20} />,
    title: 'Full Theme System',
    desc: 'Built-in themes, per-token color overrides, border radius control, and saveable profiles.'
  },
  {
    icon: <RefreshCw className="text-indigo-400" size={20} />,
    title: 'Auto Updates',
    desc: 'Built-in updater checks GitHub releases and installs updates in the background.'
  },
  {
    icon: <Activity className="text-red-400" size={20} />,
    title: 'Performance First',
    desc: 'Scroll virtualization, worker threads, and lazy-loaded pages keep the UI fast.'
  },
  {
    icon: <Shield className="text-teal-400" size={20} />,
    title: 'Single Instance',
    desc: 'Only one instance runs at a time. Second launch focuses the existing window.'
  }
]

const AboutFeatures = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <Zap size={20} className="text-blue-400" />
      Features
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map(({ icon, title, desc }) => (
        <div
          key={title}
          className="border hover:bg-white/10 transition-colors p-4 space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)'
          }}
        >
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          </div>
          <p className="text-xs text-white/50">{desc}</p>
        </div>
      ))}
    </div>
  </div>
)

export default AboutFeatures
