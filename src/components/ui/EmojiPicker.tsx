import { useEffect, useId, useMemo, useRef, useState } from 'react'

import {
  EMOJI_CATEGORIES,
  EMOJI_KEYWORDS,
  type EmojiCategory,
} from '../../data/emojiCatalog'

interface EmojiPickerProps {
  /** Emoji actuellement sélectionné. */
  value: string
  /** Appelé avec le nouvel emoji choisi. */
  onChange: (emoji: string) => void
  /** Libellé du champ (au-dessus du bouton). Par défaut « Emoji ». */
  label?: string
  /** Emoji affiché en filigrane quand aucun n'est choisi. */
  placeholder?: string
}

/** Normalise une chaîne pour la recherche (minuscule, sans accents). */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Filtre les catégories selon la recherche. */
function filterCategories(query: string): EmojiCategory[] {
  const needle = normalize(query.trim())

  if (!needle) {
    return EMOJI_CATEGORIES
  }

  return EMOJI_CATEGORIES.map((category) => {
    // Une catégorie dont le libellé correspond est gardée entièrement.
    if (normalize(category.label).includes(needle)) {
      return category
    }

    const emojis = category.emojis.filter((emoji) => {
      if (emoji === query.trim()) {
        return true
      }

      const keywords = EMOJI_KEYWORDS[emoji] ?? []
      return keywords.some((keyword) => normalize(keyword).includes(needle))
    })

    return { ...category, emojis }
  }).filter((category) => category.emojis.length > 0)
}

/**
 * Sélecteur d'emoji : un bouton affichant l'emoji courant qui ouvre un
 * popover avec recherche et grille cliquable — pour choisir directement un
 * emoji sans copier-coller.
 */
export function EmojiPicker({
  value,
  onChange,
  label = 'Emoji',
  placeholder = '🏦',
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  const categories = useMemo(() => filterCategories(query), [query])

  // Fermeture au clic à l'extérieur et à la touche Échap. On capture Échap
  // en phase de capture et on stoppe sa propagation pour ne fermer que le
  // popover (et non la modale parente qui écoute aussi Échap).
  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [open])

  const handleSelect = (emoji: string) => {
    onChange(emoji)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <span id={labelId} className="text-sm font-bold text-slate-700">
        {label}
      </span>

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 px-4 text-xl font-medium outline-none transition hover:border-emerald-300 hover:bg-white focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
      >
        {value ? (
          <span>{value}</span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choisir un emoji"
          className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[80vw] rounded-2xl border border-stone-200 bg-white p-3 shadow-xl"
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher (banque, maison, voiture...)"
            aria-label="Rechercher un emoji"
            autoFocus
            className="mb-3 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />

          <div className="max-h-60 overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Aucun emoji trouvé.
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.label} className="mb-3 last:mb-0">
                  <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {category.label}
                  </p>

                  <div className="grid grid-cols-6 gap-1">
                    {category.emojis.map((emoji) => {
                      const selected = emoji === value

                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleSelect(emoji)}
                          aria-label={`Choisir ${emoji}`}
                          aria-pressed={selected}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                            selected ? 'bg-emerald-100 ring-2 ring-emerald-300' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
