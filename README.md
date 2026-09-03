# 🪙 Carnet de budget

Votre argent, enfin clair : la puissance d'un tableur, sans la complexité
d'Excel. Suivez revenus, dépenses, budgets et épargne, et sachez toujours où
vous en êtes.

Fait partie de l'écosystème **[Les Carnets](https://lescarnets.app)** (un seul
compte, un seul abonnement débloque tous les carnets). Identité : émeraude,
thème clair.

> Déployé sur **budget.lescarnets.app**.

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (tokens `@theme` maison — émeraude / stone)
- **Supabase** (Postgres + Auth), backend central partagé « Les Carnets »
- **react-router** (v7), **lucide-react**, **clsx**

## Démarrer en local

```bash
npm install
npm run dev
```

Variables d'environnement requises (fichier `.env.local`) :

```bash
VITE_SUPABASE_URL=...        # projet Supabase « Les Carnets »
VITE_SUPABASE_ANON_KEY=...
```

```bash
npm run build     # tsc -b && vite build
npm run lint
```

## Fonctionnalités

**Pages**
- Tableau de bord · Comptes (multi-titulaires) · Transactions
- Budgets mensuels · Abonnements / récurrents · Dettes
- Patrimoine · Investissements · Objectifs d'épargne
- Calendrier · Statistiques · Réglages · Hubs « Gérer » / « Analyser »

**Moteurs & confort**
- **Score de santé financière**
- **Auto-catégorisation** des transactions (historique + règles)
- **Détection automatique des abonnements** (dépenses récurrentes)
- **Conseils financiers** contextuels et bienveillants
- Import **CSV**, export **CSV / JSON** (format FR : `;`, décimale `,`, BOM UTF-8)
- Filtre par titulaire, recherche globale, tour guidé, mode démo

## Accès & abonnement

- Essai gratuit **14 jours** (depuis la création du compte), puis abonnement
  requis. Verrou piloté par `ENFORCE_TRIAL` dans `src/config/subscription.ts`
  (actuellement `true`).
- Accès résolu à partir de la table partagée `subscriptions`. **Souscription et
  gestion centralisées** sur le Hub de la vitrine (`lescarnets.app/#hub`) ; ce
  carnet ne fait qu'y rediriger.
- **Une seule source de vérité pour les prix : la vitrine.** Ne pas recréer de
  config de prix locale ici.

## Conventions du dépôt

- **Pas de dialogues natifs** : utiliser `ConfirmActionModal` (fenêtres stylées,
  accessibles), jamais `window.confirm` / `prompt` / `alert`.
- **Grilles mobiles** : toujours des colonnes définies (`grid-cols-1`…), jamais
  un `grid` nu — sinon débordement horizontal et dézoom sur mobile.
- **Brouillons de formulaires** persistés en `localStorage` (expiration 12 h)
  via `useFormDraft`, mini-formulaires compris.
- **Stockage** : upsert + nettoyage ciblé, **jamais** « tout supprimer puis
  réinsérer » (risque de perte de données).
- **PWA** : `beforeinstallprompt` capté au chargement du module
  (`src/lib/installPrompt.ts`), pas dans un `useEffect`.

## Base de données

Migrations locales dans `supabase/migrations/` (type des paiements récurrents,
titulaire des comptes, abonnements). Le **socle central** (identité,
facturation, schéma budget) est versionné dans le dépôt **vitrine-carnet**.

## Écosystème

📔 Vue d'ensemble de l'architecture partagée, du modèle d'accès et des
garde-fous communs : **`ARCHITECTURE.md`** dans le dépôt
[vitrine-carnet](https://github.com/Lacharrogne/vitrine-carnet).
