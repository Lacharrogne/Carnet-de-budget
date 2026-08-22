import type { ReactNode } from 'react'

// Classe de base partagée par tous les champs (input, select, textarea).
// Reprend le style historique des formulaires du carnet.
export const FIELD_CLASS =
  'h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100'

type FieldShellProps = {
  htmlFor?: string
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
  children: ReactNode
}

// Coquille commune : label au-dessus, champ, puis aide ou message d'erreur.
export default function FieldShell({
  htmlFor,
  label,
  hint,
  error,
  className = '',
  children,
}: FieldShellProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-sm font-bold text-slate-700"
        >
          {label}
        </label>
      )}

      {children}

      {error ? (
        <p className="mt-1.5 text-sm font-semibold text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
