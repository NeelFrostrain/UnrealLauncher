// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Engine gradient generation for UI display.
 */

export function generateGradient(): string {
  const directions: Record<string, string> = {
    'to-t': 'to top',
    'to-tr': 'to top right',
    'to-r': 'to right',
    'to-br': 'to bottom right',
    'to-b': 'to bottom',
    'to-bl': 'to bottom left',
    'to-l': 'to left',
    'to-tl': 'to top left'
  }
  const colors = [
    '#2563eb',
    '#4f46e5',
    '#06b6d4',
    '#10b981',
    '#7c3aed',
    '#c026d3',
    '#f43f5e',
    '#f59e0b'
  ]
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const dirKey = pick(Object.keys(directions))
  const from = pick(colors)
  let to = pick(colors)
  while (to === from) to = pick(colors)
  return `linear-gradient(${directions[dirKey]}, ${from}, ${to})`
}

export function compareVersions(a: string, b: string): boolean {
  const va = a.split('.').map(Number)
  const vb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    if ((va[i] || 0) > (vb[i] || 0)) return true
    if ((va[i] || 0) < (vb[i] || 0)) return false
  }
  return false
}
