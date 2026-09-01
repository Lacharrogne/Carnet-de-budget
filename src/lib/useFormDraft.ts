import { useEffect, useRef } from 'react'

import { clearFormDraft, loadFormDraft, saveFormDraft } from './formDraft'

type UseFormDraftOptions<T> = {
  /** Clé de stockage unique du brouillon. */
  key: string
  /** Valeurs courantes du formulaire. */
  values: T
  /** Le formulaire est-il ouvert ? */
  isOpen: boolean
  /** Édition d'un élément existant ? (pas de brouillon dans ce cas). */
  isEditing: boolean
  /** La saisie mérite-t-elle d'être conservée ? */
  hasContent: (values: T) => boolean
  /**
   * Conditions requises pour tenter la restauration (ex : comptes chargés).
   * La restauration au montage attend que `ready` soit vrai.
   */
  ready?: boolean
  /** Rouvre le formulaire pré-rempli avec le brouillon récupéré. */
  onRestore: (values: T) => void
}

/**
 * Persiste la saisie d'un formulaire d'AJOUT et la restaure au retour dans
 * l'app (typiquement après un rechargement de page quand on quitte puis revient
 * sur mobile). Rien n'est persisté en édition d'un élément existant.
 */
export function useFormDraft<T>({
  key,
  values,
  isOpen,
  isEditing,
  hasContent,
  ready = true,
  onRestore,
}: UseFormDraftOptions<T>) {
  const hasRestored = useRef(false)
  // On garde la dernière version d'onRestore sans en refaire une dépendance.
  const onRestoreRef = useRef(onRestore)
  onRestoreRef.current = onRestore

  // Restauration au montage (une seule fois, dès que `ready`).
  useEffect(() => {
    if (hasRestored.current || !ready) return
    hasRestored.current = true

    const draft = loadFormDraft<T>(key)
    if (draft && hasContent(draft)) {
      onRestoreRef.current(draft)
    }
    // hasContent est stable (défini au module) ; key ne change pas.
  }, [key, ready, hasContent])

  // Sauvegarde continue pendant la saisie d'un ajout.
  useEffect(() => {
    if (!isOpen || isEditing) return
    if (hasContent(values)) {
      saveFormDraft(key, values)
    }
  }, [key, isOpen, isEditing, values, hasContent])

  return {
    clearDraft: () => clearFormDraft(key),
  }
}
