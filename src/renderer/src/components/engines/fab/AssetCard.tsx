// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState } from 'react'
import { FolderOpen, Package, FileCode, Box, HelpCircle } from 'lucide-react'
import { AssetThumb } from './AssetThumb'

export type FabAssetType = 'plugin' | 'content' | 'project' | 'unknown'

export interface FabAsset {
  name: string
  folderPath: string
  type: FabAssetType
  version: string
  description: string
  icon: string | null
  thumbnailUrl: string | null
  hasContent: boolean
  compatibleApps: string[]
  category: string
  assetType: string
  actionUrl?: string
  tags?: string[]
  isCodeProject?: boolean
  filters?: string[]
  broken?: boolean
}

export const TYPE_LABELS: Record<FabAssetType, { label: string; icon: React.ReactNode; color: string }> = {
  plugin: { label: 'Plugin', icon: <Package size={10} />, color: 'var(--color-accent)' },
  content: { label: 'Content', icon: <Box size={10} />, color: '#10b981' },
  project: { label: 'Project', icon: <FileCode size={10} />, color: '#f59e0b' },
  unknown: { label: 'Asset', icon: <HelpCircle size={10} />, color: 'var(--color-text-muted)' }
}

// ── Shared badge ──────────────────────────────────────────────────────────────
const AssetBadge = ({ label, color, version }: { label: string; color: string; version?: string }) => (
  <span
    className="flex items-center gap-0.5 text-[9px] px-1.5 py-px font-medium shrink-0"
    style={{
      borderRadius: 'calc(var(--radius) * 0.4)',
      backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      color, border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`
    }}
  >
    {version ?? label}
  </span>
)

// ── Shared action buttons ─────────────────────────────────────────────────────
const AssetActions = ({ asset, hovered, size = 13 }: { asset: FabAsset; hovered: boolean; size?: number }) => (
  <div className="flex items-center gap-1">
    {asset.actionUrl && (
      <button
        onClick={() => window.electronAPI.openExternal(asset.actionUrl!)}
        className="shrink-0 p-1.5 transition-all cursor-pointer"
        style={{
          borderRadius: 'calc(var(--radius) * 0.6)', color: 'var(--color-text-muted)',
          backgroundColor: hovered ? 'var(--color-surface-card)' : 'transparent',
          opacity: hovered ? 1 : 0, border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}`
        }}
        title="View on Fab"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </button>
    )}
    <button
      onClick={() => window.electronAPI.openDirectory(asset.folderPath)}
      className="shrink-0 p-1.5 transition-all cursor-pointer"
      style={{
        borderRadius: 'calc(var(--radius) * 0.6)', color: 'var(--color-text-muted)',
        backgroundColor: hovered ? 'var(--color-surface-card)' : 'transparent',
        opacity: hovered ? 1 : 0, border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}`
      }}
      title="Open folder"
    >
      <FolderOpen size={size} />
    </button>
  </div>
)

// ── Shared tags ───────────────────────────────────────────────────────────────
const AssetTags = ({ asset }: { asset: FabAsset }) => {
  const tags = asset.tags || asset.filters || []
  if (!tags.length) return null
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tags.slice(0, 3).map((tag, i) => (
        <span key={i} className="text-[9px] px-1.5 py-px"
          style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
          {tag}
        </span>
      ))}
      {tags.length > 3 && <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>+{tags.length - 3}</span>}
    </div>
  )
}

// ── List card ─────────────────────────────────────────────────────────────────
export const AssetListCard = ({ asset }: { asset: FabAsset }): React.ReactElement => {
  const [hovered, setHovered] = useState(false)
  const { label, icon, color } = TYPE_LABELS[asset.type]
  const recentApps = asset.compatibleApps.slice(-3).reverse()

  return (
    <div
      className="w-full flex items-center gap-3 px-3 py-2.5"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 30%, var(--color-border))' : 'var(--color-border)'}`,
        transition: 'background-color 150ms ease, border-color 150ms ease'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-16 h-16 shrink-0 overflow-hidden" style={{ borderRadius: 'calc(var(--radius) * 0.75)', border: '1px solid var(--color-border)' }}>
        <AssetThumb icon={asset.icon} thumbnailUrl={asset.thumbnailUrl} name={asset.name} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }} title={asset.name}>{asset.name}</p>
          {asset.version && <span className="shrink-0 text-[9px] font-mono px-1 py-px" style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>{asset.version}</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <AssetBadge label={asset.assetType || label} color={color} />
          {asset.isCodeProject && <AssetBadge label="Code" color="#f59e0b" />}
          {asset.broken && <AssetBadge label="Broken" color="#ef4444" />}
          {recentApps.length > 0 && (
            <div className="flex items-center gap-1">
              {recentApps.map((app) => (
                <span key={app} className="text-[9px] px-1 py-px font-mono" style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                  {app.replace('UE_', '')}
                </span>
              ))}
              {asset.compatibleApps.length > 3 && <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>+{asset.compatibleApps.length - 3}</span>}
            </div>
          )}
        </div>
        <AssetTags asset={asset} />
        {asset.description && <p className="text-[10px] mt-1 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>{asset.description}</p>}
      </div>
      <AssetActions asset={asset} hovered={hovered} />
    </div>
  )
}

// ── Grid card ─────────────────────────────────────────────────────────────────
export const AssetGridCard = ({ asset }: { asset: FabAsset }): React.ReactElement => {
  const [hovered, setHovered] = useState(false)
  const { label, icon, color } = TYPE_LABELS[asset.type]
  const recentApps = asset.compatibleApps.slice(-3).reverse()

  return (
    <div
      className="flex flex-col p-3 gap-2"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 30%, var(--color-border))' : 'var(--color-border)'}`,
        transition: 'background-color 150ms ease, border-color 150ms ease'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-12 h-12 shrink-0 overflow-hidden" style={{ borderRadius: 'calc(var(--radius) * 0.65)', border: '1px solid var(--color-border)' }}>
          <AssetThumb icon={asset.icon} thumbnailUrl={asset.thumbnailUrl} name={asset.name} />
        </div>
        <div className="flex-1 min-w-0 pt-px">
          <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: 'var(--color-text-primary)' }} title={asset.name}>{asset.name}</p>
          {asset.category && <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{asset.category}</p>}
        </div>
        <AssetActions asset={asset} hovered={hovered} size={12} />
      </div>
      {asset.description && <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{asset.description}</p>}
      <AssetTags asset={asset} />
      <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <AssetBadge label={asset.assetType || label} color={color} />
          {asset.isCodeProject && <AssetBadge label="Code" color="#f59e0b" />}
          {asset.broken && <AssetBadge label="Broken" color="#ef4444" />}
          {asset.version && <span className="text-[9px] font-mono px-1 py-px shrink-0" style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>{asset.version}</span>}
        </div>
        {recentApps.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {recentApps.map((app) => (
              <span key={app} className="text-[9px] font-mono px-1 py-px" style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                UE {app.replace('UE_', '')}
              </span>
            ))}
            {asset.compatibleApps.length > 2 && <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>+{asset.compatibleApps.length - 2}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

const AssetCard = AssetListCard
export default AssetCard
