import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import {
  CalendarDays,
  CheckCircle2,
  Coins,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'

import ConfirmActionModal from '../components/ui/ConfirmActionModal'
import { useBudgetData } from '../context/useBudgetData'
import type { Account, SavingGoal, SinkingFund } from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

type GoalFormValues = {
  title: string
  emoji: string
  targetAmount: string
  currentAmount: string
  deadline: string
}

type SinkingFundFormValues = {
  title: string
  emoji: string
  targetAmount: string
  currentAmount: string
  monthlyContribution: string
}

type SaveMoneyFormValues = {
  accountId: string
  amount: string
}

type SaveMoneyTarget =
  | {
      type: 'goal'
      goal: SavingGoal
    }
  | {
      type: 'fund'
      fund: SinkingFund
    }

const defaultGoalFormValues: GoalFormValues = {
  title: '',
  emoji: '🎯',
  targetAmount: '',
  currentAmount: '0',
  deadline: '',
}

const defaultSinkingFundFormValues: SinkingFundFormValues = {
  title: '',
  emoji: '🐖',
  targetAmount: '',
  currentAmount: '0',
  monthlyContribution: '',
}

const defaultSaveMoneyFormValues: SaveMoneyFormValues = {
  accountId: '',
  amount: '',
}

function createGoalId() {
  return `goal-${Date.now()}`
}

function createSinkingFundId() {
  return `sinking-fund-${Date.now()}`
}

function getGoalFormValues(goal: SavingGoal): GoalFormValues {
  return {
    title: goal.title,
    emoji: goal.emoji,
    targetAmount: String(goal.targetAmount),
    currentAmount: String(goal.currentAmount),
    deadline: goal.deadline ?? '',
  }
}

function getSinkingFundFormValues(fund: SinkingFund): SinkingFundFormValues {
  return {
    title: fund.title,
    emoji: fund.emoji,
    targetAmount: String(fund.targetAmount),
    currentAmount: String(fund.currentAmount),
    monthlyContribution: String(fund.monthlyContribution),
  }
}

function parseAmount(value: string) {
  const normalizedValue = value.trim().replace(',', '.')

  if (!normalizedValue) {
    return 0
  }

  return Number(normalizedValue)
}

function getProgress(currentAmount: number, targetAmount: number) {
  if (targetAmount <= 0) {
    return 0
  }

  return Math.min(Math.round((currentAmount / targetAmount) * 100), 100)
}

function getRemainingAmount(currentAmount: number, targetAmount: number) {
  return Math.max(targetAmount - currentAmount, 0)
}

function getSaveMoneyTargetTitle(target: SaveMoneyTarget) {
  return target.type === 'goal' ? target.goal.title : target.fund.title
}

function getSaveMoneyTargetEmoji(target: SaveMoneyTarget) {
  return target.type === 'goal' ? target.goal.emoji : target.fund.emoji
}

function getSaveMoneyTargetCurrentAmount(target: SaveMoneyTarget) {
  return target.type === 'goal'
    ? target.goal.currentAmount
    : target.fund.currentAmount
}

function getSaveMoneyTargetTargetAmount(target: SaveMoneyTarget) {
  return target.type === 'goal'
    ? target.goal.targetAmount
    : target.fund.targetAmount
}

function PageStatCard({
  title,
  value,
  description,
  icon,
  variant,
}: {
  title: string
  value: string
  description: string
  icon: ReactNode
  variant: 'emerald' | 'blue' | 'rose' | 'amber' | 'violet'
}) {
  const variants = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    rose: 'border-rose-100 bg-rose-50 text-rose-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    violet: 'border-violet-100 bg-violet-50 text-violet-900',
  }

  const iconVariants = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
  }

  return (
    <div className={`rounded-[1.75rem] border p-5 ${variants[variant]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-2 text-sm opacity-75">{description}</p>
        </div>

        <div className={`rounded-2xl p-3 ${iconVariants[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function SaveMoneyModal({
  target,
  accounts,
  formValues,
  formError,
  onClose,
  onChange,
  onSubmit,
}: {
  target: SaveMoneyTarget
  accounts: Account[]
  formValues: SaveMoneyFormValues
  formError: string
  onClose: () => void
  onChange: (values: SaveMoneyFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const currentAmount = getSaveMoneyTargetCurrentAmount(target)
  const targetAmount = getSaveMoneyTargetTargetAmount(target)
  const remainingAmount = getRemainingAmount(currentAmount, targetAmount)
  const progress = getProgress(currentAmount, targetAmount)

  function updateField<Field extends keyof SaveMoneyFormValues>(
    field: Field,
    value: SaveMoneyFormValues[Field],
  ) {
    onChange({
      ...formValues,
      [field]: value,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center">
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Mise de côté
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Mettre de côté depuis un compte
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                L’argent sera retiré du compte choisi, ajouté à ton objectif, et
                une transaction d’épargne sera créée.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-100 p-3 text-slate-500 transition hover:bg-stone-200 hover:text-slate-950"
              aria-label="Fermer le formulaire"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white p-4 text-3xl shadow-sm">
                {getSaveMoneyTargetEmoji(target)}
              </div>

              <div>
                <p className="font-black text-slate-950">
                  {getSaveMoneyTargetTitle(target)}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {formatCurrency(currentAmount)} / {formatCurrency(targetAmount)} ·{' '}
                  {progress} %
                </p>
              </div>
            </div>

            <div className="mt-4 h-4 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-sm font-bold text-emerald-700">
              Il reste {formatCurrency(remainingAmount)} à mettre de côté.
            </p>
          </div>

          <label>
            <span className="text-sm font-bold text-slate-700">
              Compte source
            </span>

            <select
              value={formValues.accountId}
              onChange={(event) => updateField('accountId', event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Choisir un compte</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.emoji} {account.name} ·{' '}
                  {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-bold text-slate-700">
              Montant à mettre de côté
            </span>

            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 transition focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
              <input
                value={formValues.amount}
                onChange={(event) => updateField('amount', event.target.value)}
                placeholder="Ex : 50"
                inputMode="decimal"
                className="h-12 w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              />

              <span className="font-black text-slate-500">€</span>
            </div>
          </label>

          <div className="flex flex-wrap gap-2">
            {[25, 50, 100].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => updateField('amount', String(amount))}
                className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              >
                {formatCurrency(amount)}
              </button>
            ))}

            {remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => updateField('amount', String(remainingAmount))}
                className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-stone-200"
              >
                Tout compléter
              </button>
            )}
          </div>

          {formError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-stone-200"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={accounts.length === 0 || remainingAmount <= 0}
              className="rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mettre de côté
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GoalFormModal({
  formValues,
  formError,
  isEditing,
  onClose,
  onChange,
  onSubmit,
}: {
  formValues: GoalFormValues
  formError: string
  isEditing: boolean
  onClose: () => void
  onChange: (values: GoalFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  function updateField<Field extends keyof GoalFormValues>(
    field: Field,
    value: GoalFormValues[Field],
  ) {
    onChange({
      ...formValues,
      [field]: value,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center">
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                {isEditing ? 'Modification' : 'Nouvel objectif'}
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {isEditing
                  ? 'Modifier cet objectif'
                  : 'Créer un objectif d’épargne'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? 'Modifie le titre, les montants, l’emoji ou la date limite.'
                  : 'Ajoute un projet à suivre : vacances, sécurité, matériel, voiture...'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-100 p-3 text-slate-500 transition hover:bg-stone-200 hover:text-slate-950"
              aria-label="Fermer le formulaire"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-[0.35fr_1fr]">
            <label>
              <span className="text-sm font-bold text-slate-700">Emoji</span>

              <input
                value={formValues.emoji}
                onChange={(event) => updateField('emoji', event.target.value)}
                placeholder="🎯"
                maxLength={4}
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-center text-xl font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">Titre</span>

              <input
                value={formValues.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Ex : Appareil photo, vacances, fonds de sécurité..."
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">
                Montant cible
              </span>

              <input
                value={formValues.targetAmount}
                onChange={(event) =>
                  updateField('targetAmount', event.target.value)
                }
                placeholder="Ex : 1000"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Déjà mis de côté
              </span>

              <input
                value={formValues.currentAmount}
                onChange={(event) =>
                  updateField('currentAmount', event.target.value)
                }
                placeholder="Ex : 150"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Date limite facultative
            </span>

            <input
              type="date"
              value={formValues.deadline}
              onChange={(event) => updateField('deadline', event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          {formError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-stone-200"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
            >
              {isEditing
                ? 'Enregistrer les modifications'
                : 'Ajouter l’objectif'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SinkingFundFormModal({
  formValues,
  formError,
  isEditing,
  onClose,
  onChange,
  onSubmit,
}: {
  formValues: SinkingFundFormValues
  formError: string
  isEditing: boolean
  onClose: () => void
  onChange: (values: SinkingFundFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  function updateField<Field extends keyof SinkingFundFormValues>(
    field: Field,
    value: SinkingFundFormValues[Field],
  ) {
    onChange({
      ...formValues,
      [field]: value,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center">
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                {isEditing ? 'Modification' : 'Nouveau fonds'}
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {isEditing
                  ? 'Modifier ce fonds d’amortissement'
                  : 'Créer un fonds d’amortissement'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Prévois une grosse dépense future avec une mise de côté
                régulière.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-100 p-3 text-slate-500 transition hover:bg-stone-200 hover:text-slate-950"
              aria-label="Fermer le formulaire"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-[0.35fr_1fr]">
            <label>
              <span className="text-sm font-bold text-slate-700">Emoji</span>

              <input
                value={formValues.emoji}
                onChange={(event) => updateField('emoji', event.target.value)}
                placeholder="🐖"
                maxLength={4}
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-center text-xl font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">Titre</span>

              <input
                value={formValues.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Ex : Noël, voiture, impôts, vacances..."
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">
                Montant cible
              </span>

              <input
                value={formValues.targetAmount}
                onChange={(event) =>
                  updateField('targetAmount', event.target.value)
                }
                placeholder="Ex : 600"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Déjà mis de côté
              </span>

              <input
                value={formValues.currentAmount}
                onChange={(event) =>
                  updateField('currentAmount', event.target.value)
                }
                placeholder="Ex : 100"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Mise de côté prévue chaque mois
            </span>

            <input
              value={formValues.monthlyContribution}
              onChange={(event) =>
                updateField('monthlyContribution', event.target.value)
              }
              placeholder="Ex : 50"
              inputMode="decimal"
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          {formError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-stone-200"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
            >
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter le fonds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GoalCard({
  goal,
  onSaveRequest,
  onEditRequest,
  onDeleteRequest,
}: {
  goal: SavingGoal
  onSaveRequest: (goal: SavingGoal) => void
  onEditRequest: (goal: SavingGoal) => void
  onDeleteRequest: (goal: SavingGoal) => void
}) {
  const progress = getProgress(goal.currentAmount, goal.targetAmount)
  const remainingAmount = getRemainingAmount(goal.currentAmount, goal.targetAmount)
  const isCompleted = progress >= 100

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4 text-3xl">
            {goal.emoji}
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-950">{goal.title}</h2>

            {goal.deadline && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <CalendarDays className="h-4 w-4" />
                Objectif avant le{' '}
                {new Intl.DateTimeFormat('fr-FR').format(
                  new Date(`${goal.deadline}T12:00:00`),
                )}
              </p>
            )}
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-violet-50 text-violet-700'
          }`}
        >
          {isCompleted ? 'Terminé' : `${progress} %`}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Mis de côté
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {formatCurrency(goal.currentAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Objectif
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {formatCurrency(goal.targetAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Restant
          </p>

          <p className="mt-1 text-xl font-black text-violet-700">
            {formatCurrency(remainingAmount)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">Progression</p>
          <p className="text-sm font-black text-slate-500">{progress} %</p>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full rounded-full ${
              isCompleted ? 'bg-emerald-500' : 'bg-violet-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSaveRequest(goal)}
          disabled={isCompleted}
          className="flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-black text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PiggyBank className="h-4 w-4" />
          Mettre de côté
        </button>

        <button
          type="button"
          onClick={() => onEditRequest(goal)}
          className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </button>

        <button
          type="button"
          onClick={() => onDeleteRequest(goal)}
          className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>
    </article>
  )
}

function SinkingFundCard({
  fund,
  onSaveRequest,
  onEditRequest,
  onDeleteRequest,
}: {
  fund: SinkingFund
  onSaveRequest: (fund: SinkingFund) => void
  onEditRequest: (fund: SinkingFund) => void
  onDeleteRequest: (fund: SinkingFund) => void
}) {
  const progress = getProgress(fund.currentAmount, fund.targetAmount)
  const remainingAmount = getRemainingAmount(fund.currentAmount, fund.targetAmount)
  const isCompleted = progress >= 100

  const remainingMonths =
    fund.monthlyContribution > 0
      ? Math.ceil(remainingAmount / fund.monthlyContribution)
      : 0

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-3xl">
            {fund.emoji}
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-950">{fund.title}</h2>

            <p className="mt-1 text-sm text-slate-500">
              Mise de côté prévue :{' '}
              <span className="font-bold text-slate-700">
                {formatCurrency(fund.monthlyContribution)} / mois
              </span>
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {isCompleted ? 'Complet' : `${progress} %`}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Actuel
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {formatCurrency(fund.currentAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Cible
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {formatCurrency(fund.targetAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Estimation
          </p>

          <p className="mt-1 text-xl font-black text-emerald-700">
            {remainingMonths === 0 ? 'OK' : `${remainingMonths} mois`}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            Progression du fonds
          </p>

          <p className="text-sm font-black text-slate-500">{progress} %</p>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSaveRequest(fund)}
          disabled={isCompleted}
          className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PiggyBank className="h-4 w-4" />
          Mettre de côté
        </button>

        <button
          type="button"
          onClick={() => onEditRequest(fund)}
          className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </button>

        <button
          type="button"
          onClick={() => onDeleteRequest(fund)}
          className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>
    </article>
  )
}

export default function GoalsPage() {
  const {
    accounts,
    savingGoals,
    sinkingFunds,
    addSavingGoal,
    updateSavingGoal,
    saveMoneyToGoalFromAccount,
    deleteSavingGoal,
    addSinkingFund,
    updateSinkingFund,
    saveMoneyToSinkingFundFromAccount,
    deleteSinkingFund,
    resetGoals,
  } = useBudgetData()

  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false)
  const [goalFormValues, setGoalFormValues] =
    useState<GoalFormValues>(defaultGoalFormValues)
  const [goalFormError, setGoalFormError] = useState('')
  const [goalToEdit, setGoalToEdit] = useState<SavingGoal | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<SavingGoal | null>(null)

  const [isFundFormOpen, setIsFundFormOpen] = useState(false)
  const [fundFormValues, setFundFormValues] =
    useState<SinkingFundFormValues>(defaultSinkingFundFormValues)
  const [fundFormError, setFundFormError] = useState('')
  const [fundToEdit, setFundToEdit] = useState<SinkingFund | null>(null)
  const [fundToDelete, setFundToDelete] = useState<SinkingFund | null>(null)

  const [saveMoneyTarget, setSaveMoneyTarget] =
    useState<SaveMoneyTarget | null>(null)
  const [saveMoneyFormValues, setSaveMoneyFormValues] =
    useState<SaveMoneyFormValues>(defaultSaveMoneyFormValues)
  const [saveMoneyFormError, setSaveMoneyFormError] = useState('')

  const [searchParams, setSearchParams] = useSearchParams()
  const action = searchParams.get('action')
  const shouldShowGoalForm = isGoalFormOpen || action === 'new'

  const totalSavedInGoals = savingGoals.reduce(
    (total, goal) => total + goal.currentAmount,
    0,
  )

  const totalGoalTargets = savingGoals.reduce(
    (total, goal) => total + goal.targetAmount,
    0,
  )

  const totalSavedInFunds = sinkingFunds.reduce(
    (total, fund) => total + fund.currentAmount,
    0,
  )

  const totalFundTargets = sinkingFunds.reduce(
    (total, fund) => total + fund.targetAmount,
    0,
  )

  const totalMonthlyContributions = sinkingFunds.reduce(
    (total, fund) => total + fund.monthlyContribution,
    0,
  )

  const globalSaved = totalSavedInGoals + totalSavedInFunds
  const globalTarget = totalGoalTargets + totalFundTargets
  const globalProgress = getProgress(globalSaved, globalTarget)

  const completedGoals = savingGoals.filter(
    (goal) => goal.currentAmount >= goal.targetAmount,
  ).length

  function clearActionParam() {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('action')
    setSearchParams(nextSearchParams, { replace: true })
  }

  function getDefaultAccountId() {
    return accounts[0]?.id ?? ''
  }

  function openGoalForm() {
    setGoalToEdit(null)
    setGoalFormValues(defaultGoalFormValues)
    setGoalFormError('')
    setIsGoalFormOpen(true)
  }

  function openEditGoalForm(goal: SavingGoal) {
    setGoalToEdit(goal)
    setGoalFormValues(getGoalFormValues(goal))
    setGoalFormError('')
    setIsGoalFormOpen(true)

    if (action === 'new') {
      clearActionParam()
    }
  }

  function closeGoalForm() {
    setIsGoalFormOpen(false)
    setGoalToEdit(null)
    setGoalFormValues(defaultGoalFormValues)
    setGoalFormError('')

    if (action === 'new') {
      clearActionParam()
    }
  }

  function openFundForm() {
    setFundToEdit(null)
    setFundFormValues(defaultSinkingFundFormValues)
    setFundFormError('')
    setIsFundFormOpen(true)

    if (action === 'new') {
      clearActionParam()
    }
  }

  function openEditFundForm(fund: SinkingFund) {
    setFundToEdit(fund)
    setFundFormValues(getSinkingFundFormValues(fund))
    setFundFormError('')
    setIsFundFormOpen(true)

    if (action === 'new') {
      clearActionParam()
    }
  }

  function closeFundForm() {
    setIsFundFormOpen(false)
    setFundToEdit(null)
    setFundFormValues(defaultSinkingFundFormValues)
    setFundFormError('')
  }

  function openSaveMoneyForGoal(goal: SavingGoal) {
    setSaveMoneyTarget({
      type: 'goal',
      goal,
    })

    setSaveMoneyFormValues({
      accountId: getDefaultAccountId(),
      amount: '',
    })

    setSaveMoneyFormError('')
  }

  function openSaveMoneyForFund(fund: SinkingFund) {
    setSaveMoneyTarget({
      type: 'fund',
      fund,
    })

    setSaveMoneyFormValues({
      accountId: getDefaultAccountId(),
      amount:
        fund.monthlyContribution > 0 ? String(fund.monthlyContribution) : '',
    })

    setSaveMoneyFormError('')
  }

  function closeSaveMoneyModal() {
    setSaveMoneyTarget(null)
    setSaveMoneyFormValues(defaultSaveMoneyFormValues)
    setSaveMoneyFormError('')
  }

  function handleSaveMoneySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!saveMoneyTarget) {
      return
    }

    const amount = parseAmount(saveMoneyFormValues.amount)
    const currentAmount = getSaveMoneyTargetCurrentAmount(saveMoneyTarget)
    const targetAmount = getSaveMoneyTargetTargetAmount(saveMoneyTarget)
    const remainingAmount = getRemainingAmount(currentAmount, targetAmount)

    if (accounts.length === 0) {
      setSaveMoneyFormError(
        'Crée d’abord un compte pour pouvoir mettre de côté.',
      )
      return
    }

    if (!saveMoneyFormValues.accountId) {
      setSaveMoneyFormError('Choisis le compte source.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setSaveMoneyFormError('Ajoute un montant supérieur à 0 €.')
      return
    }

    if (remainingAmount <= 0) {
      setSaveMoneyFormError('Cet objectif est déjà complété.')
      return
    }

    if (saveMoneyTarget.type === 'goal') {
      saveMoneyToGoalFromAccount(
        saveMoneyTarget.goal.id,
        saveMoneyFormValues.accountId,
        amount,
      )
    } else {
      saveMoneyToSinkingFundFromAccount(
        saveMoneyTarget.fund.id,
        saveMoneyFormValues.accountId,
        amount,
      )
    }

    closeSaveMoneyModal()
  }

  function handleGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = goalFormValues.title.trim()
    const emoji = goalFormValues.emoji.trim() || '🎯'
    const targetAmount = parseAmount(goalFormValues.targetAmount)
    const currentAmount = parseAmount(goalFormValues.currentAmount)

    if (!title) {
      setGoalFormError('Ajoute un titre à ton objectif.')
      return
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setGoalFormError('Ajoute un montant cible supérieur à 0.')
      return
    }

    if (!Number.isFinite(currentAmount)) {
      setGoalFormError('Le montant déjà mis de côté doit être un nombre valide.')
      return
    }

    if (currentAmount < 0 || currentAmount > targetAmount) {
      setGoalFormError(
        'Le montant déjà mis de côté doit être compris entre 0 et le montant cible.',
      )
      return
    }

    const nextGoal: SavingGoal = {
      id: goalToEdit?.id ?? createGoalId(),
      title,
      emoji,
      targetAmount,
      currentAmount,
      deadline: goalFormValues.deadline || undefined,
    }

    if (goalToEdit) {
      updateSavingGoal(nextGoal)
    } else {
      addSavingGoal(nextGoal)
    }

    closeGoalForm()
  }

  function handleFundSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = fundFormValues.title.trim()
    const emoji = fundFormValues.emoji.trim() || '🐖'
    const targetAmount = parseAmount(fundFormValues.targetAmount)
    const currentAmount = parseAmount(fundFormValues.currentAmount)
    const monthlyContribution = parseAmount(fundFormValues.monthlyContribution)

    if (!title) {
      setFundFormError('Ajoute un titre à ton fonds.')
      return
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setFundFormError('Ajoute un montant cible supérieur à 0.')
      return
    }

    if (!Number.isFinite(currentAmount)) {
      setFundFormError('Le montant déjà mis de côté doit être un nombre valide.')
      return
    }

    if (currentAmount < 0 || currentAmount > targetAmount) {
      setFundFormError(
        'Le montant déjà mis de côté doit être compris entre 0 et le montant cible.',
      )
      return
    }

    if (!Number.isFinite(monthlyContribution) || monthlyContribution <= 0) {
      setFundFormError('Ajoute une mensualité prévue supérieure à 0.')
      return
    }

    const nextFund: SinkingFund = {
      id: fundToEdit?.id ?? createSinkingFundId(),
      title,
      emoji,
      targetAmount,
      currentAmount,
      monthlyContribution,
    }

    if (fundToEdit) {
      updateSinkingFund(nextFund)
    } else {
      addSinkingFund(nextFund)
    }

    closeFundForm()
  }

  function handleResetGoals() {
    resetGoals()
    setGoalFormValues(defaultGoalFormValues)
    setGoalFormError('')
    setGoalToEdit(null)
    setIsGoalFormOpen(false)
    setFundFormValues(defaultSinkingFundFormValues)
    setFundFormError('')
    setFundToEdit(null)
    setIsFundFormOpen(false)
    closeSaveMoneyModal()

    if (action === 'new') {
      clearActionParam()
    }
  }

  function confirmDeleteGoal() {
    if (!goalToDelete) {
      return
    }

    deleteSavingGoal(goalToDelete.id)
    setGoalToDelete(null)
  }

  function confirmDeleteFund() {
    if (!fundToDelete) {
      return
    }

    deleteSinkingFund(fundToDelete.id)
    setFundToDelete(null)
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-100/70 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Objectifs et épargne
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Donner un but à ton argent
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Suis tes projets, tes fonds d’amortissement et ta progression.
                Quand tu mets de côté, l’argent sort maintenant d’un vrai compte
                et crée une transaction d’épargne.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetGoals}
              className="flex w-fit items-center gap-2 rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-stone-200"
            >
              <RefreshCcw className="h-4 w-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Total mis de côté"
          value={formatCurrency(globalSaved)}
          description="Objectifs + fonds d’amortissement"
          icon={<WalletCards className="h-5 w-5" />}
          variant="emerald"
        />

        <PageStatCard
          title="Objectif global"
          value={formatCurrency(globalTarget)}
          description="Montant total visé"
          icon={<Target className="h-5 w-5" />}
          variant="violet"
        />

        <PageStatCard
          title="Progression"
          value={`${globalProgress} %`}
          description="Avancement général"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="blue"
        />

        <PageStatCard
          title="Mensualités prévues"
          value={formatCurrency(totalMonthlyContributions)}
          description="À mettre de côté chaque mois"
          icon={<Coins className="h-5 w-5" />}
          variant="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Vue globale
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Épargne réalisée à {globalProgress} %
              </h2>
            </div>

            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 h-5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${globalProgress}%` }}
            />
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Tu as déjà mis de côté{' '}
            <span className="font-bold text-slate-950">
              {formatCurrency(globalSaved)}
            </span>{' '}
            sur un objectif total de{' '}
            <span className="font-bold text-slate-950">
              {formatCurrency(globalTarget)}
            </span>
            .
          </p>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Défi du mois
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Mode anti-dépense inutile
              </h2>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Objectif simple : mettre de côté au moins{' '}
            <span className="font-bold text-slate-950">100 €</span> ce mois-ci
            en réduisant les petites dépenses non prévues.
          </p>

          <div className="mt-5 rounded-3xl bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-emerald-800">
                Objectifs terminés
              </p>

              <p className="text-lg font-black text-emerald-950">
                {completedGoals} / {savingGoals.length}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Chaque objectif atteint débloquera plus tard un badge.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Objectifs d’épargne
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Tes projets importants
            </h2>
          </div>

          <button
            type="button"
            onClick={openGoalForm}
            className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
          >
            <Plus className="h-4 w-4" />
            Nouvel objectif
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {savingGoals.length > 0 ? (
            savingGoals.map((goal) => (
              <GoalCard
                key={`${goal.id}-${goal.title}-${goal.currentAmount}-${goal.targetAmount}-${goal.deadline}`}
                goal={goal}
                onSaveRequest={openSaveMoneyForGoal}
                onEditRequest={openEditGoalForm}
                onDeleteRequest={setGoalToDelete}
              />
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">🎯</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Aucun objectif
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Ajoute un objectif pour suivre tes projets importants.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Fonds d’amortissement
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Prévoir les grosses dépenses
            </h2>
          </div>

          <button
            type="button"
            onClick={openFundForm}
            className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
          >
            <Plus className="h-4 w-4" />
            Nouveau fonds
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {sinkingFunds.length > 0 ? (
            sinkingFunds.map((fund) => (
              <SinkingFundCard
                key={`${fund.id}-${fund.title}-${fund.currentAmount}-${fund.targetAmount}-${fund.monthlyContribution}`}
                fund={fund}
                onSaveRequest={openSaveMoneyForFund}
                onEditRequest={openEditFundForm}
                onDeleteRequest={setFundToDelete}
              />
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">🐖</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Aucun fonds d’amortissement
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Ajoute un fonds pour anticiper une grosse dépense future.
              </p>
            </div>
          )}
        </div>
      </section>

      {shouldShowGoalForm && (
        <GoalFormModal
          formValues={goalFormValues}
          formError={goalFormError}
          isEditing={Boolean(goalToEdit)}
          onClose={closeGoalForm}
          onChange={setGoalFormValues}
          onSubmit={handleGoalSubmit}
        />
      )}

      {isFundFormOpen && (
        <SinkingFundFormModal
          formValues={fundFormValues}
          formError={fundFormError}
          isEditing={Boolean(fundToEdit)}
          onClose={closeFundForm}
          onChange={setFundFormValues}
          onSubmit={handleFundSubmit}
        />
      )}

      {saveMoneyTarget && (
        <SaveMoneyModal
          target={saveMoneyTarget}
          accounts={accounts}
          formValues={saveMoneyFormValues}
          formError={saveMoneyFormError}
          onClose={closeSaveMoneyModal}
          onChange={setSaveMoneyFormValues}
          onSubmit={handleSaveMoneySubmit}
        />
      )}

      {goalToDelete && (
        <ConfirmActionModal
          eyebrow="Suppression"
          title="Supprimer cet objectif ?"
          description={`Tu es sur le point de supprimer "${goalToDelete.title}". Cet objectif sera retiré du suivi actuel.`}
          confirmLabel="Supprimer l’objectif"
          cancelLabel="Annuler"
          icon={<Trash2 className="h-5 w-5" />}
          variant="danger"
          onCancel={() => setGoalToDelete(null)}
          onConfirm={confirmDeleteGoal}
        />
      )}

      {fundToDelete && (
        <ConfirmActionModal
          eyebrow="Suppression"
          title="Supprimer ce fonds ?"
          description={`Tu es sur le point de supprimer "${fundToDelete.title}". Ce fonds d’amortissement sera retiré du suivi actuel.`}
          confirmLabel="Supprimer le fonds"
          cancelLabel="Annuler"
          icon={<Trash2 className="h-5 w-5" />}
          variant="danger"
          onCancel={() => setFundToDelete(null)}
          onConfirm={confirmDeleteFund}
        />
      )}
    </div>
  )
}