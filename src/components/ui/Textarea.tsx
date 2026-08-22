import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react'

import FieldShell, { FIELD_CLASS } from './FieldShell'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  wrapperClassName?: string
}

export default function Textarea({
  label,
  hint,
  error,
  wrapperClassName = '',
  className = '',
  id,
  rows = 3,
  ...rest
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  // On repart de FIELD_CLASS mais sans la hauteur fixe (h-12) des champs simples.
  const base = FIELD_CLASS.replace('h-12', 'min-h-[3rem] py-3')

  return (
    <FieldShell
      htmlFor={textareaId}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <textarea
        id={textareaId}
        rows={rows}
        className={`${base} resize-y ${
          error ? 'border-rose-300 ring-2 ring-rose-100' : ''
        } ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}
