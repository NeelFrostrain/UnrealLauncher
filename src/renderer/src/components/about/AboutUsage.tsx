import { BookOpen } from 'lucide-react'

const steps = [
  {
    title: '1. Scan for Engines & Projects',
    desc: 'Click "Scan for Engines" or "Scan for Projects" to automatically detect installations. The app searches common locations and calculates sizes in the background.'
  },
  {
    title: '2. Add Manually',
    desc: 'Use "Add Engine" or "Add Project" buttons to manually select folders if they\'re in custom locations.'
  },
  {
    title: '3. Launch & Manage',
    desc: 'Click the Launch button to start engines or projects. Hover over cards to access additional options like opening directories or removing from the list.'
  },
  {
    title: '4. Track Usage',
    desc: 'The app automatically tracks when you last launched each engine, helping you manage your installations.'
  },
  {
    title: '5. Use Favorites',
    desc: 'Click the heart icon on project cards to add them to your favorites. Access your favorite projects quickly from the Favorites tab.'
  },
  {
    title: '6. Customize Settings',
    desc: 'Visit the Settings page to customize app behavior, including auto-close on launch and other preferences.'
  }
]

const AboutUsage = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <BookOpen size={20} className="text-green-400" />
      How to Use
    </h2>
    <div
      className="p-6 space-y-4"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
      {steps.map(({ title, desc }) => (
        <div key={title} className="space-y-2">
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          <p className="text-xs text-white/50">{desc}</p>
        </div>
      ))}
    </div>
  </div>
)

export default AboutUsage
