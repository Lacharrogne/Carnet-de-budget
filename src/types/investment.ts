export type InvestmentType =
  | 'etf'
  | 'stock'
  | 'crypto'
  | 'real_estate'
  | 'cash'
  | 'other'

export type Investment = {
  id: string
  title: string
  emoji: string
  type: InvestmentType
  platform: string
  investedAmount: number
  currentValue: number
  note?: string
}