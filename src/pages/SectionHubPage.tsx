import { Link } from 'react-router'

import type { SectionHub } from '../data/sectionHubs'

type SectionHubPageProps = {
  hub: SectionHub
}

export default function SectionHubPage({ hub }: SectionHubPageProps) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-amber-100/50 blur-3xl" />

        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            {hub.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {hub.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            {hub.description}
          </p>
        </div>
      </section>

      {/* Cartes */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {hub.cards.map((card) => {
          const Icon = card.icon

          return (
            <Link
              key={card.to}
              to={card.to}
              className="group flex flex-col rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconClass}`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <h2 className="mt-4 font-display text-xl font-semibold text-slate-950">
                {card.label}
              </h2>

              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {card.description}
              </p>

              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-emerald-700">
                Ouvrir
                <span
                  aria-hidden="true"
                  className="transition group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
