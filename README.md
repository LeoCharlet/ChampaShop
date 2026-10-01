# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Catalogue (`/produits`) : choix techniques

### L'URL est la source de vérité

Page, recherche, catégorie, tri et prix sont stockés dans les paramètres d'URL
(`?q=…&category=…&sortBy=…&order=…&minPrice=…&maxPrice=…&page=…`).
`app/utils/catalog-query.ts` lit et valide ces paramètres ; la page ne garde aucun autre état.
Résultat : recharger la page, utiliser le bouton retour ou partager le lien redonne exactement
la même vue, rendue côté serveur. Les filtres sont un vrai formulaire `GET` : ils marchent aussi
sans JavaScript.

### Stratégie du filtre prix (min / max)

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

### Recherche : debounce et réponses obsolètes

La recherche part 300 ms après la dernière frappe (`app/utils/debounce.ts`). Chaque combinaison de
filtres a sa propre clé `useAsyncData`, et la requête précédente est annulée par un `AbortSignal` :
une réponse ancienne ne peut jamais écraser une réponse plus récente.
