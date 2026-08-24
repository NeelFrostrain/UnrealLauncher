// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'

const PageWrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  return <div className="w-full h-full flex flex-col overflow-hidden">{children}</div>
}

export default PageWrapper
