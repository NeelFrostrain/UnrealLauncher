import MenuBookIcon from '@mui/icons-material/MenuBook'

const latestAdded = [
  'Recent Projects tab now sorted by actual last-opened time from Saved/Logs',
  'Migrated all icons from lucide-react to MUI icons-material',
  'GitHub Version Check: compare installed vs latest GitHub release',
  'App Version IPC: renderer now reads the real app version',
]

const latestFixed = [
  'lastOpenedAt was missing from ProjectData type — now flows to renderer correctly',
  'ProjectCard useEffect missing async wrapper caused a parse error on await',
  'Log scanner now only reads top-level Saved/Logs files, not subdirectories',
  'Recent tab no longer falls back to createdAt for projects never opened',
]

const previousAdded = [
  'Settings Page: Complete settings interface for customizing app behavior',
  'Favorites System: Mark and quickly access favorite projects',
  'Advanced Animations: Beautiful framer-motion animations throughout the UI',
  'Enhanced Search: Improved search functionality with better UX',
  'Toast Notifications: Real-time feedback for user actions',
  'Single Instance Lock: Prevents multiple app instances',
  'Global Button Animations: Hover and click effects across the app',
  'Asset Resolver: Better handling of project thumbnails',
  ...latestAdded,
]

const previousFixed = [
  ...latestFixed,
  'Updated About page to display correct app version',
  'Improved TypeScript configuration compatibility',
  'Fixed HTML entity escaping in JSX components',
  'Enhanced search bar styling and functionality',
]

const ChangelogSection = ({ added, fixed }: { added: string[]; fixed: string[] }): React.ReactElement => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-green-400">✅ Added</h3>
      <ul className="text-xs text-white/50 space-y-1 ml-4">
        {added.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-blue-400">🛠️ Fixed</h3>
      <ul className="text-xs text-white/50 space-y-1 ml-4">
        {fixed.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
    <button
      onClick={() => window.electronAPI.openExternal('https://github.com/NeelFrostrain/UnrealLauncher/blob/main/CHANGELOG.md')}
      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 border border-yellow-500/50 rounded-lg text-sm transition-colors cursor-pointer"
    >
      <MenuBookIcon sx={{ fontSize: 16 }} />
      View Full Changelog
    </button>
  </div>
)

const AboutChangelog = (): React.ReactElement => (
  <>
    <div>
      <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
        <MenuBookIcon sx={{ fontSize: 20 }} className="text-yellow-400" />
        What&apos;s New
      </h2>
      <ChangelogSection added={latestAdded} fixed={latestFixed} />
    </div>
    <div>
      <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
        <MenuBookIcon sx={{ fontSize: 20 }} className="text-yellow-400" />
        What&apos;s New
      </h2>
      <ChangelogSection added={previousAdded} fixed={previousFixed} />
    </div>
  </>
)

export default AboutChangelog
