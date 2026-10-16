# ChampaShop

Boutique en ligne fictive réalisée en **Nuxt 4 / Vue 3 / TypeScript** dans le cadre du projet fil rouge.
Les données (produits, utilisateurs, authentification) viennent de l'API [DummyJSON](https://dummyjson.com).

**Site en ligne :** https://champashop-nguyencharlet.netlify.app/ <!-- à remplacer par l'URL Netlify de production -->

## Équipe et répartition des rôles

| Membre    | Fonctionnalités                                  | Autres responsabilités                                                     |
| --------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Léo       | F1 Catalogue, F3 Panier, F4 Moteur de promotions | Outillage (lint, typecheck, tests), CI GitHub Actions, déploiement Netlify |
| Alexandra | F2 Fiche produit, F5 Authentification            | README, template de PR, CHANGELOG, préparation de la release               |

## Stack

- Nuxt 4 (rendu côté serveur), Vue 3 `<script setup>`, TypeScript strict (`strict` + `typeCheck`)
- Pinia (`@pinia/nuxt`) pour le panier et l'authentification
- ESLint (`@nuxt/eslint`, `any` interdit), Prettier
- Vitest + `@nuxt/test-utils`, couverture `@vitest/coverage-v8`
- Déploiement Netlify depuis `main`, CI GitHub Actions sur chaque PR

## Installation

Prérequis : Node.js 22 et npm.

```bash
git clone git@github.com:LeoCharlet/ChampaShop.git
cd ChampaShop
npm install
npm run dev
```

Le site est alors disponible sur http://localhost:3000.
Compte de démonstration pour la connexion : `emilys` / `emilyspass`.

## Scripts

