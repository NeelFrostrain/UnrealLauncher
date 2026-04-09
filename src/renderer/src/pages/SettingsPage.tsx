import { useState, useEffect } from 'react'
import PageWrapper from '../layout/PageWrapper'
import { Activity, Database, FolderOpen, Settings, ToggleLeft, ToggleRight, Trash2, Zap } from 'lucide-react'
import { getSetting, setSetting } from '../utils/settings'

const SettingsPage = (): React.ReactElement => {
  const [autoCloseOnLaunch, setAutoCloseOnLaunch] = useState(false)
  const [tracerAutoStart, setTracerAutoStart] = useState(false)
  const [tracerRunning, setTracerRunning] = useState(false)
  const [tracerDataDir, setTracerDataDir] = useState('')
  const [tracerMerge, setTracerMerge] = useState(true)
  const [clearing, setClearing] = useState<'app' | 'tracer' | null>(null)

  useEffect(() => {
    setAutoCloseOnLaunch(getSetting('autoCloseOnLaunch'))
    window.electronAPI.getTracerStartup().then(setTracerAutoStart)
    window.electronAPI.isTracerRunning().then(setTracerRunning)
    window.electronAPI.getTracerDataDir().then(setTracerDataDir)
    window.electronAPI.getTracerMerge().then(setTracerMerge)

    const interval = setInterval(() => {
      window.electronAPI.isTracerRunning().then(setTracerRunning)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleAutoClose = (): void => {
    const next = !autoCloseOnLaunch
    setAutoCloseOnLaunch(next)
    setSetting('autoCloseOnLaunch', next)
  }

  const handleToggleTracer = async (): Promise<void> => {
    const next = !tracerAutoStart
    setTracerAutoStart(next)
    setSetting('tracerAutoStart', next)
    await window.electronAPI.setTracerStartup(next)
    setTimeout(async () => {
      const running = await window.electronAPI.isTracerRunning()
      setTracerRunning(running)
    }, 1500)
  }

  const handleToggleMerge = async (): Promise<void> => {
    const next = !tracerMerge
    setTracerMerge(next)
    await window.electronAPI.setTracerMerge(next)
  }

  const handleClearAppData = async (): Promise<void> => {
    if (!confirm('Clear all saved engines and projects? This cannot be undone.')) return
    setClearing('app')
    await window.electronAPI.clearAppData()
    setClearing(null)
  }

  const handleClearTracerData = async (): Promise<void> => {
    if (!confirm('Clear all tracer history (engines and projects)? This cannot be undone.')) return
    setClearing('tracer')
    await window.electronAPI.clearTracerData()
    setClearing(null)
  }

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="max-w-4xl mx-auto space-y-6 pb-8">

          {/* Launch Behavior */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <Zap size={20} className="text-blue-400" />
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
                  {autoCloseOnLaunch
                    ? <ToggleRight size={25} className="text-blue-500" />
                    : <ToggleLeft size={25} className="text-gray-500" />}
                </button>
              </div>
            </div>
          </div>

          {/* Tracer */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-green-400" />
              Session Tracer
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/10">

              {/* Auto-start toggle */}
              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white/90 mb-2">Run tracer on startup</h3>
                  <p className="text-xs text-white/50">
                    Automatically start the background tracer when Windows starts.
                    Tracks which engines and projects you open and updates their last-opened time.
                  </p>
                </div>
                <button
                  onClick={handleToggleTracer}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors ml-4"
                >
                  {tracerAutoStart
                    ? <ToggleRight size={25} className="text-green-500" />
                    : <ToggleLeft size={25} className="text-gray-500" />}
                </button>
              </div>

              {/* Merge toggle */}
              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white/90 mb-2">Sync tracer data on scan</h3>
                  <p className="text-xs text-white/50">
                    When scanning engines or projects, pull in new entries detected by the tracer
                    and update last-opened times automatically.
                  </p>
                </div>
                <button
                  onClick={handleToggleMerge}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors ml-4"
                >
                  {tracerMerge
                    ? <ToggleRight size={25} className="text-green-500" />
                    : <ToggleLeft size={25} className="text-gray-500" />}
                </button>
              </div>

              {/* Status row */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${tracerRunning ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-white/20'}`}
                  />
                  <span className="text-xs text-white/60">
                    {tracerRunning ? 'Running' : 'Not running'}
                  </span>
                </div>
                {tracerDataDir && (
                  <button
                    onClick={() => window.electronAPI.openDirectory(tracerDataDir)}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
                    title={tracerDataDir}
                  >
                    <FolderOpen size={13} />
                    Open data folder
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Data */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <Database size={20} className="text-red-400" />
              Data
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/10">

              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white/90 mb-1">Clear app data</h3>
                  <p className="text-xs text-white/50">
                    Removes all saved engines and projects from the launcher. Does not delete files from disk.
                  </p>
                </div>
                <button
                  onClick={handleClearAppData}
                  disabled={clearing === 'app'}
                  className="flex items-center gap-2 ml-6 px-4 py-2 rounded text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />
                  {clearing === 'app' ? 'Clearing…' : 'Clear'}
                </button>
              </div>

              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white/90 mb-1">Clear tracer data</h3>
                  <p className="text-xs text-white/50">
                    Removes all engine and project history recorded by the background tracer.
                  </p>
                </div>
                <button
                  onClick={handleClearTracerData}
                  disabled={clearing === 'tracer'}
                  className="flex items-center gap-2 ml-6 px-4 py-2 rounded text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />
                  {clearing === 'tracer' ? 'Clearing…' : 'Clear'}
                </button>
              </div>

            </div>
          </div>

          {/* General */}
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
              <Settings size={20} className="text-purple-400" />
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
