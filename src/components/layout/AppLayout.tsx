import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Home,
  Landmark,
  LayoutGrid,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  Repeat2,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserCircle,
  WalletCards,
  X,
} from 'lucide-react'

import { useAuth } from '../../context/useAuth'
import { useTour } from '../../context/useTour'
import { SUBSCRIPTION_HUB_URL, VITRINE_URL } from '../../config/subscription'
import HolderSwitcher from './HolderSwitcher'
import QuickAddMenu from './QuickAddMenu'
import Footer from './Footer'
import BrandLogo from './BrandLogo'
import GlobalSearch from '../search/GlobalSearch'

type AppLayoutProps = {
  children: ReactNode
}

type NavItem = {
  label: string
  path: string
  icon: typeof Home
  iconClass: string
  activeClass: string
}

// Toutes les sections, chacune avec sa couleur signature (icône du menu).
const ITEMS: Record<string, NavItem> = {
  '/': {
    label: 'Accueil',
    path: '/',
    icon: Home,
    iconClass: 'bg-emerald-50 text-emerald-700',
    activeClass: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100',
  },
  '/comptes': {
    label: 'Comptes',
    path: '/comptes',
    icon: CreditCard,
    iconClass: 'bg-blue-50 text-blue-700',
    activeClass: 'bg-blue-50 text-blue-800 ring-1 ring-blue-100',
  },
  '/transactions': {
    label: 'Transactions',
    path: '/transactions',
    icon: ReceiptText,
    iconClass: 'bg-teal-50 text-teal-700',
    activeClass: 'bg-teal-50 text-teal-800 ring-1 ring-teal-100',
  },
  '/abonnements': {
    label: 'Abonnements',
    path: '/abonnements',
    icon: Repeat2,
    iconClass: 'bg-amber-50 text-amber-700',
    activeClass: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
  },
  '/budgets': {
    label: 'Budgets',
    path: '/budgets',
    icon: PiggyBank,
    iconClass: 'bg-violet-50 text-violet-700',
    activeClass: 'bg-violet-50 text-violet-800 ring-1 ring-violet-100',
  },
  '/objectifs': {
    label: 'Objectifs',
    path: '/objectifs',
    icon: Target,
    iconClass: 'bg-fuchsia-50 text-fuchsia-700',
    activeClass: 'bg-fuchsia-50 text-fuchsia-800 ring-1 ring-fuchsia-100',
  },
  '/dettes': {
    label: 'Dettes',
    path: '/dettes',
    icon: WalletCards,
    iconClass: 'bg-rose-50 text-rose-700',
    activeClass: 'bg-rose-50 text-rose-800 ring-1 ring-rose-100',
  },
  '/investissements': {
    label: 'Investissements',
    path: '/investissements',
    icon: TrendingUp,
    iconClass: 'bg-lime-50 text-lime-700',
    activeClass: 'bg-lime-50 text-lime-800 ring-1 ring-lime-100',
  },
  '/patrimoine': {
    label: 'Patrimoine',
    path: '/patrimoine',
    icon: Landmark,
    iconClass: 'bg-indigo-50 text-indigo-700',
    activeClass: 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-100',
  },
  '/calendrier': {
    label: 'Calendrier',
    path: '/calendrier',
    icon: CalendarDays,
    iconClass: 'bg-orange-50 text-orange-700',
    activeClass: 'bg-orange-50 text-orange-800 ring-1 ring-orange-100',
  },
  '/statistiques': {
    label: 'Analyse',
    path: '/statistiques',
    icon: BarChart3,
    iconClass: 'bg-sky-50 text-sky-700',
    activeClass: 'bg-sky-50 text-sky-800 ring-1 ring-sky-100',
  },
}

// Pastilles directes (les 2 sections les plus utilisées).
const PRIMARY: NavItem[] = [ITEMS['/'], ITEMS['/transactions']]

// Menus déroulants (façon « Outils » de Recettes/Sport).
const MENUS: {
  label: string
  hubPath: string
  subtitle: string
  items: NavItem[]
}[] = [
  {
    label: 'Gérer',
    hubPath: '/gerer',
    subtitle: 'Comptes, charges, budgets et objectifs',
    items: [
      ITEMS['/comptes'],
      ITEMS['/abonnements'],
      ITEMS['/budgets'],
      ITEMS['/objectifs'],
      ITEMS['/dettes'],
    ],
  },
  {
    label: 'Patrimoine & analyse',
    hubPath: '/analyse',
    subtitle: 'Placements, bilan et statistiques',
    items: [
      ITEMS['/investissements'],
      ITEMS['/patrimoine'],
      ITEMS['/statistiques'],
      ITEMS['/calendrier'],
    ],
  },
]

