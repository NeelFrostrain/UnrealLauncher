import { Zap } from 'lucide-react'
import { SectionHeader, Card, SettingRow, Toggle } from '../SectionHelpers'

interface LaunchSectionProps {
  autoCloseOnLaunch: boolean
  onToggle: () => void
}

const LaunchSection = ({ autoCloseOnLaunch, onToggle }: LaunchSectionProps): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Zap size={13} className="text-yellow-300" />}
      label="Launch"
      accent="bg-yellow-500/20"
    />
    <Card>
      <SettingRow
        label="Auto-close on launch"
        description="Close the launcher automatically when opening a project or engine."
        last
      >
        <Toggle on={autoCloseOnLaunch} onChange={onToggle} />
      </SettingRow>
    </Card>
  </section>
)

export default LaunchSection
