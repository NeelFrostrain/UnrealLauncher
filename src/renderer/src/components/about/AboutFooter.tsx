import { AlertTriangle, BookOpen, Code, GitBranch } from 'lucide-react'

export const AboutFooter = (): React.ReactElement => (
  <div className="text-center space-y-4">
    <div className="flex flex-wrap items-center justify-center gap-2">
      {[
        {
          label: 'GitHub',
          icon: <GitBranch size={16} />,
          url: 'https://github.com/NeelFrostrain/UnrealLauncher',
          cls: 'bg-white/5 hover:bg-white/10 border-white/10'
        },
        {
          label: 'Changelog',
          icon: <BookOpen size={16} />,
          url: 'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CHANGELOG.md',
          cls: 'bg-white/5 hover:bg-white/10 border-white/10'
        },
        {
          label: 'Contribute',
          icon: <Code size={16} />,
          url: 'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CONTRIBUTING.md',
          cls: 'bg-white/5 hover:bg-white/10 border-white/10'
        },
        {
          label: 'Issues',
          icon: <AlertTriangle size={16} />,
          url: 'https://github.com/NeelFrostrain/UnrealLauncher/issues',
          cls: 'bg-white/5 hover:bg-white/10 border-white/10'
        },
        {
          label: 'Donate',
          icon: <span>☕</span>,
          url: 'https://ko-fi.com/neelfrostrain',
          cls: 'bg-orange-600/20 hover:bg-orange-600/30 border-orange-500/30'
        }
      ].map(({ label, icon, url, cls }) => (
        <button
          key={label}
          onClick={() => window.electronAPI.openExternal(url)}
          className={`flex items-center gap-2 px-3 py-2 ${cls} border rounded-lg text-sm transition-colors cursor-pointer`}
        >
          {icon} {label}
        </button>
      ))}
    </div>
    <p className="text-xs text-white/40 flex items-center justify-center gap-1.5 tracking-wide uppercase font-medium">
      <span>Made By</span>
      <button
        onClick={() => window.electronAPI.openExternal('https://github.com/NeelFrostrain')}
        className="text-white/80 hover:text-white transition-colors cursor-default"
      >
        Neel Frostrain
      </button>
    </p>
  </div>
)
