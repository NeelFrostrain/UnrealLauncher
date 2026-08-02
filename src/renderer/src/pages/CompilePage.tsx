// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useCallback } from 'react'
import { Wrench, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '../components/ui/ToastContext'
import PageWrapper from '../layout/PageWrapper'
import { SectionHeader, Card } from '../components/settings/SectionHelpers'
import { CompileToolbar } from '../components/compile/CompileToolbar'
import { OverviewTab } from '../components/compile/OverviewTab'
import { EnvironmentTab } from '../components/compile/EnvironmentTab'
import { RepairWorkloadsDialog } from '../components/compile/RepairWorkloadsDialog'
import { CompileTerminal, type LogEntry } from '../components/compile/CompileTerminal'
import type { VsSetupStatus } from '../components/compile/compileTypes'

const DEFAULT_INSTALL_PATH = 'D:\\Applications\\VS'

const CompilePage = (): React.ReactElement => {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [repairing, setRepairing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  const installedCount = status?.components.filter((c) => c.installed).length || 0
  const totalCount = status?.components.length || 0

  return (
    <PageWrapper>
      <div className="flex flex-col h-full overflow-hidden relative">
        {/* Fixed Top Header Toolbar */}
        <CompileToolbar
          status={status}
          loading={loading}
          repairing={repairing}
          onRefresh={fetchStatus}
        />

        {/* Scrollable Main Layout Body */}
        <div className="flex-1 overflow-y-auto mt-2 min-h-0 space-y-6 pb-6 pr-1">
          {/* Section 1: Workloads & Repair Action Card */}
          <div>
            <SectionHeader label="WORKLOADS & COMPONENT SELECTION" />
            <Card>
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <h3
                      className="text-sm font-bold tracking-tight"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Visual Studio C++ Workloads
                    </h3>
                    {status?.isHealthy ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--color-engine-version) 12%, transparent)',
                          color: 'var(--color-engine-version-text)',
                          borderColor:
                            'color-mix(in srgb, var(--color-engine-version) 25%, transparent)'
                        }}
                      >
                        <CheckCircle2 size={12} />
                        {installedCount} / {totalCount} WORKLOADS READY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                        <AlertCircle size={12} />
                        {status?.missingComponentIds.length || 0} WORKLOADS MISSING
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Unreal Engine requires specific MSVC C++ toolset compilers, Windows SDKs, and
                    Visual Studio IDE components.
                  </p>
                </div>

                {/* Primary Button to Open Repair Dialog */}
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shadow-md hover:brightness-110 shrink-0"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'white'
                  }}
                >
                  <Wrench size={15} />
                  Repair or Reinstall Workloads
                </button>
              </div>
            </Card>
          </div>

          {/* Section 2: Overview & Installation Paths */}
          <OverviewTab
            status={status}
            customVsPath={customVsPath}
            onCustomVsPathChange={setCustomVsPath}
            onSelectFolder={handleSelectFolder}
          />

          {/* Section 3: Unreal Engine Version Matrix */}
          <EnvironmentTab />

          {/* Section 4: Security & Privileges Info Card */}
          <div>
            <SectionHeader label="ELEVATED PRIVILEGES" />
            <Card>
              <div
                className="p-4 flex flex-col gap-3 text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span
                      className="font-bold text-xs"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Windows UAC Elevation Prompt
                    </span>
                    <p className="leading-relaxed text-[11px]">
                      Modifying Visual Studio components or installing missing MSVC toolsets
                      launches the Visual Studio Installer (`vs_installer.exe` or
                      `vs_Community.exe`) with administrative rights.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Interactive Repair / Reinstall Workloads Modal Dialog */}
        <RepairWorkloadsDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          status={status}
          selectedComponentIds={selectedComponentIds}
          repairing={repairing}
          onToggleSelection={toggleComponentSelection}
          onRepairAndInstall={handleRepairAndInstall}
        />

        {/* Fixed Bottom Execution Terminal Drawer */}
        <CompileTerminal
          logs={logs}
          onClearLogs={() => setLogs([])}
          isLive={repairing || loading}
        />
      </div >
    </PageWrapper >
  )
}

export default CompilePage
