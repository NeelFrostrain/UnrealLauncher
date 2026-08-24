// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useCallback } from 'react'
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  AlertTriangle,
  CheckCheck
} from 'lucide-react'
import { useToast } from '../components/ui/ToastContext'
import PageWrapper from '../layout/PageWrapper'
import { Card, SectionHeader, SettingRow } from '../components/settings/SectionHelpers'
import { RepairWorkloadsDialog } from '../components/vsStatus/RepairWorkloadsDialog'
import { VsStatusTerminal, type LogEntry } from '../components/vsStatus/VsStatusTerminal'
import type { VsSetupStatus } from '../components/vsStatus/vsStatusTypes'

const DEFAULT_INSTALL_PATH = 'D:\\Applications\\VS'

const UE_MATRIX = [
  {
    range: 'Unreal Engine 4.27 / 5.0–5.2',
    toolset: 'MSVC v142 Toolset (v14.29)',
    id: 'ComponentGroup.VC.Tools.142'
  },
  {
    range: 'Unreal Engine 5.3 / 5.4',
    toolset: 'MSVC v143 Toolset (v14.38)',
    id: 'Component.VC.14.38.17.8'
  },
  {
    range: 'Unreal Engine 5.5 / 5.6+',
    toolset: 'MSVC v143 Latest Toolset',
    id: 'Component.VC.Tools.x86.x64',
    badge: 'LATEST'
  }
]

