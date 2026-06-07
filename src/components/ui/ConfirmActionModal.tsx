import type { ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type ConfirmActionModalProps = {
  eyebrow?: string
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  icon?: ReactNode
  variant?: 'danger' | 'warning'
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmActionModal({
  eyebrow = 'Confirmation',
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  icon,
  variant = 'danger',
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  const variantClasses = {
    danger: {
      icon: 'bg-rose-50 text-rose-700',
      confirm: 'bg-rose-600 text-white hover:bg-rose-700',
      eyebrow: 'text-rose-600',
    },
    warning: {
      icon: 'bg-amber-50 text-amber-700',
      confirm: 'bg-amber-500 text-white hover:bg-amber-600',
      eyebrow: 'text-amber-600',
    },
  }

  const classes = variantClasses[variant]

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center">
      <button
        type="button"
        aria-label="Fermer la fenêtre de confirmation"
        onClick={onCancel}
        className="absolute inset-0 cursor-default"
      />

      <article className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-2xl">
        <div className="border-b border-stone-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`rounded-2xl p-3 ${classes.icon}`}>
                {icon ?? <AlertTriangle className="h-5 w-5" />}
              </div>

              <div>
                <p className={`text-sm font-semibold ${classes.eyebrow}`}>
                  {eyebrow}
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-full bg-stone-100 p-3 text-slate-500 transition hover:bg-stone-200 hover:text-slate-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 p-5 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-5 py-3 text-sm font-bold shadow-sm transition ${classes.confirm}`}
          >
            {confirmLabel}
          </button>
        </div>
      </article>
    </div>
  )
}