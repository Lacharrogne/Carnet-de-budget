import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Landmark,
  PartyPopper,
  PiggyBank,
  ReceiptText,
  Repeat2,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export type TourStep = {
  /** Page vers laquelle la visite amène automatiquement à cette étape. */
  path: string
  icon: LucideIcon
  title: string
  description: string
}

/**
 * Visite guidée du nouvel utilisateur : on l'amène sur chaque page et on lui
 * explique la fonctionnalité, dans l'ordre logique d'utilisation.
 */
export const tourSteps: TourStep[] = [
  {
    path: '/',
    icon: Sparkles,
    title: 'Bienvenue dans votre Carnet de budget 👋',
    description:
      'En quelques étapes, on vous montre tout. Le tableau de bord réunit votre score de santé financière, la prévision de fin de mois et des conseils personnalisés.',
  },
  {
    path: '/comptes',
    icon: CreditCard,
    title: 'Vos comptes',
    description:
      'Tout commence ici : ajoutez votre compte courant, votre épargne, vos espèces. Les revenus, dépenses et virements ajustent les soldes automatiquement.',
  },
  {
    path: '/transactions',
    icon: ReceiptText,
    title: 'Vos transactions',
    description:
      'Enregistrez revenus, dépenses et virements. Recherche, filtres, et export CSV/PDF de vos opérations en un clic.',
  },
  {
    path: '/budgets',
    icon: PiggyBank,
    title: 'Vos budgets',
    description:
      'Fixez une limite par catégorie et suivez le pourcentage utilisé, avec des alertes douces. Vous pouvez naviguer d’un mois à l’autre.',
  },
  {
    path: '/abonnements',
    icon: Repeat2,
    title: 'Charges fixes & revenus récurrents',
    description:
      'Loyer, abonnements, salaire… Le carnet repère même automatiquement les abonnements cachés dans vos dépenses pour vous les proposer.',
  },
  {
    path: '/objectifs',
    icon: Target,
    title: 'Objectifs & épargne',
    description:
      'Mettez de l’argent de côté pour vos projets, avec une échéance : le carnet calcule combien épargner chaque mois pour y arriver.',
  },
  {
    path: '/dettes',
    icon: WalletCards,
    title: 'Vos dettes',
    description:
      'Suivez ce qu’il vous reste à rembourser et vos mensualités, sans stress, avec une vue claire de la progression.',
  },
  {
    path: '/investissements',
    icon: TrendingUp,
    title: 'Vos investissements',
    description:
      'Suivez votre portefeuille (ETF, actions, PEA…) et vos plus ou moins-values d’un coup d’œil.',
  },
  {
    path: '/patrimoine',
    icon: Landmark,
    title: 'Votre patrimoine',
    description:
      'La vue d’ensemble : ce que vous possédez moins ce que vous devez. Votre valeur nette, clairement.',
  },
  {
    path: '/calendrier',
    icon: CalendarDays,
    title: 'Le calendrier',
    description:
      'Visualisez vos mouvements et vos charges fixes jour par jour sur le mois, pour ne rien anticiper de travers.',
  },
  {
    path: '/statistiques',
    icon: BarChart3,
    title: 'Les statistiques',
    description:
      'Tendances, évolution sur 6 mois, postes les plus coûteux et insights : comprenez où va votre argent.',
  },
  {
    path: '/',
    icon: PartyPopper,
    title: 'Vous êtes prêt ! 🎉',
    description:
      'Commencez par créer un compte puis ajoutez une première transaction. Vous pourrez relancer cette visite à tout moment depuis le menu.',
  },
]
