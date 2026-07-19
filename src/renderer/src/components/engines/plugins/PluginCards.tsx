// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, memo } from 'react'
import { FolderOpen, Package, ChevronDown, ChevronRight } from 'lucide-react'
import type { ViewMode } from './usePluginsState'
import { toLocalAssetUrl } from '../../../utils/resolveAsset'

interface EnginePlugin {
  name: string
  path: string
  icon: string | null
  version: string
  description: string
  category: string
  createdBy: string
  isBeta: boolean
  isExperimental: boolean
  enabledByDefault?: boolean
  dependencies?: string[]
  source?: 'Engine' | 'Project'
  projectName?: string
  docsUrl?: string
  supportUrl?: string
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  disabled
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}): React.ReactElement {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="relative shrink-0 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        width: 28,
        height: 16,
        borderRadius: 999,
        backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        padding: 0,
        outline: 'none'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 13 : 2,
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: checked ? '#fff' : 'var(--color-text-muted)',
          transition: 'left 0.15s ease, background-color 0.15s ease'
        }}
      />
    </button>
  )
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────
export const PluginThumb = memo(
  ({ icon, name }: { icon: string | null; name: string }): React.ReactElement => {
    const [failed, setFailed] = useState(false)
    const src = icon && !failed ? toLocalAssetUrl(icon) : null
    if (src)
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
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)' }}
      >
        <Package size={14} style={{ color: 'var(--color-accent)', opacity: 0.5 }} />
      </div>
    )
  }
)
PluginThumb.displayName = 'PluginThumb'

// ── Badge ─────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color }: { label: string; color: string }): React.ReactElement => (
  <span
    className="shrink-0 text-[8px] font-bold uppercase px-1 py-px tracking-wide"
    style={{
      borderRadius: 'calc(var(--radius) * 0.35)',
      backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      color
    }}
  >
    {label}
  </span>
)

