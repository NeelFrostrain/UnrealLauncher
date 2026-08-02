// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useCallback } from 'react'
import {
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Cpu,
  Terminal,
  Monitor,
  Zap,
  AlertTriangle,
  CheckCheck
} from 'lucide-react'
import { useToast } from '../components/ui/ToastContext'
import PageWrapper from '../layout/PageWrapper'
import { Card, SectionHeader, SettingRow, Toggle } from '../components/settings/SectionHelpers'
import { Tabs } from '../components/ui/Tabs'
import { RepairWorkloadsDialog } from '../components/vsStatus/RepairWorkloadsDialog'
import { VsStatusTerminal, type LogEntry } from '../components/vsStatus/VsStatusTerminal'
import type { VsSetupStatus } from '../components/vsStatus/vsStatusTypes'

const DEFAULT_INSTALL_PATH = 'D:\\Applications\\VS'

type VsTab = 'overview' | 'components' | 'environment'

const TABS: { id: VsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Monitor size={11} /> },
  { id: 'components', label: 'Components', icon: <Cpu size={11} /> },
  { id: 'environment', label: 'UE Matrix', icon: <Zap size={11} /> }
]

const VsStatusPage = (): React.ReactElement => {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<VsTab>('overview')
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
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 py-3 border-b shrink-0 select-none"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {/* Health badge */}
          {!loading && (
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border"
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
                      backgroundColor: 'color-mix(in srgb, #f59e0b 10%, transparent)',
                      color: '#fbbf24',
                      borderColor: 'color-mix(in srgb, #f59e0b 25%, transparent)'
                    }
              }
            >
              {isHealthy ? (
                <>
                  <CheckCheck size={12} />
                  Ready
                </>
              ) : (
                <>
                  <AlertTriangle size={12} />
                  Action Required
                </>
              )}
            </span>
          )}

          {/* Repair button */}
          <button
            onClick={() => setIsDialogOpen(true)}
            disabled={loading || repairing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)' }}
          >
            <Wrench size={12} />
            {repairing ? 'Repairing…' : 'Repair Workloads'}
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchStatus}
            disabled={loading || repairing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed border"
            style={{
              borderRadius: 'var(--radius)',
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

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden mt-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 pb-4">
          {activeTab === 'overview' && (
            <OverviewContent
              status={status}
              loading={loading}
              customVsPath={customVsPath}
              onCustomVsPathChange={setCustomVsPath}
              onSelectFolder={handleSelectFolder}
            />
          )}
          {activeTab === 'components' && (
            <ComponentsContent
              status={status}
              selectedComponentIds={selectedComponentIds}
              repairing={repairing}
              onToggleSelection={toggleComponentSelection}
              onRepairAndInstall={handleRepairAndInstall}
            />
          )}
          {activeTab === 'environment' && <EnvironmentContent />}
        </div>

        {/* Fixed Bottom Terminal */}
        <VsStatusTerminal
          logs={logs}
          onClearLogs={() => setLogs([])}
          isLive={repairing || loading}
        />
      </div>

      {/* Dialog */}
      <RepairWorkloadsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        status={status}
        selectedComponentIds={selectedComponentIds}
        repairing={repairing}
        onToggleSelection={toggleComponentSelection}
        onRepairAndInstall={handleRepairAndInstall}
      />
    </PageWrapper>
  )
}

/* ─── Overview Tab ─────────────────────────────────────────────────────────── */

function OverviewContent({
  status,
  loading,
  customVsPath,
  onCustomVsPathChange,
  onSelectFolder
}: {
  status: VsSetupStatus | null
  loading: boolean
  customVsPath: string
  onCustomVsPathChange: (v: string) => void
  onSelectFolder: () => void
}): React.ReactElement {
  const isHealthy = status?.isHealthy ?? false
  const installedCount = status?.components.filter((c) => c.installed).length || 0
  const totalCount = status?.components.length || 0

  return (
    <div className="space-y-1 mt-4">
      {/* Status summary card */}
      <SectionHeader label="INSTALLATION STATUS" />
      <Card>
        <SettingRow
          label="Visual Studio C++ Workloads"
          description="MSVC toolset compilers, Windows SDKs, and IDE components required for Unreal Engine."
          last
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
              {installedCount} / {totalCount} Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
              <AlertCircle size={13} />
              {status?.missingComponentIds.length || 0} Missing
            </span>
          )}
        </SettingRow>
      </Card>

      {/* VS Installation path + SDK */}
      <div className="mt-4">
        <SectionHeader label="PATHS & TOOLSETS" />
        <Card>
          <SettingRow
            label="Visual Studio Path"
            description="Detected installation directory for Visual Studio."
          >
            <span
              className="font-mono text-[11px] px-2.5 py-1 rounded-md border max-w-xs truncate"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
              title={status?.vsPath}
            >
              {status?.vsPath || 'Not Found'}
            </span>
          </SettingRow>
          <SettingRow
            label="Windows SDK"
            description="Windows Kits 10/11 SDK headers and libraries."
          >
            <span
              className="font-mono text-[11px] px-2.5 py-1 rounded-md border max-w-xs truncate"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
              title={status?.sdkPath}
            >
              {status?.sdkPath || 'Not Found'}
            </span>
          </SettingRow>
          <SettingRow
            label="MSVC Compiler Toolsets"
            description="Detected MSVC toolset instances under VC\\Tools\\MSVC."
            last
          >
            <span
              className="font-mono text-[11px] px-2.5 py-1 rounded-md border font-bold"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-accent)'
              }}
            >
              {status?.msvcVersions.length || 0} Found
            </span>
          </SettingRow>
        </Card>
      </div>

      {/* MSVC version list */}
      {status?.msvcVersions && status.msvcVersions.length > 0 && (
        <div className="mt-4">
          <SectionHeader label="DETECTED COMPILER INSTANCES" />
          <Card>
            {status.msvcVersions.map((item, i) => (
              <SettingRow
                key={item.version}
                label={`v${item.version}`}
                description={item.path}
                last={i === status.msvcVersions.length - 1}
              >
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--color-engine-version-text) 12%, transparent)',
                    color: 'var(--color-engine-version-text)',
                    borderColor:
                      'color-mix(in srgb, var(--color-engine-version-text) 25%, transparent)'
                  }}
                >
                  x64 Native
                </span>
              </SettingRow>
            ))}
          </Card>
        </div>
      )}

      {/* Target install path */}
      <div className="mt-4">
        <SectionHeader label="TARGET INSTALLATION FOLDER" />
        <Card>
          <SettingRow
            label="Custom Install Path"
            description="Directory where Visual Studio will be installed or repaired."
            last
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customVsPath}
                onChange={(e) => onCustomVsPathChange(e.target.value)}
                placeholder="e.g. D:\Applications\VS"
                className="px-2.5 py-1.5 text-[11px] font-mono rounded-md border focus:outline-none focus:border-[var(--color-accent)] transition-all w-52"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <button
                onClick={onSelectFolder}
                className="cursor-pointer flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium border transition-all hover:border-[var(--color-accent)] shrink-0"
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
        </Card>
      </div>

      {/* UAC notice */}
      <div className="mt-4">
        <SectionHeader label="ELEVATED PRIVILEGES" />
        <Card>
          <SettingRow
            label="Windows UAC Elevation"
            description="Modifying Visual Studio components launches vs_installer.exe or vs_Community.exe with administrative rights."
            last
          >
            <ShieldAlert size={16} className="text-amber-400 shrink-0" />
          </SettingRow>
        </Card>
      </div>
    </div>
  )
}

