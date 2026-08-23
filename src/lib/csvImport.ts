/**
 * Lecture d'un relevé bancaire CSV (sans dépendance).
 *
 * Les banques exportent des formats variés : séparateur `;` ou `,`, montants
 * « 1 234,56 » ou « 1,234.56 », colonnes Débit/Crédit séparées, dates FR ou
 * ISO. On détecte au mieux et on laisse l'utilisateur ajuster le mappage.
 */

export type ParsedCsv = {
  headers: string[]
  rows: string[][]
  delimiter: string
}

const DELIMITERS = [';', ',', '\t', '|']

function detectDelimiter(firstLine: string): string {
  let best = ';'
  let bestCount = -1
  for (const delimiter of DELIMITERS) {
    const count = firstLine.split(delimiter).length
    if (count > bestCount) {
      bestCount = count
      best = delimiter
    }
  }
  return best
}

/** Découpe une ligne CSV en respectant les guillemets. */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current.trim())
  return cells
}

export function parseCsv(text: string): ParsedCsv {
  // Retire un éventuel BOM, normalise les fins de ligne.
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const lines = clean.split('\n').filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: ';' }
  }

  const delimiter = detectDelimiter(lines[0])
  const headers = splitLine(lines[0], delimiter)
  const rows = lines.slice(1).map((line) => splitLine(line, delimiter))

  return { headers, rows, delimiter }
}

/**
 * Parse un montant provenant d'un relevé (formats FR/US, parenthèses = négatif).
 * Renvoie `null` si non interprétable.
 */
export function parseAmountFlexible(raw: string): number | null {
  if (!raw) return null

  let value = raw.trim()
  let negative = false

  // Parenthèses comptables : (12,00) = -12,00
  if (/^\(.*\)$/.test(value)) {
    negative = true
    value = value.slice(1, -1)
  }

  // Retire symboles monétaires et espaces (y compris insécables).
  value = value.replace(/[€$£\s]/g, '')

  if (value.includes('-')) negative = true
  value = value.replace(/[+-]/g, '')

  if (!value) return null

  const hasComma = value.includes(',')
  const hasDot = value.includes('.')

  if (hasComma && hasDot) {
    // Le dernier séparateur est le décimal ; l'autre sépare les milliers.
    if (value.lastIndexOf(',') > value.lastIndexOf('.')) {
      value = value.replace(/\./g, '').replace(',', '.')
    } else {
      value = value.replace(/,/g, '')
    }
  } else if (hasComma) {
    value = value.replace(',', '.')
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null

  return negative ? -parsed : parsed
}

/** Parse une date FR/ISO vers « YYYY-MM-DD ». Renvoie `null` si illisible. */
export function parseDateFlexible(raw: string): string | null {
  if (!raw) return null
  const value = raw.trim()

  // ISO : YYYY-MM-DD (ou avec heure).
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  // FR : DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (année sur 2 ou 4 chiffres).
  const fr = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/)
  if (fr) {
    const day = fr[1].padStart(2, '0')
    const month = fr[2].padStart(2, '0')
    let year = fr[3]
    if (year.length === 2) year = `20${year}`
    return `${year}-${month}-${day}`
  }

  return null
}

/** Devine l'index d'une colonne d'après des libellés d'en-tête possibles. */
export function guessColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map((header) =>
    header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, ''),
  )

  for (let i = 0; i < normalized.length; i += 1) {
    if (candidates.some((candidate) => normalized[i].includes(candidate))) {
      return i
    }
  }
  return -1
}
