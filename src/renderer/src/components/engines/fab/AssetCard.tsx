import { FolderOpen, Package, FileCode, Box, HelpCircle } from 'lucide-react'
import AssetIcon from './AssetIcon'

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

interface AssetCardProps {
  asset: FabAsset
}

const AssetCard = ({ asset }: AssetCardProps): React.ReactElement => {
  const { label, icon, color } = TYPE_LABELS[asset.type]
  const recentApps = asset.compatibleApps.slice(-3).reverse()

  return (
    <div
      className="p-3 border transition-colors"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--color-surface-card)',
        borderColor: 'var(--color-border)'
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <AssetIcon icon={asset.icon} thumbnailUrl={asset.thumbnailUrl} name={asset.name} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }} title={asset.name}>
              {asset.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span
                className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 font-medium shrink-0"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.5)',
                  backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                  color
                }}
              >
                {icon} {label}
              </span>
              {asset.category && (
                <span className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {asset.category}
                </span>
              )}
            </div>
            {recentApps.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {recentApps.map((app) => (
                  <span
                    key={app}
                    className="text-[9px] px-1 py-0.5 font-mono"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.4)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {app.replace('UE_', '')}
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
        <button
          onClick={() => window.electronAPI.openDirectory(asset.folderPath)}
          className="shrink-0 p-1 cursor-pointer transition-colors"
          style={{ borderRadius: 'calc(var(--radius) * 0.5)', color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="Open folder"
        >
          <FolderOpen size={12} />
        </button>
      </div>
      {asset.description && (
        <p className="text-[11px] mt-2 leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
          {asset.description}
        </p>
      )}
    </div>
  )
}

export default AssetCard
