import { motion } from 'framer-motion'
import type React from 'react'

const PageWrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  return (
    <motion.div
      className="w-full h-full flex flex-col overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default PageWrapper
