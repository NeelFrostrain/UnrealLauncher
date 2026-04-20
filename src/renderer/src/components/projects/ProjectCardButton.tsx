// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import type { FC, ReactNode } from 'react'

const ProjectCardButton: FC<{
  icon: ReactNode
  onClick?: () => void
  title?: string
}> = ({ icon, onClick, title }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-md flex justify-center cursor-pointer items-center transition-colors shadow-lg"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)'
      }}
    >
      {icon}
    </button>
  )
}

export default ProjectCardButton
