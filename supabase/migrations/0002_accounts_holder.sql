-- Ajoute un « titulaire » aux comptes (budget de couple/foyer).
-- À exécuter une fois dans Supabase (SQL Editor) pour mémoriser à qui
-- appartient chaque compte (ex. « Maxime », « Chloé », « Commun »).
--
-- Sans cette colonne, l'app fonctionne quand même : le titulaire n'est
-- simplement pas enregistré tant que la migration n'est pas appliquée.

alter table public.accounts
  add column if not exists holder text not null default '';
