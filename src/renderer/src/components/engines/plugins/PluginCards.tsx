// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, memo } from 'react'
import { FolderOpen, Package, ChevronRight } from 'lucide-react'
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
          left: checked ? 14 : 2,
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
        <Package size={15} style={{ color: 'var(--color-accent)', opacity: 0.5 }} />
      </div>
    )
  }
)
PluginThumb.displayName = 'PluginThumb'

// ── Badge ─────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color }: { label: string; color: string }): React.ReactElement => (
  <span
    className="shrink-0 text-[8px] font-medium uppercase px-1 py-0.5 tracking-wide"
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
    onToggleDefault,
    onShowDetails,
    selectMode,
    selected,
    onSelectToggle
  }: {
    plugin: EnginePlugin
    onToggleDefault?: (plugin: EnginePlugin) => void
    onShowDetails?: (plugin: EnginePlugin) => void
    selectMode?: boolean
    selected?: boolean
    onSelectToggle?: (path: string) => void
  }): React.ReactElement => {
    const [hovered, setHovered] = useState(false)
    const isDisabled = plugin.enabledByDefault === false
    return (
      <div
        className="w-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border"
        style={{
          background: selected
            ? 'color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-card))'
            : hovered
              ? 'rgba(255, 255, 255, 0.015)'
              : 'linear-gradient(180deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
          borderColor: selected
            ? 'var(--color-accent)'
            : hovered
              ? 'color-mix(in srgb, var(--color-accent) 25%, var(--color-border))'
              : 'var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: hovered ? '0 8px 24px rgba(0, 0, 0, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.15)',
          opacity: isDisabled ? 0.75 : 1
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          {selectMode && onSelectToggle && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onSelectToggle(plugin.path)}
              className="w-3.5 h-3.5 shrink-0 accent-(--color-accent) cursor-pointer"
            />
          )}

          {/* Thumbnail */}
          <div
            className="w-11 h-11 shrink-0 overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)'
            }}
          >
            <PluginThumb icon={plugin.icon} name={plugin.name} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
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
                  className="shrink-0 text-[8px] font-mono px-1.5 py-0.5"
                  style={{
                    color: 'var(--color-engine-version-text)',
                    backgroundColor:
                      'color-mix(in srgb, var(--color-engine-version-text) 10%, transparent)',
                    border:
                      '1px solid color-mix(in srgb, var(--color-engine-version-text) 20%, transparent)',
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
              {isDisabled && <Badge label="Disabled" color="#ef4444" />}
            </div>
            <p
              className="text-[10px] line-clamp-1 leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {plugin.description ||
                (plugin.createdBy ? `By ${plugin.createdBy}` : 'Engine plugin')}
            </p>
          </div>

          {/* Actions */}
          <div
            className="shrink-0 flex items-center gap-2.5 pl-2.5"
            style={{ borderLeft: '1px solid var(--color-border)' }}
          >
            {onToggleDefault && (
              <div className="flex items-center gap-1.5 shrink-0 px-1">
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Default
                </span>
                <Toggle checked={!isDisabled} onChange={() => onToggleDefault(plugin)} />
              </div>
            )}

            {onShowDetails && (
              <button
                onClick={() => onShowDetails(plugin)}
                className="shrink-0 p-1.5 cursor-pointer transition-all hover:bg-white/1.5 hover:text-(--color-text-primary)"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.6)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid transparent'
                }}
                title="View details"
              >
                <ChevronRight size={14} />
              </button>
            )}

            <button
              onClick={() => window.electronAPI.openDirectory(plugin.path)}
              className="shrink-0 p-1.5 cursor-pointer transition-all hover:bg-white/1.5 hover:text-(--color-text-primary)"
              style={{
                borderRadius: 'calc(var(--radius) * 0.6)',
                color: 'var(--color-text-muted)',
                border: '1px solid transparent'
              }}
              title="Open folder"
            >
              <FolderOpen size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }
)
PluginListCard.displayName = 'PluginListCard'

