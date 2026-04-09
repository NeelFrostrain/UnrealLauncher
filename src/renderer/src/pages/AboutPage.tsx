import PageWrapper from '../layout/PageWrapper'
import AboutFeatures from '../components/about/AboutFeatures'
import AboutUsage from '../components/about/AboutUsage'
import {
  AboutKnownIssues,
  AboutTechnical,
  AboutContributing,
  AboutCodeOfConduct,
  AboutSecurity,
  AboutSupport,
  AboutFooter
} from '../components/about/AboutInfo'
import AboutChangelog from '../components/about/AboutChangelog'
import { BookOpen } from 'lucide-react'

const v190Added = [
  'Enhanced Settings Page — comprehensive customization with theme system, border radius control, and profile management',
  'Advanced Theme Customization — built-in themes, custom color overrides, and saveable theme profiles',
  'Unreal Engine Tracer — background process for tracking engine and project usage with performance optimizations',
  'Updates Section in Settings — moved auto-update and GitHub version checking from About page',
  'Theme Border Radius Sync — project cards, engine cards, and settings cards now respect theme border radius',
  'Windows Installer Generation — automated NSIS installer build with native modules and tracer included',
  'TypeScript Type Safety — added NativeModule interfaces and removed all require() imports',
  'Code Quality Improvements — fixed all ESLint warnings and TypeScript diagnostics',
  'Build Process Documentation — comprehensive BUILD.md guide for developers'
]

const WhatsNewSection = ({ added }: { added: string[] }): React.ReactElement => (
  <div
    className="p-6 space-y-4"
    style={{
      backgroundColor: 'var(--color-surface-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)'
    }}
  >
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-green-400">✨ Release Highlights</h3>
      <ul className="text-xs text-white/70 space-y-1 ml-4">
        {added.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  </div>
)

const AboutPage = ({ modal = false }: { modal?: boolean }): React.ReactElement => {
  const content = (
    <div className="space-y-6 pb-8 p-5">
      <div>
        <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-yellow-400" />
          What&apos;s New
        </h2>
        <WhatsNewSection added={v190Added} />
      </div>
      <AboutFeatures />
      <AboutChangelog />
      <AboutUsage />
      <AboutKnownIssues />
      <AboutTechnical />
      <AboutContributing />
      <AboutCodeOfConduct />
      <AboutSecurity />
      <AboutSupport />
      <AboutFooter />
    </div>
  )

  if (modal) {
    return content
  }

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="max-w-4xl mx-auto">{content}</div>
      </div>
    </PageWrapper>
  )
}

export default AboutPage
