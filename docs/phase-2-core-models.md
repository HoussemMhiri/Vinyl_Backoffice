# Phase 2 — Core Models (~1h30)

**Goal:** `tenant`, `product` and `sellable-unit` exist, relate correctly, and a SKU is
generated backend-side on every unit creation.

**Definition of done:** Strapi boots, the three content-types appear in the admin, a unit
created through the admin receives `VIN-000001` without anyone typing it, and the SKU
unit test passes.

---

## Checklist

### 2.1 — `tenant` content-type
- [ ] `src/api/tenant/content-types/tenant/schema.json`
- [ ] fields: `name` (string, required), `slug` (uid from name, required), `isActive` (boolean, default true)
- [ ] `draftAndPublish: false`
- [ ] relations: `products`, `sellableUnits` (oneToMany, `mappedBy` tenant)
- [ ] verify: appears in admin, a tenant can be created

### 2.2 — `product` content-type
- [ ] fields per [01-data-model.md](01-data-model.md): `productType` enum `["vinyl"]` default `vinyl`,
      `title`, `artist` required; `description`, `label`, `year`, `country`, `format`,
      `barcode`, `discogsReleaseId`, `discogsMasterId` optional
- [ ] `tenant` manyToOne required, `sellableUnits` oneToMany
- [ ] `draftAndPublish: false`
- [ ] verify: a product can be created and linked to a tenant

### 2.3 — `sellable-unit` content-type
- [ ] fields: `sku` (string, unique), `price` (decimal, required), `currency` (string, default `EUR`),
      `mediaCondition` / `sleeveCondition` enums, `sellerComment`, `status` enum default
      `available`, `quantity` (integer, default 1), `internalLocation`
- [ ] `mediaCondition` 8 values, `sleeveCondition` 11 values — the two lists differ
- [ ] `tenant` and `product` manyToOne, both required
- [ ] `draftAndPublish: false`
- [ ] verify: appears in admin with `sku` visible but not required at input

### 2.4 — SKU generation
- [ ] `src/domain/sku.ts` — pure: `formatSku(sequence)` → `VIN-000001`, `parseSkuSequence(sku)`
- [ ] `src/api/sellable-unit/services/sku-sequence.ts` — resolves the next sequence for a tenant
- [ ] `content-types/sellable-unit/lifecycles.ts` — `beforeCreate` sets `data.sku`
- [ ] never overwrite an existing `sku` (import scenarios)
- [ ] verify: two units in the same tenant get `VIN-000001` then `VIN-000002`

### 2.5 — Unit tests
- [ ] jest configured for TypeScript, framework-free (no Strapi harness)
- [ ] `tests/unit/sku.test.ts`: padding, increment, round-trip parse, sequence > 999999
- [ ] verify: `npm test` green

### 2.6 — Boot & commit
- [ ] `npm run develop` clean, tables created in Postgres
- [ ] `/code-review`
- [ ] commit, push, PR

---

## Decisions taken

| # | Decision | Why |
|---|---|---|
| 1 | `draftAndPublish: false` everywhere | business entities have no editorial draft; D&P would duplicate rows and break SKU uniqueness |
| 2 | SKU sequence is **per tenant** | tenant A and tenant B both start at `VIN-000001`; a shared counter would leak volume between tenants |
| 3 | SKU formatting lives in `domain/`, sequence resolution in a service | formatting is pure and testable; "what number is next" needs the DB |
| 4 | Lifecycle only calls the service, holds no logic | keeps the rule testable without a Strapi harness |
| 5 | `sku` is not `required` in the schema | it's set in `beforeCreate`; required would reject valid input |
| 6 | Conditions stored as slugs, mapped to Discogs strings in the connector | DB stays framework-neutral; mapping is unit-tested |

## Known limitation to document, not solve

Computing the next sequence with a read-then-write is **racy** under concurrent creation:
two simultaneous inserts can both read `N` and both try `N+1`. For this test, single-user
and low volume, that is acceptable. A production system would use a Postgres sequence per
tenant or a unique constraint plus retry.

The `sku` column carries a **unique constraint**, so the race would surface as a failed
insert rather than as two units silently sharing a SKU. That is the correct failure mode,
and it will be stated in the README rather than hidden.

## Not in this phase

`channel-listing`, `marketplace-sync-event` (Phase 3), anything Discogs (Phase 4),
custom endpoints (Phase 5), the seed script (Phase 7).
