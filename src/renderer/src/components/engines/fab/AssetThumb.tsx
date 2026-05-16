// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState } from 'react'
import { Package } from 'lucide-react'

export const AssetThumb = ({
  icon, thumbnailUrl, name
}: { icon: string | null; thumbnailUrl: string | null; name: string }): React.ReactElement => {
  const [failed, setFailed] = useState(false)
  const src = !failed
    ? thumbnailUrl || (icon ? `local-asset:///${icon.replace(/\\/g, '/')}` : null)
    : null

  if (src) {
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
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' }}
    >
      <Package size={32} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
    </div>
  )
}