// Groupes pour le tiroir mobile (4 familles).
const MOBILE_GROUPS: { label: string | null; items: NavItem[] }[] = [
  { label: null, items: [ITEMS['/']] },
  {
    label: 'Au quotidien',
    items: [ITEMS['/comptes'], ITEMS['/transactions'], ITEMS['/abonnements']],
  },
  {
    label: 'Mes objectifs',
    items: [ITEMS['/budgets'], ITEMS['/objectifs'], ITEMS['/dettes']],
  },
  {
    label: 'Mon patrimoine',
    items: [ITEMS['/investissements'], ITEMS['/patrimoine']],
  },
  {
    label: 'Analyses',
    items: [ITEMS['/calendrier'], ITEMS['/statistiques']],
  },
]

type OpenMenu = string | null

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth()
  const { start: startTour } = useTour()
  const location = useLocation()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Raccourci clavier ⌘K / Ctrl+K pour ouvrir la recherche.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function handleSignOut() {
    await signOut()
  }

  function pillClass(isActive: boolean) {
    return [
      'rounded-full px-4 py-2.5 text-sm font-bold transition',
      isActive
        ? 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100'
        : 'text-slate-600 hover:bg-stone-100 hover:text-slate-950',
    ].join(' ')
  }

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fffdf9]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
          {/* Marque */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-100 hover:text-slate-950 lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={isMobileNavOpen}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              to="/"
              className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
            >
              <BrandLogo
                className="h-11 w-11 shrink-0 drop-shadow-md transition group-hover:-rotate-2 group-hover:scale-105 sm:h-12 sm:w-12"
                fallbackTextClassName="rounded-2xl text-base"
              />

              <div className="min-w-0">
                <p className="truncate font-display text-lg font-black leading-tight text-slate-950">
                  Carnet de budget
                </p>

                <p className="hidden truncate text-xs font-semibold text-emerald-700/80 sm:block">
                  Votre argent, au clair
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation centrale (desktop) */}
          <nav className="hidden items-center gap-1 rounded-full border border-stone-200 bg-white/70 p-1.5 shadow-sm lg:flex">
            {PRIMARY.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setOpenMenu(null)}
                className={({ isActive }) => pillClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}

            {MENUS.map((menu) => {
              const isActive =
                menu.items.some((item) => item.path === location.pathname) ||
                location.pathname === menu.hubPath
              const isOpen = openMenu === menu.label

              return (
                <div
                  key={menu.label}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(menu.label)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <Link
                    to={menu.hubPath}
                    onClick={() => setOpenMenu(null)}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition',
                      isActive || isOpen
                        ? 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100'
                        : 'text-slate-600 hover:bg-stone-100 hover:text-slate-950',
                    ].join(' ')}
                  >
                    {menu.label}
                    <ChevronDown
                      className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </Link>

                  {/* pont invisible pour garder le survol */}
                  <div className="absolute left-0 top-full h-3 w-full" />

                  <div
                    className={[
                      'absolute left-1/2 top-[calc(100%+0.5rem)] z-50 w-[22rem] -translate-x-1/2 rounded-[1.75rem] border border-stone-200 bg-white p-3 shadow-xl transition duration-150',
                      isOpen
                        ? 'visible translate-y-0 opacity-100'
                        : 'invisible -translate-y-1 opacity-0',
                    ].join(' ')}
                  >
                    <p className="px-2 pb-2 pt-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-400">
                      {menu.subtitle}
                    </p>

                    <Link
                      to={menu.hubPath}
                      onClick={() => setOpenMenu(null)}
                      className="mb-1 flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Vue d’ensemble
                      <span aria-hidden="true">→</span>
                    </Link>

                    <div className="grid gap-1">
                      {menu.items.map((item) => {
                        const Icon = item.icon

                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpenMenu(null)}
                            className={({ isActive: active }) =>
                              [
                                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition',
                                active
                                  ? item.activeClass
                                  : 'text-slate-700 hover:bg-stone-100 hover:text-slate-950',
                              ].join(' ')
                            }
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            {item.label}
                          </NavLink>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-100 hover:text-slate-900"
              aria-label="Rechercher"
              title="Rechercher (⌘K)"
            >
              <Search className="h-5 w-5" />
            </button>

            <HolderSwitcher />

            <div className="hidden sm:block">
              <QuickAddMenu />
            </div>

            <a
              href={VITRINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:bg-emerald-50 lg:inline-flex"
              title="Découvrir toute la suite Les Carnets"
            >
              <LayoutGrid className="h-4 w-4" />
              Les Carnets
            </a>

            {/* Menu compte (desktop) */}
            <div
              className="relative hidden lg:block"
              onMouseEnter={() => setOpenMenu('account')}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-white px-2 py-2 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50"
                aria-label="Mon compte"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <UserCircle className="h-5 w-5" />
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition ${openMenu === 'account' ? 'rotate-180' : ''}`}
                />
              </button>

              <div className="absolute right-0 top-full h-3 w-full" />

              <div
                className={[
                  'absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[17rem] rounded-[1.75rem] border border-stone-200 bg-white p-3 shadow-xl transition duration-150',
                  openMenu === 'account'
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible -translate-y-1 opacity-0',
                ].join(' ')}
              >
                <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <UserCircle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                      Connecté
                    </p>
                    <p className="truncate text-xs font-black text-slate-950">
                      {user?.email ?? 'Utilisateur'}
                    </p>
                  </div>
                </div>

                <a
                  href={SUBSCRIPTION_HUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenMenu(null)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-emerald-950 to-teal-900 px-4 py-2.5 text-sm font-black text-amber-100 shadow-sm transition hover:scale-[1.01]"
                >
                  <Sparkles className="h-4 w-4" />
                  Mon abonnement
                </a>

                <Link
                  to="/reglages"
                  onClick={() => setOpenMenu(null)}
                  className="mt-1.5 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-stone-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-slate-600">
                    <Settings className="h-4 w-4" />
                  </span>
                  Réglages
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null)
                    startTour()
                  }}
                  className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-stone-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-slate-600">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  Visite guidée
                </button>

                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <LogOut className="h-4 w-4" />
                  </span>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">{children}</main>

      <Footer />

      {/* Tiroir de navigation complet (mobile / tablette). */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setIsMobileNavOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          <div className="animate-rise absolute left-0 top-0 flex h-full w-[18rem] max-w-[85%] flex-col overflow-y-auto border-r border-stone-200 bg-[#fffdf9] p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/"
                onClick={() => setIsMobileNavOpen(false)}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <BrandLogo
                  className="h-11 w-11 shrink-0"
                  fallbackTextClassName="text-base"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-black leading-tight text-slate-950">
                    Carnet de budget
                  </p>
                  <p className="truncate text-xs font-semibold text-emerald-700/80">
                    Votre argent, au clair
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Fermer le menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-slate-500 transition hover:bg-stone-200 hover:text-slate-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 flex-1">
              {MOBILE_GROUPS.map((group, groupIndex) => (
                <div
                  key={group.label ?? 'main'}
                  className={groupIndex > 0 ? 'mt-4' : ''}
                >
                  {group.label && (
                    <p className="mb-1.5 px-3 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-400">
                      {group.label}
                    </p>
                  )}

                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const Icon = item.icon

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === '/'}
                          onClick={() => setIsMobileNavOpen(false)}
                          className={({ isActive }) =>
                            [
                              'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition',
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
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <a
              href={VITRINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileNavOpen(false)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-sm ring-1 ring-stone-200 transition hover:bg-emerald-50"
            >
              <LayoutGrid className="h-4 w-4" />
              Les Carnets
            </a>

            <a
              href={SUBSCRIPTION_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileNavOpen(false)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-emerald-950 to-teal-900 px-4 py-3 text-sm font-black text-amber-100 shadow-sm transition hover:scale-[1.01]"
            >
              <Sparkles className="h-4 w-4" />
              Mon abonnement
            </a>

            <Link
              to="/reglages"
              onClick={() => setIsMobileNavOpen(false)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-100"
            >
              <Settings className="h-4 w-4" />
              Réglages
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsMobileNavOpen(false)
                startTour()
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
            >
              <HelpCircle className="h-4 w-4" />
              Visite guidée
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMobileNavOpen(false)
                void handleSignOut()
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm ring-1 ring-stone-200 transition hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}
    </div>
  )
}
