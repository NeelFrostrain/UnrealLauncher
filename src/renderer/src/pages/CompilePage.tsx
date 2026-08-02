// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, ShieldAlert } from 'lucide-react'
import { useToast } from '../components/ui/ToastContext'
import PageWrapper from '../layout/PageWrapper'
import { SectionHeader, Card } from '../components/settings/SectionHelpers'
import { CompileToolbar } from '../components/compile/CompileToolbar'
import { ComponentChecklist } from '../components/compile/ComponentChecklist'
import { EnvironmentTab } from '../components/compile/EnvironmentTab'
import { CompileTerminal, type LogEntry } from '../components/compile/CompileTerminal'
import type { VsSetupStatus } from '../components/compile/compileTypes'

const DEFAULT_INSTALL_PATH = 'D:\\Applications\\VS'

const CompilePage = (): React.ReactElement => {
  const { addToast } = useToast()
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
        {/* Fixed Header Toolbar */}
        <CompileToolbar
          status={status}
          loading={loading}
          repairing={repairing}
          onRefresh={fetchStatus}
        />

        {/* Scrollable Single Page Layout Body */}
        <div className="flex-1 overflow-y-auto mt-2 min-h-0 space-y-6">
          {/* Top Path Config Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target VS Installation Path */}
            <div>
              <SectionHeader label="TARGET INSTALLATION FOLDER" />
              <Card>
                <div className="p-4 flex flex-col gap-3">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Visual Studio installation target root:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customVsPath}
                      onChange={(e) => setCustomVsPath(e.target.value)}
                      placeholder="e.g. D:\Applications\VS"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-md border focus:outline-none transition-all duration-200 min-w-0"
                      style={{
                        backgroundColor: 'var(--color-surface-card)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                    <button
                      onClick={handleSelectFolder}
                      className="cursor-pointer flex items-center justify-center px-3.5 py-2 rounded-md text-xs font-medium border transition-all duration-200 shrink-0"
                      style={{
                        backgroundColor: 'var(--color-surface-card)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                      Browse
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Windows SDK Path */}
            <div>
              <SectionHeader label="WINDOWS SDK" />
              <Card>
                <div className="p-4 flex flex-col gap-3">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Windows Kits 10/11 SDK headers and libraries:
                  </p>
                  <div
                    className="p-3 rounded-md border font-mono text-xs break-all select-all"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {status?.sdkPath || 'Not Found'}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Main 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: MSVC Compiler Instances, Matrix, UAC Privileges */}
            <div className="space-y-6">
              {/* Detected MSVC Compiler Toolsets */}
              <div>
                <SectionHeader label="DETECTED COMPILER INSTANCES" />
                <Card>
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        Installed MSVC Toolsets
                      </span>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                        style={{
                          backgroundColor: 'var(--color-surface-card)',
                          color: 'var(--color-text-muted)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        {status?.msvcVersions.length || 0} Found
                      </span>
                    </div>

                    {status?.msvcVersions && status.msvcVersions.length > 0 ? (
                      <div className="space-y-2">
                        {status.msvcVersions.map((item) => (
                          <div
                            key={item.version}
                            className="p-3 rounded-md border flex flex-col gap-1 transition-all duration-200"
                            style={{
                              backgroundColor: 'var(--color-surface-card)',
                              borderColor: 'var(--color-border)'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="font-bold text-xs font-mono"
                                style={{ color: 'var(--color-accent)' }}
                              >
                                v{item.version}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                                x64 Native Compiler
                              </span>
                            </div>
                            <span
                              className="font-mono text-[11px] break-all select-all mt-0.5"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {item.path}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="p-4 text-center text-xs italic border border-dashed rounded-md"
                        style={{
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        No MSVC compiler binaries detected under VC\Tools\MSVC.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Unreal Engine Version Matrix */}
              <EnvironmentTab />

              {/* Security & Privileges Info Card */}
              <div>
                <SectionHeader label="ELEVATED PRIVILEGES" />
                <Card>
                  <div
                    className="p-4.5 flex flex-col gap-3 text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          Windows UAC Elevation Prompt
                        </span>
                        <p className="leading-relaxed">
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

            {/* Right Column: Workloads & Component Selection */}
            <div>
              <ComponentChecklist
                status={status}
                selectedComponentIds={selectedComponentIds}
                repairing={repairing}
                onToggleSelection={toggleComponentSelection}
                onRepairAndInstall={handleRepairAndInstall}
              />
            </div>
          </div>
        </div>

        {/* Fixed Bottom Execution Terminal */}
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
