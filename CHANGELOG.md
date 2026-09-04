# Journal des changements — Carnet de budget 🪙

Main courante du carnet : **ce qui a été fait, quand, et pourquoi**.
Ordre antéchronologique (le plus récent en haut).

> Chaque modification est consignée ici **dans le même commit** que le
> changement. Voir `CLAUDE.md` pour le format et la règle.
>
> Ce journal démarre le 2026-08-23 ; l'historique antérieur est dans `git log`.

---

## 2026-09-04

### Lint nettoyé et rendu bloquant

- **Ce qui change** : les 5 erreurs de lint sont traitées — la ref de `useFormDraft` n'est plus écrite pendant le rendu, la bannière d'installation lit son état initial, et les trois restaurations de brouillon sont documentées comme exceptions. Le lint passe de « informatif » à **bloquant** en CI :
  une PR qui en réintroduit une ne peut plus être fusionnée.
- **Pourquoi** : ces erreurs `react-hooks` signalaient de vrais motifs fragiles
  (états dérivés stockés inutilement, ref écrite pendant le rendu). Et un lint
  qu'on ignore ne sert à rien.
- **À savoir** : les rares exceptions restantes sont **annotées avec leur
  justification** dans le code — restauration d'un brouillon qui dépend de
  données chargées après coup, et champ éditable qu'on ne peut pas dériver.

### Premiers tests automatisés

- **Ce qui change** : mise en place de Vitest et **19 tests** sur les deux
  logiques les plus sensibles — l'auto-catégorisation des transactions et le
  format d'export CSV. La CI les exécute désormais à chaque PR.
- **Pourquoi** : ce carnet calcule sur l'argent des utilisateurs et n'avait
  aucun test ; une régression silencieuse y serait coûteuse et difficile à
  repérer.
- **À savoir** : les tests verrouillent notamment le format français de
  l'export (séparateur `;`, virgule décimale, protection des libellés
  contenant `;`, guillemets ou sauts de ligne) — un point décimal suffirait à
  ce qu'Excel lise les montants comme du texte.

### Un abonné payant ne peut plus être bloqué par une panne de lecture

- **Ce qui change** : `getSubscription()` distingue désormais **« lecture
  réussie »** de **« lecture en échec »** (au lieu de renvoyer `null` dans les
  deux cas) et réessaie deux fois avant d'abandonner. La décision d'accès passe
  par une fonction pure, `decideEntitlement()`, qui **laisse entrer** quand
  l'abonnement n'a pas pu être lu, et se rabat sur le dernier statut connu
  mémorisé localement.
- **Pourquoi** : une simple coupure réseau suffisait à faire passer un client
  qui paie pour un non-abonné ; l'essai étant terminé, il se retrouvait devant
  l'écran « essai terminé », dehors.
- **À savoir** : principe retenu — **on ne verrouille jamais sur un doute**.
  L'entitlement expose un indicateur `degraded` quand la décision repose sur ce
  repli, pour permettre plus tard un bandeau discret plutôt qu'un mur.

### Intégration continue (CI)

- **Ce qui change** : ajout d'un workflow GitHub Actions qui, sur chaque PR et
  sur `main`, installe les dépendances, passe le lint, (pas encore de tests) et vérifie que le
  build compile. Un second job **refuse toute PR qui touche à `src/` ou
  `supabase/` sans mettre à jour `CHANGELOG.md`**.
- **Pourquoi** : aucun dépôt n'avait de CI — rien n'empêchait de fusionner une
  PR qui casse le build, et la main courante ne tenait que par la discipline.
- **À savoir** : le lint est **non bloquant** pour l'instant (`continue-on-error`),
  car il remonte des erreurs préexistantes. Le rendre bloquant une fois
  celles-ci corrigées, en retirant cette ligne du workflow.

### Mise en place de la main courante

