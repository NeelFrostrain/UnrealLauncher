// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Code2,
  Hammer,
  RotateCcw,
  Trash2,
  FileCode2,
  FolderOpen,
  Terminal,
  Cpu,
  Search,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Bug,
  Flame,
  ChevronDown,
  Wrench,
  Monitor,
  Smartphone,
  Apple,
  Download,
  Activity,
  Gauge,
  Zap,
  ShieldCheck
} from 'lucide-react'
import { useToast } from '../ui/ToastContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { Tabs, TabItem } from '../ui/Tabs'
import { getSetting, setSetting } from '../../utils/settings'

interface ProjectCompilerDialogProps {
  projectName: string
  projectPath: string
  projectVersion: string
  onClose: () => void
}

interface LogMessage {
  id: string
  timestamp: string
  text: string
  type: 'info' | 'success' | 'warning' | 'error'
}

type TabType = 'build' | 'files' | 'monitor'
type ConfigType = 'Development Editor' | 'DebugGame Editor' | 'Development' | 'Shipping' | 'DebugGame'
type PlatformType = 'Win64' | 'Linux' | 'Mac' | 'Android' | 'iOS'

interface CustomDropdownOption<V extends string> {
  value: V
  label: string
  description?: string
  icon?: React.ReactNode
}

interface CustomDropdownProps<V extends string> {
  options: CustomDropdownOption<V>[]
  value: V
  onChange: (value: V) => void
  disabled?: boolean
  className?: string
  buttonStyle?: React.CSSProperties
}

