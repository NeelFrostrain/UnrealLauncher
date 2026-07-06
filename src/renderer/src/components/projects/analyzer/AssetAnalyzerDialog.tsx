// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PieChart, Download, StopCircle, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { useFocusTrap } from '../../../hooks/useFocusTrap'
import { useToast } from '../../ui/ToastContext'

interface Props {
  projectName: string
  projectPath: string
  onClose: () => void
}

type TabType = 'overview' | 'largest' | 'duplicates' | 'unused'

export default function AssetAnalyzerDialog({ projectName, projectPath, onClose }: Props): React.ReactElement {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef)
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState({ phase: '', scanned: 0, total: 0 })
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    const unsub = window.electronAPI.onAssetAnalyzerProgress((prog) => {
      setProgress(prog)
    })
    return () => unsub()
  }, [])

  const startScan = async () => {
    setScanning(true)
    setResults(null)
    setProgress({ phase: 'Starting...', scanned: 0, total: 0 })
    try {
      const res = await window.electronAPI.scanAssets(projectPath)
      if (res && res.error) {
        addToast(res.error, 'error')
      } else {
        setResults(res)
      }
    } catch (e: any) {
      addToast(e.message || 'Scan failed', 'error')
    } finally {
      setScanning(false)
    }
  }

  const cancelScan = async () => {
    await window.electronAPI.cancelAssetScan()
    setScanning(false)
    setProgress({ phase: 'Cancelled', scanned: 0, total: 0 })
  }

  useEffect(() => {
    startScan()
    return () => {
      window.electronAPI.cancelAssetScan()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath])

  const exportData = async (format: 'json' | 'csv') => {
    if (!results) return
    try {
      // Basic CSV export logic
      let dataToExport = results
      if (format === 'csv') {
        const rows = ['Category,Count']
        for (const [k, v] of Object.entries(results.stats)) {
          if (typeof v === 'number') rows.push(`${k},${v}`)
        }
        dataToExport = rows.join('\\n')
      }
      
      const res = await window.electronAPI.exportAssetAnalysis(dataToExport, format)
      addToast(`Exported to ${res.filePath}`, 'success')
    } catch (e: any) {
      addToast('Export failed', 'error')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !scanning) onClose()
      }}
    >
      <motion.div
        ref={dialogRef}
        className="flex flex-col w-full"
        style={{
          maxWidth: 900,
          height: '85vh',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
        }}
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <PieChart size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              Asset Usage Analyzer — {projectName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Scan and analyze project assets
            </p>
          </div>
          <div className="flex gap-2">
            {!scanning && results && (
              <>
                <button
                  onClick={() => exportData('csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <Download size={13} />
                  CSV
                </button>
                <button
                  onClick={() => exportData('json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <Download size={13} />
                  JSON
                </button>
              </>
            )}
            <button
              onClick={onClose}
              disabled={scanning}
              className="p-2 cursor-pointer disabled:opacity-50"
              aria-label="Close"
              style={{
                borderRadius: 'calc(var(--radius) * 0.5)',
                color: 'var(--color-text-muted)',
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {scanning ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div
                className="w-12 h-12 rounded-full border-4 animate-spin mb-6"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
                  borderTopColor: 'var(--color-accent)'
                }}
              />
              <h3 className="text-xl font-bold mb-2">{progress.phase || 'Scanning...'}</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {progress.scanned.toLocaleString()} {progress.total > 0 ? ` / ${progress.total.toLocaleString()}` : ''} items processed
              </p>
              <button
                onClick={cancelScan}
                className="mt-8 flex items-center gap-2 px-4 py-2 text-sm font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  color: '#f87171'
                }}
              >
                <StopCircle size={15} />
                Cancel Scan
              </button>
            </div>
          ) : results ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-2 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <button
                  className={"pb-2 text-sm font-semibold " + (activeTab === 'overview' ? '' : 'opacity-60')}
                  style={{ borderBottom: activeTab === 'overview' ? '2px solid var(--color-accent)' : '2px solid transparent' }}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={"pb-2 text-sm font-semibold " + (activeTab === 'largest' ? '' : 'opacity-60')}
                  style={{ borderBottom: activeTab === 'largest' ? '2px solid var(--color-accent)' : '2px solid transparent' }}
                  onClick={() => setActiveTab('largest')}
                >
                  Largest Assets
                </button>
                <button
                  className={"pb-2 text-sm font-semibold " + (activeTab === 'duplicates' ? '' : 'opacity-60')}
                  style={{ borderBottom: activeTab === 'duplicates' ? '2px solid var(--color-accent)' : '2px solid transparent' }}
                  onClick={() => setActiveTab('duplicates')}
                >
                  Duplicates <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>{results.duplicates.length}</span>
                </button>
                <button
                  className={"pb-2 text-sm font-semibold " + (activeTab === 'unused' ? '' : 'opacity-60')}
                  style={{ borderBottom: activeTab === 'unused' ? '2px solid var(--color-accent)' : '2px solid transparent' }}
                  onClick={() => setActiveTab('unused')}
                >
                  Potentially Unused <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>{results.unused.length}</span>
                </button>
                <div className="flex-1" />
                <button
                  onClick={startScan}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <RefreshCw size={12} />
                  Rescan
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
                          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Assets</p>
                          <p className="text-2xl font-bold">{results.stats.TotalAssets.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
                          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Size</p>
                          <p className="text-2xl font-bold text-[#4ade80]">{formatSize(results.stats.TotalSize)}</p>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold mb-3">Breakdown by Type</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                        {Object.entries(results.stats).filter(([k]) => k !== 'TotalAssets' && k !== 'TotalSize').map(([key, val]: any) => (
                          <div key={key} className="p-3 rounded flex justify-between items-center" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{key}</span>
                            <span className="font-mono font-bold">{val}</span>
                          </div>
                        ))}
                      </div>

                      <h4 className="font-semibold mb-3">Folder Storage</h4>
                      <div className="rounded overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                        <table className="w-full text-left text-sm">
                          <thead style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                            <tr>
                              <th className="px-4 py-2 font-medium">Folder</th>
                              <th className="px-4 py-2 font-medium text-right w-32">Size</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.folders.map((f: any, i: number) => (
                              <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td className="px-4 py-2 font-mono text-xs truncate max-w-[300px]" title={f.folder}>{f.folder}</td>
                                <td className="px-4 py-2 text-right font-mono text-xs">{formatSize(f.size)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                  
                  {activeTab === 'largest' && (
                    <motion.div key="largest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="rounded overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                        <table className="w-full text-left text-sm">
                          <thead style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                            <tr>
                              <th className="px-4 py-2 font-medium w-12">#</th>
                              <th className="px-4 py-2 font-medium">Asset Name</th>
                              <th className="px-4 py-2 font-medium w-32">Type</th>
                              <th className="px-4 py-2 font-medium text-right w-32">Size</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.largest.map((f: any, i: number) => (
                              <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td className="px-4 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                                <td className="px-4 py-2 font-mono text-xs truncate max-w-[400px]" title={f.path}>{f.name}</td>
                                <td className="px-4 py-2 text-xs">{f.type}</td>
                                <td className="px-4 py-2 text-right font-mono text-xs font-bold text-[#f59e0b]">{formatSize(f.size)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'duplicates' && (
                    <motion.div key="duplicates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {results.duplicates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>
                          <CheckCircle size={32} className="mb-3 text-[#4ade80]" />
                          <p>No identical duplicate assets found.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {results.duplicates.map((dup: any, i: number) => (
                            <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
                              <div className="flex justify-between items-center mb-3">
                                <h5 className="font-bold font-mono text-sm">{dup.name}</h5>
                                <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                                  {formatSize(dup.size)}
                                </span>
                              </div>
                              <ul className="text-xs font-mono space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                                {dup.paths.map((p: string, j: number) => (
                                  <li key={j} className="truncate" title={p}>• {p}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'unused' && (
                    <motion.div key="unused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="mb-4 p-3 rounded text-sm flex gap-3 items-start" style={{ backgroundColor: 'color-mix(in srgb, #f59e0b 15%, transparent)', color: '#fcd34d', border: '1px solid color-mix(in srgb, #f59e0b 30%, transparent)' }}>
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p><strong>Potentially Unused Assets (Heuristic):</strong> This list is generated via lightweight string reference scanning. It may contain false positives (e.g. assets loaded dynamically via C++ or exact string matches in binary). Do not blindly delete these without verifying in the Editor.</p>
                      </div>
                      
                      <div className="rounded overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                        <table className="w-full text-left text-sm">
                          <thead style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                            <tr>
                              <th className="px-4 py-2 font-medium">Asset Name</th>
                              <th className="px-4 py-2 font-medium w-32">Type</th>
                              <th className="px-4 py-2 font-medium text-right w-24">Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.unused.map((f: any, i: number) => (
                              <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td className="px-4 py-2 font-mono text-xs truncate max-w-[400px]" title={f.path}>{f.name}</td>
                                <td className="px-4 py-2 text-xs">{f.type}</td>
                                <td className="px-4 py-2 text-right text-xs">
                                  <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    {f.confidence}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ color: 'var(--color-text-muted)' }}>Scan cancelled or failed.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