// ── Grid card ─────────────────────────────────────────────────────────────────
export const PluginGridCard = memo(
  ({
    plugin,
    onToggleDefault,
    onShowDetails,
    selectMode,
    selected,
    onSelectToggle
  }: {
    plugin: EnginePlugin
    onToggleDefault?: (plugin: EnginePlugin) => void
    onShowDetails?: (plugin: EnginePlugin) => void
    selectMode?: boolean
    selected?: boolean
    onSelectToggle?: (path: string) => void
  }): React.ReactElement => {
    const [hovered, setHovered] = useState(false)
    const isDisabled = plugin.enabledByDefault === false
    return (
      <div
        className="relative overflow-hidden w-full aspect-square border group transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
        style={{
          borderRadius: 'var(--radius)',
          background: selected
            ? 'color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-card))'
            : 'var(--color-surface-card)',
          borderColor: selected
            ? 'var(--color-accent)'
            : hovered
              ? 'color-mix(in srgb, var(--color-accent) 25%, var(--color-border))'
              : 'var(--color-border)',
          boxShadow: hovered ? '0 8px 24px rgba(0, 0, 0, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.15)',
          opacity: isDisabled ? 0.75 : 1
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onShowDetails?.(plugin)}
      >
        {/* Selection Checkbox */}
        {selectMode && onSelectToggle && (
          <div className="absolute top-2.5 left-2.5 z-20" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onSelectToggle(plugin.path)}
              className="w-3.5 h-3.5 accent-(--color-accent) cursor-pointer"
            />
          </div>
        )}

        {/* Full Background Thumbnail / Fallback */}
        <div className="absolute inset-0 z-0 opacity-20 transition-transform duration-500 group-hover:scale-110">
          <PluginThumb icon={plugin.icon} name={plugin.name} />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent z-1" />

        {/* Top Badges */}
        <div
          className="absolute top-2.5 z-10 flex gap-1 flex-wrap max-w-[70%]"
          style={{ left: selectMode ? '2.1rem' : '0.6rem' }}
        >
          {plugin.version && (
            <span
              className="text-[8px] font-mono px-1 py-0.5 bg-black/40 border border-white/10"
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
          {isDisabled && <Badge label="Off" color="#ef4444" />}
        </div>

        {/* Actions Overlay */}
        {hovered && (
          <div className="absolute top-2.5 right-2.5 z-10 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.electronAPI.openDirectory(plugin.path)
              }}
              className="p-1 cursor-pointer transition-colors hover:bg-white/[0.15]"
              style={{
                borderRadius: 'calc(var(--radius) * 0.5)',
                backgroundColor: 'rgba(0,0,0,0.75)',
                color: 'var(--color-text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(4px)'
              }}
              title="Open folder"
            >
              <FolderOpen size={11} />
            </button>
          </div>
        )}

        {/* Bottom Info / Content Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-2.5 z-10 flex flex-col gap-1 justify-end h-[60%] bg-linear-to-t from-black/90 to-transparent">
          <p className="text-[11px] font-semibold text-white truncate" title={plugin.name}>
            {plugin.name}
          </p>
          <p
            className="text-[9px] line-clamp-2 leading-relaxed font-normal"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            {plugin.description || 'Engine plugin'}
          </p>

          {onToggleDefault && (
            <div
              className="flex items-center justify-between mt-1 pt-1 border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                EnabledByDefault
              </span>
              <Toggle checked={!isDisabled} onChange={() => onToggleDefault(plugin)} />
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
    onToggleDefault,
    onShowDetails,
    selectMode,
    selectedPaths,
    onSelectToggle
  }: {
    category: string
    plugins: EnginePlugin[]
    viewMode: ViewMode
    defaultOpen: boolean
    forceOpen: boolean
    onToggleDefault?: (plugin: EnginePlugin) => void
    onShowDetails?: (plugin: EnginePlugin) => void
    selectMode?: boolean
    selectedPaths?: Set<string>
    onSelectToggle?: (path: string) => void
  }): React.ReactElement => {
    const [open, setOpen] = useState(forceOpen || defaultOpen)
    const [prevForceOpen, setPrevForceOpen] = useState(forceOpen)

    if (forceOpen !== prevForceOpen) {
      setPrevForceOpen(forceOpen)
      if (forceOpen) setOpen(true)
    }
    return (
      <div className="mb-1.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-1.5 px-1.5 py-1.5 cursor-pointer transition-colors rounded text-xs font-normal"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--color-surface-card)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {open ? (
            <ChevronRight
              size={12}
              style={{
                color: 'var(--color-accent)',
                flexShrink: 0,
                transform: 'rotate(90deg)',
                transition: 'transform 150ms'
              }}
            />
          ) : (
            <ChevronRight
              size={12}
              style={{
                color: 'var(--color-text-muted)',
                flexShrink: 0,
                transition: 'transform 150ms'
              }}
            />
          )}
          <span className="flex-1 text-left font-medium">{category}</span>
          <span
            className="text-[9px] font-mono px-1.5 py-px font-normal"
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
              className="grid gap-2 pt-1 px-0.5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))' }}
            >
              {plugins.map((p) => (
                <PluginGridCard
                  key={p.path}
                  plugin={p}
                  onToggleDefault={onToggleDefault}
                  onShowDetails={onShowDetails}
                  selectMode={selectMode}
                  selected={selectedPaths?.has(p.path)}
                  onSelectToggle={onSelectToggle}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 pt-1 px-0.5">
              {plugins.map((p) => (
                <PluginListCard
                  key={p.path}
                  plugin={p}
                  onToggleDefault={onToggleDefault}
                  onShowDetails={onShowDetails}
                  selectMode={selectMode}
                  selected={selectedPaths?.has(p.path)}
                  onSelectToggle={onSelectToggle}
                />
              ))}
            </div>
          ))}
      </div>
    )
  }
)
CategorySection.displayName = 'CategorySection'
