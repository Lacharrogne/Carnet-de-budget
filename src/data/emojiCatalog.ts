/**
 * Catalogue d'emojis du Carnet de budget.
 *
 * Regroupé par thèmes utiles à une application de gestion d'argent
 * (banque, maison, transport, etc.) pour alimenter le sélecteur
 * `EmojiPicker`. Chaque catégorie porte un libellé (recherchable) et la
 * liste de ses emojis. Le `keywords` optionnel enrichit la recherche pour
 * les emojis dont le sens n'est pas évident d'après le seul libellé de
 * catégorie.
 */

export interface EmojiCategory {
  /** Libellé affiché et utilisé pour la recherche. */
  label: string
  /** Emojis de la catégorie. */
  emojis: string[]
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: 'Banque & argent',
    emojis: [
      '🏦', '💰', '💵', '💶', '💷', '💴', '🪙', '💳',
      '💸', '🧾', '🏧', '📈', '📉', '💹', '🪪', '🤑',
    ],
  },
  {
    label: 'Maison & charges',
    emojis: [
      '🏠', '🏡', '🏘️', '🔑', '🛋️', '🛏️', '🚿', '💡',
      '🔌', '🔥', '💧', '🧹', '🪑', '🚪', '🪟', '📺',
    ],
  },
  {
    label: 'Transport & auto',
    emojis: [
      '🚗', '🚙', '🚕', '🛻', '🏎️', '🚌', '🚆', '🚄',
      '🚲', '🛵', '🏍️', '⛽', '🅿️', '✈️', '⛴️', '🛺',
    ],
  },
  {
    label: 'Alimentation & courses',
    emojis: [
      '🍽️', '🛒', '🍕', '🍔', '🍟', '🥗', '🍣', '🍜',
      '🥖', '🥐', '🧀', '🍎', '🥑', '☕', '🍷', '🍺',
      '🥤', '🍫', '🎂', '🍿',
    ],
  },
  {
    label: 'Loisirs & sorties',
    emojis: [
      '🎬', '🎮', '🎲', '🎸', '🎤', '🎧', '🎟️', '🏟️',
      '🎨', '📚', '🎭', '🎳', '🏖️', '🎯', '🧩', '🎁',
    ],
  },
  {
    label: 'Santé & bien-être',
    emojis: [
      '🏥', '💊', '🩺', '🦷', '👓', '💪', '🧘', '🏋️',
      '🚴', '🧴', '🧼', '🩹',
    ],
  },
  {
    label: 'Voyage & vacances',
    emojis: [
      '🌍', '🧳', '🏝️', '⛺', '🏕️', '🗺️', '🏨', '🎒',
      '📸', '🚢', '🏔️', '🗽',
    ],
  },
  {
    label: 'Famille & enfants',
    emojis: [
      '👨‍👩‍👧‍👦', '👶', '🧸', '🍼', '🎓', '🐶', '🐱', '🐾',
      '🎈', '👕', '👟', '💍', '🎀',
    ],
  },
  {
    label: 'Travail & études',
    emojis: [
      '💼', '🏢', '💻', '🖥️', '📱', '⌚', '🖊️', '📊',
      '📅', '✉️', '🧑‍💻', '🔧', '🛠️',
    ],
  },
  {
    label: 'Épargne & objectifs',
    emojis: [
      '🎯', '🐖', '🪺', '🌱', '🏆', '⭐', '🚀', '💎',
      '🔒', '📌', '🍀', '🧧',
    ],
  },
]

/**
 * Mots-clés additionnels par emoji pour la recherche (synonymes courants).
 * Inutile de tout renseigner : la recherche couvre déjà le libellé de
 * catégorie.
 */
export const EMOJI_KEYWORDS: Record<string, string[]> = {
  '🏦': ['banque', 'compte'],
  '💰': ['argent', 'sac', 'épargne'],
  '💳': ['carte', 'crédit', 'paiement'],
  '💸': ['dépense', 'argent'],
  '🧾': ['facture', 'reçu', 'ticket'],
  '📈': ['bourse', 'placement', 'action', 'hausse'],
  '📉': ['bourse', 'baisse'],
  '🐖': ['cochon', 'tirelire', 'épargne'],
  '🏠': ['maison', 'logement', 'loyer'],
  '🏡': ['maison', 'logement'],
  '💡': ['électricité', 'énergie'],
  '💧': ['eau'],
  '🔥': ['gaz', 'chauffage'],
  '🚗': ['voiture', 'auto'],
  '⛽': ['essence', 'carburant', 'station'],
  '✈️': ['avion', 'vol', 'voyage'],
  '🛒': ['courses', 'supermarché', 'caddie'],
  '🍽️': ['restaurant', 'repas'],
  '☕': ['café'],
  '🏥': ['santé', 'hôpital', 'médecin'],
  '💊': ['médicament', 'pharmacie', 'santé'],
  '🎓': ['études', 'école', 'diplôme'],
  '💼': ['travail', 'salaire', 'boulot'],
  '🎯': ['objectif', 'but', 'cible'],
  '🏆': ['objectif', 'récompense'],
  '🌱': ['épargne', 'croissance'],
  '🎁': ['cadeau'],
  '💍': ['mariage', 'bijou'],
  '👶': ['bébé', 'enfant'],
}
