import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Landmark,
  PiggyBank,
  Repeat2,
  Target,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export type SectionHubCard = {
  label: string
  to: string
  description: string
  icon: LucideIcon
  iconClass: string
}

export type SectionHub = {
  eyebrow: string
  title: string
  description: string
  cards: SectionHubCard[]
}

export const GERER_HUB: SectionHub = {
  eyebrow: 'Gérer',
  title: 'Tout ce qui fait vivre votre budget.',
  description:
    'Vos comptes, vos charges fixes, vos budgets, vos objectifs et vos dettes — réunis pour garder le quotidien sous contrôle, sans prise de tête.',
  cards: [
    {
      label: 'Comptes',
      to: '/comptes',
      description:
        'Vos comptes courants, épargne, espèces et placements, avec leur solde à jour et les virements entre eux.',
      icon: CreditCard,
      iconClass: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Abonnements',
      to: '/abonnements',
      description:
        'Vos charges fixes et abonnements récurrents (loyer, Netflix…), pour anticiper les prélèvements du mois.',
      icon: Repeat2,
      iconClass: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Budgets',
      to: '/budgets',
      description:
        'Fixez une limite mensuelle par catégorie et suivez où vous en êtes, avec des alertes en douceur.',
      icon: PiggyBank,
      iconClass: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Objectifs',
      to: '/objectifs',
      description:
        'Vos projets d’épargne et enveloppes : combien mis de côté, combien il reste, et à quel rythme.',
      icon: Target,
      iconClass: 'bg-fuchsia-50 text-fuchsia-700',
    },
    {
      label: 'Dettes',
      to: '/dettes',
      description:
        'Vos crédits et dettes, ce qu’il reste à rembourser, et le remboursement directement depuis un compte.',
      icon: WalletCards,
      iconClass: 'bg-rose-50 text-rose-700',
    },
  ],
}

export const ANALYSE_HUB: SectionHub = {
  eyebrow: 'Patrimoine & analyse',
  title: 'Prenez de la hauteur sur vos finances.',
  description:
    'Vos placements, votre patrimoine net et vos statistiques — pour comprendre où vous en êtes vraiment et voir la tendance sur la durée.',
  cards: [
    {
      label: 'Investissements',
      to: '/investissements',
      description:
        'Vos placements (bourse, ETF, crypto, assurance-vie…) et leur répartition, en un coup d’œil.',
      icon: TrendingUp,
      iconClass: 'bg-lime-50 text-lime-700',
    },
    {
      label: 'Patrimoine',
      to: '/patrimoine',
      description:
        'Votre bilan net : ce que vous possédez moins ce que vous devez, vu d’ensemble et dans le temps.',
      icon: Landmark,
      iconClass: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Analyse',
      to: '/statistiques',
      description:
        'Vos statistiques : évolution des revenus et dépenses sur 6 mois, postes principaux et tendances.',
      icon: BarChart3,
      iconClass: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Calendrier',
      to: '/calendrier',
      description:
        'Vos mouvements et échéances placés dans un calendrier mensuel, pour anticiper les entrées et sorties.',
      icon: CalendarDays,
      iconClass: 'bg-orange-50 text-orange-700',
    },
  ],
}
