import { useState } from 'react'
import { FolderOpen, Package, FileCode, Box, HelpCircle } from 'lucide-react'

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
}

export const TYPE_LABELS: Record<FabAssetType, { label: string; icon: React.ReactNode; color: string }> = {
  plugin:  { label: 'Plugin',  icon: <Package size={10} />,    color: 'var(--color-accent)' },
  content: { label: 'Content', icon: <Box size={10} />,        color: '#10b981' },
  project: { label: 'Project', icon: <FileCode size={10} />,   color: '#f59e0b' },
  unknown: { label: 'Asset',   icon: <HelpCircle size={10} />, color: 'var(--color-text-muted)' }
}

// ── Shared thumbnail ──────────────────────────────────────────────────────────
export const AssetThumb = ({ icon, thumbnailUrl, name }: {
  icon: string | null
  thumbnailUrl: string | null
  name: string
}): React.ReactElement => {
  const [failed, setFailed] = useState(false)
  const src = !failed
    ? (icon ? `local-asset:///${icon.replace(/\\/g, '/')}` : thumbnailUrl)
    : null

  if (src) {
    return (
      <img src={src} alt={name} onError={() => setFailed(true)}
        className="w-full h-full object-cover" loading="lazy" decoding="async" />
    )
  }
  return (
    <div className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' }}>
      <Package size={20} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
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
      <div className="w-10 h-10 shrink-0 overflow-hidden"
        style={{ borderRadius: 'calc(var(--radius) * 0.75)', border: '1px solid var(--color-border)' }}>
        <AssetThumb icon={asset.icon} thumbnailUrl={asset.thumbnailUrl} name={asset.name} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }} title={asset.name}>
            {asset.name}
          </p>
          {asset.version && (
            <span className="shrink-0 text-[9px] font-mono px-1 py-px"
              style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              {asset.version}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-px font-medium shrink-0"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 22%, transparent)` }}>
            {icon} {label}
          </span>
          {asset.category && (
            <span className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>{asset.category}</span>
          )}
          {recentApps.length > 0 && (
            <div className="flex items-center gap-1">
              {recentApps.map((app) => (
                <span key={app} className="text-[9px] px-1 py-px font-mono"
                  style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                  {app.replace('UE_', '')}
                </span>
              ))}
              {asset.compatibleApps.length > 3 && (
                <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>+{asset.compatibleApps.length - 3}</span>
              )}
            </div>
          )}
        </div>
        {asset.description && (
          <p className="text-[10px] mt-1 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>{asset.description}</p>
        )}
      </div>

      <button onClick={() => window.electronAPI.openDirectory(asset.folderPath)}
        className="shrink-0 p-1.5 transition-all cursor-pointer"
        style={{ borderRadius: 'calc(var(--radius) * 0.6)', color: 'var(--color-text-muted)', backgroundColor: hovered ? 'var(--color-surface-card)' : 'transparent', opacity: hovered ? 1 : 0, border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}` }}
        title="Open folder">
        <FolderOpen size={13} />
      </button>
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
      {/* Header: icon + name + folder btn */}
      <div className="flex items-start gap-2.5">
        <div
          className="w-9 h-9 shrink-0 overflow-hidden"
          style={{ borderRadius: 'calc(var(--radius) * 0.65)', border: '1px solid var(--color-border)' }}
        >
          <AssetThumb icon={asset.icon} thumbnailUrl={asset.thumbnailUrl} name={asset.name} />
        </div>
        <div className="flex-1 min-w-0 pt-px">
          <p
            className="text-xs font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--color-text-primary)' }}
            title={asset.name}
          >
            {asset.name}
          </p>
          {asset.category && (
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
              {asset.category}
            </p>
          )}
        </div>
        <button
          onClick={() => window.electronAPI.openDirectory(asset.folderPath)}
          className="shrink-0 p-1 cursor-pointer transition-all"
          style={{
            borderRadius: 'calc(var(--radius) * 0.5)',
            color: 'var(--color-text-muted)',
            backgroundColor: hovered ? 'var(--color-surface-card)' : 'transparent',
            opacity: hovered ? 1 : 0,
            border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}`
          }}
          title="Open folder"
        >
          <FolderOpen size={12} />
        </button>
      </div>

      {/* Description */}
      {asset.description && (
        <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
          {asset.description}
        </p>
      )}

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />

      {/* Footer: type + version + compat + category */}
      <div className="flex flex-col gap-1">
        {/* Row 1: type badge + version */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="flex items-center gap-0.5 text-[9px] px-1.5 py-px font-medium shrink-0"
            style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 22%, transparent)` }}
          >
            {icon} {label}
          </span>
          {asset.version && (
            <span
              className="text-[9px] font-mono px-1 py-px shrink-0"
              style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
            >
              {asset.version}
            </span>
          )}
        </div>

        {/* Row 2: compatible UE versions */}
        {recentApps.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {recentApps.map((app) => (
              <span
                key={app}
                className="text-[9px] font-mono px-1 py-px"
                style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
              >
                UE {app.replace('UE_', '')}
              </span>
            ))}
            {asset.compatibleApps.length > 3 && (
              <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
                +{asset.compatibleApps.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Default export stays as list card for backwards compat
const AssetCard = AssetListCard
export default AssetCard
