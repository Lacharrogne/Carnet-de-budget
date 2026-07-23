import { Link } from 'react-router'
import { Heart, Leaf, ShieldCheck } from 'lucide-react'

import {
  SUBSCRIPTION_HUB_URL,
  VITRINE_URL,
} from '../../config/subscription'

type FooterLink = { label: string; to: string }

function isExternalLink(to: string) {
  return to.startsWith('http')
}

const FOOTER_SECTIONS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Explorer',
    links: [
      { label: 'Accueil', to: '/' },
      { label: 'Comptes', to: '/comptes' },
      { label: 'Transactions', to: '/transactions' },
      { label: 'Budgets', to: '/budgets' },
      { label: 'Analyse', to: '/statistiques' },
    ],
  },
  {
    title: 'Mon carnet',
    links: [
      { label: 'Objectifs', to: '/objectifs' },
      { label: 'Dettes', to: '/dettes' },
      { label: 'Investissements', to: '/investissements' },
      { label: 'Patrimoine', to: '/patrimoine' },
    ],
  },
  {
    title: 'Les Carnets',
    links: [
      { label: 'La suite', to: VITRINE_URL },
      { label: 'Tarifs', to: SUBSCRIPTION_HUB_URL },
      { label: 'Mon abonnement', to: SUBSCRIPTION_HUB_URL },
    ],
  },
]

const TRUST_SIGNALS: { icon: typeof Heart; label: string }[] = [
  { icon: Heart, label: 'Fait avec soin' },
  { icon: ShieldCheck, label: 'Sans publicité' },
  { icon: Leaf, label: '14 jours d’essai gratuit' },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-[#fffdf9] print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-950 to-teal-900 font-display text-sm font-bold text-amber-200 ring-1 ring-white/10">
              CB
            </div>

            <div>
              <p className="font-black text-slate-950">Carnet de budget</p>
              <p className="text-sm font-semibold text-slate-500">
                Votre argent, au clair
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600">
            La puissance d’un tableur, sans la complexité d’Excel. Vos comptes,
            budgets, épargne et patrimoine réunis dans un carnet simple et beau.
          </p>

          <ul className="mt-6 space-y-2">
            {TRUST_SIGNALS.map((signal) => {
              const Icon = signal.icon

              return (
                <li
                  key={signal.label}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600"
                >
                  <Icon className="h-4 w-4 text-emerald-600" />
                  {signal.label}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                {section.title}
              </p>

              <ul className="mt-4 space-y-2.5">
                {section.links.map((link, index) =>
                  isExternalLink(link.to) ? (
                    <li key={`${link.label}-${index}`}>
                      <a
                        href={link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-slate-600 transition hover:text-emerald-700"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={`${link.label}-${index}`}>
                      <Link
                        to={link.to}
                        className="text-sm font-bold text-slate-600 transition hover:text-emerald-700"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-200/70">
        <p className="mx-auto max-w-6xl px-6 py-4 text-sm text-slate-500">
          © 2026 — Carnet de budget
        </p>
      </div>
    </footer>
  )
}
