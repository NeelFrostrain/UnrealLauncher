// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useState } from 'react'
import {
  GitBranch,
  BookOpen,
  Code,
  MessageCircle,
  AlertTriangle,
  ExternalLink,
  Activity,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  Heart,
  Terminal,
  CheckCircle2
} from 'lucide-react'
import PageWrapper from '../layout/PageWrapper'
import { useAppVersion } from '../hooks'
import config from '../../../config'
import { Tabs } from '../components/ui/Tabs'
import type { TabItem } from '../components/ui/Tabs'
import {
  ARCHITECTURE_LAYERS,
  IPC_MODULES,
  STORAGE_ENTRIES,
  FEATURE_COUNTS,
  TECH_STACK,
  FEATURES
} from '../components/about/aboutConstants'

type TabType = 'overview' | 'features' | 'architecture' | 'tech' | 'storage'

export const AboutPage = ({ modal = false }: { modal?: boolean }): React.ReactElement => {
  const version = useAppVersion()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const STATS = [
    { label: 'Version', value: `v${version}` },
    { label: 'IPC Channels', value: '34+' },
    { label: 'Features', value: '58+' },
    { label: 'Native Backend', value: 'Rust (napi-rs)' }
  ]

  const LINKS = [
    {
      label: 'GitHub Repository',
      icon: GitBranch,
      url: config.githubRepo
    },
    {
      label: 'Changelog',
      icon: BookOpen,
      url: `${config.githubRepo}/blob/main/CHANGELOG.md`
    },
    {
      label: 'Contribute',
      icon: Code,
      url: `${config.githubRepo}/blob/main/CONTRIBUTING.md`
    },
    {
      label: 'Report Issue',
      icon: AlertTriangle,
      url: `${config.githubRepo}/issues`
    },
    {
      label: 'Discord Community',
      icon: MessageCircle,
      url: config.discordInvite
    },
    {
      label: 'Support / Ko-fi',
      icon: ExternalLink,
      url: config.kofi
    }
  ]

  const TABS: TabItem<TabType>[] = [
    { id: 'overview', label: 'Overview', icon: <Sparkles size={14} /> },
    { id: 'features', label: 'Feature Directory', icon: <Activity size={14} /> },
    { id: 'architecture', label: 'Architecture & IPC', icon: <Layers size={14} /> },
    { id: 'tech', label: 'Tech Stack', icon: <Cpu size={14} /> },
    { id: 'storage', label: 'Storage & Links', icon: <HardDrive size={14} /> }
  ]

  const content = (
    <div className={`space-y-5 pb-6 ${modal ? 'p-4' : ''}`}>
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden p-6 sm:p-7"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 14%, transparent), color-mix(in srgb, var(--color-accent) 4%, var(--color-surface-elevated)))',
          border: '1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border))',
          borderRadius: 'var(--radius)'
        }}
      >
        <div
          className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none"
          style={{ backgroundColor: 'var(--color-accent)', opacity: 0.08, filter: 'blur(45px)' }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full pointer-events-none"
          style={{ backgroundColor: 'var(--color-accent)', opacity: 0.06, filter: 'blur(35px)' }}
        />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2 max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                color: 'var(--color-accent)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                borderRadius: 'calc(var(--radius) * 2)'
              }}
            >
              <Sparkles size={13} />
              Unreal Launcher v{version}
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Engine & Project Management, Evolved
            </h1>
            <p
              className="text-xs sm:text-sm leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              A fast, lightweight Electron & Rust desktop app for discovering, launching,
              diagnosing, and managing Unreal Engine installations and projects — no Epic Games
              Launcher required.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 w-full md:w-auto shrink-0">
            {STATS.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col p-2.5 text-center md:text-left min-w-[120px]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 70%, transparent)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <span
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {label}
                </span>
                <span
                  className="text-xs sm:text-sm font-bold mt-0.5"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Standard Reusable Tabs Component */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabType)} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURE_COUNTS.map((item) => (
              <div
                key={item.category}
                className="p-3.5 flex items-center justify-between transition-all"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <div className="space-y-0.5">
                  <span
                    className="text-xs font-bold block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {item.category}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {item.count} Active modules
                  </span>
                </div>
                <span
                  className="px-2.5 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                    color: 'var(--color-accent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  +{item.count}
                </span>
              </div>
            ))}
          </div>

          {/* Key Highlight Features */}
          <div
            className="p-4 space-y-3"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <CheckCircle2 size={14} style={{ color: 'var(--color-accent)' }} />
              Core Capabilities Highlight
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {FEATURES.slice(0, 8).map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="p-3 flex items-start gap-3"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--color-surface-card) 60%, transparent)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div
                    className="p-2 shrink-0 mt-0.5"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                      color: 'var(--color-accent)',
                      borderRadius: 'calc(var(--radius) * 0.8)'
                    }}
                  >
                    <Icon size={15} />
                  </div>
                  <div>
                    <h3
                      className="text-xs font-semibold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {label}
                    </h3>
                    <p
                      className="text-[11px] leading-relaxed mt-0.5"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Feature Directory */}
      {activeTab === 'features' && (
        <div
          className="p-4 space-y-3"
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)'
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              All Built-In Features ({FEATURES.length})
            </h2>
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Unreal Launcher v{version}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="p-3 flex items-start gap-3"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 60%, transparent)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <div
                  className="p-2 shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    color: 'var(--color-accent)',
                    borderRadius: 'calc(var(--radius) * 0.8)'
                  }}
                >
                  <Icon size={15} />
                </div>
                <div>
                  <span
                    className="text-xs font-bold block"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {label}
                  </span>
                  <p
                    className="text-[11px] leading-relaxed mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Architecture & IPC */}
      {activeTab === 'architecture' && (
        <div className="space-y-5">
          {/* Architecture Layers */}
          <div className="space-y-2.5">
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              System Architecture Layers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ARCHITECTURE_LAYERS.map((layer) => (
                <div
                  key={layer.title}
                  className="p-3.5 space-y-2"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div
                    className="flex items-center gap-2 pb-2"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    />
                    <h3
                      className="text-xs font-bold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {layer.title}
                    </h3>
                  </div>
                  <ul className="space-y-1.5 pt-1">
                    {layer.items.map((item) => (
                      <li
                        key={item}
                        className="text-xs flex items-center gap-2"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <span
                          className="w-1 h-1 rounded-full opacity-60"
                          style={{ backgroundColor: 'var(--color-accent)' }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* IPC Modules Breakdown */}
          <div
            className="p-4 space-y-3"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Terminal size={14} />
              IPC Channel Dispatchers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {IPC_MODULES.map((mod) => (
                <div
                  key={mod.module}
                  className="p-3 space-y-2"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--color-surface-card) 60%, transparent)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <span
                    className="text-xs font-mono font-bold block"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {mod.module}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mod.channels.map((ch) => (
                      <span
                        key={ch}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text-muted)',
                          borderColor: 'var(--color-border)'
                        }}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tech Stack */}
      {activeTab === 'tech' && (
        <div
          className="p-4 space-y-3"
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)'
          }}
        >
          <h2
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Technologies & Frameworks
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {TECH_STACK.map(({ label }) => (
              <div
                key={label}
                className="p-3 flex items-center justify-between"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 60%, transparent)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <span
                  className="text-xs font-mono font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {label}
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Storage & Links */}
      {activeTab === 'storage' && (
        <div className="space-y-5">
          {/* Persistent Data Files */}
          <div
            className="p-4 space-y-3"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Data Storage Structure (userData)
            </h2>
            <div className="space-y-2">
              {STORAGE_ENTRIES.map(({ path, desc }) => (
                <div
                  key={path}
                  className="p-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--color-surface-card) 60%, transparent)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div className="space-y-0.5">
                    <span
                      className="text-xs font-mono font-bold block"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {path}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {desc}
                    </span>
                  </div>
                  <HardDrive size={15} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div
            className="p-4 space-y-3"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Community & Project Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {LINKS.map(({ label, icon: Icon, url }) => (
                <button
                  key={label}
                  onClick={() => window.electronAPI.openExternal(url)}
                  className="flex items-center justify-between p-2.5 text-xs font-medium border transition-all cursor-pointer hover:opacity-85"
                  style={{
                    color: 'var(--color-text-secondary)',
                    borderColor: 'var(--color-border)',
                    backgroundColor:
                      'color-mix(in srgb, var(--color-surface-card) 60%, transparent)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span>{label}</span>
                  </div>
                  <ExternalLink size={12} className="opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Credits */}
      <div className="pt-2 text-center space-y-1">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Unreal Launcher &bull; Created with{' '}
          <Heart size={12} className="inline text-red-400 mx-0.5" /> by{' '}
          <button
            onClick={() => window.electronAPI.openExternal('https://github.com/NeelFrostrain')}
            className="font-bold underline transition-colors cursor-pointer hover:opacity-80"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Neel Frostrain
          </button>
        </p>
        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          Copyright &copy; 2026 NeelFrostrain. Licensed under GNU GPLv3.
        </p>
      </div>
    </div>
  )

  if (modal) return content

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">{content}</div>
      </div>
    </PageWrapper>
  )
}

export default AboutPage
