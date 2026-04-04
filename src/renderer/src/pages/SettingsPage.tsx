import { useState, useEffect } from 'react'
import PageWrapper from '../layout/PageWrapper'
import SettingsIcon from '@mui/icons-material/Settings'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import { getSetting, setSetting } from '../utils/settings'

const SettingsPage = (): React.ReactElement => {
  const [autoCloseOnLaunch, setAutoCloseOnLaunch] = useState(false)

  useEffect(() => {
    setAutoCloseOnLaunch(getSetting('autoCloseOnLaunch'))
  }, [])

  const handleToggleAutoClose = (): void => {
    const newValue = !autoCloseOnLaunch
    setAutoCloseOnLaunch(newValue)
    setSetting('autoCloseOnLaunch', newValue)
  }

  return (
    <PageWrapper>
      {/* <PageTitleBar title="Settings" description="Configure Unreal Launcher behavior" /> */}

      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
          {/* Launch Behavior Settings */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <FlashOnIcon sx={{ fontSize: 20 }} className="text-blue-400" />
              Launch Behavior
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white/90 mb-2">Auto-close on Launch</h3>
                  <p className="text-xs text-white/50">
                    Automatically close the launcher when launching projects or engines
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoClose}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors ml-4"
                >
                  {autoCloseOnLaunch ? (
                    <>
                      <ToggleOnIcon sx={{ fontSize: 25 }} className="text-blue-500" />
                    </>
                  ) : (
                    <>
                      <ToggleOffIcon sx={{ fontSize: 25 }} className="text-gray-500" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Future Settings Sections */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <SettingsIcon sx={{ fontSize: 20 }} className="text-purple-400" />
              General
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-xs text-white/50">
                More settings will be available in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default SettingsPage
