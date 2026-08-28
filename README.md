# Vinyl Backoffice — Strapi + Discogs

Technical test: a vertical slice of a multi-tenant backoffice for selling vinyl records,
with a mockable Discogs marketplace integration.

Stack: Strapi 5.52 · TypeScript · PostgreSQL.

## Requirements

- Node.js 20+ (tested on 22)
- PostgreSQL 14+ running locally
- npm

## Install

```bash
git clone https://github.com/HoussemMhiri/test-tech.git
cd test-tech/backoffice
npm install
```

## Database

Create the database and its role:

```sql
CREATE USER vinyl WITH PASSWORD 'vinyl';
CREATE DATABASE vinyl_backoffice OWNER vinyl;
```

On Windows, `psql` lives at `C:\Program Files\PostgreSQL\<version>\bin\psql.exe`:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE USER vinyl WITH PASSWORD 'vinyl';"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE vinyl_backoffice OWNER vinyl;"
```

## Environment

```bash
cp .env.example .env
```

Then fill the secrets. Generate each one with:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

`APP_KEYS` takes four comma-separated values. Set `DATABASE_PASSWORD` to the password
used above.

Discogs runs in **mock mode by default** — no token required. Set `DISCOGS_MODE=api` and
`DISCOGS_TOKEN` only to hit the real API.

## Run

```bash
npm run develop
```

Strapi starts on http://localhost:1337 — create the first admin user at `/admin`.

## Seed

```bash
npm run seed
```

Creates the tenant `Vinyl Store Paris`, the Daft Punk / *Discovery* catalogue sheet and
one sellable unit, then prints the ids the parcours below needs. The script is
idempotent: running it twice reuses the existing records.

The product is deliberately created **without** a `discogsReleaseId` — attaching one is
step 4 of the parcours.

## Test parcours

Discogs runs in mock mode, so no token and no network access are required.

Export the ids printed by the seed:

```bash
TENANT=<TENANT_ID>
PRODUCT=<PRODUCT_ID>
UNIT=<UNIT_ID>
```

**1-2. Tenant and catalogue sheet** — created by the seed, visible in the admin panel.

**3. Search a Discogs release**

```bash
curl "http://localhost:1337/api/discogs/search?tenantId=$TENANT&q=daft%20punk%20discovery"
```

**4. Attach the release to the product**

```bash
curl -X POST "http://localhost:1337/api/products/$PRODUCT/attach-discogs-release"   -H "Content-Type: application/json"   -d "{\"tenantId\":\"$TENANT\",\"releaseId\":\"123456\"}"
```

Only empty product fields are filled from the release: the seller's own metadata is never
overwritten.

**5. Sellable unit** — created by the seed with an automatic SKU (`VIN-000001`). Create
more from the admin panel; the SKU is always generated server-side, per tenant.

**6. Check Discogs completeness**

```bash
curl -X POST "http://localhost:1337/api/sellable-units/$UNIT/check-discogs-completeness"   -H "Content-Type: application/json" -d "{\"tenantId\":\"$TENANT\"}"
```

Returns `200` with `{ isValid, missingFields, errors }`. An incomplete unit is a valid
answer, not an error. Run this **before** step 4 to see it fail on
`product.discogsReleaseId`.

**7-9. Publish on Discogs**

```bash
curl -X POST "http://localhost:1337/api/sellable-units/$UNIT/publish-discogs"   -H "Content-Type: application/json" -d "{\"tenantId\":\"$TENANT\"}"
```

Creates or updates the `ChannelListing` with `externalListingId`, `externalUrl`,
`publishedPrice` and `lastSyncedAt`, and journalises `publish_listing`. Publishing twice
updates the same listing rather than creating a second one. An incomplete unit returns
`422` with the missing fields and leaves the listing in `failed`.

**10-12. Simulate a Discogs sale**

```bash
curl -X POST "http://localhost:1337/api/sellable-units/$UNIT/simulate-discogs-sale"   -H "Content-Type: application/json"   -d "{\"tenantId\":\"$TENANT\",\"quantity\":1}"
```

Decrements the stock. The unit becomes `sold` when it reaches zero and the listing is set
to `removed`; with stock left it stays `available`. Journalises
`mark_local_out_of_stock`.

**Check the journal** — open **Marketplace Sync Event** in the admin panel: every
operation above wrote exactly one row, successes and failures alike.

## Multi-tenancy

Every business query is scoped by tenant. A record belonging to another tenant returns
`404`, never `403`, so the existence of another tenant's data is never confirmed. An
inactive tenant is refused with `403`.

## Tests

```bash
npm test              # unit, no database required
npm run test:integration   # against PostgreSQL, isolates its own tenant
```

Unit tests cover SKU generation, completeness validation, the Discogs condition mapping
and the mock connector. Business rules live in `src/domain` as pure functions
specifically so they can be tested without a Strapi harness — Strapi's own testing guide
relies on in-memory SQLite, which it states does not work on Windows.

## Known gaps

Deliberate limits, given the 8-hour scope:

- **No authentication on the custom routes.** They are `auth: false`. A real deployment
  would put an API token or a policy in front of them.
- **SKUs are unique per tenant, not globally.** Each tenant's sequence restarts at
  `VIN-000001`, so two tenants legitimately hold the same SKU. No database constraint
  enforces even the per-tenant uniqueness: Strapi does not translate a `unique` attribute
  into an index here, and a global unique index would break the per-tenant sequence
  outright. Enforcing it properly needs a composite index on (tenant, sku), which in turn
  needs the tenant denormalised onto the row.
- **The SKU sequence is racy under concurrent creation.** Two simultaneous inserts can
  read the same highest sequence and, with no constraint behind them, both succeed.
  Production would use a Postgres sequence per tenant.
- **`upsertListing` is a non-atomic find-then-create.** Concurrent publishes of the same
  unit can create two listings. Single-user usage never hits it; a real system needs the
  composite unique index above and an upsert on conflict.
- **No retry or rate limiting on the Discogs HTTP connector.** Discogs limits requests
  per minute; a real integration needs backoff.
- **Sales are simulated locally.** Discogs closed its public marketplace-search endpoint,
  so there is no supported way to poll for real sales.
- **The real API mode is untested against live Discogs**, having no token. It is written
  to the documented contract and isolated behind the same interface as the mock.

## Project structure

```
backoffice/          Strapi application
  src/api/           content-types, controllers, routes, services
  src/connectors/    marketplace connectors (Discogs: mock + http)
docs/                working specification and build notes
test-technique.md    original test subject
```

## Documentation

The subject is decomposed in [`docs/`](docs/README.md): data model, connector contract,
API workflow, engineering conventions, and the acceptance checklist.

## Scope

One product type (`vinyl`), one channel (`discogs`). Fnac, Amazon, Stripe, orders,
shipping, email, CMS, workers and file storage are explicitly out of scope — see
[`docs/00-brief.md`](docs/00-brief.md).
