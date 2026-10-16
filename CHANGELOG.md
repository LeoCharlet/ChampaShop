# Changelog

Toutes les évolutions notables du projet sont listées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions selon
[Semantic Versioning](https://semver.org/lang/fr/).

## [0.1.0] - Semaine 1

### Ajouté

- **Catalogue** (`/produits`) : liste paginée par 12, recherche avec debounce de 300 ms, filtres
  par catégorie et par prix, tri par prix, note ou titre. L'URL est la source de vérité (rendu
  serveur, bouton retour, liens partageables). États de chargement, de liste vide et d'erreur.
- **Fiche produit** (`/produits/[id]`) : galerie, description, marque, note, stock, garantie,
  livraison, avis. SEO avec `useSeoMeta` et Open Graph. Vraie erreur 404 pour un produit inexistant.
- **Panier** (`/panier`) : store Pinia persisté en cookie, ajout, suppression et modification de
  quantité dans la limite du stock, code promo, récapitulatif détaillé des remises.
- **Moteur de promotions** (`utils/promotions.ts`) : remise beauté, code `TROYES10`, plafond de
  25 %, livraison offerte dès 80 € hors meubles. 8 scénarios d'acceptation testés, couverture 100 %.
- **Authentification DummyJSON** : connexion, utilisateur chargé côté serveur, page `/compte`
  protégée par middleware, rafraîchissement du token en single-flight, déconnexion.
- Outillage : ESLint, Prettier, typecheck strict, Vitest avec seuil de couverture, CI GitHub
  Actions, déploiement Netlify, template de PR.
