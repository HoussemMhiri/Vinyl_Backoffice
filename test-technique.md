# Test Technique Simplifie - Backoffice Strapi Vinyle + Discogs

## Objectif

Realiser une tranche verticale simplifiee de la plateforme backoffice, basee sur les fondations du projet cible.

Le test doit etre realisable en environ 8 heures par un developpeur assiste d'un agent IA. Le but n'est pas de livrer toute la plateforme, mais de verifier la capacite a structurer proprement le socle metier, a respecter les contraintes Strapi/TypeScript/PostgreSQL, et a produire une integration Discogs minimale, testable et maintenable.

## Contexte Projet A Respecter

Le projet final est une plateforme multi-tenant de gestion de produits vendables sur site vitrine et marketplaces.

Pour ce test, le perimetre est volontairement reduit :

- un seul type produit : `Vinyle` ;
- un seul canal marketplace : `Discogs` ;
- pas de Fnac ;
- pas d'Amazon ;
- pas de Stripe ;
- pas de livraison ;
- pas de CMS ;
- pas de plans/modules ;
- pas de marque blanche avancee ;
- pas d'emails ;
- pas de fiscalite ;
- pas de generation de documents.

La solution doit toutefois respecter les principes structurants du projet final :

- TypeScript ;
- Strapi ;
- PostgreSQL ;
- modele compatible multi-tenant ;
- separation fiche catalogue / unite vendable ;
- channel listing separe ;
- logs de synchronisation ;
- architecture de connecteur marketplace ;
- integration Discogs mockable.

## Hypothese De Base

Le developpeur part d'une base projet existante ou doit initialiser une base minimale Strapi TypeScript.

La base attendue doit contenir au minimum :

- Strapi configure en TypeScript ;
- PostgreSQL configure ;
- README d'installation ;
- variables d'environnement documentees ;
- scripts de lancement dev ;
- au moins un seed ou une procedure simple pour creer un tenant de test.

Si le projet existant n'a pas encore ces elements, le candidat doit les ajouter de facon minimale et documentee.

## Perimetre Fonctionnel Attendu

### 1. Tenant Minimal

Creer un modele `Tenant` minimal :

- nom ;
- slug ;
- statut actif/inactif.

Tous les objets metier crees dans le test doivent etre rattaches a un `tenantId`.

L'isolation multi-tenant peut rester simple pour le test, mais le code doit montrer clairement que les requetes metier sont scopees par tenant.

### 2. Fiche Produit Catalogue

Creer un modele `Product` representant la fiche catalogue vinyle.

Champs minimum :

- tenant ;
- type produit fixe : `vinyl` ;
- titre ;
- artiste ;
- description ;
- label ;
- annee ;
- pays ;
- format ;
- code-barres ou reference catalogue optionnelle ;
- `discogsReleaseId` optionnel ;
- `discogsMasterId` optionnel.

### 3. Unite Vendable

Creer un modele `SellableUnit` representant l'exemplaire vendu.

Champs minimum :

- tenant ;
- product ;
- SKU genere automatiquement au format `VIN-000001` ;
- prix ;
- devise, `EUR` par defaut ;
- etat disque ;
- etat pochette ;
- commentaire vendeur ;
- statut vente : `available`, `reserved`, `sold`, `out_of_stock`, `archived` ;
- quantite disponible, 1 par defaut ;
- localisation interne optionnelle.

Le SKU doit etre genere cote backend, pas saisi manuellement.

### 4. Channel Listing Discogs

Creer un modele `ChannelListing`.

Champs minimum :

- tenant ;
- sellable unit ;
- canal : `discogs` ;
- `externalListingId` ;
- `externalUrl` ;
- statut : `not_published`, `pending`, `published`, `failed`, `removed`, `sync_error` ;
- prix publie ;
- date derniere synchro ;
- dernier message d'erreur.

### 5. Logs De Synchronisation

Creer un modele `MarketplaceSyncEvent`.

Champs minimum :

- tenant ;
- canal ;
- action ;
- statut ;
- product optionnel ;
- sellable unit optionnelle ;
- channel listing optionnel ;
- message ;
- payload technique optionnel ;
- date.

Actions minimum :

- recherche release ;
- verification completude ;
- publication listing ;
- mise hors stock locale.

### 6. Connecteur Discogs Minimal

Creer une couche service/connecteur Discogs avec une interface claire.

Fonctions attendues :