| Commande                          | Rôle                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`                     | Serveur de développement (rechargement à chaud)                                          |
| `npm run build`                   | Build de production (utilisé par Netlify)                                                |
| `npm run preview`                 | Lance localement le build de production                                                  |
| `npm run lint` / `lint:fix`       | ESLint (vérifie / corrige)                                                               |
| `npm run format` / `format:check` | Prettier (formate / vérifie)                                                             |
| `npm run typecheck`               | Vérification TypeScript (`nuxt typecheck`)                                               |
| `npm test`                        | Tous les tests Vitest (unitaires, Nuxt, e2e)                                             |
| `npm run test:unit`               | Tests unitaires uniquement (rapide)                                                      |
| `npm run test:coverage`           | Tests + couverture ; échoue sous 90 % (lignes et branches) sur `app/utils/promotions.ts` |

La CI (`.github/workflows/ci.yml`) lance sur chaque PR : `npm ci`, `lint`, `format:check`,
`typecheck`, `test:coverage` et `build`.

## Organisation du code

```
app/
├── pages/         # Routes : /, /produits, /produits/[id], /panier, /connexion, /compte
├── layouts/       # Layout commun (header, navigation, footer)
├── components/    # Composants par domaine : catalog/, product/, cart/, auth/
├── composables/   # Chargement des données (useAsyncData) : catalogue, produit, panier
├── stores/        # Stores Pinia : cart (panier), auth (authentification)
├── middleware/    # Middleware de route "auth" (protège /compte)
├── plugins/       # auth.server.ts : charge l'utilisateur pendant le rendu serveur
├── types/         # Types TypeScript (réponses DummyJSON, panier, catalogue…)
└── utils/         # Logique métier en fonctions pures, testées (prix, promotions, panier…)
test/
├── unit/          # Tests Vitest des fonctions de utils/
├── nuxt/          # Tests de composants
└── e2e/           # Test de bout en bout (rendu de la page d'accueil)
```

Principe : la logique métier (promotions, panier, filtres, stock…) est écrite en **fonctions
pures** dans `utils/`, sans Vue ni Pinia. Les stores et les pages ne font que les appeler.
Cela les rend faciles à tester et à réutiliser.

## Conventions Git

Nous suivons **GitFlow** :

| Branche               | Créée depuis | Mergée dans        | Règle                                                                                           |
| --------------------- | ------------ | ------------------ | ----------------------------------------------------------------------------------------------- |
| `main`                | —            | —                  | Production (déployée sur Netlify). Protégée : merge uniquement depuis `release/*` ou `hotfix/*` |
| `develop`             | `main`       | —                  | Intégration. Protégée : merge par PR approuvée uniquement                                       |
| `feature/<n°>-<desc>` | `develop`    | `develop`          | Une issue = une branche = une PR, ex. `feature/14-filtres-url`                                  |
| `release/vX.Y.Z`      | `develop`    | `main` + `develop` | Gel des fonctionnalités : corrections, version, CHANGELOG. Tag annoté sur `main`                |
| `hotfix/<desc>`       | `main`       | `main` + `develop` | Correction urgente de production, incrémente le patch                                           |

Workflow :

1. Chaque fonctionnalité a une **issue GitHub** assignée à une seule personne, avec des critères d'acceptation.
2. La branche `feature/` part de `develop` à jour.
3. Commits au format **Conventional Commits** : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `ci:`.
4. La PR vers `develop` référence l'issue (`Closes #14`), remplit le template et passe la CI.
5. Au moins **une review approuvée** d'un coéquipier, avec des commentaires argumentés.
6. Merge avec **« Create a merge commit »** (équivalent `--no-ff`), puis suppression de la branche.

Labels utilisés : `feature`, `bug`, `bug-prod`, `a11y`, `test`.

## Choix techniques

### Catalogue (`/produits`)

#### L'URL est la source de vérité

Page, recherche, catégorie, tri et prix sont stockés dans les paramètres d'URL
(`?q=…&category=…&sortBy=…&order=…&minPrice=…&maxPrice=…&page=…`).
`app/utils/catalog-query.ts` lit et valide ces paramètres ; la page ne garde aucun autre état.
Résultat : recharger la page, utiliser le bouton retour ou partager le lien redonne exactement
la même vue, rendue côté serveur. Les filtres sont un vrai formulaire `GET` : ils marchent aussi
sans JavaScript.

#### Stratégie du filtre prix (min / max)

DummyJSON ne sait pas filtrer par prix, ni combiner recherche + catégorie. Deux modes
(`app/utils/catalog.ts`) :

| Situation                                                      | Appel à l'API                                             | Filtre / tri / pagination |
| -------------------------------------------------------------- | --------------------------------------------------------- | ------------------------- |
| Pas de filtre prix, et pas recherche + catégorie en même temps | 12 produits (`limit=12&skip=…`, `sortBy`, `order`)        | Faits par l'API           |
| Filtre prix, ou recherche + catégorie                          | Toute la liste concernée en **un seul appel** (`limit=0`) | Faits côté application    |

Justification :

- **Appels** : un seul appel par changement de filtre, jamais une boucle de pages. On interroge
  déjà la route la plus précise (`/products/category/:slug` ou `/products/search`) pour réduire la liste.
- **Performance** : le catalogue complet fait ~200 produits ; avec `select=` on ne récupère que les
  7 champs utiles à une carte, soit quelques dizaines de Ko. Le mode "API" (12 produits) reste
  le cas par défaut, le plus fréquent.
- **Pagination** : en mode local, le total est recalculé après filtrage, donc le nombre de pages
  est juste ; le tri est appliqué **avant** la pagination pour être correct sur toutes les pages.
- **Limite** : si le catalogue devenait très gros, il faudrait filtrer côté serveur (route Nitro
  ou vraie API), comme pour les promotions.

#### Recherche : debounce et réponses obsolètes

La recherche part 300 ms après la dernière frappe (`app/utils/debounce.ts`). Chaque combinaison de
filtres a sa propre clé `useAsyncData`, et la requête précédente est annulée par un `AbortSignal` :
une réponse ancienne ne peut jamais écraser une réponse plus récente.

### Panier (`/panier`, store Pinia `app/stores/cart.ts`)

- **Persistance par cookie** (`useCookie`) : le cookie est envoyé au serveur, donc le panier est
  présent dès le rendu serveur.
- **Limite de 4 Ko** : on ne stocke que `[[idProduit, quantité], …]` (≈ 8 octets par ligne).
  Les titres, prix et stocks sont rechargés depuis l'API à l'affichage du panier : on ne fait
  jamais confiance à un prix stocké côté client.
- Le cookie est **validé à la lecture** (`parseCartCookie`) : entrées invalides ignorées,
  doublons fusionnés, quantités et nombre de lignes plafonnés.
- **Stock** : impossible de dépasser le stock d'un produit ; un message explique pourquoi. Si le
  stock a baissé depuis l'ajout, la quantité est ramenée au stock disponible.

### Moteur de promotions (`app/utils/promotions.ts`)

Fonction pure `computeCart(lines, promoCode)`, appelée par la page panier. Tous les montants sont
en **centimes entiers** pour éviter les erreurs d'arrondi des nombres à virgule. Règles, dans l'ordre :

1. **Remise beauté** : dès 3 articles `beauty` (quantités cumulées), −10 % sur chaque ligne beauté,
   arrondi au centime ligne par ligne.
2. **Code `TROYES10`** : −10,00 € si le sous-total après remise beauté est strictement supérieur à
   50,00 €. Insensible à la casse et aux espaces. Sinon, un message explique le refus.
3. **Plafond** : le total des remises ne dépasse jamais 25 % du brut ; en cas de dépassement, c'est
   le code qui est réduit.
4. **Livraison** : 4,90 €, offerte dès 80,00 € après remises, sauf si le panier contient un meuble.

Les 8 scénarios d'acceptation du sujet et des cas limites (panier vide, code inconnu, quantités à 0,
seuils exacts…) sont testés dans `test/unit/promotions.spec.ts`. Couverture : 100 %.

> ⚠️ Ce calcul est fait côté front pour le projet. En production, il devrait être fait côté
> serveur, sinon un utilisateur pourrait modifier les montants.

### Authentification (`/connexion`, `/compte`, store `app/stores/auth.ts`)

- Connexion par `POST /auth/login` (`username`, `password`, `expiresInMins`).
- `accessToken` et `refreshToken` sont stockés en **cookies**. Un plugin serveur
  (`plugins/auth.server.ts`) charge l'utilisateur via `GET /auth/me` pendant le rendu : pas de
  « flash » de l'état déconnecté au rechargement. Les tokens ne sont pas renvoyés par le store,
  donc ils n'apparaissent pas dans le HTML.
- Le middleware `auth` protège `/compte` et redirige vers `/connexion?redirect=…`. Le paramètre
  `redirect` est validé (chemins internes uniquement) pour éviter une redirection vers un site externe.
- **Rafraîchissement « single-flight »** (`createSingleFlight` dans `utils/auth.ts`) : si plusieurs
  requêtes reçoivent une 401 en même temps, un seul `POST /auth/refresh` part, puis toutes les
  requêtes sont rejouées. Démonstration sur `/compte` (session de test d'1 minute).
- Déconnexion : suppression des cookies et de l'utilisateur, retour à l'accueil.

## Déploiement

Le site est déployé sur **Netlify** à chaque merge sur `main` (configuration dans `netlify.toml`).
Nuxt détecte Netlify au build et génère le rendu côté serveur sous forme de fonctions Netlify.

## Usage de l'IA

L'IA est autorisée sur ce projet. Chaque membre tient son journal dans `docs/ai-usage/<prénom>.md`
(ce qui a été demandé, ce qui a été gardé, modifié ou rejeté, et pourquoi). Chaque PR indique si une
partie significative a été générée par IA.
