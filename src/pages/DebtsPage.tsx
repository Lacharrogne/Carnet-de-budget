import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  AlertTriangle,
  Banknote,
  CreditCard,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingDown,
  WalletCards,
  X,
} from 'lucide-react'

import ConfirmActionModal from '../components/ui/ConfirmActionModal'
import { useBudgetData } from '../context/useBudgetData'
import type { Account } from '../types/budget'
import type { Debt } from '../types/debt'
import { formatCurrency } from '../utils/formatCurrency'

type DebtFormValues = {
  title: string
  emoji: string
  totalAmount: string
  remainingAmount: string
  monthlyPayment: string
  interestRate: string
}

type RepaymentFormValues = {
  accountId: string
  amount: string
}

const defaultDebtFormValues: DebtFormValues = {
  title: '',
  emoji: '💳',
  totalAmount: '',
  remainingAmount: '',
  monthlyPayment: '',
  interestRate: '0',
}

function createDebtId() {
  return `debt-${Date.now()}`
}

function getDebtFormValues(debt: Debt): DebtFormValues {
  return {
    title: debt.title,
    emoji: debt.emoji,
    totalAmount: String(debt.totalAmount),
    remainingAmount: String(debt.remainingAmount),
    monthlyPayment: String(debt.monthlyPayment),
    interestRate: String(debt.interestRate),
  }
}

function getDefaultRepaymentFormValues(
  accounts: Account[],
  debt: Debt,
  presetAmount?: number,
): RepaymentFormValues {
  const defaultAmount =
    presetAmount ??
    Math.min(
      debt.monthlyPayment > 0 ? debt.monthlyPayment : debt.remainingAmount,
      debt.remainingAmount,
    )

  return {
    accountId: accounts[0]?.id ?? '',
    amount: String(defaultAmount),
  }
}

function parseAmount(value: string) {
  const normalizedValue = value.trim().replace(',', '.')

  if (!normalizedValue) {
    return 0
  }

  return Number(normalizedValue)
}

function getDebtProgress(debt: Debt) {
  if (debt.totalAmount <= 0) {
    return 0
  }

  const paidAmount = debt.totalAmount - debt.remainingAmount

  return Math.min(Math.round((paidAmount / debt.totalAmount) * 100), 100)
}

