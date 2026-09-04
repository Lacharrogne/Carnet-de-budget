import { describe, expect, it } from 'vitest'

import { buildTransactionRows, transactionsToCsv } from './exportService'
import type { Transaction } from '../types/budget'

const helpers = {
  getAccountName: (id?: string) => (id ? `Compte ${id}` : ''),
  getCategoryName: () => 'Courses',
}

const tx = (patch: Partial<Transaction> = {}): Transaction =>
  ({
    date: '2026-09-04',
    title: 'Carrefour',
    type: 'expense',
    accountId: 'A',
    amount: 12.5,
    note: '',
    ...patch,
  }) as unknown as Transaction

const dataLine = (csv: string) => csv.split('\r\n')[1]

describe('transactionsToCsv — compatibilité tableur français', () => {
  it('sépare les colonnes par des points-virgules', () => {
    const csv = transactionsToCsv(buildTransactionRows([tx()], helpers))
    expect(csv.split('\r\n')[0]).toContain('Date;Titre;Type')
  })

  it('écrit les montants avec une virgule décimale et deux décimales', () => {
    const csv = transactionsToCsv(buildTransactionRows([tx({ amount: 1234.5 })], helpers))
    expect(dataLine(csv)).toContain('1234,50')
    // Un point décimal serait lu comme du texte par Excel en locale française.
    expect(dataLine(csv)).not.toContain('1234.5')
  })

  it('formate les dates en jour/mois/année', () => {
    const csv = transactionsToCsv(buildTransactionRows([tx()], helpers))
    expect(dataLine(csv)).toContain('04/09/2026')
  })

  it('sépare les lignes par un retour chariot Windows', () => {
    const csv = transactionsToCsv(buildTransactionRows([tx(), tx()], helpers))
    expect(csv.split('\r\n')).toHaveLength(3)
  })
})

describe('transactionsToCsv — libellés qui casseraient le fichier', () => {
  it('protège un libellé contenant un point-virgule', () => {
    const csv = transactionsToCsv(
      buildTransactionRows([tx({ title: 'Achat; remise' })], helpers),
    )
    expect(dataLine(csv)).toContain('"Achat; remise"')
  })

  it('double les guillemets internes', () => {
    const csv = transactionsToCsv(
      buildTransactionRows([tx({ title: 'Le "bon" coin' })], helpers),
    )
    expect(dataLine(csv)).toContain('"Le ""bon"" coin"')
  })

  it('protège un libellé contenant un saut de ligne', () => {
    const csv = transactionsToCsv(
      buildTransactionRows([tx({ title: 'Ligne1\nLigne2' })], helpers),
    )
    expect(csv).toContain('"Ligne1\nLigne2"')
  })
})

describe('buildTransactionRows', () => {
  it('renseigne le compte destinataire pour un virement seulement', () => {
    const [virement] = buildTransactionRows(
      [tx({ type: 'transfer', toAccountId: 'B' })],
      helpers,
    )
    expect(virement.toAccount).toBe('Compte B')

    const [depense] = buildTransactionRows([tx({ toAccountId: 'B' })], helpers)
    expect(depense.toAccount).toBe('')
  })

  it('remplace une note absente par une chaîne vide', () => {
    const [row] = buildTransactionRows([tx({ note: undefined })], helpers)
    expect(row.note).toBe('')
  })
})
