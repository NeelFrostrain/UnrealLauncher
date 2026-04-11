import { AlertTriangle, BookOpen, Code, GitBranch, MessageCircle } from 'lucide-react'
import config from '../../../../config'

const LINKS = [
  {
    label: 'GitHub',
    icon: <GitBranch size={14} />,
    url: config.githubRepo,
    style: { color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-card)' }
  },
  {
    label: 'Changelog',
    icon: <BookOpen size={14} />,
    url: `${config.githubRepo}/blob/main/CHANGELOG.md`,
    style: { color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-card)' }
  },
  {
    label: 'Contribute',
    icon: <Code size={14} />,
    url: `${config.githubRepo}/blob/main/CONTRIBUTING.md`,
    style: { color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-card)' }
  },
  {
    label: 'Issues',
    icon: <AlertTriangle size={14} />,
    url: `${config.githubRepo}/issues`,
    style: { color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-card)' }
  },
  {
    label: 'Discord',
    icon: <MessageCircle size={14} />,
    url: config.discordInvite,
    style: { color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.08)' }
  },
  {
    label: 'Ko-fi',
    icon: <span className="text-sm leading-none">☕</span>,
    url: config.kofi,
    style: { color: '#fb923c', borderColor: 'rgba(251,146,60,0.3)', backgroundColor: 'rgba(251,146,60,0.08)' }
  }
]

export const AboutFooter = (): React.ReactElement => (
  <div className="text-center space-y-3 pt-2">
    <div className="flex flex-wrap items-center justify-center gap-2">
      {LINKS.map(({ label, icon, url, style }) => (
        <button
          key={label}
          onClick={() => window.electronAPI.openExternal(url)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer hover:opacity-80"
          style={{ ...style, borderRadius: 'var(--radius)' }}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
    <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: 'var(--color-text-muted)' }}>
      Made by{' '}
      <button
        onClick={() => window.electronAPI.openExternal(`${config.githubRepo.split('/').slice(0, 4).join('/')}`)}
        className="transition-colors cursor-pointer hover:opacity-80"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Neel Frostrain
      </button>
    </p>
  </div>
)
