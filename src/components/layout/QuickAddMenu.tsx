import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import {
  BarChart3,
  CalendarDays,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat2,
  Target,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'

type QuickAddMenuProps = {
  variant?: 'header' | 'bottom'
}

type QuickAction = {
  label: string
  description: string
  href: string
  icon: ReactNode
  classes: {
    icon: string
    badge: string
  }
}

const quickActions: QuickAction[] = [
  {
    label: 'Nouvelle transaction',
    description: 'Ajouter une dépense, un revenu ou un paiement.',
    href: '/transactions?action=new',
    icon: <ReceiptText className="h-5 w-5" />,
    classes: {
      icon: 'bg-emerald-50 text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700',
    },
  },
  {
    label: 'Nouvel abonnement',
    description: 'Ajouter un loyer, abonnement ou prélèvement mensuel.',
    href: '/abonnements?action=new',
    icon: <Repeat2 className="h-5 w-5" />,
    classes: {
      icon: 'bg-amber-50 text-amber-700',
      badge: 'bg-amber-50 text-amber-700',
    },
  },
  {
    label: 'Nouvelle dette',
    description: 'Ajouter un crédit ou un remboursement à suivre.',
    href: '/dettes?action=new',
    icon: <WalletCards className="h-5 w-5" />,
    classes: {
      icon: 'bg-rose-50 text-rose-700',
      badge: 'bg-rose-50 text-rose-700',
    },
  },
  {
    label: 'Nouvel investissement',
    description: 'Ajouter un ETF, une action, une crypto ou un placement.',
    href: '/investissements?action=new',
    icon: <TrendingUp className="h-5 w-5" />,
    classes: {
      icon: 'bg-emerald-50 text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700',
    },
  },
  {
    label: 'Nouvel objectif',
    description: 'Créer un projet d’épargne ou une nouvelle cible.',
    href: '/objectifs?action=new',
    icon: <Target className="h-5 w-5" />,
    classes: {
      icon: 'bg-violet-50 text-violet-700',
      badge: 'bg-violet-50 text-violet-700',
    },
  },
  {
    label: 'Nouveau budget',
    description: 'Créer ou ajuster une limite mensuelle par catégorie.',
    href: '/budgets?action=new',
    icon: <PiggyBank className="h-5 w-5" />,
    classes: {
      icon: 'bg-blue-50 text-blue-700',
      badge: 'bg-blue-50 text-blue-700',
    },
  },
  {
    label: 'Voir le calendrier',
    description: 'Consulter les paiements à venir dans le mois.',
    href: '/calendrier',
    icon: <CalendarDays className="h-5 w-5" />,
    classes: {
      icon: 'bg-stone-100 text-slate-700',
      badge: 'bg-stone-100 text-slate-700',
    },
  },
  {
    label: 'Analyser les stats',
    description: 'Comprendre les dépenses, revenus et alertes.',
    href: '/statistiques',
    icon: <BarChart3 className="h-5 w-5" />,
    classes: {
      icon: 'bg-rose-50 text-rose-700',
      badge: 'bg-rose-50 text-rose-700',
    },
  },
]

function getRecommendedAction(pathname: string) {
  if (pathname.startsWith('/transactions')) {
    return 'Nouvelle transaction'
  }

  if (pathname.startsWith('/abonnements') || pathname.startsWith('/recurrents')) {
    return 'Nouvel abonnement'
  }

  if (pathname.startsWith('/dettes')) {
    return 'Nouvelle dette'
  }

  if (pathname.startsWith('/investissements')) {
    return 'Nouvel investissement'
  }

  if (pathname.startsWith('/objectifs')) {
    return 'Nouvel objectif'
  }

  if (pathname.startsWith('/budgets')) {
    return 'Nouveau budget'
  }

  if (pathname.startsWith('/calendrier')) {
    return 'Voir le calendrier'
  }

  if (pathname.startsWith('/statistiques') || pathname.startsWith('/stats')) {
    return 'Analyser les stats'
  }

  return 'Nouvelle transaction'
}

export default function QuickAddMenu({ variant = 'header' }: QuickAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const recommendedAction = getRecommendedAction(location.pathname)
  const isBottomVariant = variant === 'bottom'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={
          isBottomVariant
            ? 'flex h-16 w-16 -translate-y-5 items-center justify-center rounded-full border-4 border-white bg-emerald-950 text-white shadow-2xl transition hover:bg-emerald-900'
            : 'flex items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900'
        }
        aria-label="Ouvrir le menu d’ajout rapide"
      >
        <Plus className={isBottomVariant ? 'h-7 w-7' : 'h-4 w-4'} />
        {!isBottomVariant && 'Ajouter'}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu d’ajout"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-slate-950/10 sm:bg-transparent"
          />

          <div className="fixed bottom-24 left-3 right-3 z-50 max-h-[calc(100vh-8rem)] overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-2xl sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[min(92vw,30rem)]">
            <div className="border-b border-stone-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">
                    Ajout rapide
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    Que veux-tu ajouter ?
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Accède rapidement aux actions importantes de ton carnet.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full bg-stone-100 p-3 text-slate-500 transition hover:bg-stone-200 hover:text-slate-950"
                  aria-label="Fermer le menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              <div className="grid gap-2">
                {quickActions.map((action) => {
                  const isRecommended = action.label === recommendedAction

                  return (
                    <Link
                      key={action.label}
                      to={action.href}
                      onClick={() => setIsOpen(false)}
                      className="group rounded-[1.5rem] p-3 transition hover:bg-stone-50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`rounded-2xl p-3 ${action.classes.icon}`}
                        >
                          {action.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-slate-950">
                              {action.label}
                            </p>

                            {isRecommended && (
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-black ${action.classes.badge}`}
                              >
                                Conseillé
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm leading-5 text-slate-500">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}