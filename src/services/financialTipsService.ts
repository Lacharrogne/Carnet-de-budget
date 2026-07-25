import type { BudgetUsage, EndOfMonthForecast } from './budgetStatsService'
import type { SavingGoal, SinkingFund } from '../types/budget'
import { formatCurrency } from '../utils/formatCurrency'

/**
 * Moteur de conseils financiers.
 *
 * Génère une courte liste de conseils utiles, concrets et toujours
 * bienveillants à partir de la situation réelle du mois. Jamais
 * culpabilisant : on éclaire et on propose, on ne juge pas.
 */

export type TipTone = 'positive' | 'info' | 'warning'

export type FinancialTip = {
  id: string
  tone: TipTone
  title: string
  message: string
  actionLabel?: string
  href?: string
}

export function getFinancialTips({
  monthlyIncome,
  monthlyBalance,
  budgetUsages,
  recurringMonthlyTotal,
  savingGoals,
  sinkingFunds,
  subscriptionCandidatesCount,
  forecast,
  maxTips = 4,
}: {
  monthlyIncome: number
  monthlyBalance: number
  budgetUsages: BudgetUsage[]
  recurringMonthlyTotal: number
  savingGoals: SavingGoal[]
  sinkingFunds: SinkingFund[]
  subscriptionCandidatesCount: number
  forecast: EndOfMonthForecast | null
  maxTips?: number
}): FinancialTip[] {
  const tips: FinancialTip[] = []

  // 1. Budget dépassé — le poste le plus en dépassement.
  const overBudget = budgetUsages
    .filter((budget) => budget.status === 'danger')
    .sort((a, b) => b.spent - b.limit - (a.spent - a.limit))[0]

  if (overBudget) {
    tips.push({
      id: 'budget-danger',
      tone: 'warning',
      title: `Budget ${overBudget.category.name} dépassé`,
      message: `Vous avez dépassé ce budget de ${formatCurrency(
        overBudget.spent - overBudget.limit,
      )}. Rien de grave : ajustez la limite ou levez le pied sur ce poste d’ici la fin du mois.`,
      actionLabel: 'Voir mes budgets',
      href: '/budgets',
    })
  } else {
    // Sinon, un budget proche de la limite (à surveiller).
    const warningBudget = budgetUsages
      .filter((budget) => budget.status === 'warning')
      .sort((a, b) => b.percentage - a.percentage)[0]

    if (warningBudget) {
      tips.push({
        id: 'budget-warning',
        tone: 'warning',
        title: `Budget ${warningBudget.category.name} à surveiller`,
        message: `Vous avez utilisé ${warningBudget.percentage} % de ce budget. Il vous reste ${formatCurrency(
          warningBudget.remaining,
        )} pour finir le mois.`,
        actionLabel: 'Voir mes budgets',
        href: '/budgets',
      })
    }
  }

  // 2. Fin de mois tendue (prévision).
  if (forecast && forecast.tone === 'risque') {
    tips.push({
      id: 'forecast-risk',
      tone: 'warning',
      title: 'Fin de mois à surveiller',
      message: `À ce rythme, le mois se terminerait autour de ${formatCurrency(
        forecast.projectedEndBalance,
      )}. Un coup d’œil à vos plus gros postes suffit souvent à retrouver de l’air.`,
      actionLabel: 'Analyser mes dépenses',
      href: '/statistiques',
    })
  }

  // 3. Abonnements détectés.
  if (subscriptionCandidatesCount > 0) {
    tips.push({
      id: 'subscriptions',
      tone: 'info',
      title: `${subscriptionCandidatesCount} abonnement${
        subscriptionCandidatesCount > 1 ? 's' : ''
      } repéré${subscriptionCandidatesCount > 1 ? 's' : ''}`,
      message:
        'Des dépenses reviennent chaque mois dans votre historique. Ajoutez-les en charges fixes pour mieux anticiper.',
      actionLabel: 'Voir les abonnements',
      href: '/abonnements',
    })
  }

  // 4. Aucun budget défini.
  if (budgetUsages.length === 0) {
    tips.push({
      id: 'no-budget',
      tone: 'info',
      title: 'Posez un premier budget',
      message:
        'Fixer une limite par catégorie aide à garder le cap sans y penser. Commencez par votre poste le plus dépensier.',
      actionLabel: 'Créer un budget',
      href: '/budgets',
    })
  }

  // 5. Épargne possible (vous dégagez de la marge ce mois-ci).
  if (
    monthlyBalance > 0 &&
    (!forecast || forecast.tone !== 'risque')
  ) {
    tips.push({
      id: 'savings-opportunity',
      tone: 'positive',
      title: 'Vous avez de la marge',
      message: `Vous dégagez ${formatCurrency(
        monthlyBalance,
      )} ce mois-ci. Et si vous en mettiez une partie de côté pour un projet ?`,
      actionLabel: 'Alimenter un objectif',
      href: '/objectifs',
    })
  }

  // 6. Objectif presque atteint.
  const almostDone = [...savingGoals, ...sinkingFunds]
    .filter((goal) => {
      const ratio =
        goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0
      return ratio >= 0.8 && ratio < 1
    })
    .sort(
      (a, b) =>
        b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount,
    )[0]

  if (almostDone) {
    tips.push({
      id: 'goal-almost',
      tone: 'positive',
      title: `Plus très loin de « ${almostDone.title} »`,
      message: `Il ne manque que ${formatCurrency(
        almostDone.targetAmount - almostDone.currentAmount,
      )} pour atteindre cet objectif. Vous y êtes presque !`,
      actionLabel: 'Voir mes objectifs',
      href: '/objectifs',
    })
  }

  // 7. Charges fixes lourdes par rapport aux revenus.
  if (monthlyIncome > 0 && recurringMonthlyTotal > monthlyIncome * 0.5) {
    const share = Math.round((recurringMonthlyTotal / monthlyIncome) * 100)

    tips.push({
      id: 'recurring-weight',
      tone: 'info',
      title: 'Des charges fixes importantes',
      message: `Vos charges fixes représentent environ ${share} % de vos revenus. Vérifier vos abonnements peut libérer un peu de marge.`,
      actionLabel: 'Voir les abonnements',
      href: '/abonnements',
    })
  }

  // Conseil positif de repli si tout va bien.
  if (tips.length === 0) {
    tips.push({
      id: 'all-good',
      tone: 'positive',
      title: 'Mois bien tenu',
      message:
        'Vos dépenses restent maîtrisées et aucun budget n’est en alerte. Continuez ainsi, vous gardez le contrôle.',
      actionLabel: 'Voir mes statistiques',
      href: '/statistiques',
    })
  }

  // Priorité : alertes d'abord, puis infos, puis encouragements.
  const tonePriority: Record<TipTone, number> = {
    warning: 0,
    info: 1,
    positive: 2,
  }

  return tips
    .sort((a, b) => tonePriority[a.tone] - tonePriority[b.tone])
    .slice(0, maxTips)
}
