// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  Shield,
  Building2,
  ExternalLink,
  Check,
  X,
  Scale,
  Sparkles,
  AlertTriangle,
  Globe,
  User,
  BookOpen
} from 'lucide-react'
import config from '../../../../config'
import {
  CURRENT_LEGAL_VERSION,
  CURRENT_LEGAL_POLICY_VERSION,
  LEGAL_POLICY_UPDATED_DATE,
  TERMS_VERSION,
  PRIVACY_VERSION,
  COMPANY_INFO,
  TERMS_HIGHLIGHTS,
  PRIVACY_HIGHLIGHTS
} from '../../utils/legalConstants'
import { setSetting } from '../../utils/settings'
import { Tabs, type TabItem } from './Tabs'

export type LegalTabType = 'terms' | 'privacy' | 'company'

interface LegalModalProps {
  isOpen: boolean
  isMandatory?: boolean
  initialTab?: LegalTabType
  onClose?: () => void
  onAccept?: () => void
}

/**
 * Custom Checkbox Component matching the launcher's design system
 */
function CustomCheckbox({
  checked,
  onChange,
  label,
  id
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: React.ReactNode
  id?: string
}): React.ReactElement {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      id={id}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onChange(!checked)
        }
      }}
      className="flex items-center gap-2.5 cursor-pointer select-none group"
    >
      <div
        className="w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all duration-200 shrink-0 border"
        style={{
          backgroundColor: checked
            ? 'var(--color-accent)'
            : 'color-mix(in srgb, var(--color-surface-card) 90%, transparent)',
          borderColor: checked ? 'var(--color-accent)' : 'var(--color-border)',
          boxShadow: checked
            ? '0 0 10px color-mix(in srgb, var(--color-accent) 40%, transparent)'
            : 'none'
        }}
      >
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <div
        className="text-xs transition-colors group-hover:text-[var(--color-text-primary)]"
        style={{
          color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
        }}
      >
        {label}
      </div>
    </div>
  )
}

