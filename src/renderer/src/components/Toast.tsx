import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

const Toast = ({ message, type, duration = 4000, onClose }: ToastProps): React.ReactElement => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300) // Wait for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'text-green-400 bg-green-500/10 border-green-500/20',
    error: 'text-red-400 bg-red-500/10 border-red-500/20',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  }

  const Icon = icons[type]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg ${colors[type]} max-w-md`}
        >
          <Icon size={20} />
          <p className="text-sm font-medium flex-1">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>
  onRemove: (id: string) => void
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps): React.ReactElement => {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </>
  )
}

export default Toast
