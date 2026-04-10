import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

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

const config: Record<
  ToastType,
  { icon: React.ComponentType<{ size?: number; className?: string }>; bar: string; iconCls: string }
> = {
  success: { icon: CheckCircle, bar: 'bg-green-500', iconCls: 'text-green-400' },
  error: { icon: XCircle, bar: 'bg-red-500', iconCls: 'text-red-400' },
  warning: { icon: AlertTriangle, bar: 'bg-yellow-500', iconCls: 'text-yellow-400' },
  info: { icon: Info, bar: 'bg-blue-500', iconCls: 'text-blue-400' }
}

const ToastItem = ({
  toast,
  onRemove
}: {
  toast: Toast
  onRemove: (id: string) => void
}): React.ReactElement => {
  const { icon: Icon, bar, iconCls } = config[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-center gap-3 w-80 border shadow-2xl overflow-hidden pr-3"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        borderColor: 'var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
      {/* Left accent bar */}
      <div className={`w-1 self-stretch shrink-0 ${bar}`} />

      <Icon size={18} className={`shrink-0 ${iconCls}`} />

      <p
        className="flex-1 text-xs py-3 leading-relaxed"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {toast.message}
      </p>

      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded cursor-pointer transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export const ToastProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const addToast = useCallback((message: string, type: ToastType): void => {
    const id = String(++counter.current)
    setToasts((prev) => [...prev, { id, message, type }].slice(-5))
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
