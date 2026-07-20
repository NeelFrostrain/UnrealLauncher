// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCw, AlertTriangle, Layers, Search, Download } from 'lucide-react'
import { useToast } from '../ui/ToastContext'

interface ProjectAssetsDialogProps {
  projectName: string
  projectPath: string
  onClose: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  Textures: '#3b82f6', // Blue
  Materials: '#10b981', // Emerald
  Meshes: '#f59e0b', // Amber
  Animations: '#ec4899', // Pink
  Audio: '#8b5cf6', // Purple
  Blueprints: '#06b6d4', // Cyan
  Niagara: '#f43f5e', // Rose
  Maps: '#14b8a6', // Teal
  Other: '#6b7280' // Gray
}

export default function ProjectAssetsDialog({
  projectName,
  projectPath,
  onClose
}: ProjectAssetsDialogProps): React.ReactElement {
  const [report, setReport] = useState<AssetReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stats' | 'largest' | 'duplicates'>('stats')
  const [searchQuery, setSearchQuery] = useState('')
  const { addToast } = useToast()

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.projectAnalyzeAssets(projectPath)
      if (res.error) {
        addToast(res.error, 'error')
      } else {
        setReport(res)
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to run asset usage analysis', 'error')
    } finally {
      setLoading(false)
    }
  }, [projectPath, addToast])

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Calculate total wasted duplicate space
  const totalWastedBytes = useMemo(() => {
    if (!report || !report.duplicates) return 0
    return report.duplicates.reduce((acc, group) => {
      if (group.length <= 1) return acc
      const size = group[0].sizeBytes
      const wastedCount = group.length - 1
      return acc + size * wastedCount
    }, 0)
  }, [report])

  // Filter largest assets
  const filteredLargest = useMemo(() => {
    if (!report) return []
    return report.largestAssets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.path.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [report, searchQuery])

  // Filter duplicates
  const filteredDuplicates = useMemo(() => {
    if (!report || !report.duplicates) return []
    return report.duplicates.filter((group) =>
      group.some(
        (asset) =>
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.path.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [report, searchQuery])

  // Export report handler
  const handleExport = async (format: 'json' | 'md') => {
    if (!report) return
    let content = ''

    if (format === 'json') {
      content = JSON.stringify(report, null, 2)
    } else {
      // Create markdown report
      content = `# Asset Usage Analysis Report: ${projectName}\n`
      content += `**Project Path:** ${projectPath}\n`
      content += `**Date:** ${new Date().toLocaleString()}\n\n`
      content += `## Summary\n`
      content += `- **Total Asset Files:** ${report.totalAssets}\n`
      content += `- **Total Asset Size:** ${formatBytes(report.totalSizeBytes)}\n`
      content += `- **Total Redundant Duplicate Space:** ${formatBytes(totalWastedBytes)}\n\n`

      content += `## Category Breakdown\n`
      content += `| Category | Count | Size |\n`
      content += `| --- | --- | --- |\n`
      report.categories.forEach((cat) => {
        content += `| ${cat.category} | ${cat.count} | ${formatBytes(cat.sizeBytes)} |\n`
      })
      content += `\n`

      content += `## Top 10 Largest Assets\n`
      content += `| Asset Name | Relative Path | Size |\n`
      content += `| --- | --- | --- |\n`
      report.largestAssets.forEach((asset) => {
        content += `| ${asset.name} | ${asset.path} | ${formatBytes(asset.sizeBytes)} |\n`
      })
      content += `\n`

      content += `## Duplicate Groups\n`
      report.duplicates.forEach((group, index) => {
        if (group.length > 0) {
          content += `### Group ${index + 1} (Size: ${formatBytes(group[0].sizeBytes)} each, ${group.length} duplicates)\n`
          group.forEach((asset) => {
            content += `- \`${asset.path}\`\n`
          })
          content += `\n`
        }
      })
    }

    try {
      const res = await window.electronAPI.projectExportAssetReport(projectPath, content, format)
      if (res.success) {
        addToast(`Report exported successfully to: ${res.filePath}`, 'success')
      } else if (!res.canceled) {
        addToast(res.error || 'Export failed', 'error')
      }
    } catch {
      addToast('Failed to export report', 'error')
    }
  }

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
        className="w-full max-w-3xl overflow-hidden flex flex-col"
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
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Asset Usage Analyzer
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
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw
                className="animate-spin text-accent"
                size={32}
                style={{ color: 'var(--color-accent)' }}
              />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Scanning Content assets and calculating file hashes...
              </p>
            </div>
          ) : report ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="p-4"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Total Assets
                  </span>
                  <span
                    className="text-xl font-black"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {report.totalAssets.toLocaleString()}
                  </span>
                </div>
                <div
                  className="p-4"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Total Footprint
                  </span>
                  <span
                    className="text-xl font-black text-accent"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {formatBytes(report.totalSizeBytes)}
                  </span>
                </div>
                <div
                  className="p-4"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Duplicate Waste
                    {totalWastedBytes > 0 && <AlertTriangle size={12} className="text-amber-500" />}
                  </span>
                  <span
                    className="text-xl font-black"
                    style={{
                      color: totalWastedBytes > 0 ? '#f59e0b' : 'var(--color-text-primary)'
                    }}
                  >
                    {formatBytes(totalWastedBytes)}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div
                className="flex gap-2 shrink-0 border-b pb-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {(['stats', 'largest', 'duplicates'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab)
                      setSearchQuery('')
                    }}
                    className="px-4 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors"
                    style={{
                      backgroundColor:
                        activeTab === tab ? 'var(--color-surface-elevated)' : 'transparent',
                      color:
                        activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      border:
                        activeTab === tab
                          ? '1px solid var(--color-border)'
                          : '1px solid transparent'
                    }}
                  >
                    {tab === 'stats' && 'Asset Categories'}
                    {tab === 'largest' && 'Largest Assets'}
                    {tab === 'duplicates' && `Duplicates (${report.duplicates.length})`}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <h3
                    className="text-sm font-extrabold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Asset Size Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.categories
                      .filter((c) => c.count > 0)
                      .sort((a, b) => b.sizeBytes - a.sizeBytes)
                      .map((cat) => {
                        const pct =
                          report.totalSizeBytes > 0
                            ? (cat.sizeBytes / report.totalSizeBytes) * 100
                            : 0
                        const themeColor = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Other
                        return (
                          <div
                            key={cat.category}
                            className="p-4 flex flex-col gap-2"
                            style={{
                              backgroundColor: 'var(--color-surface-elevated)',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block"
                                  style={{ backgroundColor: themeColor }}
                                />
                                {cat.category}
                              </span>
                              <span
                                className="text-xs font-semibold"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                {cat.count.toLocaleString()} assets
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span
                                className="text-lg font-black"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                {formatBytes(cat.sizeBytes)}
                              </span>
                              <span
                                className="text-xs font-mono font-bold"
                                style={{ color: themeColor }}
                              >
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                            {/* Horizontal progress bar */}
                            <div
                              className="w-full h-1.5 rounded-full overflow-hidden"
                              style={{ backgroundColor: 'var(--color-surface-card)' }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor: themeColor,
                                  width: `${pct}%`,
                                  transition: 'width 0.4s ease'
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {activeTab === 'largest' && (
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-2 px-3 py-2"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search top assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-0 text-xs focus:ring-0 focus:outline-none"
                      style={{ color: 'var(--color-text-primary)' }}
                    />
                  </div>

                  <div
                    className="overflow-x-auto"
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr
                          style={{
                            backgroundColor: 'var(--color-surface-elevated)',
                            borderBottom: '1px solid var(--color-border)'
                          }}
                        >
                          <th
                            className="p-3 font-bold"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Asset Name
                          </th>
                          <th
                            className="p-3 font-bold"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Path
                          </th>
                          <th
                            className="p-3 font-bold text-right"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Size
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLargest.length > 0 ? (
                          filteredLargest.map((asset, i) => (
                            <tr
                              key={i}
                              className="hover:bg-white/5 transition-colors"
                              style={{
                                borderBottom:
                                  i < filteredLargest.length - 1
                                    ? '1px solid var(--color-border)'
                                    : '0'
                              }}
                            >
                              <td
                                className="p-3 font-bold"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                {asset.name}
                              </td>
                              <td
                                className="p-3 font-mono text-[10px]"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                {asset.path}
                              </td>
                              <td
                                className="p-3 text-right font-semibold"
                                style={{ color: 'var(--color-accent)' }}
                              >
                                {formatBytes(asset.sizeBytes)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="p-8 text-center text-xs"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              No matching assets found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'duplicates' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-4 flex-wrap">
                    <div
                      className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2"
                      style={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)'
                      }}
                    >
                      <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search duplicate files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-0 text-xs focus:ring-0 focus:outline-none"
                        style={{ color: 'var(--color-text-primary)' }}
                      />
                    </div>
                  </div>

                  {filteredDuplicates.length > 0 ? (
                    <div className="space-y-4">
                      {filteredDuplicates.map((group, index) => {
                        const count = group.length
                        const sizeEach = group[0].sizeBytes
                        const wasted = sizeEach * (count - 1)
                        return (
                          <div
                            key={index}
                            className="p-4 space-y-3"
                            style={{
                              backgroundColor: 'var(--color-surface-elevated)',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <div className="flex justify-between items-baseline flex-wrap gap-2">
                              <span
                                className="text-xs font-extrabold"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                Duplicate group: {group[0].name}
                              </span>
                              <span
                                className="text-xs font-mono font-bold"
                                style={{ color: '#f59e0b' }}
                              >
                                {count} copies · {formatBytes(wasted)} redundant
                              </span>
                            </div>
                            <div
                              className="pl-3 border-l-2 space-y-1.5"
                              style={{ borderColor: 'var(--color-border)' }}
                            >
                              {group.map((asset, i) => (
                                <div key={i} className="flex justify-between items-center gap-4">
                                  <span
                                    className="text-[10px] font-mono truncate"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                  >
                                    {asset.path}
                                  </span>
                                  <span
                                    className="text-[10px] font-bold tracking-wide shrink-0"
                                    style={{ color: 'var(--color-text-muted)' }}
                                  >
                                    {formatBytes(asset.sizeBytes)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div
                      className="p-12 flex flex-col items-center justify-center space-y-2"
                      style={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      <Layers size={28} />
                      <p className="text-xs font-bold">No duplicate assets detected</p>
                      <p className="text-[10px] text-center max-w-sm">
                        All files under the Content directory produce unique hash signatures.
                        Excellent optimization!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No report available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}
        >
          <div className="flex gap-2">
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
              Re-scan
            </button>

            {report && (
              <div className="relative group inline-block">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-all"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <Download size={12} />
                  Export Report
                </button>
                <div
                  className="absolute bottom-full left-0 mb-1 hidden group-hover:block w-32 py-1 z-50"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-semibold hover:bg-white/5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    JSON Format
                  </button>
                  <button
                    onClick={() => handleExport('md')}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-semibold hover:bg-white/5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Markdown Format
                  </button>
                </div>
              </div>
            )}
          </div>

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
