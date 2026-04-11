// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { SectionHeader, Card, SettingRow, Toggle } from '../SectionHelpers'
import { useAnimations } from '../../../utils/AnimationContext'
import { getSetting, setSetting } from '../../../utils/settings'

interface LaunchSectionProps {
  autoCloseOnLaunch: boolean
  onToggle: () => void
}

const LaunchSection = ({ autoCloseOnLaunch, onToggle }: LaunchSectionProps): React.ReactElement => {
  const [registryEngines, setRegistryEngines] = useState(true)
  const { animationsEnabled, toggleAnimations } = useAnimations()
  const [showTitlebarButtons, setShowTitlebarButtons] = useState(() =>
    getSetting('showTitlebarButtons')
  )

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
        >
          <Toggle on={registryEngines} onChange={handleRegistryToggle} />
        </SettingRow>
        <SettingRow
          label="UI Animations"
          description="Enable transitions and motion effects. Disable to reduce CPU/GPU usage and improve performance."
        >
          <Toggle on={animationsEnabled} onChange={toggleAnimations} />
        </SettingRow>
        <SettingRow
          label="Show Feedback & Discord buttons"
          description="Display the Feedback and Discord buttons in the titlebar."
          last
        >
          <Toggle
            on={showTitlebarButtons}
            onChange={() => {
              const next = !showTitlebarButtons
              setShowTitlebarButtons(next)
              setSetting('showTitlebarButtons', next)
            }}
          />
        </SettingRow>
      </Card>
    </section>
  )
}

export default LaunchSection