export function LegalModal({
  isOpen,
  isMandatory = false,
  initialTab = 'terms',
  onClose,
  onAccept
}: LegalModalProps): React.ReactElement | null {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab)
  const [hasAgreed, setHasAgreed] = useState(false)

  if (!isOpen) return null

  const handleOpenExternal = (url: string): void => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleAccept = (): void => {
    setSetting('acceptedLegalVersion', CURRENT_LEGAL_VERSION)
    if (onAccept) onAccept()
    if (onClose) onClose()
  }

  const tabs: TabItem<LegalTabType>[] = [
    {
      id: 'terms',
      label: `Terms of Service (v${TERMS_VERSION})`,
      icon: <FileText size={14} />
    },
    {
      id: 'privacy',
      label: `Privacy Policy (v${PRIVACY_VERSION})`,
      icon: <Shield size={14} />
    },
    {
      id: 'company',
      label: 'Company & Ownership',
      icon: <Building2 size={14} />
    }
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 select-none"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={(e) => {
        if (!isMandatory && e.target === e.currentTarget && onClose) {
          onClose()
        }
      }}
    >
      <div
        className="flex flex-col overflow-hidden w-full max-h-[90vh] shadow-2xl"
        style={{
          maxWidth: 720,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{
            borderBottom: '1px solid var(--color-border)',
            background:
              'linear-gradient(180deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
                color: 'var(--color-accent)'
              }}
            >
              <Scale size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Terms of Service & Privacy Policy
                </h2>
                <span
                  className="px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase tracking-wider"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                    color: 'var(--color-accent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)'
                  }}
                >
                  v{CURRENT_LEGAL_POLICY_VERSION}
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Published by{' '}
                <strong style={{ color: 'var(--color-text-secondary)' }}>
                  {COMPANY_INFO.name}
                </strong>{' '}
                • Updated {LEGAL_POLICY_UPDATED_DATE}
              </p>
            </div>
          </div>

          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)'
              }}
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Custom Tabs Navigation */}
        <div
          className="px-5 pt-3 pb-2 shrink-0"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <Tabs<LegalTabType>
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
          />
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[280px]">
          {/* Tab 1: Terms and Conditions */}
          {activeTab === 'terms' && (
            <div className="space-y-3.5">
              <div
                className="p-3.5 flex items-start gap-3 text-xs rounded-xl"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--color-accent) 8%, var(--color-surface-elevated))',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)'
                }}
              >
                <Sparkles
                  size={16}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--color-accent)' }}
                />
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Summary of Terms
                  </p>
                  <p className="mt-0.5">
                    Unreal Launcher is free, open-source software under the{' '}
                    <strong style={{ color: 'var(--color-text-primary)' }}>GNU GPLv3</strong>{' '}
                    license. By using this desktop application, you agree to the terms below and
                    acknowledge that this tool is not affiliated with Epic Games, Inc.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {TERMS_HIGHLIGHTS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                          color: 'var(--color-accent)'
                        }}
                      >
                        {idx + 1}
                      </span>
                      <h3
                        className="text-xs font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {item.title}
                      </h3>
                    </div>
                    <p
                      className="text-[11px] mt-1.5 leading-relaxed pl-7"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="p-3 rounded-xl flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-semibold">Full Terms Document:</span> Read the complete
                  legal agreement on GitHub.
                </div>
                <button
                  onClick={() =>
                    handleOpenExternal(
                      `${config.githubRepo || 'https://github.com/NeelFrostrain/UnrealLauncher'}/blob/main/TERMS_AND_CONDITIONS.md`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <BookOpen size={13} />
                  <span>Read TERMS_AND_CONDITIONS.md</span>
                  <ExternalLink size={11} className="opacity-60" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Privacy Policy */}
          {activeTab === 'privacy' && (
            <div className="space-y-3.5">
              <div
                className="p-3.5 flex items-start gap-3 text-xs rounded-xl"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--color-accent) 8%, var(--color-surface-elevated))',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)'
                }}
              >
                <Shield
                  size={16}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--color-accent)' }}
                />
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Local-First Privacy Architecture
                  </p>
                  <p className="mt-0.5">
                    Unreal Launcher is built with a local-first philosophy. Your project paths,
                    configurations, and engine registrations never leave your device except for
                    startup stability telemetry and voluntary user feedback.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {PRIVACY_HIGHLIGHTS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                          color: 'var(--color-accent)'
                        }}
                      >
                        {idx + 1}
                      </span>
                      <h3
                        className="text-xs font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {item.title}
                      </h3>
                    </div>
                    <p
                      className="text-[11px] mt-1.5 leading-relaxed pl-7"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="p-3 rounded-xl flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-semibold">Full Privacy Policy:</span> View the full privacy
                  disclosure.
                </div>
                <button
                  onClick={() =>
                    handleOpenExternal(
                      `${config.githubRepo || 'https://github.com/NeelFrostrain/UnrealLauncher'}/blob/main/PRIVACY_POLICY.md`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <BookOpen size={13} />
                  <span>Read PRIVACY_POLICY.md</span>
                  <ExternalLink size={11} className="opacity-60" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Company & Ownership */}
          {activeTab === 'company' && (
            <div className="space-y-3.5">
              {/* Studio Card */}
              <div
                className="p-4 rounded-xl space-y-3"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                        color: 'var(--color-accent)'
                      }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3
                        className="text-xs font-bold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {COMPANY_INFO.name}
                      </h3>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        Publishing Organization & Owner
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenExternal(COMPANY_INFO.website)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer hover:opacity-85"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                      color: 'var(--color-accent)'
                    }}
                  >
                    <Globe size={13} />
                    <span>Visit Website</span>
                    <ExternalLink size={11} className="opacity-60" />
                  </button>
                </div>

                <div
                  className="p-3 rounded-lg text-xs space-y-1.5"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Website URL</span>
                    <button
                      onClick={() => handleOpenExternal(COMPANY_INFO.website)}
                      className="font-mono text-xs underline cursor-pointer hover:opacity-80"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {COMPANY_INFO.website}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>License</span>
                    <span
                      className="font-semibold font-mono text-xs"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {COMPANY_INFO.license}
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Card */}
              <div
                className="p-4 rounded-xl space-y-3"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                        color: 'var(--color-accent)'
                      }}
                    >
                      <User size={20} />
                    </div>
                    <div>
                      <h3
                        className="text-xs font-bold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {COMPANY_INFO.creatorName}
                      </h3>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        Original Author & Core Maintainer
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenExternal(COMPANY_INFO.creatorGithub)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer hover:opacity-85"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <span>GitHub Profile</span>
                    <ExternalLink size={11} className="opacity-60" />
                  </button>
                </div>

                <div
                  className="p-3 rounded-lg text-xs space-y-1.5"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Contact Email</span>
                    <a
                      href={`mailto:${COMPANY_INFO.creatorEmail}`}
                      className="font-mono text-xs underline"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {COMPANY_INFO.creatorEmail}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Repository</span>
                    <button
                      onClick={() =>
                        handleOpenExternal(
                          config.githubRepo || 'https://github.com/NeelFrostrain/UnrealLauncher'
                        )
                      }
                      className="font-mono text-xs underline cursor-pointer"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      NeelFrostrain/UnrealLauncher
                    </button>
                  </div>
                </div>
              </div>

              {/* Trademark Disclaimer */}
              <div
                className="p-3.5 rounded-xl flex items-start gap-3 text-xs"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {COMPANY_INFO.trademarkDisclaimer}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="px-5 py-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3.5"
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}
        >
          {isMandatory ? (
            <>
              <CustomCheckbox
                id="legal-agree-checkbox"
                checked={hasAgreed}
                onChange={setHasAgreed}
                label={
                  <span>
                    I have reviewed and agree to the{' '}
                    <strong style={{ color: 'var(--color-text-primary)' }}>
                      Terms & Conditions
                    </strong>{' '}
                    and{' '}
                    <strong style={{ color: 'var(--color-text-primary)' }}>
                      Privacy Policy (v{CURRENT_LEGAL_POLICY_VERSION})
                    </strong>
                  </span>
                }
              />

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    if (window.electronAPI?.windowClose) {
                      window.electronAPI.windowClose()
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  Decline & Exit
                </button>
                <button
                  disabled={!hasAgreed}
                  onClick={handleAccept}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: '#ffffff',
                    boxShadow: hasAgreed
                      ? '0 2px 10px color-mix(in srgb, var(--color-accent) 40%, transparent)'
                      : 'none'
                  }}
                >
                  <Check size={13} strokeWidth={2.5} />
                  <span>Accept & Continue</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Policy Version: <strong>v{CURRENT_LEGAL_POLICY_VERSION}</strong> • Published by{' '}
                <strong>{COMPANY_INFO.name}</strong>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: '#ffffff'
                }}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
