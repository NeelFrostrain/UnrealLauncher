// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState } from 'react'
import { Package } from 'lucide-react'

interface AssetIconProps {
  icon: string | null
  thumbnailUrl: string | null
  name: string
}

const AssetIcon = ({ icon, thumbnailUrl, name }: AssetIconProps): React.ReactElement => {
  const [failed, setFailed] = useState(false)
  const src = !failed ? (icon ? `local-asset:///${icon.replace(/\\/g, '/')}` : thumbnailUrl) : null

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="w-12 h-12 object-cover shrink-0"
        style={{ borderRadius: 'var(--radius)' }}
        loading="lazy"
        decoding="async"
      />
    )
  }
  return (
    <div
      className="w-12 h-12 flex items-center justify-center shrink-0"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)'
      }}
    >
      <Package size={20} style={{ color: 'var(--color-accent)' }} />
    </div>
  )
}

export default AssetIcon
