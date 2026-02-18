'use client'

import { cn } from '@/lib/utils'
import type { Toast } from '@/types'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles = {
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  error: 'bg-red-50 text-red-800 ring-red-200',
  info: 'bg-blue-50 text-blue-800 ring-blue-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
}

const iconStyles = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = icons[toast.type]

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg ring-1 ring-inset',
        'animate-in slide-in-from-right-5 duration-300',
        styles[toast.type],
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', iconStyles[toast.type])} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}
