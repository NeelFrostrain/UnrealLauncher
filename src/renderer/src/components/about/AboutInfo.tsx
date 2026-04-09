import { AlertTriangle, BookOpen, Code, Zap, GitBranch } from 'lucide-react'

const knownIssues = [
  'Size calculation may take time for large folders (30+ GB). The app remains responsive during calculation.',
  'Removing engines or projects from the list does NOT delete files from disk - only removes them from the launcher.',
  'Project thumbnails are loaded from Saved/AutoScreenshot.png if available.',
  'The app scans these default paths: D:\\Engine\\UnrealEditors, C:\\Program Files\\Epic Games, Documents\\Unreal Projects'
]

const techDetails = [
  { label: 'Version', value: '1.8.0', mono: true },
  { label: 'Framework', value: 'Electron 39.2.6' },
  { label: 'UI Library', value: 'React 19.2.1' },
  { label: 'Language', value: 'TypeScript 5.9.3' },
  { label: 'Build Tool', value: 'Vite 7.2.6' },
  { label: 'License', value: 'MIT' }
]

export const AboutKnownIssues = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <AlertTriangle size={20} className="text-yellow-400" />
      Known Issues &amp; Notes
    </h2>
    <div
      className="p-6 space-y-3"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
      {knownIssues.map((issue) => (
        <div key={issue} className="flex gap-3">
          <span className="text-yellow-400 mt-0.5">•</span>
          <p className="text-xs text-white/50">{issue}</p>
        </div>
      ))}
    </div>
  </div>
)

export const AboutTechnical = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4">Technical Details</h2>
    <div
      className="p-6 space-y-3"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
      {techDetails.map(({ label, value, mono }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-sm text-white/50">{label}</span>
          <span className={`text-sm ${mono ? 'font-mono' : ''} text-white/90`}>{value}</span>
        </div>
      ))}
    </div>
  </div>
)

export const AboutContributing = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <GitBranch size={20} className="text-green-400" />
      Contributing
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
        We welcome contributions! Help make Unreal Launcher better for everyone.
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90">How to Contribute</h3>
        <ul className="text-xs text-white/50 space-y-1 ml-4">
          <li>• Fork the repository</li>
          <li>• Create a feature branch</li>
          <li>• Make your changes and run tests</li>
          <li>• Open a pull request</li>
        </ul>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90">Development Guidelines</h3>
        <ul className="text-xs text-white/50 space-y-1 ml-4">
          <li>
            • Run <code className="bg-white/10 px-1 rounded">npm run lint</code> before committing
          </li>
          <li>• Ensure TypeScript types are correct</li>
          <li>• Update documentation for new features</li>
          <li>• Test on multiple platforms when possible</li>
        </ul>
      </div>
      <button
        onClick={() =>
          window.electronAPI.openExternal(
            'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CONTRIBUTING.md'
          )
        }
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 border border-green-500/50 rounded-lg text-sm transition-colors cursor-pointer"
      >
        <BookOpen size={16} />
        Read Contributing Guide
      </button>
    </div>
  </div>
)

export const AboutCodeOfConduct = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <AlertTriangle size={20} className="text-blue-400" />
      Code of Conduct
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
        This project is governed by a Code of Conduct to ensure a welcoming environment for
        everyone.
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90">Our Standards</h3>
        <ul className="text-xs text-white/50 space-y-1 ml-4">
          <li>• Use welcoming and inclusive language</li>
          <li>• Be respectful of differing viewpoints</li>
          <li>• Show empathy towards community members</li>
          <li>• Focus on what&apos;s best for the community</li>
        </ul>
      </div>
      <button
        onClick={() =>
          window.electronAPI.openExternal(
            'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CODE_OF_CONDUCT.md'
          )
        }
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 border border-blue-500/50 rounded-lg text-sm transition-colors cursor-pointer"
      >
        <BookOpen size={16} />
        Read Code of Conduct
      </button>
    </div>
  </div>
)

export const AboutSecurity = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <AlertTriangle size={20} className="text-red-400" />
      Security
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
        If you discover a security vulnerability, please report it privately.
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90">Reporting</h3>
        <p className="text-xs text-white/50">
          Send security reports to:{' '}
          <code className="bg-white/10 px-1 rounded">nfrostrain@gmail.com</code>
        </p>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90">Supported Versions</h3>
        <p className="text-xs text-white/50">
          Security fixes are only applied to the current stable release.
        </p>
      </div>
      <button
        onClick={() =>
          window.electronAPI.openExternal(
            'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/SECURITY.md'
          )
        }
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 border border-red-500/50 rounded-lg text-sm transition-colors cursor-pointer"
      >
        <BookOpen size={16} />
        Read Security Policy
      </button>
    </div>
  </div>
)

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
