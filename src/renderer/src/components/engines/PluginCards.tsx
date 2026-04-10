import { useState } from 'react'
import { Package, FolderOpen } from 'lucide-react'

const PluginThumb = ({ icon, name }: { icon: string | null; name: string }): React.ReactElement => {
  const [failed, setFailed] = useState(false)
  const src = icon && !failed ? `local-asset:///${icon.replace(/\\/g, '/')}` : null
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
    )
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' }}
    >
      <Package size={16} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
    </div>
  )
}

export const PluginListCard = ({ plugin }: { plugin: MarketplacePlugin }): React.ReactElement => {
  const [hovered, setHovered] = useState(false)
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
      <div
        className="w-10 h-10 shrink-0 overflow-hidden"
        style={{
          borderRadius: 'calc(var(--radius) * 0.75)',
          border: '1px solid var(--color-border)'
        }}
      >
        <PluginThumb icon={plugin.icon} name={plugin.name} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="text-xs font-semibold truncate"
            style={{ color: 'var(--color-text-primary)' }}
            title={plugin.name}
          >
            {plugin.name}
          </p>
          {plugin.version && (
            <span
              className="shrink-0 text-[9px] font-mono px-1 py-px"
              style={{
                borderRadius: 'calc(var(--radius) * 0.4)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)'
              }}
            >
              v{plugin.version}
            </span>
          )}
        </div>
        <p className="text-[10px] line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
          {plugin.description || 'Marketplace plugin'}
        </p>
      </div>
      <button
        onClick={() => window.electronAPI.openDirectory(plugin.path)}
        className="shrink-0 p-1.5 cursor-pointer transition-all"
        style={{
          borderRadius: 'calc(var(--radius) * 0.6)',
          color: 'var(--color-text-muted)',
          backgroundColor: hovered ? 'var(--color-surface-card)' : 'transparent',
          opacity: hovered ? 1 : 0,
          border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}`
        }}
        title="Open folder"
      >
        <FolderOpen size={13} />
      </button>
    </div>
  )
}

export const PluginGridCard = ({ plugin }: { plugin: MarketplacePlugin }): React.ReactElement => {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 30%, var(--color-border))' : 'var(--color-border)'}`,
        transition: 'background-color 150ms ease, border-color 150ms ease'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative w-full aspect-square overflow-hidden"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <PluginThumb icon={plugin.icon} name={plugin.name} />
        {hovered && (
          <button
            onClick={() => window.electronAPI.openDirectory(plugin.path)}
            className="absolute top-2 right-2 p-1.5 cursor-pointer"
            style={{
              borderRadius: 'calc(var(--radius) * 0.6)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
            title="Open folder"
          >
            <FolderOpen size={12} />
          </button>
        )}
      </div>
      <div className="p-2.5">
        <p
          className="text-xs font-semibold truncate mb-0.5"
          style={{ color: 'var(--color-text-primary)' }}
          title={plugin.name}
        >
          {plugin.name}
        </p>
        {plugin.version && (
          <span
            className="text-[9px] font-mono px-1 py-px"
            style={{
              borderRadius: 'calc(var(--radius) * 0.4)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)'
            }}
          >
            v{plugin.version}
          </span>
        )}
        {plugin.description && (
          <p
            className="text-[10px] mt-1 line-clamp-2 leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {plugin.description}
          </p>
        )}
      </div>
    </div>
  )
}
