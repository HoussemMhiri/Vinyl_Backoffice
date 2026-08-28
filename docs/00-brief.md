# 00 — Brief & Scope

Source of truth: [`../test-technique.md`](../test-technique.md). These docs are a working
decomposition of it. If the two ever disagree, the original wins.

## What we are building

A **vertical slice** of a multi-tenant backoffice for selling vinyl records, running on
Strapi + TypeScript + PostgreSQL, with a **minimal, mockable Discogs connector**.

Budget: ~8 hours. The evaluation is about **structure**, not feature volume:

- clean domain modelling (catalog sheet vs sellable unit vs channel listing),
- respect of the Strapi/TS/PG constraints,
- a Discogs integration that is isolated, testable and maintainable.

## Reduced perimeter

- one product type: `vinyl`
- one marketplace channel: `discogs`

## Structural principles that MUST show in the code

| Principle | How it must be visible |
|---|---|
| TypeScript | strict TS everywhere, no `any` in the domain layer |
| Strapi | content-types + custom routes/controllers/services |
| PostgreSQL | configured as the DB, documented in `.env.example` |
| Multi-tenant compatible | every entity carries `tenant`; every business query is scoped by `tenantId` |
| Catalog sheet ≠ sellable unit | `Product` and `SellableUnit` are separate models, 1→N |
| Separate channel listing | `ChannelListing` is its own model, not fields on `SellableUnit` |
| Sync logs | `MarketplaceSyncEvent` rows persisted for every marketplace action |
| Connector architecture | a `MarketplaceConnector` interface, `DiscogsConnector` implements it |
| Mockable Discogs | mock mode is the DEFAULT, no network calls needed to run the workflow |

## HARD out of scope — do not build

Fnac · Amazon · Stripe · orders · shipping · email · CMS · plans/modules · advanced
white-label · advanced multi-role · a complete custom admin UI · BullMQ workers · S3
storage · advanced pricing rules · tax · document generation.

A small custom admin page is **bonus only** — never at the expense of the required scope.

## Baseline the repo must ship with

- Strapi configured in TypeScript
- PostgreSQL configured
- README with install instructions
- documented env variables (`.env.example`, no hardcoded secrets)
- dev launch scripts
- a seed or simple procedure creating a test tenant
