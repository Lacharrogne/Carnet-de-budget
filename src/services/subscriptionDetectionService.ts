import { getCategoryById } from './budgetStatsService'
import type {
  BudgetCategoryId,
  RecurringPayment,
  Transaction,
} from '../types/budget'

/**
 * Détection automatique des abonnements.
 *
 * On repère les dépenses qui reviennent régulièrement (même libellé, montant
 * stable, sur plusieurs mois) et qui ne sont pas encore suivies comme charges
 * fixes. L'idée : proposer à l'utilisateur de les transformer en abonnement
 * en un clic, sans rien deviner à sa place.
 */

export type SubscriptionCandidate = {
  /** Clé stable basée sur le libellé normalisé. */
  key: string
  /** Libellé affiché (celui de l'occurrence la plus récente). */
  title: string
  /** Montant mensuel représentatif (médiane des occurrences). */
  amount: number
  category: BudgetCategoryId
  accountId: string
  /** Jour du mois suggéré (le plus fréquent). */
  dayOfMonth: number
  /** Nombre de transactions repérées. */
  occurrences: number
  /** Nombre de mois distincts concernés. */
  monthsCount: number
  /** Date de la dernière occurrence (ISO). */
  lastDate: string
  /** Estimation du coût annuel. */
  yearlyEstimate: number
}

function removeAccents(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Normalise un libellé pour regrouper « Netflix », « NETFLIX 06 » ensemble. */
function normalizeTitle(title: string) {
  return removeAccents(title)
    .toLowerCase()
    .replace(/[0-9]+/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function mostFrequent<T>(values: T[]): T {
  const counts = new Map<T, number>()
  let best = values[0]
  let bestCount = 0

  for (const value of values) {
    const next = (counts.get(value) ?? 0) + 1
    counts.set(value, next)

    if (next > bestCount) {
      best = value
      bestCount = next
    }
  }

  return best
}

function getMonthKey(isoDate: string) {
  return isoDate.slice(0, 7)
}

function getDayOfMonth(isoDate: string) {
  const day = Number(isoDate.slice(8, 10))
  return Number.isFinite(day) && day >= 1 ? Math.min(day, 28) : 1
}

export function detectSubscriptions(
  transactions: Transaction[],
  recurringPayments: RecurringPayment[],
): SubscriptionCandidate[] {
  // Libellés déjà suivis comme charges fixes (pour ne rien proposer en double).
  const trackedTitles = new Set(
    recurringPayments.map((payment) => normalizeTitle(payment.title)),
  )

  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue
    }

    const key = normalizeTitle(transaction.title)

    if (key.length < 2 || trackedTitles.has(key)) {
      continue
    }

    const group = groups.get(key)

    if (group) {
      group.push(transaction)
    } else {
      groups.set(key, [transaction])
    }
  }

  const candidates: SubscriptionCandidate[] = []

  for (const [key, group] of groups) {
    const months = new Set(group.map((item) => getMonthKey(item.date)))

    // Un abonnement, c'est au moins deux prélèvements sur deux mois distincts.
    if (months.size < 2) {
      continue
    }

    const amounts = group.map((item) => item.amount)
    const representativeAmount = median(amounts)

    if (representativeAmount <= 0) {
      continue
    }

    // Montant stable d'un mois sur l'autre (tolérance : 2 € ou 20 %).
    const tolerance = Math.max(2, representativeAmount * 0.2)
    const isStable = amounts.every(
      (amount) => Math.abs(amount - representativeAmount) <= tolerance,
    )

    if (!isStable) {
      continue
    }

    const sortedByDate = [...group].sort((a, b) => b.date.localeCompare(a.date))
    const latest = sortedByDate[0]

    candidates.push({
      key,
      title: latest.title,
      amount: Math.round(representativeAmount * 100) / 100,
      category: mostFrequent(group.map((item) => item.category)),
      accountId: latest.accountId,
      dayOfMonth: mostFrequent(group.map((item) => getDayOfMonth(item.date))),
      occurrences: group.length,
      monthsCount: months.size,
      lastDate: latest.date,
      yearlyEstimate: Math.round(representativeAmount * 12),
    })
  }

  return candidates.sort((a, b) => b.yearlyEstimate - a.yearlyEstimate)
}

/** Emoji de la catégorie d'un candidat (pour l'affichage). */
export function getCandidateEmoji(candidate: SubscriptionCandidate) {
  return getCategoryById(candidate.category).emoji
}
