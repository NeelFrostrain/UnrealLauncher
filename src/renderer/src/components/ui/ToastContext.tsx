import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import InfoIcon from '@mui/icons-material/Info'
import CloseIcon from '@mui/icons-material/Close'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const config: Record<ToastType, { icon: React.ElementType; bar: string; iconCls: string }> = {
  success: { icon: CheckCircleIcon,  bar: 'bg-green-500',  iconCls: 'text-green-400' },
  error:   { icon: ErrorIcon,        bar: 'bg-red-500',    iconCls: 'text-red-400'   },
  warning: { icon: WarningAmberIcon, bar: 'bg-yellow-500', iconCls: 'text-yellow-400'},
  info:    { icon: InfoIcon,         bar: 'bg-blue-500',   iconCls: 'text-blue-400'  },
}

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }): React.ReactElement => {
  const { icon: Icon, bar, iconCls } = config[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-center gap-3 w-80 bg-[#1c1c1c] border border-white/10 rounded-lg shadow-2xl overflow-hidden pr-3"
    >
      {/* Left accent bar */}
      <div className={`w-1 self-stretch shrink-0 ${bar}`} />

      <Icon sx={{ fontSize: 18 }} className={`shrink-0 ${iconCls}`} />

      <p className="flex-1 text-xs text-white/85 py-3 leading-relaxed">{toast.message}</p>

      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded text-white/30 hover:text-white/70 transition-colors cursor-pointer"
      >
        <CloseIcon sx={{ fontSize: 14 }} />
      </button>
    </motion.div>
  )
}

export const ToastProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType): void => {
    const id = Date.now().toString()
    setToasts((prev) => {
      // Cap at 5 visible toasts
      const next = [...prev, { id, message, type }]
      return next.slice(-5)
    })
    // Auto-remove after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2 items-end select-auto pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
