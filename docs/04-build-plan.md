# 04 — Build Plan (8h)

Indicative slicing from the spec, with the concrete deliverable of each block.

| Time | Block | Deliverable |
|---|---|---|
| 1h | Bootstrap | Strapi TS project, PostgreSQL wired, `.env.example`, dev scripts, `pnpm develop` boots clean |
| 1h30 | Core models | `tenant`, `product`, `sellable-unit` content-types + SKU generation lifecycle |
| 1h | Channel models | `channel-listing`, `marketplace-sync-event` + a small `syncEvent.log()` helper |
| 1h30 | Connector | interface, mock impl, fixtures, `validateListingPayload` + its unit tests |
| 1h | Endpoints | the 4 custom routes/controllers/services + tenant scoping |
| 1h | Workflow | publish + simulate-sale wired end to end, events written |
| 1h | Finish | tests, seed, README parcours, cleanup |

## Order of work (dependency-safe)

1. `npx create-strapi-app@latest . --typescript` → point `config/database.ts` at Postgres
2. `.env.example` + README skeleton immediately (so nothing gets hardcoded later)
3. content-types in dependency order: tenant → product → sellable-unit → channel-listing → marketplace-sync-event
4. SKU service + lifecycle + **its unit test** (cheap, always asked about)
5. connector folder: types → fixtures → mock → completeness validator + **tests**
6. sync-event logging helper
7. services (product/discogs, sellable-unit workflow)
8. controllers + routes
9. seed script creating the test tenant (+ optionally the Daft Punk product)
10. one integration test on `publish-discogs`
11. README: install, env, seed, then the 12 steps as copy-pastable curl calls

## Tests (recommended, not blocking — do them, they're cheap)

- unit: SKU generation (padding, increment, per-tenant, uniqueness)
- unit: completeness validation (valid case + each missing field)
- unit: mock connector returns the documented fixtures
- integration: `POST /api/sellable-units/:id/publish-discogs` → listing created, event written

## Time-boxing rules

If the clock is tight, cut in this order: custom admin page (bonus) → integration test →
real HTTP Discogs mode → metadata backfill on attach. **Never** cut: the five models, SKU
generation, mock publish, event logging, README.
