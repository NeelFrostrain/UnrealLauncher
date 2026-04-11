// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
export const generateGradient = (): string => {
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

  const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const dirKey = random(Object.keys(directions))
  const from = random(colors)

  // Logic to prevent solid colors
  let to = random(colors)
  while (to === from) {
    to = random(colors)
  }

  return `linear-gradient(${directions[dirKey]}, ${from}, ${to})`
}
