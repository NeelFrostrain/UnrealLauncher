// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
export const formatVersion = (v: string): string => {
  if (!v || v === 'Unknown') return '?'
  if (v.startsWith('{') || v.length > 12) return 'Custom'
  return v
}

export const formatDate = (d: string): string => {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return d
  }
}

export const showErrorToast = (message: string): void => {
  const msg = document.createElement('div')
  msg.textContent = message
  Object.assign(msg.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '99999',
    background: 'var(--color-surface-elevated)',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '12px',
    maxWidth: '360px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
  })
  document.body.appendChild(msg)
  setTimeout(() => msg.remove(), 5000)
}
