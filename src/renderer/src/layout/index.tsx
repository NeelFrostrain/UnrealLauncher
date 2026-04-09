import { motion } from 'framer-motion'
import React from 'react'
import { Sidebar, Titlebar } from '../components'

const LayoutWrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  return (
    <motion.div
      className="w-screen h-screen bg-black text-white p-px overflow-hidden select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="w-full h-full bg-white/10 p-0.5">
        <div className="w-full h-full bg-black/50 p-0.5">
          <div className="w-full h-full bg-[#242424] flex flex-col">
            <div className="flex-1 flex min-h-0">
              <Sidebar />
              <div className="flex-1 min-h-0 flex flex-col">
                <Titlebar />
                <div className="flex-1 min-h-0 p-3.5 pt-1">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default LayoutWrapper
