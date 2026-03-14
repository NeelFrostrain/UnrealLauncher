import type React from 'react'

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div className="w-full h-full flex flex-col overflow-hidden">{children}</div>
}

export default PageWrapper
