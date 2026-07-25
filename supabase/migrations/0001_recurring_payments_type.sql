-- Ajoute la distinction charge / revenu aux paiements récurrents.
-- À exécuter une fois dans Supabase (SQL Editor) pour activer les revenus
-- récurrents (salaire, aides…) et fiabiliser la prévision de fin de mois.

alter table public.recurring_payments
  add column if not exists type text not null default 'expense';

-- Garantit des valeurs cohérentes.
alter table public.recurring_payments
  drop constraint if exists recurring_payments_type_check;

alter table public.recurring_payments
  add constraint recurring_payments_type_check
  check (type in ('income', 'expense'));
