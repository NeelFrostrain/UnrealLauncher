// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../components/ui/ToastContext'
import PageWrapper from '../layout/PageWrapper'
import { CompileToolbar } from '../components/compile/CompileToolbar'
import { OverviewTab } from '../components/compile/OverviewTab'
import { WorkloadsTab } from '../components/compile/WorkloadsTab'
import { EnvironmentTab } from '../components/compile/EnvironmentTab'
import { CompileTerminal, type LogEntry } from '../components/compile/CompileTerminal'
import type { VsSetupStatus, CompileTabType } from '../components/compile/compileTypes'

const DEFAULT_INSTALL_PATH = 'D:\\Applications\\VS'

const CompilePage = (): React.ReactElement => {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<CompileTabType>('overview')
  const [loading, setLoading] = useState(true)
  const [repairing, setRepairing] = useState(false)
  const [status, setStatus] = useState<VsSetupStatus | null>(null)
  const [customVsPath, setCustomVsPath] = useState(DEFAULT_INSTALL_PATH)
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    if (!window.electronAPI?.onVsLogOutput) return
    return window.electronAPI.onVsLogOutput((log) => {
      setLogs((prev) => [...prev, log])
    })
  }, [])

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      if (window.electronAPI?.checkVsSetup) {
        const res = await window.electronAPI.checkVsSetup()
        setStatus(res)
        if (res.vsPath && res.vsPath !== 'Not Found') {
          setCustomVsPath(res.vsPath)
        } else {
          setCustomVsPath(DEFAULT_INSTALL_PATH)
        }
        setSelectedComponentIds(res.missingComponentIds)
      }
    } catch (err) {
      console.error('Error fetching VS setup status:', err)
      addToast('Failed to check Visual Studio installation status', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleSelectFolder = async () => {
    try {
      if (window.electronAPI?.selectFolder) {
        const folders = await window.electronAPI.selectFolder()
        if (folders && folders.length > 0) {
          setCustomVsPath(folders[0])
        }
      }
    } catch (err) {
      console.error('Failed to select folder:', err)
    }
  }

  const toggleComponentSelection = (id: string) => {
    setSelectedComponentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleRepairAndInstall = async () => {
    if (!window.electronAPI?.repairVsSetup) {
      addToast('Electron API not available', 'error')
      return
    }

    setRepairing(true)
    addToast('Requesting Administrator privileges via UAC prompt...', 'info')

    try {
      const res = await window.electronAPI.repairVsSetup({
        targetInstallPath: customVsPath || DEFAULT_INSTALL_PATH,
        missingComponentIds:
          selectedComponentIds.length > 0 ? selectedComponentIds : status?.missingComponentIds
      })

      if (res.success) {
        addToast('Visual Studio components modified successfully!', 'success')
      } else {
        addToast(res.error || 'Installer finished or was cancelled by user', 'error')
      }
    } catch (err) {
      console.error('Repair execution failed:', err)
      addToast('Failed to execute Visual Studio repair tool', 'error')
    } finally {
      setRepairing(false)
      fetchStatus()
    }
  }

  return (
    <PageWrapper>
      <div className="flex flex-col h-full overflow-hidden relative">
        {/* Fixed Top Toolbar (Outside Scroll Container) */}
        <CompileToolbar
          activeTab={activeTab}
          status={status}
          loading={loading}
          repairing={repairing}
          onTabChange={setActiveTab}
          onRefresh={fetchStatus}
        />

        {/* Scrollable Main Content Body */}
        <div className="flex-1 overflow-y-auto py-3 px-1 min-h-0 space-y-4">
          {/* Tab 1: Overview & Paths */}
          {activeTab === 'overview' && <OverviewTab status={status} />}

          {/* Tab 2: Workloads & Repair */}
          {activeTab === 'components' && (
            <WorkloadsTab
              status={status}
              customVsPath={customVsPath}
              selectedComponentIds={selectedComponentIds}
              repairing={repairing}
              onCustomVsPathChange={setCustomVsPath}
              onSelectFolder={handleSelectFolder}
              onToggleSelection={toggleComponentSelection}
              onRepairAndInstall={handleRepairAndInstall}
            />
          )}

          {/* Tab 3: Environment & Toolsets */}
          {activeTab === 'environment' && <EnvironmentTab />}
        </div>

        {/* Fixed Bottom Execution Terminal Drawer */}
        <CompileTerminal
          logs={logs}
          onClearLogs={() => setLogs([])}
          isLive={repairing || loading}
        />
      </div>
    </PageWrapper>
  )
}

export default CompilePage
