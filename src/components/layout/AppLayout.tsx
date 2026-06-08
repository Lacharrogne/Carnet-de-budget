import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Home,
  Landmark,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
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
    iconClass: 'bg-emerald-50 text-emerald-700',
    activeClass: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100',
  },
  {
    label: 'Comptes',
    path: '/comptes',
    icon: CreditCard,
    iconClass: 'bg-blue-50 text-blue-700',
    activeClass: 'bg-blue-50 text-blue-800 ring-1 ring-blue-100',
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: ReceiptText,
    iconClass: 'bg-teal-50 text-teal-700',
    activeClass: 'bg-teal-50 text-teal-800 ring-1 ring-teal-100',
  },
  {
    label: 'Abonnements',
    path: '/abonnements',
    icon: Repeat2,
    iconClass: 'bg-amber-50 text-amber-700',
    activeClass: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
  },
  {
    label: 'Budgets',
    path: '/budgets',
    icon: PiggyBank,
    iconClass: 'bg-violet-50 text-violet-700',
    activeClass: 'bg-violet-50 text-violet-800 ring-1 ring-violet-100',
  },
  {
    label: 'Objectifs',
    path: '/objectifs',
    icon: Target,
    iconClass: 'bg-fuchsia-50 text-fuchsia-700',
    activeClass: 'bg-fuchsia-50 text-fuchsia-800 ring-1 ring-fuchsia-100',
  },
  {
    label: 'Dettes',
    path: '/dettes',
    icon: WalletCards,
    iconClass: 'bg-rose-50 text-rose-700',
    activeClass: 'bg-rose-50 text-rose-800 ring-1 ring-rose-100',
  },
  {
    label: 'Invest.',
    path: '/investissements',
    icon: TrendingUp,
    iconClass: 'bg-lime-50 text-lime-700',
    activeClass: 'bg-lime-50 text-lime-800 ring-1 ring-lime-100',
  },
  {
    label: 'Calendrier',
    path: '/calendrier',
    icon: CalendarDays,
    iconClass: 'bg-orange-50 text-orange-700',
    activeClass: 'bg-orange-50 text-orange-800 ring-1 ring-orange-100',
  },
  {
    label: 'Patrimoine',
    path: '/patrimoine',
    icon: Landmark,
    iconClass: 'bg-indigo-50 text-indigo-700',
    activeClass: 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-100',
  },
  {
    label: 'Analyse',
    path: '/statistiques',
    icon: BarChart3,
    iconClass: 'bg-sky-50 text-sky-700',
    activeClass: 'bg-sky-50 text-sky-800 ring-1 ring-sky-100',
  },
]

const mobileNavItems = [navItems[0], navItems[2], navItems[3], navItems[10]]

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <aside
        className={[
          'fixed left-0 top-0 hidden h-screen flex-col overflow-hidden border-r border-stone-200 bg-white/95 p-4 backdrop-blur transition-all duration-300 xl:flex',
          isSidebarCollapsed ? 'w-24' : 'w-72',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className={[
              'flex min-w-0 items-center gap-3 rounded-[1.5rem] border border-stone-200 bg-gradient-to-br from-emerald-950 to-teal-900 p-3 text-white shadow-sm transition hover:scale-[1.01]',
              isSidebarCollapsed ? 'justify-center' : 'flex-1',
            ].join(' ')}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-sm font-black text-white ring-1 ring-white/20">
              CB
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                  Carnet
                </p>

                <h1 className="truncate text-lg font-black text-white">
                  Budget
                </h1>

                <p className="truncate text-xs font-medium text-emerald-100">
                  Cockpit financier
                </p>
              </div>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-slate-500 transition hover:bg-stone-200 hover:text-slate-950"
              aria-label="Réduire le menu"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}
        </div>

        {isSidebarCollapsed ? (
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(false)}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
            aria-label="Ouvrir le menu"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        ) : (
          <div className="mt-4 rounded-[1.25rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
            Données synchronisées
          </div>
        )}

        <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                title={isSidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    'group flex items-center rounded-2xl text-sm font-bold transition',
                    isSidebarCollapsed
                      ? 'justify-center px-2 py-2.5'
                      : 'gap-3 px-3 py-2.5',
                    isActive
                      ? item.activeClass
                      : 'text-slate-600 hover:bg-stone-100 hover:text-slate-950',
                  ].join(' ')
                }
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div
          className={[
            'mt-4 rounded-[1.5rem] border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-3 shadow-sm',
            isSidebarCollapsed ? 'flex flex-col items-center' : '',
          ].join(' ')}
        >
          {isSidebarCollapsed ? (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm">
                <UserCircle className="h-5 w-5" />
              </div>

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="mt-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm transition hover:bg-rose-50 hover:text-rose-700"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm">
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
            </>
          )}
        </div>
      </aside>

      <div
        className={[
          'transition-all duration-300',
          isSidebarCollapsed ? 'xl:pl-24' : 'xl:pl-72',
        ].join(' ')}
      >
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
                          ? item.activeClass
                          : 'text-slate-500 hover:bg-stone-50 hover:text-slate-900',
                      ].join(' ')
                    }
                  >
                    <span
                      className={`mb-1 flex h-7 w-7 items-center justify-center rounded-xl ${item.iconClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
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
                          ? item.activeClass
                          : 'text-slate-500 hover:bg-stone-50 hover:text-slate-900',
                      ].join(' ')
                    }
                  >
                    <span
                      className={`mb-1 flex h-7 w-7 items-center justify-center rounded-xl ${item.iconClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
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