- `searchReleases(query)` ;
- `getRelease(releaseId)` ;
- `validateListingPayload(unit)` ;
- `publishListing(unit)` ;
- `markLocalSoldOrOutOfStock(unit)` ou equivalent metier.

L'integration Discogs peut etre mockee pour rester realisable en 8h.

Deux modes acceptes :

- mode mock par defaut, sans appel reseau reel ;
- mode API reel optionnel si token Discogs fourni.

Le mode mock doit retourner des donnees plausibles permettant de tester le workflow complet.

### 7. Workflow Minimal

Le test doit permettre le parcours suivant :

1. Creer un tenant de test.
2. Creer une fiche vinyle.
3. Rechercher une release Discogs, mockee ou reelle.
4. Associer la release a la fiche produit.
5. Creer une unite vendable rattachee au produit.
6. Verifier la completude Discogs.
7. Publier l'unite sur Discogs, en mock si necessaire.
8. Creer ou mettre a jour le `ChannelListing` avec un `externalListingId`.
9. Journaliser les evenements dans `MarketplaceSyncEvent`.
10. Simuler une vente Discogs.
11. Passer l'unite en `sold` ou `out_of_stock`.
12. Journaliser la mise hors stock.

## Interface Attendue

Le test peut etre realise avec l'admin Strapi natif ou des endpoints custom.

Il n'est pas demande de construire un BO custom complet en 8h.

Minimum attendu :

- endpoints ou actions Strapi pour declencher les operations Discogs ;
- donnees consultables dans Strapi ;
- README expliquant le parcours de test.

Bonus si le candidat ajoute une page admin custom simple, mais ce n'est pas obligatoire.

## API / Endpoints Souhaites

Endpoints custom possibles :

- `GET /api/discogs/search?tenantId=...&q=...`
- `POST /api/products/:id/attach-discogs-release`
- `POST /api/sellable-units/:id/check-discogs-completeness`
- `POST /api/sellable-units/:id/publish-discogs`
- `POST /api/sellable-units/:id/simulate-discogs-sale`

Les noms exacts peuvent differer, mais le parcours doit etre clair et documente.

## Donnees De Test

Prevoir une donnee mock Discogs type :

- artiste : `Daft Punk` ;
- titre : `Discovery` ;
- annee : `2001` ;
- pays : `France` ;
- format : `2xLP` ;
- label : `Virgin` ;
- release ID mock : `123456`.

Le listing publie en mock peut retourner :

- externalListingId : `discogs-listing-0001` ;
- externalUrl : `https://www.discogs.com/sell/item/discogs-listing-0001`.

## Contraintes Techniques

Obligatoire :

- TypeScript ;
- code lisible et structure ;
- pas de secrets hardcodes ;
- `.env.example` si variables necessaires ;
- logique Discogs isolee dans un service/connecteur ;
- logs metier persistants ;
- README clair.

Recommande :

- tests unitaires sur generation SKU ;
- tests unitaires sur validation completude ;
- tests service Discogs mock ;
- test integration d'un endpoint critique.

## Critere De Reussite

Le test est considere reussi si :

- le projet se lance localement ;
- le modele tenant/product/sellable unit/channel listing existe ;
- le SKU est genere automatiquement ;
- une release Discogs peut etre recherchee et associee ;
- une unite peut etre publiee sur Discogs en mode mock ;
- un `externalListingId` est stocke ;
- une vente Discogs peut etre simulee ;
- l'unite passe hors stock/vendue ;
- les evenements sont journalises ;
- le README permet de reproduire le parcours.

## Decoupage Indicatif Sur 8 Heures

Ce decoupage est indicatif et sert a maintenir un perimetre realiste.

- 1h : prise en main projet, configuration Strapi/PostgreSQL, verification lancement.
- 1h30 : modeles `Tenant`, `Product`, `SellableUnit`.
- 1h : modeles `ChannelListing`, `MarketplaceSyncEvent`.
- 1h30 : service/connecteur Discogs mock + validation completude.
- 1h : endpoints/actions custom pour workflow.
- 1h : simulation publication + simulation vente + logs.
- 1h : tests minimaux, README, nettoyage.

## Hors Scope Strict

Ne pas traiter dans ce test :

- Fnac ;
- Amazon ;
- Stripe ;
- commandes ;
- livraison ;
- email ;
- CMS ;
- multi-role avance ;
- UI admin custom complete ;
- worker BullMQ ;
- stockage S3 ;
- regles de prix avancees ;
- fiscalite ;
- documents.

Ces sujets appartiennent au cahier des charges complet, mais ne doivent pas faire exploser le test technique.