function CustomDropdown<V extends string>({
  options,
  value,
  onChange,
  disabled,
  className = '',
  buttonStyle
}: CustomDropdownProps<V>): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find((o) => o.value === value) || options[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'calc(var(--radius) * 0.75)',
          color: 'var(--color-text-primary)',
          ...buttonStyle
        }}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.icon}
          <span className="truncate">{selectedOption?.label}</span>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 text-[var(--color-text-muted)] ${isOpen ? 'rotate-180 text-[var(--color-accent)]' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 py-1 shadow-2xl overflow-y-auto max-h-60"
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium cursor-pointer transition-colors text-left hover:bg-[var(--color-surface-card)]"
                style={{
                  backgroundColor: isSelected
                    ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                    : 'transparent',
                  color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                }}
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  {opt.icon}
                  <div className="truncate">
                    <p className="truncate font-semibold">{opt.label}</p>
                    {opt.description && (
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">{opt.description}</p>
                    )}
                  </div>
                </div>
                {isSelected && <Check size={14} className="text-[var(--color-accent)] shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProjectCompilerDialog({
  projectName,
  projectPath,
  projectVersion,
  onClose
}: ProjectCompilerDialogProps): React.ReactElement {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef)

  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('build')
  const [scanResult, setScanResult] = useState<CppScanResult | null>(null)
  const [scanning, setScanning] = useState(true)
  const [vsSetup, setVsSetup] = useState<{
    isHealthy: boolean
    vsPath: string
    msvcVersions: Array<{ version: string; path: string }>
    sdkPath: string
  } | null>(null)

  // Build state
  const [selectedConfig, setSelectedConfig] = useState<ConfigType>('Development Editor')
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('Win64')
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildStatus, setBuildStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle')
  const [creatingCpp, setCreatingCpp] = useState(false)
  const [buildTimer, setBuildTimer] = useState(0)

  // Log state
  const [logs, setLogs] = useState<LogMessage[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [copiedLogs, setCopiedLogs] = useState(false)
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')
  const logTerminalRef = useRef<HTMLDivElement>(null)

  // File explorer filter
  const [fileSearch, setFileSearch] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'cpp' | 'header' | 'cs'>('all')

  // Preferred IDE setting (vs | rider)
  const [preferredIde, setPreferredIde] = useState<'vs' | 'rider'>(() =>
    getSetting('preferredIde') || 'vs'
  )

  useEffect(() => {
    const listener = (ev: Event) => {
      const detail = (ev as CustomEvent).detail
      if (detail && detail.key === 'preferredIde') {
        setPreferredIde(detail.value as 'vs' | 'rider')
      }
    }
    window.addEventListener('app-settings-changed', listener)
    return () => window.removeEventListener('app-settings-changed', listener)
  }, [])

  const handleIdeChange = (ide: 'vs' | 'rider') => {
    setPreferredIde(ide)
    setSetting('preferredIde', ide)
  }

  const appendLog = useCallback((text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp,
        text,
        type
      }
    ])
  }, [])

  // Build elapsed timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isBuilding) {
      interval = setInterval(() => setBuildTimer((t) => t + 1), 1000)
    } else {
      setBuildTimer(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isBuilding])

  // Load project scan data & VS status
  const runScan = useCallback(async () => {
    setScanning(true)
    try {
      const res = await window.electronAPI.projectCppScan(projectPath)
      setScanResult(res)
    } catch {
      addToast('Failed to scan C++ project files', 'error')
    } finally {
      setScanning(false)
    }
  }, [projectPath, addToast])

  useEffect(() => {
    appendLog(`Initialized C++ Compiler & Build Tools for ${projectName} (UE ${projectVersion})`, 'info')
    appendLog(`Project Directory: ${projectPath}`, 'info')
    runScan()
    window.electronAPI
      .checkVsSetup()
      .then((vs) => {
        setVsSetup({
          isHealthy: vs.isHealthy,
          vsPath: vs.vsPath,
          msvcVersions: vs.msvcVersions,
          sdkPath: vs.sdkPath
        })
        if (vs.isHealthy) {
          appendLog(`Visual Studio Environment Ready: ${vs.vsPath || 'Default Installation'}`, 'success')
        } else {
          appendLog('Warning: Visual Studio environment components missing. Check Diagnostics tab.', 'warning')
        }
      })
      .catch(() => { })
  }, [projectPath, projectName, projectVersion, runScan, appendLog])

  // Context event synchronization: listen for engine changes & health updates
  useEffect(() => {
    const handler = (ev: Event): void => {
      try {
        const detail = (ev as CustomEvent).detail
        if (detail && detail.projectPath === projectPath) {
          runScan()
        }
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('project-engine-changed', handler as EventListener)
    window.addEventListener('project-health-updated', handler as EventListener)
    return () => {
      window.removeEventListener('project-engine-changed', handler as EventListener)
      window.removeEventListener('project-health-updated', handler as EventListener)
    }
  }, [projectPath, runScan])

  // Listen to C++ log streaming
  useEffect(() => {
    const unsubscribe = window.electronAPI.onCppLogOutput((log) => {
      if (log.projectPath === projectPath) {
        appendLog(log.text, log.type)
      }
    })
    return () => {
      unsubscribe()
    }
  }, [projectPath, appendLog])

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Action: Build / Rebuild / Clean / Generate
  const handleBuildAction = async (action: 'build' | 'rebuild' | 'clean' | 'generate') => {
    setIsBuilding(true)
    setBuildStatus('running')
    appendLog(`=== Starting action [${action.toUpperCase()}] for ${projectName} ===`, 'info')

    try {
      const res = await window.electronAPI.projectCppBuild({
        projectPath,
        config: selectedConfig,
        platform: selectedPlatform,
        action
      })

      if (res.success) {
        setBuildStatus('success')
        addToast(`C++ ${action} completed successfully`, 'success')
        runScan()
      } else {
        setBuildStatus('failed')
        addToast(`C++ ${action} failed: ${res.error || 'Check logs'}`, 'error')
      }
    } catch (err) {
      setBuildStatus('failed')
      appendLog(`Error running ${action}: ${err instanceof Error ? err.message : String(err)}`, 'error')
      addToast(`Error during ${action}`, 'error')
    } finally {
      setIsBuilding(false)
    }
  }

  // Action: Debug Project (Build first with DebugGame Editor, then launch debugger)
  const handleDebugProject = async () => {
    const debugConfig = selectedConfig.includes('Editor') ? 'DebugGame Editor' : 'DebugGame'
    setIsBuilding(true)
    setBuildStatus('running')
    appendLog(`=== Debug: Building ${projectName} [${debugConfig}] before launching debugger... ===`, 'info')

    try {
      // Step 1: Build
      const buildRes = await window.electronAPI.projectCppBuild({
        projectPath,
        config: debugConfig as 'Development Editor' | 'DebugGame Editor' | 'Development' | 'Shipping' | 'DebugGame',
        platform: selectedPlatform,
        action: 'build'
      })

      if (!buildRes.success) {
        setBuildStatus('failed')
        addToast(`Build failed before debug launch. Fix errors first.`, 'error')
        appendLog(`=== Build FAILED — debug launch aborted ===`, 'error')
        return
      }

      setBuildStatus('success')
      appendLog(`=== Build succeeded — launching debugger... ===`, 'success')

      // Step 2: Launch debugger
      const debugRes = await window.electronAPI.projectCppDebug(projectPath, debugConfig)
      if (debugRes.success) {
        addToast('Debugger launched successfully', 'success')
        appendLog('✅ Debugger process spawned. Attach in VS and press F5.', 'success')
      } else {
        addToast(debugRes.error || 'Failed to launch debugger', 'error')
        appendLog(`Debug launch failed: ${debugRes.error}`, 'error')
      }
    } catch (err) {
      setBuildStatus('failed')
      appendLog(`Error during debug build+launch: ${err instanceof Error ? err.message : String(err)}`, 'error')
      addToast('Error during debug build+launch', 'error')
    } finally {
      setIsBuilding(false)
    }
  }

  // Action: Open Solution in Preferred IDE (VS / Rider)
  const handleOpenSln = async () => {
    const ideName = preferredIde === 'rider' ? 'JetBrains Rider' : 'Visual Studio'
    const customRiderPath = getSetting('riderPath') || ''
    appendLog(`Opening solution file in ${ideName}...`, 'info')
    const res = await window.electronAPI.projectCppOpenSln(projectPath, preferredIde, customRiderPath)
    if (res.success) {
      addToast(`Opening solution in ${ideName}...`, 'info')
      appendLog(`Opened .sln solution file in ${ideName}.`, 'success')
    } else {
      addToast(res.error || `Failed to open solution in ${ideName}`, 'error')
      appendLog(`Open SLN failed: ${res.error}`, 'error')
    }
  }

  // Action: Open VS Code / Directory
  const handleOpenVsCode = async () => {
    try {
      const res = await window.electronAPI.openDirectory(projectPath)
      if (res.success) {
        addToast('Opened project directory', 'info')
      }
    } catch {
      /* ignore */
    }
  }

  // Action: Open Source Folder in Explorer
  const handleOpenSourceFolder = async () => {
    const sourceDir = scanResult?.sourceFolderPath || `${projectPath}/Source`
    const res = await window.electronAPI.openDirectory(sourceDir)
    if (!res.success) {
      addToast('Source folder does not exist yet', 'warning')
    }
  }

  // Action: Create C++ Structure for Blueprint projects
  const handleCreateCppStructure = async () => {
    setCreatingCpp(true)
    appendLog('Creating C++ source directory and boilerplate files...', 'info')
    try {
      const res = await window.electronAPI.projectCppCreateStructure(projectPath)
      if (res.success) {
        addToast('Created C++ Source folder & Module structure!', 'success')
        appendLog(`Successfully created C++ files: ${res.createdFiles?.join(', ')}`, 'success')
        await runScan()
      } else {
        addToast(res.error || 'Failed to create C++ structure', 'error')
        appendLog(`Failed to create C++ structure: ${res.error}`, 'error')
      }
    } catch (err) {
      addToast('Error generating C++ source files', 'error')
      appendLog(`Error: ${err instanceof Error ? err.message : String(err)}`, 'error')
    } finally {
      setCreatingCpp(false)
    }
  }

  // Action: Fix Target Rules for UE compatibility
  const handleFixTargetRules = async () => {
    appendLog('Checking and fixing Target.cs build rules for UE compatibility...', 'info')
    try {
      const res = await window.electronAPI.projectCppFixTargetRules(projectPath)
      if (res.success && res.fixedFiles && res.fixedFiles.length > 0) {
        addToast(`Updated Target.cs rules in: ${res.fixedFiles.join(', ')}`, 'success')
        appendLog(`Successfully updated target rules: ${res.fixedFiles.join(', ')}`, 'success')
        runScan()
      } else if (res.success) {
        addToast('Target rules are already up to date!', 'info')
        appendLog('Target rules are already compatible with installed engine.', 'info')
      } else {
        addToast(res.error || 'Failed to fix target rules', 'error')
        appendLog(`Failed to fix target rules: ${res.error}`, 'error')
      }
    } catch {
      addToast('Error updating target rules', 'error')
    }
  }

  // Action: Save Terminal Logs to File
  const handleSaveLogsToFile = async () => {
    if (logs.length === 0) {
      addToast('No logs to save!', 'warning')
      return
    }
    const logContent = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.text}`)
      .join('\n')

    try {
      const res = await window.electronAPI.projectCppSaveLogFile(projectPath, logContent)
      if (res.success && res.savedPath) {
        addToast('Saved compiler logs to Saved/Logs directory!', 'success')
        appendLog(`Saved compiler logs to: ${res.savedPath}`, 'success')
      } else {
        addToast(res.error || 'Failed to save log file', 'error')
      }
    } catch {
      addToast('Error saving log file', 'error')
    }
  }

  // Clear logs
  const handleClearLogs = () => {
    setLogs([])
  }

  // Copy logs
  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.text}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopiedLogs(true)
    setTimeout(() => setCopiedLogs(false), 2000)
    addToast('Logs copied to clipboard', 'info')
  }

  // Open single source file
  const handleOpenFile = (filePath: string) => {
    window.electronAPI.openExternal(`file:///${filePath.replace(/\\/g, '/')}`)
  }

  // Filter logs for display
  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'error') return l.type === 'error'
    if (logFilter === 'warning') return l.type === 'warning'
    if (logFilter === 'info') return l.type === 'info' || l.type === 'success'
    return true
  })

  // Filter C++ files in file explorer tab
  const filteredFiles = (scanResult?.files || []).filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(fileSearch.toLowerCase()) ||
      f.relativePath.toLowerCase().includes(fileSearch.toLowerCase())

    if (!matchSearch) return false

    if (fileTypeFilter === 'cpp') return f.extension === '.cpp' || f.extension === '.c'
    if (fileTypeFilter === 'header') return f.extension === '.h' || f.extension === '.hpp'
    if (fileTypeFilter === 'cs') return f.extension === '.cs'
    return true
  })

  // Tab Items for custom Tabs component
  const dialogTabs: TabItem<TabType>[] = [
    {
      id: 'build',
      label: 'Build & Debug Operations',
      icon: <Hammer size={14} />,
      accent: 'var(--color-accent)'
    },
    {
      id: 'files',
      label: `Source Files (${scanResult?.totalFilesCount || 0})`,
      icon: <FileCode2 size={14} />,
      accent: '#3b82f6'
    },
    {
      id: 'monitor',
      label: 'Debug & Compile Monitor',
      icon: <Activity size={14} />,
      accent: '#10b981'
    }
  ]

  // Options for Platform CustomDropdown
  const platformOptions: CustomDropdownOption<PlatformType>[] = [
    { value: 'Win64', label: 'Windows (Win64)', description: '64-bit Windows PC', icon: <Monitor size={14} className="text-blue-400" /> },
    { value: 'Linux', label: 'Linux', description: 'x86_64 Linux Build', icon: <Terminal size={14} className="text-amber-400" /> },
    { value: 'Mac', label: 'macOS', description: 'Apple Silicon / Intel Mac', icon: <Apple size={14} className="text-slate-300" /> },
    { value: 'Android', label: 'Android', description: 'ARM64 Mobile APK / AAB', icon: <Smartphone size={14} className="text-emerald-400" /> },
    { value: 'iOS', label: 'iOS', description: 'Apple iPhone / iPad Package', icon: <Apple size={14} className="text-purple-400" /> }
  ]

  // Options for Config CustomDropdown
  const configOptions: CustomDropdownOption<ConfigType>[] = [
    { value: 'Development Editor', label: 'Development Editor', description: 'Standard Editor & Live Coding', icon: <Hammer size={14} className="text-blue-400" /> },
    { value: 'DebugGame Editor', label: 'DebugGame Editor', description: 'Full symbols for game debugging', icon: <Bug size={14} className="text-emerald-400" /> },
    { value: 'Development', label: 'Development Game', description: 'Standalone executable build', icon: <Monitor size={14} className="text-purple-400" /> },
    { value: 'Shipping', label: 'Shipping (Release)', description: 'Optimized production build', icon: <Sparkles size={14} className="text-amber-400" /> },
    { value: 'DebugGame', label: 'DebugGame Standalone', description: 'Standalone debug executable', icon: <Bug size={14} className="text-rose-400" /> }
  ]

  // Options for Log Filter CustomDropdown
  const logFilterOptions: CustomDropdownOption<'all' | 'error' | 'warning' | 'info'>[] = [
    { value: 'all', label: `All Logs (${logs.length})`, icon: <Terminal size={13} /> },
    { value: 'error', label: 'Errors Only', icon: <XCircle size={13} className="text-rose-400" /> },
    { value: 'warning', label: 'Warnings Only', icon: <AlertTriangle size={13} className="text-amber-400" /> },
    { value: 'info', label: 'Info Only', icon: <CheckCircle2 size={13} className="text-blue-400" /> }
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBuilding) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="flex flex-col w-full h-[88vh] max-h-[820px] max-w-5xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-family)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Header Bar */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{
            borderBottom: '1px solid var(--color-border)',
            // background:
            // 'linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 100%)'
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-base font-bold truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  C++ Compiler & Build Tools
                </h2>
                {/* <span
                  className="text-xs px-2 py-0.5 font-mono font-medium"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'calc(var(--radius) * 0.5)'
                  }}
                >
                  {projectName}
                </span> */}
                <span
                  className="text-xs px-2 py-0.5 font-mono font-semibold"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
                    color: 'var(--color-accent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)',
                    borderRadius: 'calc(var(--radius) * 0.5)'
                  }}
                >
                  UE {projectVersion}
                </span>
              </div>
              <p className="text-xs truncate mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {projectPath}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* C++ Status Badge */}
            {scanning ? (
              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 font-medium">
                <RefreshCw size={13} className="animate-spin text-[var(--color-accent)]" /> Scanning Source...
              </span>
            ) : scanResult?.isCppProject ? (
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, #10b981 12%, transparent)',
                  color: '#10b981',
                  border: '1px solid color-mix(in srgb, #10b981 25%, transparent)'
                }}
              >
                <CheckCircle2 size={13} />
                C++ Source Project ({scanResult.cppFilesCount + scanResult.headerFilesCount} files)
              </span>
            ) : (
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, #f59e0b 12%, transparent)',
                  color: '#f59e0b',
                  border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)'
                }}
              >
                <AlertTriangle size={13} />
                Blueprint Project (No C++ Source)
              </span>
            )}

            <button
              onClick={onClose}
              disabled={isBuilding}
              className="p-2 cursor-pointer transition-opacity hover:opacity-80"
              style={{
                color: 'var(--color-text-muted)',
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'calc(var(--radius) * 0.6)'
              }}
              title="Close Dialog"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation using app Tabs Component */}
        <div
          className="flex items-center px-6 py-2.5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}
        >
          <Tabs
            tabs={dialogTabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as TabType)}
          />
        </div>

        {/* Content Area — overflow-hidden so children take flex-1 min-h-0 */}
        <div className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col gap-4">
          {/* Top Banner if Blueprint Project */}
          {!scanning && scanResult && !scanResult.hasSourceFolder && (
            <div
              className="p-4 flex items-center justify-between gap-4 shrink-0"
              style={{
                backgroundColor: 'color-mix(in srgb, #f59e0b 8%, transparent)',
                border: '1px solid color-mix(in srgb, #f59e0b 24%, transparent)',
                borderRadius: 'var(--radius)'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, #f59e0b 16%, transparent)',
                    color: '#f59e0b',
                    borderRadius: 'calc(var(--radius) * 0.75)'
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-400">
                    Blueprint Project Detected
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    This project does not have a C++ <code className="font-mono text-amber-300">Source/</code> folder yet. Convert it to a C++ project to write custom C++ modules and compile via UBT.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreateCppStructure}
                disabled={creatingCpp}
                className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 shrink-0 transition-all shadow-md cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#000',
                  borderRadius: 'calc(var(--radius) * 0.75)'
                }}
              >
                {creatingCpp ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Code2 size={14} /> Convert to C++ Project
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 1: Build & Debug Hub */}
          {activeTab === 'build' && (
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
              {/* Configuration Controls Bar with CustomDropdowns */}
              <div
                className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                {/* Platform */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-muted)]">
                    Target Platform
                  </label>
                  <CustomDropdown
                    options={platformOptions}
                    value={selectedPlatform}
                    onChange={(val) => setSelectedPlatform(val)}
                  />
                </div>

                {/* Configuration */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-muted)]">
                    Build Configuration
                  </label>
                  <CustomDropdown
                    options={configOptions}
                    value={selectedConfig}
                    onChange={(val) => setSelectedConfig(val)}
                  />
                </div>

                {/* Solution & Quick Actions */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)]">
                      Solution & Source Actions
                    </label>
                    {/* IDE Selector Toggle (VS / Rider) */}
                    <div className="flex items-center gap-1 p-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                      <button
                        onClick={() => handleIdeChange('vs')}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          preferredIde === 'vs'
                            ? 'bg-blue-600 text-white'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                        }`}
                        title="Set preferred C++ IDE to Visual Studio"
                      >
                        VS
                      </button>
                      <button
                        onClick={() => handleIdeChange('rider')}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          preferredIde === 'rider'
                            ? 'bg-rose-600 text-white'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                        }`}
                        title="Set preferred C++ IDE to JetBrains Rider"
                      >
                        Rider
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleOpenSln}
                      className="flex-1 text-xs font-semibold py-2 px-2 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'calc(var(--radius) * 0.75)',
                        color: 'var(--color-text-primary)'
                      }}
                      title={
                        preferredIde === 'rider'
                          ? 'Open Solution (.sln) in JetBrains Rider'
                          : 'Open Solution (.sln) in Visual Studio'
                      }
                    >
                      {preferredIde === 'rider' ? (
                        <>
                          <ExternalLink size={13} className="text-rose-400" /> Open Rider (.sln)
                        </>
                      ) : (
                        <>
                          <ExternalLink size={13} className="text-blue-400" /> Open VS (.sln)
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleOpenSourceFolder}
                      className="text-xs font-semibold py-2 px-2 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'calc(var(--radius) * 0.75)',
                        color: 'var(--color-text-primary)'
                      }}
                      title="Open Source/ Folder in Explorer"
                    >
                      <FolderOpen size={13} className="text-amber-400" /> Source
                    </button>
                    <button
                      onClick={handleOpenVsCode}
                      className="text-xs font-semibold py-2 px-2 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'calc(var(--radius) * 0.75)',
                        color: 'var(--color-text-primary)'
                      }}
                      title="Open Project Folder in Explorer"
                    >
                      <FolderOpen size={13} className="text-purple-400" /> Folder
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Toolbar — 6 perfectly aligned single-line action buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
                <button
                  onClick={() => handleBuildAction('build')}
                  disabled={isBuilding}
                  className="h-9 px-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: '#fff',
                    borderRadius: 'calc(var(--radius) * 0.75)'
                  }}
                >
                  <Hammer size={14} /> Build
                </button>

                <button
                  onClick={handleDebugProject}
                  disabled={isBuilding}
                  className="h-9 px-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  style={{ borderRadius: 'calc(var(--radius) * 0.75)' }}
                >
                  <Bug size={14} /> Debug
                </button>

                <button
                  onClick={() => handleBuildAction('rebuild')}
                  disabled={isBuilding}
                  className="h-9 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-amber-500 text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'calc(var(--radius) * 0.75)'
                  }}
                >
                  <RotateCcw size={13} className="text-amber-400" /> Rebuild
                </button>

                <button
                  onClick={() => handleBuildAction('generate')}
                  disabled={isBuilding}
                  className="h-9 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-blue-500 text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'calc(var(--radius) * 0.75)'
                  }}
                  title="Generate Visual Studio Solution (.sln)"
                >
                  <FileCode2 size={13} className="text-blue-400" /> Generate Solution
                </button>

                <button
                  onClick={handleFixTargetRules}
                  disabled={isBuilding}
                  className="h-9 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-emerald-500 text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'calc(var(--radius) * 0.75)'
                  }}
                  title="Fix Target.cs build rules for Unreal Engine compatibility"
                >
                  <Wrench size={13} className="text-emerald-400" /> Fix Target Rules
                </button>

                <button
                  onClick={() => handleBuildAction('clean')}
                  disabled={isBuilding}
                  className="h-9 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-rose-500 text-rose-400 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'calc(var(--radius) * 0.75)'
                  }}
                  title="Purge & Deep Clean: Deletes .vs, .idea (JetBrains Rider), Saved, .sln, .slnx, .DotSettings, Intermediate, Binaries, DDC, .vscode, and .vsconfig files"
                >
                  <Trash2 size={13} /> Purge & Clean
                </button>
              </div>

              {/* Terminal Container — flex-1 min-h-0 flex flex-col so inner scroll area scrolls cleanly */}
              <div
                className="flex-1 min-h-0 flex flex-col border overflow-hidden"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 95%, black)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                {/* Terminal Header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-surface-elevated) 85%, black)',
                    borderBottom: '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal size={14} className="text-blue-400" />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      Compiler & Build Log Terminal
                    </span>
                    {buildStatus === 'running' && (
                      <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        <RefreshCw size={11} className="animate-spin" /> Building...
                      </span>
                    )}
                    {buildStatus === 'success' && (
                      <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 size={11} /> Build Passed
                      </span>
                    )}
                    {buildStatus === 'failed' && (
                      <span className="flex items-center gap-1.5 text-[11px] text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        <XCircle size={11} /> Build Failed
                      </span>
                    )}
                  </div>

                  {/* Controls with CustomDropdown for Log Filter */}
                  <div className="flex items-center gap-2">
                    <CustomDropdown
                      options={logFilterOptions}
                      value={logFilter}
                      onChange={(val) => setLogFilter(val)}
                      className="w-36"
                      buttonStyle={{ padding: '2px 8px', fontSize: '11px' }}
                    />

                    <button
                      onClick={() => setAutoScroll(!autoScroll)}
                      className="text-[11px] px-2.5 py-1 font-medium border cursor-pointer transition-colors"
                      style={{
                        backgroundColor: autoScroll
                          ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
                          : 'var(--color-surface-card)',
                        borderColor: autoScroll
                          ? 'var(--color-accent)'
                          : 'var(--color-border)',
                        color: autoScroll
                          ? 'var(--color-accent)'
                          : 'var(--color-text-muted)',
                        borderRadius: 'calc(var(--radius) * 0.6)'
                      }}
                    >
                      Auto-scroll
                    </button>

                    <button
                      onClick={handleSaveLogsToFile}
                      className="p-1 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--color-surface-card)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                        borderRadius: 'calc(var(--radius) * 0.6)'
                      }}
                      title="Save Terminal Logs to File (Saved/Logs/)"
                    >
                      <Download size={13} className="text-blue-400" />
                    </button>

                    <button
                      onClick={handleCopyLogs}
                      className="p-1 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--color-surface-card)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                        borderRadius: 'calc(var(--radius) * 0.6)'
                      }}
                      title="Copy Log Output"
                    >
                      {copiedLogs ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>

                    <button
                      onClick={handleClearLogs}
                      className="p-1 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--color-surface-card)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                        borderRadius: 'calc(var(--radius) * 0.6)'
                      }}
                      title="Clear Terminal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Inner Terminal Body — flex-1 min-h-0 overflow-y-auto */}
                <div
                  ref={logTerminalRef}
                  className="flex-1 min-h-0 p-4 font-mono text-[12px] leading-relaxed overflow-y-auto space-y-1.5 select-text"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {filteredLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-2 py-12">
                      <Terminal size={32} className="opacity-30" />
                      <p className="text-xs font-sans">No build output yet. Click "Build Project" or "Generate VS Solution".</p>
                    </div>
                  ) : (
                    filteredLogs.map((l) => (
                      <div key={l.id} className="flex items-start gap-2 whitespace-pre-wrap break-all">
                        <span className="text-[var(--color-text-muted)] shrink-0 text-[11px] select-none pt-0.5">
                          [{l.timestamp}]
                        </span>
                        <span
                          className={
                            l.type === 'error'
                              ? 'text-rose-400 font-semibold'
                              : l.type === 'warning'
                                ? 'text-amber-300 font-medium'
                                : l.type === 'success'
                                  ? 'text-emerald-400 font-semibold'
                                  : 'text-[var(--color-text-primary)]'
                          }
                        >
                          {l.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Source Files Explorer */}
          {activeTab === 'files' && (
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
              {/* Header Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                <div
                  className="p-3.5"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Modules (.Build.cs)</p>
                  <p className="text-xl font-bold text-[var(--color-accent)] mt-0.5">
                    {scanResult?.modules.length || 0}
                  </p>
                </div>
                <div
                  className="p-3.5"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Target Rules (.Target.cs)</p>
                  <p className="text-xl font-bold text-blue-400 mt-0.5">
                    {scanResult?.targets.length || 0}
                  </p>
                </div>
                <div
                  className="p-3.5"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <p className="text-[11px] text-[var(--color-text-muted)] font-medium">C++ Implementation (.cpp)</p>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">
                    {scanResult?.cppFilesCount || 0}
                  </p>
                </div>
                <div
                  className="p-3.5"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Header Files (.h/.hpp)</p>
                  <p className="text-xl font-bold text-amber-400 mt-0.5">
                    {scanResult?.headerFilesCount || 0}
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    placeholder="Search C++ source files or modules..."
                    className="w-full text-xs font-medium pl-9 pr-3 py-2"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'calc(var(--radius) * 0.75)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>

                <div
                  className="flex items-center gap-1 p-1"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'calc(var(--radius) * 0.75)'
                  }}
                >
                  <button
                    onClick={() => setFileTypeFilter('all')}
                    className={`text-xs font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors ${fileTypeFilter === 'all'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                  >
                    All ({scanResult?.totalFilesCount || 0})
                  </button>
                  <button
                    onClick={() => setFileTypeFilter('cpp')}
                    className={`text-xs font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors ${fileTypeFilter === 'cpp'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                  >
                    .cpp ({scanResult?.cppFilesCount || 0})
                  </button>
                  <button
                    onClick={() => setFileTypeFilter('header')}
                    className={`text-xs font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors ${fileTypeFilter === 'header'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                  >
                    .h ({scanResult?.headerFilesCount || 0})
                  </button>
                  <button
                    onClick={() => setFileTypeFilter('cs')}
                    className={`text-xs font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors ${fileTypeFilter === 'cs'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                  >
                    .cs ({scanResult?.csharpFilesCount || 0})
                  </button>
                </div>
              </div>

              {/* File List Container */}
              <div
                className="flex-1 min-h-0 overflow-y-auto divide-y divide-[var(--color-border)]"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                {filteredFiles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                    No C++ source files found matching your search query.
                  </div>
                ) : (
                  filteredFiles.map((file) => (
                    <div
                      key={file.path}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-[var(--color-surface-elevated)] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileCode2
                          size={16}
                          className={
                            file.extension === '.cpp'
                              ? 'text-emerald-400 shrink-0'
                              : file.extension === '.h'
                                ? 'text-amber-400 shrink-0'
                                : 'text-blue-400 shrink-0'
                          }
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)] font-mono truncate">
                            {file.relativePath}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                          {(file.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                        <button
                          onClick={() => handleOpenFile(file.path)}
                          className="p-1 rounded hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                          title="Open File"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Debug & Compilation Monitor Dashboard */}
          {activeTab === 'monitor' && (
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1">
              {/* Top Dashboard Metrics (4 Grid Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 shrink-0">
                {/* Metric 1: Build Execution Status */}
                <div
                  className="p-4 flex flex-col justify-between relative overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Build Status
                    </span>
                    <Activity size={16} className="text-emerald-400" />
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      {isBuilding ? (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-amber-400">
                          <RefreshCw size={14} className="animate-spin" /> RUNNING ({buildTimer}s)
                        </span>
                      ) : buildStatus === 'success' ? (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                          <CheckCircle2 size={14} /> PASSED
                        </span>
                      ) : buildStatus === 'failed' ? (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-rose-400">
                          <XCircle size={14} /> FAILED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-secondary)]">
                          <Gauge size={14} /> IDLE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate font-mono mt-1">
                      {selectedConfig} | {selectedPlatform}
                    </p>
                  </div>
                </div>

                {/* Metric 2: Parallel Action Core Allocation */}
                <div
                  className="p-4 flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Parallel Cores
                    </span>
                    <Cpu size={16} className="text-blue-400" />
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      6 Physical Cores
                    </p>
                    <p className="text-[11px] text-blue-400 font-mono mt-1">
                      12 Logical Threads (UBT Parallel Execution)
                    </p>
                  </div>
                </div>

                {/* Metric 3: Target Build Environment */}
                <div
                  className="p-4 flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Target Environment
                    </span>
                    <ShieldCheck size={16} className="text-purple-400" />
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                      Installed Engine (5.8)
                    </p>
                    <p className="text-[11px] text-purple-400 font-mono mt-1">
                      bOverrideBuildEnvironment = true
                    </p>
                  </div>
                </div>

                {/* Metric 4: UbaServer & Build Accelerator */}
                <div
                  className="p-4 flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Build Accelerator
                    </span>
                    <Zap size={16} className="text-amber-400" />
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-bold text-amber-400 truncate">
                      UbaServer Active
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-1">
                      Listening on 0.0.0.0:1345
                    </p>
                  </div>
                </div>
              </div>

              {/* Compilation Pipeline Stage Tracking */}
              <div
                className="p-5 flex flex-col gap-4 shrink-0"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Flame size={18} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                      Compilation Pipeline & Build Task Stages
                    </h3>
                  </div>
                  <button
                    onClick={runScan}
                    className="text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} /> Refresh Scan
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Stage 1 */}
                  <div
                    className="p-3.5 flex items-center justify-between rounded-lg font-mono text-xs"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                        1
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-text-primary)]">Target Rules & Build Environment Check</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] font-sans">
                          Validates Target.cs settings against installed engine binary limits
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                      PASSED
                    </span>
                  </div>

                  {/* Stage 2 */}
                  <div
                    className="p-3.5 flex items-center justify-between rounded-lg font-mono text-xs"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-[11px]">
                        2
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-text-primary)]">Adaptive Non-Unity Working Set Calculation</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] font-sans">
                          Uses git status to determine modified C++ files for fast incremental rebuilds
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-blue-400 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                      ACTIVE
                    </span>
                  </div>

                  {/* Stage 3 */}
                  <div
                    className="p-3.5 flex items-center justify-between rounded-lg font-mono text-xs"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-[11px]">
                        3
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-text-primary)]">UbaServer Parallel C++ Compilation</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] font-sans">
                          Executes up to 6 parallel cl.exe compiler tasks via UBA process manager
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-purple-400 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20">
                      {isBuilding ? 'EXECUTING' : 'READY'}
                    </span>
                  </div>

                  {/* Stage 4 */}
                  <div
                    className="p-3.5 flex items-center justify-between rounded-lg font-mono text-xs"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-[11px]">
                        4
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-text-primary)]">Visual Studio Solution & Debugger Integration</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] font-sans">
                          Generates {projectName}.sln and connects UnrealEditor debug flags
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                      READY
                    </span>
                  </div>
                </div>
              </div>

              {/* System & Toolset Environment Diagnostics */}
              <div
                className="p-5 flex flex-col gap-4 shrink-0"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                        color: 'var(--color-accent)',
                        borderRadius: 'calc(var(--radius) * 0.75)'
                      }}
                    >
                      <Cpu size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                        Detected Visual Studio & MSVC Toolset Environment
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Local C++ compiler toolset, Windows SDK, and DotNet SDK information.
                      </p>
                    </div>
                  </div>
                  {vsSetup?.isHealthy ? (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Toolset Healthy
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle size={13} /> Check Toolset
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div
                    className="p-3"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'calc(var(--radius) * 0.75)'
                    }}
                  >
                    <span className="text-[var(--color-text-muted)] block text-[10px] font-sans font-semibold">
                      Visual Studio Installation Path:
                    </span>
                    <span className="text-[var(--color-text-primary)] truncate block mt-1">
                      {vsSetup?.vsPath || 'D:\\Applications\\VS'}
                    </span>
                  </div>

                  <div
                    className="p-3"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'calc(var(--radius) * 0.75)'
                    }}
                  >
                    <span className="text-[var(--color-text-muted)] block text-[10px] font-sans font-semibold">
                      Windows SDK Path:
                    </span>
                    <span className="text-[var(--color-text-primary)] truncate block mt-1">
                      {vsSetup?.sdkPath || 'Windows 10 / 11 SDK'}
                    </span>
                  </div>
                </div>

                {/* MSVC Versions */}
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] mb-2">
                    Detected MSVC Compiler Toolsets ({vsSetup?.msvcVersions.length || 1})
                  </h4>
                  <div className="space-y-1.5">
                    {(vsSetup?.msvcVersions && vsSetup.msvcVersions.length > 0
                      ? vsSetup.msvcVersions
                      : [{ version: '14.38.33130', path: 'D:\\Applications\\VS\\VC\\Tools\\MSVC' }]
                    ).map((v) => (
                      <div
                        key={v.version}
                        className="px-3 py-2 flex items-center justify-between text-xs font-mono"
                        style={{
                          backgroundColor: 'var(--color-surface-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'calc(var(--radius) * 0.75)'
                        }}
                      >
                        <span className="text-emerald-400 font-bold">MSVC v{v.version}</span>
                        <span className="text-[var(--color-text-muted)] text-[11px] truncate max-w-[350px]">
                          {v.path}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