const VsStatusPage = (): React.ReactElement => {
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
  const isHealthy = status?.isHealthy ?? false

  return (
    <PageWrapper>
      {/* ── Full Width Toolbar ─────────────────────────────────────────────── */}
      <div
        className="w-full flex items-center justify-between py-3.5 border-b shrink-0 select-none gap-4"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Title */}
        <div className="flex items-center gap-3 mx-1">
          <div className="flex flex-col">
            <h1
              className="text-sm font-bold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Visual Studio &amp; C++ Build Environment
            </h1>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Verify compiler toolsets, MSVC workloads, and SDK dependencies for Unreal Engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Health badge */}
          {!loading && (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all"
              style={
                isHealthy
                  ? {
                      backgroundColor:
                        'color-mix(in srgb, var(--color-engine-version-text) 12%, transparent)',
                      color: 'var(--color-engine-version-text)',
                      borderColor:
                        'color-mix(in srgb, var(--color-engine-version-text) 25%, transparent)'
                    }
                  : {
                      backgroundColor: 'color-mix(in srgb, #f59e0b 12%, transparent)',
                      color: '#fbbf24',
                      borderColor: 'color-mix(in srgb, #f59e0b 30%, transparent)'
                    }
              }
            >
              {isHealthy ? (
                <>
                  <CheckCheck size={13} />
                  Ready
                </>
              ) : (
                <>
                  <AlertTriangle size={13} />
                  {status?.missingComponentIds.length || 0} Workloads Missing
                </>
              )}
            </span>
          )}

          {/* Quick Repair modal button */}
          <button
            onClick={() => setIsDialogOpen(true)}
            disabled={loading || repairing}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <Wrench size={13} />
            {repairing ? 'Repairing…' : 'Repair Workloads'}
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchStatus}
            disabled={loading || repairing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed border rounded-lg hover:border-[var(--color-accent)]"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Checking…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Full Width Merged Scrollable Page Body ───────────────────────── */}
      <div className="flex-1 w-full overflow-hidden mt-1 flex flex-col min-h-0">
        <div className="flex-1 w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-h-0 space-y-5">
          {/* Section 1: System Status & Paths */}
          <div className="w-full">
            <SectionHeader label="SYSTEM STATUS & PATHS" />
            <Card>
              <SettingRow
                label="C++ Workloads Health"
                description="Required MSVC toolset compilers, Windows SDKs, and IDE components for Unreal Engine."
              >
                {loading ? (
                  <span
                    className="px-3 py-1.5 rounded-md text-xs font-semibold border"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      color: 'var(--color-text-muted)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    Checking…
                  </span>
                ) : isHealthy ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border"
                    style={{
                      backgroundColor:
                        'color-mix(in srgb, var(--color-engine-version-text) 12%, transparent)',
                      color: 'var(--color-engine-version-text)',
                      borderColor:
                        'color-mix(in srgb, var(--color-engine-version-text) 25%, transparent)'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    {installedCount} / {totalCount} Workloads Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    <AlertCircle size={13} />
                    {status?.missingComponentIds.length || 0} Workloads Missing
                  </span>
                )}
              </SettingRow>

              <SettingRow
                label="Visual Studio Installation Path"
                description="Detected root installation folder for Visual Studio."
              >
                <span
                  className="font-mono text-[11px] px-3 py-1.5 rounded-md border max-w-md truncate select-all"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                  title={status?.vsPath}
                >
                  {status?.vsPath || 'Not Found'}
                </span>
              </SettingRow>

              <SettingRow
                label="Windows Kits SDK"
                description="Windows Kits 10/11 SDK headers and library paths."
              >
                <span
                  className="font-mono text-[11px] px-3 py-1.5 rounded-md border max-w-md truncate select-all"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                  title={status?.sdkPath}
                >
                  {status?.sdkPath || 'Not Found'}
                </span>
              </SettingRow>

              <SettingRow
                label="Detected MSVC Compiler Instances"
                description="Found MSVC toolset compiler binaries under VC\\Tools\\MSVC."
                last
              >
                <span
                  className="font-mono text-[11px] px-3 py-1 rounded-md border font-bold"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                    color: 'var(--color-accent)'
                  }}
                >
                  {status?.msvcVersions.length || 0} Installed
                </span>
              </SettingRow>
            </Card>
          </div>

          {/* Section 2: Workloads & Component Selection */}
          {/* <div className="w-full">
            <SectionHeader label={`REQUIRED WORKLOADS (${installedCount}/${totalCount} READY)`} />
            <Card>
              {status?.components.map((comp, i) => {
                const isSelected = selectedComponentIds.includes(comp.id)
                return (
                  <SettingRow
                    key={comp.id}
                    label={comp.label}
                    description={comp.id}
                    last={i === (status?.components.length ?? 0) - 1}
                  >
                    <div className="flex items-center gap-3">
                      {comp.installed ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold border px-2.5 py-1 rounded-md"
                          style={{
                            backgroundColor:
                              'color-mix(in srgb, var(--color-engine-version-text) 12%, transparent)',
                            color: 'var(--color-engine-version-text)',
                            borderColor:
                              'color-mix(in srgb, var(--color-engine-version-text) 25%, transparent)'
                          }}
                        >
                          <CheckCircle2 size={11} />
                          INSTALLED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                          <AlertCircle size={11} />
                          MISSING
                        </span>
                      )}
                      <Toggle on={isSelected} onChange={() => toggleComponentSelection(comp.id)} />
                    </div>
                  </SettingRow>
                )
              })}
            </Card>
          </div> */}

          {/* Section 3: Unreal Engine Version Matrix */}
          <div className="w-full">
            <SectionHeader label="UNREAL ENGINE MSVC MATRIX" />
            <Card>
              {UE_MATRIX.map((row, i) => (
                <SettingRow
                  key={row.id}
                  label={row.range}
                  description={row.toolset}
                  last={i === UE_MATRIX.length - 1}
                >
                  <div className="flex items-center gap-2">
                    {row.badge && (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase"
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--color-engine-version-text) 12%, transparent)',
                          color: 'var(--color-engine-version-text)',
                          borderColor:
                            'color-mix(in srgb, var(--color-engine-version-text) 25%, transparent)'
                        }}
                      >
                        {row.badge}
                      </span>
                    )}
                    <span
                      className="font-mono text-[11px] px-2.5 py-1 rounded-md border font-semibold tracking-tight"
                      style={{
                        backgroundColor: 'var(--color-surface-card)',
                        color: 'var(--color-accent)',
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      {row.id}
                    </span>
                  </div>
                </SettingRow>
              ))}
            </Card>
          </div>

          {/* Section 4: Target Installation Path & Privileges */}
          <div className="w-full">
            <SectionHeader label="INSTALLATION CONFIG & PRIVILEGES" />
            <Card>
              <SettingRow
                label="Custom Target Path"
                description="Custom target installation folder for Visual Studio tools."
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customVsPath}
                    onChange={(e) => setCustomVsPath(e.target.value)}
                    placeholder="e.g. D:\Applications\VS"
                    className="px-3 py-1.5 text-xs font-mono rounded-md border focus:outline-none focus:border-[var(--color-accent)] transition-all w-64"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <button
                    onClick={handleSelectFolder}
                    className="cursor-pointer flex items-center justify-center px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-all hover:border-[var(--color-accent)] shrink-0"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-[var(--color-accent)]" />
                    Browse
                  </button>
                </div>
              </SettingRow>

              <SettingRow
                label="Windows UAC Elevation"
                description="Modifying Visual Studio components launches vs_installer.exe with administrator privileges."
                last
              >
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="flex items-center gap-2 px-4.5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed rounded-lg shadow-md hover:brightness-110 active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {repairing ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Modifying…
                    </>
                  ) : (
                    <>
                      <Wrench size={13} />
                      Execute Repair
                    </>
                  )}
                </button>
              </SettingRow>
            </Card>
          </div>
        </div>

        {/* Full Width Terminal Drawer */}
        <VsStatusTerminal
          logs={logs}
          onClearLogs={() => setLogs([])}
          isLive={repairing || loading}
        />
      </div>

      {/* Repair Modal Dialog */}
      <RepairWorkloadsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        status={status}
        customVsPath={customVsPath}
        selectedComponentIds={selectedComponentIds}
        repairing={repairing}
        onToggleSelection={toggleComponentSelection}
        onRepairAndInstall={handleRepairAndInstall}
      />
    </PageWrapper>
  )
}

export default VsStatusPage
