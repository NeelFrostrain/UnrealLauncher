// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Info,
  ShieldAlert
} from 'lucide-react'
import { useToast } from '../ui/ToastContext'

interface ProjectHealthDialogProps {
  projectName: string
  projectPath: string
  onClose: () => void
}

export default function ProjectHealthDialog({
  projectName,
  projectPath,
  onClose
}: ProjectHealthDialogProps): React.ReactElement {
  const [report, setReport] = useState<HealthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const { addToast } = useToast()

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.projectCheckHealth(projectPath)
      setReport(res)
      try {
        window.dispatchEvent(new CustomEvent('project-health-updated', { detail: { projectPath } }))
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to run health analysis', 'error')
    } finally {
      setLoading(false)
    }
  }, [projectPath, addToast])

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  const handleClean = useCallback(async () => {
    setCleaning(true)
    try {
      const r = await window.electronAPI.projectCleanIntermediate(projectPath)
      if (r.cleaned.length > 0) {
        addToast(`Cleaned ${r.cleaned.length} item(s)`, 'success')
      } else {
        addToast('Nothing to clean', 'info')
      }
      // Re-run analysis to show fresh sizes and updated score
      await runAnalysis()
    } catch {
      addToast('Failed to clean project directories', 'error')
    } finally {
      setCleaning(false)
    }
  }, [projectPath, addToast, runAnalysis])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Determine status styles
  const getStatusDetails = (status: 'healthy' | 'warning' | 'critical' | undefined) => {
    switch (status) {
      case 'healthy':
        return {
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          label: 'Healthy',
          icon: <CheckCircle className="text-emerald-500" size={20} />
        }
      case 'warning':
        return {
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
          label: 'Warning',
          icon: <AlertTriangle className="text-amber-500" size={20} />
        }
      case 'critical':
      default:
        return {
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          label: 'Critical',
          icon: <ShieldAlert className="text-rose-500" size={20} />
        }
    }
  }

  const statusStyle = getStatusDetails(report?.status)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.15s ease',
        fontFamily: 'var(--font-family)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.03)',
          maxHeight: '85vh',
          fontFamily: 'var(--font-family)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Project Health Report
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {projectName} — {projectPath}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw
                className="animate-spin text-accent"
                size={32}
                style={{ color: 'var(--color-accent)' }}
              />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Analyzing project directories and files...
              </p>
            </div>
          ) : report ? (
            <>
              {/* Score Dashboard */}
              <div
                className="flex items-center gap-6 p-6"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {/* Gauge */}
                <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="transparent"
                      stroke="var(--color-border)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="transparent"
                      stroke={statusStyle.color}
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - report.score / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span
                      className="text-2xl font-black"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {report.score}
                    </span>
                    <span
                      className="text-[10px] uppercase font-bold"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Score
                    </span>
                  </div>
                </div>

                {/* Score Status info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {statusStyle.icon}
                    <h3 className="text-base font-extrabold" style={{ color: statusStyle.color }}>
                      Project Status: {statusStyle.label}
                    </h3>
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-text-secondary)', lineHeight: '1.4' }}
                  >
                    {report.score === 100
                      ? 'No issues detected! Your project structure is completely aligned with standard configurations and storage guidelines.'
                      : report.score >= 90
                        ? 'Your project is in good health with only minor optimization recommendations.'
                        : report.score >= 60
                          ? 'We detected some warnings. Review the recommendations below to restore configuration files or manage storage bloat.'
                          : 'Critical issues detected. These issues may prevent compilation, engine loading, or cause packaging failure.'}
                  </p>
                </div>
              </div>

              {/* Cache/Folder Sizes & Clean Action */}
              <div
                className="p-4 flex items-center justify-between gap-4 flex-wrap"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center gap-6">
                  <div>
                    <span
                      className="block text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Intermediate Directory
                    </span>
                    <span
                      className="text-sm font-mono font-semibold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {formatBytes(report.intermediateSize)}
                    </span>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--color-border)', height: '24px' }} />
                  <div>
                    <span
                      className="block text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Saved Directory
                    </span>
                    <span
                      className="text-sm font-mono font-semibold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {formatBytes(report.savedSize)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleClean}
                  disabled={cleaning || (report.intermediateSize === 0 && report.savedSize === 0)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors"
                  style={{
                    backgroundColor: 'color-mix(in srgb, #f87171 12%, transparent)',
                    color: '#f87171',
                    border: '1px solid color-mix(in srgb, #f87171 25%, transparent)',
                    borderRadius: 'var(--radius)'
                  }}
                  title="Wipes generated folders (Binaries, Build, Intermediate, Saved)"
                >
                  <Trash2 size={13} className={cleaning ? 'animate-pulse' : ''} />
                  {cleaning ? 'Cleaning...' : 'Clean Generated Files'}
                </button>
              </div>

              {/* Detailed checks / issues */}
              <div className="space-y-3">
                <h4
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Analysis &amp; Warnings ({report.issues.length})
                </h4>

                {report.issues.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#10b981' }}>
                        All structural checks passed
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Essential configuration, directories, and dependencies are intact.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {report.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3.5 p-4 rounded-lg border transition-all"
                        style={{
                          backgroundColor: 'var(--color-surface-elevated)',
                          borderColor:
                            issue.type === 'critical'
                              ? 'rgba(239, 68, 68, 0.25)'
                              : issue.type === 'warning'
                                ? 'rgba(245, 158, 11, 0.25)'
                                : 'var(--color-border)'
                        }}
                      >
                        {issue.type === 'critical' ? (
                          <XCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                        ) : issue.type === 'warning' ? (
                          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        ) : (
                          <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
                        )}
                        <div className="min-w-0">
                          <p
                            className="text-xs font-bold"
                            style={{
                              color:
                                issue.type === 'critical'
                                  ? '#ef4444'
                                  : issue.type === 'warning'
                                    ? '#f59e0b'
                                    : 'var(--color-text-primary)'
                            }}
                          >
                            {issue.message}
                          </p>
                          <p
                            className="text-[11px] mt-1"
                            style={{ color: 'var(--color-text-secondary)', lineHeight: '1.4' }}
                          >
                            <span
                              className="font-bold text-accent mr-1"
                              style={{ color: 'var(--color-accent)' }}
                            >
                              Recommendation:
                            </span>
                            {issue.recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
              No health report available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}
        >
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-all disabled:opacity-60"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-primary)'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Re-analyze
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold cursor-pointer transition-all"
            style={{
              backgroundColor: 'var(--color-accent)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-primary)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
