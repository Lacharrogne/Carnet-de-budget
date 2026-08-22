import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'

export type ButtonVariant =
  | 'primary'
  | 'dark'
  | 'secondary'
  | 'soft'
  | 'ghost'
  | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BASE_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-full text-center font-bold transition duration-200 outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-emerald-700',
  dark: 'bg-emerald-950 text-white shadow-sm hover:-translate-y-0.5 hover:bg-emerald-900',
  secondary:
    'bg-white text-slate-600 shadow-sm ring-1 ring-stone-200 hover:-translate-y-0.5 hover:bg-stone-50 hover:text-slate-900',
  soft: 'bg-emerald-50 text-emerald-800 hover:-translate-y-0.5 hover:bg-emerald-100',
  ghost: 'text-slate-500 hover:bg-stone-100 hover:text-slate-900',
  danger:
    'bg-white text-slate-600 shadow-sm ring-1 ring-stone-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3',
}

type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

type CommonProps = StyleProps & {
  children: ReactNode
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

type ButtonAsLink = CommonProps & {
  to: string
}

export type ButtonProps = ButtonAsButton | ButtonAsLink

function buildClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: StyleProps) {
  return [
    BASE_CLASS,
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export default function Button(props: ButtonProps) {
  if ('to' in props && props.to) {
    const { to, variant, size, fullWidth, className, children } = props

    return (
      <Link
        to={to}
        className={buildClassName({ variant, size, fullWidth, className })}
      >
        {children}
      </Link>
    )
  }

  const { variant, size, fullWidth, className, children, ...buttonProps } =
    props as ButtonAsButton

  return (
    <button
      className={buildClassName({ variant, size, fullWidth, className })}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
