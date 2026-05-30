// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { Plus, RefreshCw } from 'lucide-react'
import type { FC } from 'react'

interface PageTitleBarProps {
  title: string
  showAddButton?: boolean
  showScanButton?: boolean
  description: string
  addButtonText?: string
  scanButtonText?: string
  onAdd?: () => void
  onScan?: () => void
  scanning?: boolean
}

const PageTitleBar: FC<PageTitleBarProps> = ({
  title,
  showAddButton,
  showScanButton,
  description,
  addButtonText = 'Add',
  scanButtonText = 'Scan',
  onAdd,
  onScan,
  scanning = false
}) => {
  return (
    <div className="w-full h-fit mt-1 px-2 flex justify-between items-center">
      <div>
        <h1 className="font-semibold text-xl" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
        <p className="text-sm mt-px" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
      </div>
      <div className="flex gap-2">
        {showScanButton && (
          <button
            onClick={onScan}
            disabled={scanning}
            className={`cursor-pointer flex justify-center items-center px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
              scanning ? 'cursor-not-allowed' : ''
            }`}
            style={{
              backgroundColor: 'var(--color-surface-card)',
              borderColor: 'var(--color-border)',
              color: scanning ? 'var(--color-text-muted)' : 'var(--color-text-secondary)'
            }}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : scanButtonText}
          </button>
        )}
        {showAddButton && (
          <button
            onClick={onAdd}
            className="cursor-pointer flex justify-center items-center px-4 py-2 rounded-md text-sm font-medium border border-transparent transition-all duration-200"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {addButtonText}
          </button>
        )}
      </div>
    </div>
  )
}

export default PageTitleBar
