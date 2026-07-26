// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Heart,
  MessageSquare,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

const BINANCE_DETAILS = {
  network: 'BNB Smart Chain (BEP20)',
  address: '0xcb7fdbcdbb0b558227c9fc91fd6fd848748dca61',
  note: 'Don’t send NFTs to this address.'
}

export function SupportModal({ isOpen, onClose }: SupportModalProps): React.ReactElement | null {
  const [showBinanceModal, setShowBinanceModal] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleOpenExternal = (url: string): void => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyAddress = (): void => {
    navigator.clipboard.writeText(BINANCE_DETAILS.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cardStyle = {
    backgroundColor: 'var(--color-surface-elevated)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)'
  } as const

  const DONATION_PLATFORMS = [
    {
      id: 'patreon',
      name: 'Patreon',
      desc: 'Become a Patron',
      url: 'https://www.patreon.com/cw/NeelFrostrain',
      color: '#FF424D',
      bg: 'linear-gradient(135deg, rgba(255,66,77,.18), rgba(255,66,77,.05))',
      border: 'rgba(255,66,77,.35)',
      hoverBorder: 'rgba(255,66,77,.8)',
      badgeBg: 'rgba(255,66,77,.18)',
      icon: <Heart size={16} fill="#FF424D" />
    },
    {
      id: 'binance',
      name: 'Binance',
      desc: 'Crypto donations',
      recommended: true,
      color: '#FCD535',
      bg: 'linear-gradient(135deg, rgba(252,213,53,.22), rgba(252,213,53,.08))',
      border: 'rgba(252,213,53,.5)',
      hoverBorder: 'rgba(252,213,53,.9)',
      badgeBg: 'rgba(252,213,53,.22)',
      icon: <Sparkles size={16} />
    }
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex flex-col overflow-hidden w-full select-none"
        style={{
          maxWidth: 640,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)'
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {showBinanceModal && (
            <button
              onClick={() => setShowBinanceModal(false)}
              className="p-1.5 rounded-lg transition-colors cursor-pointer mr-1"
              style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-card)' }}
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-base font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              {showBinanceModal ? 'Deposit USDT to Binance' : 'Support & Community'}
              <Sparkles size={14} style={{ color: '#FCD535' }} />
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {showBinanceModal
                ? 'Scan QR or copy address to send USDT via BNB Smart Chain'
                : 'Help keep Unreal Launcher free, open-source & fast'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer transition-colors rounded-lg"
            style={{
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--radius)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-card)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-muted)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content body */}
        <div className="py-5 px-4 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {showBinanceModal ? (
            /* Binance Deposit Detail View */
            <div className="flex flex-col items-center gap-5 p-5" style={cardStyle}>
              {/* Heading */}
              <div className="text-center">
                <h3 className="text-lg font-extrabold" style={{ color: '#FCD535' }}>
                  Deposit USDT to Binance
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  BEP20 Network Transfer
                </p>
              </div>

              {/* QR Code display — real scannable QR code */}
              <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center justify-center border-4 border-[#FCD535]/40">
                <img
                  src={`https://quickchart.io/qr?text=${encodeURIComponent(
                    BINANCE_DETAILS.address
                  )}&size=240&margin=1`}
                  alt="Binance USDT BEP20 Deposit QR Code"
                  width={220}
                  height={220}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                />
              </div>

              {/* Deposit Details Table */}
              <div className="w-full space-y-3 pt-2">
                {/* Network row */}
                <div className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    Network
                  </span>
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                    {BINANCE_DETAILS.network}
                  </span>
                </div>

                {/* Address row with Copy button */}
                <div className="flex flex-col gap-1.5 p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      Wallet Address
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded cursor-pointer transition-all"
                      style={{
                        backgroundColor: copied ? 'rgba(74,222,128,0.2)' : 'rgba(252,213,53,0.2)',
                        color: copied ? '#4ade80' : '#FCD535',
                        border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'rgba(252,213,53,0.4)'}`
                      }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                  </div>
                  <span className="text-xs font-mono select-all break-all" style={{ color: '#FCD535' }}>
                    {BINANCE_DETAILS.address}
                  </span>
                </div>

                {/* Warning / Note */}
                <p className="text-[11px] text-center italic" style={{ color: 'var(--color-text-muted)' }}>
                  {BINANCE_DETAILS.note}
                </p>
              </div>

              {/* Binance Brand Banner */}
              <div className="flex items-center gap-2 pt-1">
                <Sparkles size={16} style={{ color: '#FCD535' }} />
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#FCD535' }}>
                  BINANCE
                </span>
              </div>
            </div>
          ) : (
            /* Main Support View */
            <>
              {/* Card section 1: Info */}
              <div className="p-4 flex flex-col gap-2" style={cardStyle}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} style={{ color: 'var(--color-accent)' }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      Developer Support
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}>
                    100% Free & Open Source
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  I built this launcher as an independent developer and continue to improve it in my spare time. If you enjoy using it, your support helps me dedicate more time to updates, new features, maintenance, and keeping the servers online. Thank you!
                </p>
              </div>

              {/* Card section 2: Premium Donation Buttons Grid */}
              <div className="p-4 flex flex-col gap-3" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Choose Platform
                  </span>
                  <CreditCard size={14} style={{ color: 'var(--color-text-muted)' }} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DONATION_PLATFORMS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        if (p.id === 'binance') {
                          setShowBinanceModal(true)
                        } else if (p.url) {
                          handleOpenExternal(p.url)
                        }
                      }}
                      className="group relative flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 hover:shadow-md text-left overflow-hidden"
                      style={{
                        background: p.bg,
                        border: `1px solid ${p.border}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = p.hoverBorder
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = p.border
                      }}
                    >
                      {/* Recommended Ribbon */}
                      {p.recommended && (
                        <div
                          className="absolute -top-1 -right-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-bl-lg shadow-sm"
                          style={{
                            backgroundColor: '#FCD535',
                            color: '#000000'
                          }}
                        >
                          Recommended★
                        </div>
                      )}

                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
                          style={{
                            backgroundColor: p.badgeBg,
                            color: p.color
                          }}
                        >
                          {p.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate flex items-center gap-1" style={{ color: p.color }}>
                            {p.name}
                          </span>
                          <span className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {p.desc}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 pl-1">
                        <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" style={{ color: p.color }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card section 3: Discord Community */}
              <div className="p-4 flex flex-col gap-3" style={cardStyle}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Feedback & Community
                </span>

                <button
                  onClick={() => handleOpenExternal('https://discord.gg')}
                  className="group flex items-center justify-between p-3.5 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md text-left"
                  style={{
                    background: 'linear-gradient(135deg, rgba(88, 101, 242, 0.18) 0%, rgba(88, 101, 242, 0.06) 100%)',
                    color: '#7289da',
                    border: '1px solid rgba(88, 101, 242, 0.4)'
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
                      style={{
                        backgroundColor: 'rgba(88, 101, 242, 0.2)',
                        color: '#7289da'
                      }}
                    >
                      <MessageSquare size={17} />
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs font-bold truncate" style={{ color: '#7289da' }}>
                        Join Discord Server
                      </span>
                      <span className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                        Share feedback, report bugs & chat with devs
                      </span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="transition-transform group-hover:scale-110 shrink-0 ml-2" style={{ color: '#7289da' }} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}
        >
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Thank you for supporting Unreal Launcher!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium cursor-pointer transition-all hover:opacity-80"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)'
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
