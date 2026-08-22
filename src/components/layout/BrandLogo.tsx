import { useState } from 'react'

import { LOGO_SRC } from '../../data/brand'

type BrandLogoProps = {
  /** Taille / forme du logo (ex. `h-12 w-12`). */
  className?: string
  /** Classes du repli « CB » (taille du texte), si l'image ne charge pas. */
  fallbackTextClassName?: string
  alt?: string
}

/**
 * Logo de marque de Carnet de budget (avatar rond « Chloé »). Si l'image
 * `/logo.png` est absente ou échoue, on retombe proprement sur le badge « CB »
 * en dégradé émeraude — rien ne casse tant que le logo n'est pas déposé.
 */
export default function BrandLogo({
  className = '',
  fallbackTextClassName = '',
  alt = 'Carnet de budget',
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      <img
        src={LOGO_SRC}
        alt={alt}
        onError={() => setFailed(true)}
        className={`object-contain ${className}`}
      />
    )
  }

  return (
    <span
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-950 to-teal-900 font-display font-bold text-amber-200 ring-1 ring-white/10 ${className} ${fallbackTextClassName}`}
    >
      CB
    </span>
  )
}