/* ─── Components Tab ────────────────────────────────────────────────────────── */

function ComponentsContent({
  status,
  selectedComponentIds,
  repairing,
  onToggleSelection,
  onRepairAndInstall
}: {
  status: VsSetupStatus | null
  selectedComponentIds: string[]
  repairing: boolean
  onToggleSelection: (id: string) => void
  onRepairAndInstall: () => void
}): React.ReactElement {
  const installedCount = status?.components.filter((c) => c.installed).length || 0
  const totalCount = status?.components.length || 0

  return (
    <div className="space-y-1 mt-4">
      <SectionHeader label={`WORKLOAD SELECTION — ${installedCount} / ${totalCount} INSTALLED`} />
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
                    className="inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded"
                    style={{
                      backgroundColor:
                        'color-mix(in srgb, var(--color-engine-version-text) 12%, transparent)',
                      color: 'var(--color-engine-version-text)',
                      borderColor:
                        'color-mix(in srgb, var(--color-engine-version-text) 25%, transparent)'
                    }}
                  >
                    <CheckCircle2 size={10} />
                    INSTALLED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    <AlertCircle size={10} />
                    MISSING
                  </span>
                )}
                <Toggle on={isSelected} onChange={() => onToggleSelection(comp.id)} />
              </div>
            </SettingRow>
          )
        })}
      </Card>

      {/* Repair action */}
      <div className="mt-4">
        <SectionHeader label="REPAIR ACTION" />
        <Card>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Install &amp; Repair Selected Components
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {selectedComponentIds.length} component{selectedComponentIds.length !== 1 ? 's' : ''}{' '}
                selected — requires UAC elevation prompt
              </p>
            </div>
            <button
              onClick={onRepairAndInstall}
              disabled={repairing || selectedComponentIds.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shrink-0"
              style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)' }}
            >
              {repairing ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Repairing…
                </>
              ) : (
                <>
                  <Wrench size={12} />
                  Execute Repair
                </>
              )}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ─── Environment (UE Matrix) Tab ───────────────────────────────────────────── */

const UE_MATRIX = [
  {
    range: 'Unreal Engine 4.27 / 5.0–5.2',
    toolset: 'MSVC v142 Toolset (v14.29)',
    id: 'ComponentGroup.VC.Tools.142'
  },
  {
    range: 'Unreal Engine 5.3 / 5.4',
    toolset: 'MSVC v143 Toolset (v14.38)',
    id: 'Component.VC.14.38.17.8',
    badge: null
  },
  {
    range: 'Unreal Engine 5.5 / 5.6+',
    toolset: 'MSVC v143 Latest Toolset',
    id: 'Component.VC.Tools.x86.x64',
    badge: 'LATEST'
  }
]

function EnvironmentContent(): React.ReactElement {
  return (
    <div className="space-y-1 mt-4">
      <SectionHeader label="UNREAL ENGINE VERSION MATRIX" />
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
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase"
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
                className="font-mono text-[10px] px-2 py-1 rounded border font-semibold"
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

      {/* Toolset info */}
      <div className="mt-4">
        <SectionHeader label="TOOLSET REFERENCE" />
        <Card>
          <SettingRow
            label="vswhere.exe"
            description="Visual Studio locator tool used to detect installed instances and component IDs."
            last={false}
          >
            <span
              className="font-mono text-[11px] px-2.5 py-1 rounded-md border"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)'
              }}
            >
              %ProgramFiles(x86)%\...\Installer
            </span>
          </SettingRow>
          <SettingRow
            label="VS Installer Engine"
            description="Bundled vs_Community.exe bootstrapper used for fresh install or modify/repair."
            last
          >
            <Terminal size={14} style={{ color: 'var(--color-accent)' }} />
          </SettingRow>
        </Card>
      </div>
    </div>
  )
}

export default VsStatusPage
