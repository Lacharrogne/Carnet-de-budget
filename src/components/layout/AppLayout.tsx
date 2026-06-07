import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Home,
  Landmark,
  LogOut,
  PiggyBank,
  ReceiptText,
  Repeat2,
  Target,
  TrendingUp,
  UserCircle,
  WalletCards,
} from 'lucide-react'

import { useAuth } from '../../context/useAuth'
import QuickAddMenu from './QuickAddMenu'

type AppLayoutProps = {
  children: ReactNode
}

const navItems = [
  {
    label: 'Accueil',
    path: '/',
    icon: Home,
  },
  {
    label: 'Comptes',
    path: '/comptes',
    icon: CreditCard,
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: ReceiptText,
  },
  {
    label: 'Budgets',
    path: '/budgets',
    icon: PiggyBank,
  },
  {
    label: 'Abonnements',
    path: '/abonnements',
    icon: Repeat2,
  },
  {
    label: 'Dettes',
    path: '/dettes',
    icon: WalletCards,
  },
  {
    label: 'Patrimoine',
    path: '/patrimoine',
    icon: Landmark,
  },
  {
    label: 'Invest.',
    path: '/investissements',
    icon: TrendingUp,
  },
  {
    label: 'Objectifs',
    path: '/objectifs',
    icon: Target,
  },
  {
    label: 'Calendrier',
    path: '/calendrier',
    icon: CalendarDays,
  },
  {
    label: 'Stats',
    path: '/statistiques',
    icon: BarChart3,
  },
]

const mobileNavItems = [
  {
    label: 'Accueil',
    path: '/',
    icon: Home,
  },
  {
    label: 'Transac.',
    path: '/transactions',
    icon: ReceiptText,
  },
  {
    label: 'Budgets',
    path: '/budgets',
    icon: PiggyBank,
  },
  {
    label: 'Stats',
    path: '/statistiques',
    icon: BarChart3,
  },
]

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col overflow-hidden border-r border-stone-200 bg-white/95 p-4 backdrop-blur xl:flex">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-[1.5rem] border border-stone-200 bg-white p-3 shadow-sm transition hover:bg-stone-50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-950 text-sm font-black text-white">
            CB
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
              Carnet
            </p>

            <h1 className="truncate text-lg font-black text-slate-950">
              Budget
            </h1>

            <p className="truncate text-xs font-medium text-slate-500">
              Cockpit financier
            </p>
          </div>
        </Link>

        <div className="mt-4 rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          Données synchronisées
        </div>

        <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:bg-stone-100 hover:text-slate-950',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
              <UserCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                Connecté
              </p>

              <p className="truncate text-xs font-black text-slate-950">
                {user?.email ?? 'Utilisateur'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Carnet de budget
              </p>

              <p className="truncate text-sm text-slate-500">
                Simple, beau et plus pratique qu’un fichier Excel.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <QuickAddMenu />
              </div>

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-rose-50 hover:text-rose-700 xl:hidden"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-36 md:px-8 xl:pb-10">
          {children}
        </main>

        <nav className="fixed bottom-3 left-1/2 z-30 w-[calc(100%-1.25rem)] max-w-md -translate-x-1/2 xl:hidden">
          <div className="relative rounded-[2rem] border border-stone-200 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur">
            <div className="grid grid-cols-[1fr_1fr_4.5rem_1fr_1fr] items-center gap-1">
              {mobileNavItems.slice(0, 2).map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      [
                        'flex min-h-14 flex-col items-center justify-center rounded-[1.4rem] px-2 py-2 text-[0.68rem] font-black transition',
                        isActive
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-slate-500 hover:bg-stone-50 hover:text-slate-900',
                      ].join(' ')
                    }
                  >
                    <Icon className="mb-1 h-5 w-5" />
                    {item.label}
                  </NavLink>
                )
              })}

              <div className="flex justify-center">
                <QuickAddMenu variant="bottom" />
              </div>

              {mobileNavItems.slice(2).map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      [
                        'flex min-h-14 flex-col items-center justify-center rounded-[1.4rem] px-2 py-2 text-[0.68rem] font-black transition',
                        isActive
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-slate-500 hover:bg-stone-50 hover:text-slate-900',
                      ].join(' ')
                    }
                  >
                    <Icon className="mb-1 h-5 w-5" />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}