// ── List card ─────────────────────────────────────────────────────────────────
export const PluginListCard = memo(
  ({
    plugin,
    onToggleDefault
  }: {
    plugin: EnginePlugin
    onToggleDefault?: (plugin: EnginePlugin) => void
  }): React.ReactElement => {
    const [hovered, setHovered] = useState(false)
    const [expanded, setExpanded] = useState(false)
    return (
      <div
        className="w-full transition-all cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{
          backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
          border: hovered ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          transition: 'background-color 120ms ease, border-color 120ms ease'
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Thumbnail */}
          <div
            className="w-14 h-14 shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)'
            }}
          >
            <PluginThumb icon={plugin.icon} name={plugin.name} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className="text-xs font-semibold truncate"
                style={{ color: 'var(--color-text-primary)' }}
                title={plugin.name}
              >
                {plugin.name}
              </p>
              {plugin.version && (
                <span
                  className="shrink-0 text-[9px] font-mono px-1.5 py-px"
                  style={{
                    color: 'var(--color-engine-version-text)',
                    backgroundColor: 'color-mix(in srgb, var(--color-engine-version-text) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-engine-version-text) 20%, transparent)',
                    borderRadius: 'calc(var(--radius) * 0.5)'
                  }}
                >
                  v{plugin.version}
                </span>
              )}
              {plugin.isBeta && <Badge label="Beta" color="#f59e0b" />}
              {plugin.isExperimental && <Badge label="Experimental" color="#a78bfa" />}
              {plugin.source === 'Project' ? (
                <Badge label={`Project: ${plugin.projectName}`} color="#10b981" />
              ) : (
                <Badge label="Engine" color="#06b6d4" />
              )}
            </div>
            <p className="text-[10px] line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
              {plugin.description || (plugin.createdBy ? `By ${plugin.createdBy}` : 'Engine plugin')}
            </p>
          </div>

          {/* Actions */}
          <div
            className="shrink-0 flex items-center gap-2.5 pl-3"
            style={{ borderLeft: '1px solid var(--color-border)' }}
          >
            {onToggleDefault && (
              <div
                className="flex items-center gap-1.5 shrink-0 px-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Default
                </span>
                <Toggle
                  checked={plugin.enabledByDefault !== false}
                  onChange={() => onToggleDefault(plugin)}
                />
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                window.electronAPI.openDirectory(plugin.path)
              }}
              className="shrink-0 p-1.5 cursor-pointer transition-all"
              style={{
                borderRadius: 'calc(var(--radius) * 0.6)',
                color: 'var(--color-text-muted)',
                backgroundColor: hovered ? 'var(--color-surface-card)' : 'transparent',
                border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}`
              }}
              title="Open folder"
            >
              <FolderOpen size={12} />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div
            className="px-3 pb-3 pt-1 border-t border-dashed flex flex-col gap-2 text-[10px]"
            style={{ borderColor: 'var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {plugin.description && (
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                {plugin.description}
              </p>
            )}
            {plugin.createdBy && (
              <p style={{ color: 'var(--color-text-muted)' }}>
                Created by:{' '}
                <span style={{ color: 'var(--color-text-secondary)' }}>{plugin.createdBy}</span>
              </p>
            )}
            {plugin.dependencies && plugin.dependencies.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span style={{ color: 'var(--color-text-muted)' }}>Dependencies:</span>
                {plugin.dependencies.map((d) => (
                  <span
                    key={d}
                    className="px-1 py-px font-mono text-[9px]"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      borderRadius: 'calc(var(--radius) * 0.4)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}
            {(plugin.docsUrl || plugin.supportUrl) && (
              <div className="flex gap-2 mt-1">
                {plugin.docsUrl && (
                  <button
                    onClick={() => window.open(plugin.docsUrl, '_blank')}
                    className="px-2 py-1 cursor-pointer transition-all hover:opacity-90 text-[10px]"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      color: '#fff',
                      borderRadius: 'calc(var(--radius) * 0.5)',
                      border: 'none',
                      fontWeight: 600
                    }}
                  >
                    Documentation
                  </button>
                )}
                {plugin.supportUrl && (
                  <button
                    onClick={() => window.open(plugin.supportUrl, '_blank')}
                    className="px-2 py-1 cursor-pointer transition-all hover:bg-neutral-800 text-[10px]"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-secondary)',
                      borderRadius: 'calc(var(--radius) * 0.5)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    Support URL
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)
PluginListCard.displayName = 'PluginListCard'

// ── Grid card ─────────────────────────────────────────────────────────────────
export const PluginGridCard = memo(
  ({
    plugin,
    onToggleDefault
  }: {
    plugin: EnginePlugin
    onToggleDefault?: (plugin: EnginePlugin) => void
  }): React.ReactElement => {
    const [hovered, setHovered] = useState(false)
    const [expanded, setExpanded] = useState(false)
    return (
      <div
        className="relative overflow-hidden cursor-pointer w-full aspect-square"
        onClick={() => setExpanded(!expanded)}
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-surface-card)',
          border: hovered ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
          transition: 'border-color 150ms ease'
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Full Background Thumbnail / Fallback */}
        <div className="absolute inset-0 z-0 opacity-20">
          <PluginThumb icon={plugin.icon} name={plugin.name} />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent z-1" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex gap-1 flex-wrap max-w-[90%]">
          {plugin.version && (
            <span
              className="text-[8px] font-mono px-1 py-px bg-black/40 border border-white/10"
              style={{
                borderRadius: 'calc(var(--radius) * 0.4)',
                color: 'var(--color-engine-version-text)'
              }}
            >
              v{plugin.version}
            </span>
          )}
          {plugin.isBeta && <Badge label="Beta" color="#f59e0b" />}
          {plugin.isExperimental && <Badge label="Exp" color="#a78bfa" />}
          {plugin.source === 'Project' ? (
            <Badge label="Proj" color="#10b981" />
          ) : (
            <Badge label="Eng" color="#06b6d4" />
          )}
        </div>

        {/* Folder open button */}
        {hovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.electronAPI.openDirectory(plugin.path)
            }}
            className="absolute top-2.5 right-2.5 p-1 z-10 cursor-pointer"
            style={{
              borderRadius: 'calc(var(--radius) * 0.5)',
              backgroundColor: 'rgba(0,0,0,0.65)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
            title="Open folder"
          >
            <FolderOpen size={10} />
          </button>
        )}

        {/* Bottom Info / Content Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-2.5 z-10 flex flex-col gap-1 justify-end h-[60%] bg-linear-to-t from-black/90 to-transparent">
          <p className="text-[11px] font-semibold text-white truncate" title={plugin.name}>
            {plugin.name}
          </p>
          <p
            className="text-[9px] line-clamp-2 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            {plugin.description || 'Engine plugin'}
          </p>

          {expanded && (
            <div
              className="pt-1.5 mt-1 border-t border-white/10 flex flex-col gap-1 text-[8px]"
              onClick={(e) => e.stopPropagation()}
            >
              {plugin.createdBy && (
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>By {plugin.createdBy}</p>
              )}
              {(plugin.docsUrl || plugin.supportUrl) && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {plugin.docsUrl && (
                    <button
                      onClick={() => window.open(plugin.docsUrl, '_blank')}
                      className="px-1.5 py-0.5 cursor-pointer text-[8px] font-semibold hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: '#fff',
                        borderRadius: 'calc(var(--radius) * 0.4)',
                        border: 'none'
                      }}
                    >
                      Docs
                    </button>
                  )}
                  {plugin.supportUrl && (
                    <button
                      onClick={() => window.open(plugin.supportUrl, '_blank')}
                      className="px-1.5 py-0.5 cursor-pointer text-[8px] hover:bg-neutral-800"
                      style={{
                        backgroundColor: 'transparent',
                        color: 'rgba(255,255,255,0.7)',
                        borderRadius: 'calc(var(--radius) * 0.4)',
                        border: '1px solid rgba(255,255,255,0.15)'
                      }}
                    >
                      Support
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {onToggleDefault && (
            <div
              className="flex items-center justify-between mt-1 pt-1 border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                EnabledByDefault
              </span>
              <Toggle
                checked={plugin.enabledByDefault !== false}
                onChange={() => onToggleDefault(plugin)}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
)
PluginGridCard.displayName = 'PluginGridCard'

// ── Category section ──────────────────────────────────────────────────────────
export const CategorySection = memo(
  ({
    category,
    plugins,
    viewMode,
    defaultOpen,
    forceOpen,
    onToggleDefault
  }: {
    category: string
    plugins: EnginePlugin[]
    viewMode: ViewMode
    defaultOpen: boolean
    forceOpen: boolean
    onToggleDefault?: (plugin: EnginePlugin) => void
  }): React.ReactElement => {
    const [open, setOpen] = useState(forceOpen || defaultOpen)
    const [prevForceOpen, setPrevForceOpen] = useState(forceOpen)

    if (forceOpen !== prevForceOpen) {
      setPrevForceOpen(forceOpen)
      if (forceOpen) setOpen(true)
    }
    return (
      <div className="mb-1">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors rounded"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--color-surface-card)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {open ? (
            <ChevronDown size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          ) : (
            <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          )}
          <span className="text-[11px] font-semibold flex-1 text-left">{category}</span>
          <span
            className="text-[9px] font-mono px-1.5 py-px"
            style={{
              borderRadius: 'calc(var(--radius) * 0.4)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)'
            }}
          >
            {plugins.length}
          </span>
        </button>
        {open &&
          (viewMode === 'grid' ? (
            <div
              className="grid gap-2 pt-1 px-1"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
            >
              {plugins.map((p) => (
                <PluginGridCard key={p.path} plugin={p} onToggleDefault={onToggleDefault} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1 pt-1 px-1">
              {plugins.map((p) => (
                <PluginListCard key={p.path} plugin={p} onToggleDefault={onToggleDefault} />
              ))}
            </div>
          ))}
      </div>
    )
  }
)
CategorySection.displayName = 'CategorySection'
