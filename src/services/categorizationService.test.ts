import { describe, expect, it } from 'vitest'

import {
  buildHistoryIndex,
  normalizeLabel,
  suggestCategory,
} from './categorizationService'
import type { Transaction } from '../types/budget'

const tx = (
  title: string,
  category: string,
  type: 'expense' | 'income' | 'transfer' = 'expense',
): Transaction => ({ title, category, type }) as unknown as Transaction

describe('normalizeLabel', () => {
  it('met en minuscules, retire accents et ponctuation', () => {
    expect(normalizeLabel('  CARREFOUR  Márket-75 ')).toBe('carrefour market 75')
  })

  it('renvoie une chaîne vide pour un libellé sans lettres', () => {
    expect(normalizeLabel('!!! ***')).toBe('')
  })
})

describe('suggestCategory — dictionnaire de mots-clés', () => {
  it('reconnaît un salaire', () => {
    expect(suggestCategory('Virement SALAIRE septembre')).toBe('salary')
  })

  it('ne devine pas quand rien ne correspond', () => {
    expect(suggestCategory('Zzzz inconnu 1234')).toBeNull()
  })

  it('ne devine rien sur un libellé vide', () => {
    expect(suggestCategory('   ')).toBeNull()
  })
})

describe('buildHistoryIndex / suggestCategory — apprentissage', () => {
  it("retient la catégorie la plus fréquente pour un libellé", () => {
    const index = buildHistoryIndex([
      tx('Boulangerie Paul', 'groceries'),
      tx('Boulangerie Paul', 'groceries'),
      tx('Boulangerie Paul', 'restaurant'),
    ])
    expect(suggestCategory('boulangerie paul', index)).toBe('groceries')
  })

  it("ignore les virements internes dans l'apprentissage", () => {
    const index = buildHistoryIndex([tx('Vers Livret A', 'savings', 'transfer')])
    expect(index.size).toBe(0)
  })

  it("l'historique prime sur le dictionnaire de mots-clés", () => {
    // « salaire » serait classé en 'salary' par les mots-clés ; l'utilisateur
    // en a décidé autrement, son choix doit gagner.
    const index = buildHistoryIndex([
      tx('Salaire conjoint', 'other-income'),
      tx('Salaire conjoint', 'other-income'),
    ])
    expect(suggestCategory('Salaire conjoint', index)).toBe('other-income')
  })

  it('rapproche un libellé connu contenu dans un nouveau', () => {
    const index = buildHistoryIndex([
      tx('Carrefour', 'groceries'),
      tx('Carrefour', 'groceries'),
    ])
    expect(suggestCategory('CARREFOUR MARKET PARIS 11', index)).toBe('groceries')
  })

  it('ne rapproche pas sur un fragment trop court (risque de faux positif)', () => {
    const index = buildHistoryIndex([tx('EDF', 'utilities')])
    // « edf » fait 3 caractères : sous le seuil, on ne rapproche pas.
    expect(suggestCategory('Fedex livraison', index)).toBeNull()
  })
})