function getRemainingMonths(debt: Debt) {
  if (debt.monthlyPayment <= 0 || debt.remainingAmount <= 0) {
    return 0
  }

  return Math.ceil(debt.remainingAmount / debt.monthlyPayment)
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
  variant: 'emerald' | 'blue' | 'rose' | 'amber'
}) {
  const variants = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    rose: 'border-rose-100 bg-rose-50 text-rose-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
  }

  const iconVariants = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
  }

  return (
    <article className={`rounded-[1.75rem] border p-5 ${variants[variant]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="tabular mt-3 text-3xl font-black tracking-tight">
            {value}
          </p>
          <p className="mt-2 text-sm opacity-75">{description}</p>
        </div>

        <div className={`rounded-2xl p-3 ${iconVariants[variant]}`}>
          {icon}
        </div>
      </div>
    </article>
  )
}

function NoAccountWarning() {
  return (
    <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
            <WalletCards className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-amber-700">
              Compte nécessaire
            </p>

            <h2 className="mt-1 text-xl font-black text-amber-950">
              Créez d’abord un compte pour rembourser une dette
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800/80">
              Le remboursement doit venir d’un vrai compte. Une transaction sera
              créée automatiquement et le solde du compte sera corrigé.
            </p>
          </div>
        </div>

        <Link
          to="/comptes"
          className="flex w-fit items-center justify-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
        >
          <Plus className="h-4 w-4" />
          Créer un compte
        </Link>
      </div>
    </section>
  )
}

function BudgetErrorBanner({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  return (
    <section className="rounded-[2rem] border border-rose-100 bg-rose-50 p-5 text-rose-900 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-rose-700 shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-rose-700">
              Une erreur est survenue
            </p>

            <p className="mt-1 text-sm leading-6 text-rose-800">{message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white p-2 text-rose-600 transition hover:bg-rose-100"
          aria-label="Fermer l’erreur"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

function DebtFormModal({
  formValues,
  formError,
  isEditing,
  onClose,
  onChange,
  onSubmit,
}: {
  formValues: DebtFormValues
  formError: string
  isEditing: boolean
  onClose: () => void
  onChange: (values: DebtFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  function updateField<Field extends keyof DebtFormValues>(
    field: Field,
    value: DebtFormValues[Field],
  ) {
    onChange({
      ...formValues,
      [field]: value,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 md:items-center">
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />

      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                {isEditing ? 'Modification' : 'Nouvelle dette'}
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {isEditing
                  ? 'Modifier cette dette'
                  : 'Ajouter une dette à suivre'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? 'Modifiez le nom, les montants, la mensualité ou le taux.'
                  : 'Ajoutez un crédit, un paiement en plusieurs fois ou une dette à rembourser.'}
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
                placeholder="💳"
                maxLength={4}
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-center text-xl font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Nom de la dette
              </span>

              <input
                value={formValues.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Ex : Crédit voiture, téléphone, prêt familial..."
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">
                Montant total
              </span>

              <input
                value={formValues.totalAmount}
                onChange={(event) =>
                  updateField('totalAmount', event.target.value)
                }
                placeholder="Ex : 6000"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Montant restant
              </span>

              <input
                value={formValues.remainingAmount}
                onChange={(event) =>
                  updateField('remainingAmount', event.target.value)
                }
                placeholder="Ex : 3200"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-700">
                Mensualité
              </span>

              <input
                value={formValues.monthlyPayment}
                onChange={(event) =>
                  updateField('monthlyPayment', event.target.value)
                }
                placeholder="Ex : 180"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Taux d’intérêt facultatif
              </span>

              <input
                value={formValues.interestRate}
                onChange={(event) =>
                  updateField('interestRate', event.target.value)
                }
                placeholder="Ex : 3.2"
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
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
              className="rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
            >
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter la dette'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RepaymentFormModal({
  debt,
  accounts,
  formValues,
  formError,
  onClose,
  onChange,
  onSubmit,
}: {
  debt: Debt
  accounts: Account[]
  formValues: RepaymentFormValues
  formError: string
  onClose: () => void
  onChange: (values: RepaymentFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const amount = parseAmount(formValues.amount)
  const selectedAccount = accounts.find((account) => {
    return account.id === formValues.accountId
  })

  function updateField<Field extends keyof RepaymentFormValues>(
    field: Field,
    value: RepaymentFormValues[Field],
  ) {
    onChange({
      ...formValues,
      [field]: value,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 md:items-center">
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />

      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Remboursement
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Rembourser {debt.title}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Le montant sera retiré du compte choisi, une transaction sera
                créée, puis la dette diminuera automatiquement.
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
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-400">
                Dette restante
              </p>

              <p className="tabular mt-2 text-xl font-black text-rose-950">
                {formatCurrency(debt.remainingAmount)}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-500">
                Mensualité
              </p>

              <p className="tabular mt-2 text-xl font-black text-emerald-950">
                {formatCurrency(debt.monthlyPayment)}
              </p>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Après paiement
              </p>

              <p className="tabular mt-2 text-xl font-black text-slate-950">
                {formatCurrency(Math.max(debt.remainingAmount - amount, 0))}
              </p>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Compte utilisé
            </span>

            <select
              value={formValues.accountId}
              onChange={(event) => updateField('accountId', event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Choisir un compte</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.emoji} {account.name} —{' '}
                  {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
          </label>

          {selectedAccount && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-600">
              Solde actuel de{' '}
              <span className="font-black text-slate-950">
                {selectedAccount.name}
              </span>{' '}
              :{' '}
              <span className="tabular font-black text-slate-950">
                {formatCurrency(selectedAccount.balance)}
              </span>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Montant remboursé
            </span>

            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 transition focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
              <input
                value={formValues.amount}
                onChange={(event) => updateField('amount', event.target.value)}
                placeholder="Ex : 180"
                inputMode="decimal"
                aria-label="Montant remboursé en euros"
                className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
              />

              <span className="font-black text-slate-500">€</span>
            </div>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                updateField(
                  'amount',
                  String(Math.min(debt.monthlyPayment, debt.remainingAmount)),
                )
              }
              className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
            >
              Mensualité
            </button>

            <button
              type="button"
              onClick={() =>
                updateField('amount', String(debt.remainingAmount))
              }
              className="rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100"
            >
              Solder la dette
            </button>
          </div>

          {formError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {formError}
            </div>
          )}

          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
            Pour annuler un remboursement, il suffira de supprimer la
            transaction liée dans la page Transactions : le solde du compte et
            la dette seront corrigés automatiquement.
          </div>

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
              Valider le remboursement
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DebtCard({
  debt,
  canRepay,
  onRepayRequest,
  onEditRequest,
  onDeleteRequest,
}: {
  debt: Debt
  canRepay: boolean
  onRepayRequest: (debt: Debt, amount?: number) => void
  onEditRequest: (debt: Debt) => void
  onDeleteRequest: (debt: Debt) => void
}) {
  const progress = getDebtProgress(debt)
  const paidAmount = debt.totalAmount - debt.remainingAmount
  const remainingMonths = getRemainingMonths(debt)
  const isPaid = debt.remainingAmount <= 0
  const monthlyRepaymentAmount = Math.min(
    debt.monthlyPayment,
    debt.remainingAmount,
  )

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`rounded-3xl border p-4 text-3xl ${
              isPaid
                ? 'border-emerald-100 bg-emerald-50'
                : 'border-rose-100 bg-rose-50'
            }`}
          >
            {debt.emoji}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black text-slate-950">
                {debt.title}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {isPaid ? 'Remboursée' : `${progress} % remboursé`}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Mensualité :{' '}
              <span className="tabular font-bold text-slate-700">
                {formatCurrency(debt.monthlyPayment)}
              </span>
              {debt.interestRate > 0 && (
                <>
                  {' '}
                  · Taux :{' '}
                  <span className="font-bold text-slate-700">
                    {debt.interestRate} %
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="tabular text-2xl font-black text-rose-700">
          {formatCurrency(debt.remainingAmount)}
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Total
          </p>

          <p className="tabular mt-2 font-black text-slate-950">
            {formatCurrency(debt.totalAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Payé
          </p>

          <p className="tabular mt-2 font-black text-emerald-700">
            {formatCurrency(paidAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Restant
          </p>

          <p className="tabular mt-2 font-black text-rose-700">
            {formatCurrency(debt.remainingAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Fin estimée
          </p>

          <p className="mt-2 font-black text-amber-700">
            {remainingMonths === 0 ? 'OK' : `${remainingMonths} mois`}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            Progression du remboursement
          </p>

          <p className="text-sm font-black text-slate-500">{progress} %</p>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full rounded-full ${
              isPaid ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEditRequest(debt)}
          className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-stone-200 hover:text-slate-950"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </button>

        <button
          type="button"
          disabled={isPaid || !canRepay}
          onClick={() => onRepayRequest(debt)}
          className={`rounded-full px-4 py-2 text-sm font-black transition ${
            isPaid || !canRepay
              ? 'cursor-not-allowed bg-stone-100 text-slate-300'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Rembourser
        </button>

        <button
          type="button"
          disabled={isPaid || !canRepay}
          onClick={() => onRepayRequest(debt, monthlyRepaymentAmount)}
          className={`rounded-full px-4 py-2 text-sm font-black transition ${
            isPaid || !canRepay
              ? 'cursor-not-allowed bg-stone-100 text-slate-300'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          Payer la mensualité
        </button>

        <button
          type="button"
          onClick={() => onDeleteRequest(debt)}
          className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>
    </article>
  )
}

export default function DebtsPage() {
  const {
    accounts,
    debts,
    budgetError,
    clearBudgetError,
    addDebt,
    updateDebt,
    repayDebtFromAccount,
    deleteDebt,
  } = useBudgetData()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] =
    useState<DebtFormValues>(defaultDebtFormValues)
  const [formError, setFormError] = useState('')
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null)
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null)
  const [debtToRepay, setDebtToRepay] = useState<Debt | null>(null)
  const [repaymentFormValues, setRepaymentFormValues] =
    useState<RepaymentFormValues>({
      accountId: '',
      amount: '',
    })
  const [repaymentFormError, setRepaymentFormError] = useState('')

  const [searchParams, setSearchParams] = useSearchParams()
  const action = searchParams.get('action')
  const shouldShowForm = isFormOpen || action === 'new'
  const canRepay = accounts.length > 0

  const totalDebtAmount = debts.reduce((total, debt) => {
    return total + debt.totalAmount
  }, 0)

  const totalRemainingAmount = debts.reduce((total, debt) => {
    return total + debt.remainingAmount
  }, 0)

  const totalPaidAmount = totalDebtAmount - totalRemainingAmount

  const totalMonthlyPayments = debts
    .filter((debt) => debt.remainingAmount > 0)
    .reduce((total, debt) => {
      return total + Math.min(debt.monthlyPayment, debt.remainingAmount)
    }, 0)

  const globalProgress =
    totalDebtAmount > 0
      ? Math.round((totalPaidAmount / totalDebtAmount) * 100)
      : 0

  const paidDebtsCount = debts.filter((debt) => debt.remainingAmount <= 0).length

  function clearActionParam() {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('action')
    setSearchParams(nextSearchParams, { replace: true })
  }

  function openForm() {
    clearBudgetError()
    setDebtToEdit(null)
    setFormValues(defaultDebtFormValues)
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(debt: Debt) {
    clearBudgetError()
    setDebtToEdit(debt)
    setFormValues(getDebtFormValues(debt))
    setFormError('')
    setIsFormOpen(true)

    if (action === 'new') {
      clearActionParam()
    }
  }

  function closeForm() {
    setIsFormOpen(false)
    setDebtToEdit(null)
    setFormValues(defaultDebtFormValues)
    setFormError('')

    if (action === 'new') {
      clearActionParam()
    }
  }

  function openRepaymentForm(debt: Debt, presetAmount?: number) {
    clearBudgetError()

    if (!canRepay) {
      setRepaymentFormError('Créez d’abord un compte pour rembourser une dette.')
      return
    }

    setDebtToRepay(debt)
    setRepaymentFormValues(
      getDefaultRepaymentFormValues(accounts, debt, presetAmount),
    )
    setRepaymentFormError('')
  }

  function closeRepaymentForm() {
    setDebtToRepay(null)
    setRepaymentFormValues({
      accountId: '',
      amount: '',
    })
    setRepaymentFormError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = formValues.title.trim()
    const emoji = formValues.emoji.trim() || '💳'
    const totalAmount = parseAmount(formValues.totalAmount)
    const remainingAmount = parseAmount(formValues.remainingAmount)
    const monthlyPayment = parseAmount(formValues.monthlyPayment)
    const interestRate = parseAmount(formValues.interestRate)

    if (!title) {
      setFormError('Ajoutez un nom pour cette dette.')
      return
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      setFormError('Ajoutez un montant total supérieur à 0 €.')
      return
    }

    if (
      !Number.isFinite(remainingAmount) ||
      remainingAmount < 0 ||
      remainingAmount > totalAmount
    ) {
      setFormError(
        'Le montant restant doit être compris entre 0 et le montant total.',
      )
      return
    }

    if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
      setFormError('Ajoutez une mensualité supérieure à 0 €.')
      return
    }

    if (!Number.isFinite(interestRate) || interestRate < 0) {
      setFormError('Le taux doit être supérieur ou égal à 0.')
      return
    }

    const nextDebt: Debt = {
      id: debtToEdit?.id ?? createDebtId(),
      title,
      emoji,
      totalAmount,
      remainingAmount,
      monthlyPayment,
      interestRate,
    }

    if (debtToEdit) {
      updateDebt(nextDebt)
    } else {
      addDebt(nextDebt)
    }

    closeForm()
  }

  function handleRepaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!debtToRepay) {
      return
    }

    const amount = parseAmount(repaymentFormValues.amount)

    if (!repaymentFormValues.accountId) {
      setRepaymentFormError('Choisissez le compte utilisé pour le remboursement.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setRepaymentFormError('Saisissez un montant supérieur à 0 €.')
      return
    }

    if (amount > debtToRepay.remainingAmount) {
      setRepaymentFormError(
        'Le montant ne peut pas dépasser le reste de la dette.',
      )
      return
    }

    repayDebtFromAccount(
      debtToRepay.id,
      repaymentFormValues.accountId,
      amount,
    )

    closeRepaymentForm()
  }

  function confirmDeleteDebt() {
    if (!debtToDelete) {
      return
    }

    deleteDebt(debtToDelete.id)
    setDebtToDelete(null)
  }

  return (
    <div className="space-y-6">
      <section className="animate-rise card-premium overflow-hidden">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Dettes et remboursements
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.4rem] md:leading-[1.1]">
                Reprenez le contrôle de vos dettes
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Suivez vos crédits, paiements en plusieurs fois et dettes
                personnelles, à votre rythme. Les remboursements passent
                maintenant par un vrai compte et créent une transaction
                automatiquement.
              </p>
            </div>

            <button
              type="button"
              onClick={openForm}
              className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" />
              Nouvelle dette
            </button>
          </div>
        </div>
      </section>

      {!canRepay && <NoAccountWarning />}

      {budgetError && (
        <BudgetErrorBanner message={budgetError} onClose={clearBudgetError} />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          title="Dette restante"
          value={formatCurrency(totalRemainingAmount)}
          description="Montant encore à rembourser"
          icon={<CreditCard className="h-5 w-5" />}
          variant="rose"
        />

        <PageStatCard
          title="Déjà remboursé"
          value={formatCurrency(totalPaidAmount)}
          description="Progression globale"
          icon={<ShieldCheck className="h-5 w-5" />}
          variant="emerald"
        />

        <PageStatCard
          title="Mensualités"
          value={formatCurrency(totalMonthlyPayments)}
          description="Remboursement prévu chaque mois"
          icon={<Banknote className="h-5 w-5" />}
          variant="amber"
        />

        <PageStatCard
          title="Progression"
          value={`${globalProgress} %`}
          description={`${paidDebtsCount} dette${
            paidDebtsCount > 1 ? 's' : ''
          } terminée${paidDebtsCount > 1 ? 's' : ''}`}
          icon={<TrendingDown className="h-5 w-5" />}
          variant="blue"
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
                Remboursement global à {globalProgress} %
              </h2>
            </div>

            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
              <WalletCards className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 h-5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-rose-500"
              style={{ width: `${globalProgress}%` }}
            />
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-600">
            Vous avez déjà remboursé{' '}
            <span className="tabular font-black text-emerald-700">
              {formatCurrency(totalPaidAmount)}
            </span>{' '}
            sur un total initial de{' '}
            <span className="tabular font-black text-slate-950">
              {formatCurrency(totalDebtAmount)}
            </span>
            .
          </p>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Analyse rapide
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Ce qu’il faut surveiller
              </h2>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-[1.5rem] bg-rose-50 p-5">
              <p className="text-sm font-semibold text-rose-700">
                Poids mensuel
              </p>

              <p className="tabular mt-2 text-3xl font-black text-rose-950">
                {formatCurrency(totalMonthlyPayments)}
              </p>

              <p className="mt-2 text-sm text-rose-800/80">
                C’est le montant prévu chaque mois pour les dettes encore en
                cours.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-emerald-50 p-5">
              <p className="text-sm font-semibold text-emerald-700">
                Logique propre
              </p>

              <p className="mt-2 text-xl font-black text-emerald-950">
                Plus d’argent imaginaire
              </p>

              <p className="mt-2 text-sm text-emerald-800/80">
                Chaque remboursement retire réellement l’argent d’un compte et
                diminue la dette.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Liste des dettes
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {debts.length} dette{debts.length > 1 ? 's' : ''}
            </h2>
          </div>

          <button
            type="button"
            onClick={openForm}
            className="flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {debts.length > 0 ? (
            debts.map((debt) => (
              <DebtCard
                key={`${debt.id}-${debt.title}-${debt.totalAmount}-${debt.remainingAmount}-${debt.monthlyPayment}-${debt.interestRate}`}
                debt={debt}
                canRepay={canRepay}
                onRepayRequest={openRepaymentForm}
                onEditRequest={openEditForm}
                onDeleteRequest={setDebtToDelete}
              />
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
              <p className="text-3xl">🎉</p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                Aucune dette enregistrée
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Ajoutez une dette uniquement si vous souhaitez suivre un
                remboursement.
              </p>
            </div>
          )}
        </div>
      </section>

      {shouldShowForm && (
        <DebtFormModal
          formValues={formValues}
          formError={formError}
          isEditing={Boolean(debtToEdit)}
          onClose={closeForm}
          onChange={setFormValues}
          onSubmit={handleSubmit}
        />
      )}

      {debtToRepay && (
        <RepaymentFormModal
          debt={debtToRepay}
          accounts={accounts}
          formValues={repaymentFormValues}
          formError={repaymentFormError}
          onClose={closeRepaymentForm}
          onChange={setRepaymentFormValues}
          onSubmit={handleRepaymentSubmit}
        />
      )}

      {debtToDelete && (
        <ConfirmActionModal
          eyebrow="Suppression"
          title="Supprimer cette dette ?"
          description={`Vous êtes sur le point de supprimer "${debtToDelete.title}". Cette action retirera cette dette de votre suivi.`}
          confirmLabel="Supprimer la dette"
          cancelLabel="Annuler"
          icon={<Trash2 className="h-5 w-5" />}
          variant="danger"
          onCancel={() => setDebtToDelete(null)}
          onConfirm={confirmDeleteDebt}
        />
      )}
    </div>
  )
}