- **Ce qui change** : ajout de ce `CHANGELOG.md` et d'un `CLAUDE.md` qui fixe
  les règles de travail du dépôt (dont l'obligation de tenir ce journal).
- **Pourquoi** : garder une trace précise des décisions, afin qu'une session
  future — sans le contexte de celle qui a fait le changement — sache ce qui a
  déjà été fait et pourquoi.

### Audit technique : ouverture des tickets

- **Ce qui change** : les constats de l'audit sont suivis en issues
  (#25 entitlement, #26 CI, tests absents et lint).
- **À savoir** : ce dépôt n'a **aucun test** alors qu'il calcule sur l'argent des
  utilisateurs (catégorisation, détection d'abonnements, score de santé). Voir le
  tableau de bord
  [vitrine-carnet#10](https://github.com/Lacharrogne/vitrine-carnet/issues/10).

## 2026-09-03

### Vrai README (#24)

- **Ce qui change** : le README d'exemple généré par Vite est remplacé par une
  vraie présentation du carnet (stack, démarrage, fonctionnalités, conventions).

### Retrait de la config de paiement morte (#23)

- **Ce qui change** : suppression de `LEMONSQUEEZY`, `IS_BILLING_CONFIGURED` et
  `buildCheckoutUrl()`, qui n'étaient plus ni importés ni appelés.
- **Pourquoi** : ils portaient un **prix obsolète** (5,99 € au lieu de 3,99 €),
  alors que le checkout est centralisé sur le Hub de la vitrine.
- **À savoir** : la seule source de vérité des prix est `src/config.ts` du dépôt
  vitrine-carnet. Ne pas réintroduire de prix ici.

### L'invite d'installation ne s'affichait pas sur PC (#22)

- **Ce qui change** : `beforeinstallprompt` est capté dès le chargement du
  module (`src/lib/installPrompt.ts`), et non plus dans un `useEffect`.
- **Pourquoi** : sur ordinateur, l'événement se déclenche **avant** le montage
  du composant React — le listener le ratait, et la bannière n'apparaissait
  jamais.

## 2026-09-01

### Dernière boîte native remplacée (#21)

- **Ce qui change** : le dernier `window.alert` (export) devient une fenêtre
  in-app.
- **Pourquoi** : cohérence visuelle ; plus aucune boîte native dans l'app.

### Brouillons automatiques sur tous les formulaires (#18, #19, #20)

- **Ce qui change** : la saisie en cours est sauvegardée automatiquement en
  `localStorage` (expiration 12 h) — d'abord les transactions, puis tous les
  formulaires longs, puis les mini-formulaires.
- **Pourquoi** : sur téléphone, quitter l'app un instant (pour vérifier une
  information) effaçait toute la saisie en cours.
- **À savoir** : hook réutilisable `useFormDraft` ; les formulaires contextuels
  mémorisent l'entité concernée pour se rouvrir au bon endroit.

## 2026-08-30 → 08-31

### Mobile : fin du scroll horizontal et du dézoom (#17)

- **Ce qui change** : `grid-cols-1` appliqué à toutes les grilles mono-colonne.
- **Pourquoi** : une grille sans colonnes définies laisse son contenu déborder ;
  la page devenait plus large que l'écran et le navigateur dézoomait.
- **À savoir** : garde-fou permanent — ne jamais laisser un `grid` nu.

### Mobile : fondu en haut du menu ouvert (#16)

- **Pourquoi** : une bande de bouton apparaissait coupée sous la barre.

## 2026-08-29

### Encoche et barre d'accueil iOS (#15)

- **Ce qui change** : prise en compte des `safe-area` sur l'en-tête et la
  bannière d'installation.

## 2026-08-28

### L'app devient installable (#14)

- **Ce qui change** : icônes 192/512 + maskable, `apple-touch-icon` opaque,
  raccourcis manifest, bannière « Installer l'application ».

## 2026-08-27

### Barre du haut lisible sur mobile (#13)

- **Ce qui change** : le titre affiche « Budget » au lieu de « Carnet de
  budget ».
- **Pourquoi** : le titre complet était tronqué en « Car… ».

### Pages-hub « Gérer » et « Patrimoine & analyse » (#12)

- **Ce qui change** : deux pages de regroupement pour alléger la navigation.

## 2026-08-23

### Pied de page aligné sur la suite (#11)

- **Ce qui change** : icônes de confiance en emoji, identiques aux autres
  carnets.
