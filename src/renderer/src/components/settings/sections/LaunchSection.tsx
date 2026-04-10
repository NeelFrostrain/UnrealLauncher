import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { SectionHeader, Card, SettingRow, Toggle } from '../SectionHelpers'

interface LaunchSectionProps {
  autoCloseOnLaunch: boolean
  onToggle: () => void
}

const LaunchSection = ({ autoCloseOnLaunch, onToggle }: LaunchSectionProps): React.ReactElement => {
  const [registryEngines, setRegistryEngines] = useState(true)

  useEffect(() => {
    window.electronAPI.getRegistryEngines().then(setRegistryEngines)
  }, [])

  const handleRegistryToggle = async (): Promise<void> => {
    const next = !registryEngines
    setRegistryEngines(next)
    await window.electronAPI.setRegistryEngines(next)
  }

  return (
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
        >
          <Toggle on={autoCloseOnLaunch} onChange={onToggle} />
        </SettingRow>
        <SettingRow
          label="Scan registry for engines"
          description="Detect Unreal Engine installations registered in the Windows registry (HKLM\\SOFTWARE\\EpicGames)."
          last
        >
          <Toggle on={registryEngines} onChange={handleRegistryToggle} />
        </SettingRow>
      </Card>
    </section>
  )
}

export default LaunchSection
