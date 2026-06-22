import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Accessibilité des fenêtres modales (boîtes de dialogue).
 *
 * Renvoie une *ref de rappel* à attacher au panneau de la modale. À
 * l'ouverture, elle :
 * - place le focus à l'intérieur ;
 * - ferme la modale avec la touche Échap ;
 * - piège le focus (Tab / Maj+Tab bouclent dans la modale) ;
 * - bloque le défilement de l'arrière-plan ;
 * - restaure le focus sur l'élément précédent à la fermeture (nettoyage de
 *   la ref de rappel, React 19).
 *
 * `onClose` peut changer d'une frame à l'autre : on en garde la dernière
 * version via une ref (synchronisée dans un effet), lue uniquement dans le
 * gestionnaire clavier — jamais pendant le rendu.
 */
export function useDialogA11y<T extends HTMLElement>(onClose: () => void) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  return useCallback((node: T | null) => {
    if (!node) {
      return
    }

    const panel = node
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null)

    const focusables = getFocusable()

    if (focusables.length > 0) {
      focusables[0].focus()
    } else {
      panel.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const items = getFocusable()

      if (items.length === 0) {
        return
      }

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [])
}
