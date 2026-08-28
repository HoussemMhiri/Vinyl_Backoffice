# 09 — Architecture & Naming

Binding rules. A file that doesn't fit this layout is in the wrong place.

## Layers and the dependency rule

Four layers. **Dependencies point inward only.**

```
  api/          Strapi surface: routes, controllers, services
    │  may import ↓
  connectors/   outside world: Discogs mock + http
    │  may import ↓
  domain/       pure business logic: no strapi, no io, no framework
```

- `domain/` imports **nothing** from the project. No `strapi` global, no Strapi types,
  no `ctx`, no network, no database. This is what makes it unit-testable on Windows
  without a harness (see [06](06-research-notes.md)).
- `connectors/` may import `domain/` types and pure helpers. It never touches the DB and
  never imports from `api/`.
- `api/` may import both. **Nothing imports `api/`.**
- A violation of this direction is a review blocker, not a nit.

## Folder structure

```
backoffice/src/
├── api/
│   ├── tenant/
│   │   ├── content-types/tenant/schema.json
│   │   ├── controllers/tenant.ts
│   │   ├── routes/tenant.ts
│   │   └── services/tenant.ts
│   ├── product/
│   │   ├── content-types/product/schema.json
│   │   ├── controllers/product.ts
│   │   ├── routes/product.ts                    core routes
│   │   ├── routes/01-product-discogs.ts         custom routes, numeric prefix
│   │   └── services/product-discogs.ts          attach release
│   ├── sellable-unit/
│   │   ├── content-types/sellable-unit/schema.json
│   │   ├── content-types/sellable-unit/lifecycles.ts    calls domain/sku
│   │   ├── controllers/sellable-unit.ts
│   │   ├── routes/01-sellable-unit-discogs.ts
│   │   └── services/listing-workflow.ts         publish / simulate sale
│   ├── channel-listing/
│   └── marketplace-sync-event/
│       └── services/sync-event.ts               the only writer of log rows
├── connectors/
│   ├── marketplace-connector.ts                 the generic interface
│   └── discogs/
│       ├── index.ts                             picks mock or http from env
│       ├── discogs.mock.ts
│       ├── discogs.http.ts
│       ├── discogs.fixtures.ts                  Daft Punk / Discovery
│       └── discogs.types.ts
├── domain/
│   ├── sku.ts                                   format + next-sequence logic
│   ├── completeness.ts                          validateListingPayload
│   ├── conditions.ts                            slug ↔ Discogs grading strings
│   └── types.ts                                 shared domain types
├── utils/
│   └── tenant.ts                                resolve + assert tenant scope
└── index.ts

backoffice/tests/
├── unit/                     mirrors src/domain and src/connectors
│   ├── sku.test.ts
│   ├── completeness.test.ts
│   └── discogs-mock.test.ts
└── integration/
    └── publish-discogs.test.ts
```

Test files mirror the path of what they test. `tests/unit/sku.test.ts` tests
`src/domain/sku.ts`. No test lives next to source.

## Naming

### Strapi content-types (constrained by the framework)

| Thing | Convention | Example |
|---|---|---|
| API folder | kebab-case singular | `sellable-unit/` |
| `singularName` | kebab-case singular | `sellable-unit` |
| `pluralName` | kebab-case plural | `sellable-units` |
| `collectionName` | snake_case plural | `sellable_units` |
| `displayName` | Title Case | `Sellable Unit` |
| UID reference | `api::<singular>.<singular>` | `api::sellable-unit.sellable-unit` |

The folder, the content-type folder and `singularName` must all match, or Strapi won't
resolve the UID.

### Code

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `listing-workflow.ts`, `discogs.mock.ts` |
| Types / interfaces | PascalCase, no `I` prefix | `DiscogsRelease`, `PublishResult` |
| Functions / vars | camelCase | `publishListing`, `missingFields` |
| Constants | SCREAMING_SNAKE | `SKU_PREFIX`, `MOCK_RELEASE` |
| Enum values in DB | SCREAMING_SNAKE slugs | `VG_PLUS`, `NOT_GRADED` |
| Content-type attributes | camelCase | `discogsReleaseId`, `sleeveCondition` |
| Route paths | kebab-case plural | `/sellable-units/:id/publish-discogs` |
| Booleans | assertion-shaped | `isValid`, `hasDiscogsRelease` |
| Test names | state the rule | `rejects a unit with no price` |

Suffix convention inside `connectors/discogs/`: `.mock.ts`, `.http.ts`, `.types.ts`,
`.fixtures.ts`. The suffix says what kind of file it is at a glance.

### Functions

- Services expose verbs, not nouns: `attachRelease`, `publishToDiscogs`, `markOutOfStock`.
- Pure predicates read as questions answered: `isPublishable`, `toDiscogsCondition`.
- No `handle*`, `process*`, `manage*`, `data`, `info`, `helper` — they describe nothing.

## Service responsibilities (one job each)

| Service | Owns | Must not |
|---|---|---|
| `product-discogs` | search, attach release to product | write listings or units |
| `listing-workflow` | completeness, publish, simulate sale | call Discogs HTTP directly |
| `sync-event` | writing `marketplace-sync-event` rows | contain business rules |
| `tenant` (utils) | resolving and asserting tenant scope | be bypassed anywhere |

`sync-event` is the **only** module that creates log rows. Every other service calls it.
That keeps the log format consistent and makes "did we log it?" a single-file question.

## Where a new piece of code goes

Ask in order:

1. Is it a pure rule with no IO? → `domain/`
2. Does it talk to Discogs? → `connectors/discogs/`
3. Does it orchestrate DB writes and logging? → `api/<entity>/services/`
4. Does it read `ctx` or set a status code? → `api/<entity>/controllers/`
5. None of the above? It probably doesn't belong in this test.
