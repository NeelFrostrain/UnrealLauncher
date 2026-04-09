import { BookOpen } from 'lucide-react'

const v180Added = [
  'List & Grid View — toggle between flat list and thumbnail grid, preference saved across sessions',
  'Batch Project Import — imports up to 20 projects at a time, toast shows how many were skipped',
  'Redesigned Project Cards — list row with 3-dot dropdown menu, grid card with hover overlay',
  'Neon border glow on grid card hover',
  'Stacking toast notifications with colored accent bar, auto-dismiss, and close button',
  'Persist last open page — app reopens the last visited page on launch',
  'Persist view mode — list/grid preference restored on launch',
  'Error Boundary — recoverable error screen instead of blank window on crash',
  'openExternal now validates https-only URLs for security',
  'Settings cache — getSetting no longer re-parses localStorage on every call'
]

const v180Fixed = [
  'Favorites tab showing nothing — fixed stale closure in filterForTab',
  'Dropdown menus clipped by scroll container — now rendered via React portal',
  'Toast X button not working — fixed pointer-events blocked by select-none',
  'ProjectsPage scanning on every tab switch — now scans once, filters client-side',
  'favoritePaths breaking useMemo — moved to React state for stable reference',
  'Relative import paths broken after component folder reorganization'
]

const v170Added = [
  'Recent Projects tab sorted by last-opened time from Saved/Logs timestamps',
  'Migrated all icons from lucide-react to MUI icons-material',
  'GitHub Version Check: compare installed vs latest GitHub release',
  'App Version IPC: renderer reads the real app version',
  'Settings Page, Favorites System, Toast Notifications, Single Instance Lock'
]

const v170Fixed = [
  'lastOpenedAt missing from ProjectData type',
  'ProjectCard useEffect missing async wrapper',
  'Log scanner recursing into subdirectories',
  'Recent tab falling back to createdAt'
]

const ChangelogSection = ({
  added,
  fixed
}: {
  added: string[]
  fixed: string[]
}): React.ReactElement => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-green-400">✅ Added</h3>
      <ul className="text-xs text-white/50 space-y-1 ml-4">
        {added.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-blue-400">🛠️ Fixed</h3>
      <ul className="text-xs text-white/50 space-y-1 ml-4">
        {fixed.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
    <button
      onClick={() =>
        window.electronAPI.openExternal(
          'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CHANGELOG.md'
        )
      }
      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 border border-yellow-500/50 rounded-lg text-sm transition-colors cursor-pointer"
    >
      <BookOpen size={16} />
      View Full Changelog
    </button>
  </div>
)

const AboutChangelog = (): React.ReactElement => (
  <>
    <div>
      <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
        <BookOpen size={20} className="text-yellow-400" />
        What&apos;s New in 1.8.0
      </h2>
      <ChangelogSection added={v180Added} fixed={v180Fixed} />
    </div>
    <div>
      <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
        <BookOpen size={20} className="text-yellow-400" />
        Previous — 1.7.0
      </h2>
      <ChangelogSection added={v170Added} fixed={v170Fixed} />
    </div>
  </>
)

export default AboutChangelog
