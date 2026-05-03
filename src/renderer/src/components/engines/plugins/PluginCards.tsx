// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, memo } from 'react'
import { FolderOpen, Package, ChevronDown, ChevronRight } from 'lucide-react'
import type { ViewMode } from './usePluginsState'

interface EnginePlugin {
  name: string; path: string; icon: string | null; version: string
  description: string; category: string; createdBy: string; isBeta: boolean; isExperimental: boolean
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────
export const PluginThumb = memo(({ icon, name }: { icon: string | null; name: string }): React.ReactElement => {
  const [failed, setFailed] = useState(false)
  const src = icon && !failed ? `local-asset:///${icon.replace(/\\/g, '/')}` : null
  if (src) return <img src={src} alt={name} onError={() => setFailed(true)} className="w-full h-full object-cover" loading="lazy" decoding="async" />
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)' }}>
      <Package size={14} style={{ color: 'var(--color-accent)', opacity: 0.5 }} />
    </div>
  )
})
PluginThumb.displayName = 'PluginThumb'

// ── Badge ─────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color }: { label: string; color: string }): React.ReactElement => (
  <span className="shrink-0 text-[8px] font-bold uppercase px-1 py-px tracking-wide"
    style={{ borderRadius: 'calc(var(--radius) * 0.35)', backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, color }}>
    {label}
  </span>
)

// ── List card ─────────────────────────────────────────────────────────────────
export const PluginListCard = memo(({ plugin }: { plugin: EnginePlugin }): React.ReactElement => {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="flex items-center gap-2.5 px-3 py-2"
      style={{ borderRadius: 'var(--radius)', backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)', border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 25%, var(--color-border))' : 'var(--color-border)'}`, transition: 'background-color 120ms ease, border-color 120ms ease' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="w-8 h-8 shrink-0 overflow-hidden" style={{ borderRadius: 'calc(var(--radius) * 0.6)', border: '1px solid var(--color-border)' }}>
        <PluginThumb icon={plugin.icon} name={plugin.name} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }} title={plugin.name}>{plugin.name}</p>
          {plugin.version && <span className="shrink-0 text-[9px] font-mono px-1 py-px" style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>v{plugin.version}</span>}
          {plugin.isBeta && <Badge label="Beta" color="#f59e0b" />}
          {plugin.isExperimental && <Badge label="Experimental" color="#a78bfa" />}
        </div>
        <p className="text-[10px] line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>{plugin.description || (plugin.createdBy ? `By ${plugin.createdBy}` : 'Engine plugin')}</p>
      </div>
      <button onClick={() => window.electronAPI.openDirectory(plugin.path)} className="shrink-0 p-1.5 cursor-pointer transition-all"
        style={{ borderRadius: 'calc(var(--radius) * 0.6)', color: 'var(--color-text-muted)', backgroundColor: hovered ? 'var(--color-surface-card)' : 'transparent', opacity: hovered ? 1 : 0, border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}` }} title="Open folder">
        <FolderOpen size={12} />
      </button>
    </div>
  )
})
PluginListCard.displayName = 'PluginListCard'

// ── Grid card ─────────────────────────────────────────────────────────────────
export const PluginGridCard = memo(({ plugin }: { plugin: EnginePlugin }): React.ReactElement => {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="flex flex-col overflow-hidden"
      style={{ borderRadius: 'var(--radius)', backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)', border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 25%, var(--color-border))' : 'var(--color-border)'}`, transition: 'background-color 120ms ease, border-color 120ms ease' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative w-full aspect-square overflow-hidden" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <PluginThumb icon={plugin.icon} name={plugin.name} />
        {hovered && (
          <button onClick={() => window.electronAPI.openDirectory(plugin.path)} className="absolute top-1.5 right-1.5 p-1.5 cursor-pointer"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: 'rgba(0,0,0,0.65)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }} title="Open folder">
            <FolderOpen size={11} />
          </button>
        )}
        {(plugin.isBeta || plugin.isExperimental) && (
          <div className="absolute bottom-1.5 left-1.5 flex gap-1">
            {plugin.isBeta && <Badge label="Beta" color="#f59e0b" />}
            {plugin.isExperimental && <Badge label="Exp" color="#a78bfa" />}
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-[11px] font-semibold truncate mb-0.5" style={{ color: 'var(--color-text-primary)' }} title={plugin.name}>{plugin.name}</p>
        {plugin.version && <span className="text-[9px] font-mono px-1 py-px" style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>v{plugin.version}</span>}
        {plugin.description && <p className="text-[10px] mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{plugin.description}</p>}
      </div>
    </div>
  )
})
PluginGridCard.displayName = 'PluginGridCard'

// ── Category section ──────────────────────────────────────────────────────────
export const CategorySection = memo(({ category, plugins, viewMode, defaultOpen, forceOpen }: {
  category: string; plugins: EnginePlugin[]; viewMode: ViewMode; defaultOpen: boolean; forceOpen: boolean
}): React.ReactElement => {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => { if (forceOpen) setOpen(true); else setOpen(defaultOpen) }, [forceOpen, defaultOpen])
  return (
    <div className="mb-1">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors rounded" style={{ color: 'var(--color-text-secondary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-card)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
        {open ? <ChevronDown size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} /> : <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
        <span className="text-[11px] font-semibold flex-1 text-left">{category}</span>
        <span className="text-[9px] font-mono px-1.5 py-px" style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>{plugins.length}</span>
      </button>
      {open && (viewMode === 'grid' ? (
        <div className="grid gap-2 pt-1 px-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {plugins.map((p) => <PluginGridCard key={p.path} plugin={p} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-1 pt-1 px-1">
          {plugins.map((p) => <PluginListCard key={p.path} plugin={p} />)}
        </div>
      ))}
    </div>
  )
})
CategorySection.displayName = 'CategorySection'
