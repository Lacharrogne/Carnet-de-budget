import type { BudgetCategoryId, Transaction } from '../types/budget'

/**
 * Auto-catégorisation d'une transaction à partir de son libellé.
 *
 * Deux sources, dans l'ordre :
 *  1. L'historique de l'utilisateur — si un libellé identique (ou très proche)
 *     a déjà été catégorisé, on réutilise sa catégorie la plus fréquente.
 *  2. Un dictionnaire de mots-clés (enseignes et termes courants en France).
 *
 * On ne devine jamais « à la place » de l'utilisateur : la suggestion reste
 * modifiable, et on renvoie `null` quand on n'est pas sûr.
 */

/** Normalise un libellé : minuscules, sans accents, espaces compactés. */
export function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Règles mots-clés, dans l'ordre de priorité (les plus spécifiques d'abord).
const RULES: { category: BudgetCategoryId; keywords: string[] }[] = [
  {
    category: 'salary',
    keywords: ['salaire', 'paie', 'paye', 'remuneration', 'employeur', 'traitement'],
  },
  {
    category: 'subscriptions',
    keywords: [
      'netflix', 'spotify', 'deezer', 'canal', 'disney', 'prime video',
      'amazon prime', 'youtube premium', 'adobe', 'icloud', 'microsoft 365',
      'office 365', 'abonnement', 'free ', 'orange', 'sfr', 'bouygues', 'sosh',
      'red by sfr', 'dropbox', 'audible', 'molotov',
    ],
  },
  {
    category: 'transport',
    keywords: [
      'sncf', 'uber', 'bolt', 'blablacar', 'ratp', 'navigo', 'velib', 'lime',
      'essence', 'carburant', 'total', 'totalenergies', 'esso', 'shell', 'bp ',
      'station service', 'parking', 'peage', 'autoroute', 'vinci', 'sanef',
      'aire de', 'flixbus', 'ouigo',
    ],
  },
  {
    category: 'groceries',
    keywords: [
      'carrefour', 'leclerc', 'lidl', 'auchan', 'intermarche', 'monoprix',
      'franprix', 'casino', 'super u', 'hyper u', 'supermarche', 'aldi',
      'biocoop', 'picard', 'grand frais', 'naturalia', 'cora', 'g20', 'spar',
    ],
  },
  {
    category: 'restaurant',
    keywords: [
      'restaurant', 'resto', 'mcdo', 'mcdonald', 'burger', 'kfc', 'pizza',
      'sushi', 'uber eats', 'deliveroo', 'just eat', 'boulangerie', 'cafe',
      'brasserie', 'starbucks', 'subway', 'traiteur', 'kebab', 'bar ',
    ],
  },
  {
    category: 'health',
    keywords: [
      'pharmacie', 'docteur', 'medecin', 'dentiste', 'hopital', 'clinique',
      'mutuelle', 'opticien', 'laboratoire', 'osteo', 'kine', 'cpam',
      'ophtalmo', 'infirmier',
    ],
  },
  {
    category: 'housing',
    keywords: [
      'loyer', 'edf', 'engie', 'gdf', 'veolia', 'suez', 'electricite',
      'assurance habitation', 'foncia', 'syndic', 'charges', 'nexity',
      'total energies gaz', 'eau ', 'gaz ',
    ],
  },
  {
    category: 'shopping',
    keywords: [
      'amazon', 'zara', 'h&m', 'zalando', 'fnac', 'darty', 'boulanger',
      'ikea', 'action', 'primark', 'sephora', 'decathlon', 'leroy merlin',
      'cdiscount', 'aliexpress', 'vinted', 'shein', 'kiabi', 'gifi', 'normal',
    ],
  },
  {
    category: 'leisure',
    keywords: [
      'cinema', 'ugc', 'pathe', 'theatre', 'musee', 'concert', 'steam',
      'playstation', 'nintendo', 'xbox', 'spotify concerts', 'fitness',
      'basic fit', 'salle de sport', 'piscine', 'bowling', 'parc',
    ],
  },
  {
    category: 'debt',
    keywords: ['credit', 'pret', 'remboursement pret', 'echeance', 'cofidis', 'cetelem', 'sofinco'],
  },
  {
    category: 'investment',
    keywords: ['bourse', 'etf', 'crypto', 'binance', 'coinbase', 'pea', 'assurance vie', 'trade republic', 'boursorama invest'],
  },
  {
    category: 'savings',
    keywords: ['epargne', 'livret', 'versement epargne', 'ldd', 'lep '],
  },
]

/**
 * Index d'historique : normalized label → catégorie la plus fréquente.
 * À construire une fois puis à réutiliser (utile pour l'import en masse).
 */
export function buildHistoryIndex(
  transactions: Transaction[],
): Map<string, BudgetCategoryId> {
  const counts = new Map<string, Map<BudgetCategoryId, number>>()

  for (const transaction of transactions) {
    if (transaction.type === 'transfer') continue
    const key = normalizeLabel(transaction.title)
    if (!key) continue

    const perCategory = counts.get(key) ?? new Map<BudgetCategoryId, number>()
    perCategory.set(
      transaction.category,
      (perCategory.get(transaction.category) ?? 0) + 1,
    )
    counts.set(key, perCategory)
  }

  const index = new Map<string, BudgetCategoryId>()
  for (const [key, perCategory] of counts) {
    let best: BudgetCategoryId | null = null
    let bestCount = 0
    for (const [category, count] of perCategory) {
      if (count > bestCount) {
        bestCount = count
        best = category
      }
    }
    if (best) index.set(key, best)
  }

  return index
}

function matchKeywords(normalized: string): BudgetCategoryId | null {
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.category
    }
  }
  return null
}

/**
 * Suggère une catégorie pour un libellé. `historyIndex` (optionnel) prime sur
 * le dictionnaire. Renvoie `null` si rien de fiable.
 */
export function suggestCategory(
  label: string,
  historyIndex?: Map<string, BudgetCategoryId>,
): BudgetCategoryId | null {
  const normalized = normalizeLabel(label)
  if (!normalized) return null

  if (historyIndex) {
    const exact = historyIndex.get(normalized)
    if (exact) return exact

    // Rapprochement souple : un libellé connu contenu dans le nouveau.
    for (const [key, category] of historyIndex) {
      if (key.length >= 4 && normalized.includes(key)) return category
    }
  }

  return matchKeywords(normalized)
}
