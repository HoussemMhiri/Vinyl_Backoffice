# 03 — API & Workflow

## The 12-step parcours (this is what gets demoed)

| # | Step | Endpoint / action | Side effects |
|---|---|---|---|
| 1 | Create a test tenant | seed script | — |
| 2 | Create a vinyl catalog sheet | native Strapi `POST /api/products` | — |
| 3 | Search a Discogs release | `GET /api/discogs/search` | event `search_release` |
| 4 | Attach the release to the product | `POST /api/products/:id/attach-discogs-release` | product gets `discogsReleaseId` (+ metadata backfill) |
| 5 | Create a sellable unit | native `POST /api/sellable-units` | SKU auto-generated |
| 6 | Check Discogs completeness | `POST /api/sellable-units/:id/check-discogs-completeness` | event `check_completeness` |
| 7 | Publish on Discogs (mock) | `POST /api/sellable-units/:id/publish-discogs` | event `publish_listing` |
| 8 | Create/update the ChannelListing | (same call as 7) | listing `published` + `externalListingId` + `externalUrl` |
| 9 | Events journalised | automatic | rows in `marketplace-sync-event` |
| 10 | Simulate a Discogs sale | `POST /api/sellable-units/:id/simulate-discogs-sale` | — |
| 11 | Unit → `sold` / `out_of_stock` | (same call as 10) | unit `saleStatus` + quantity updated |
| 12 | Journalise the out-of-stock | (same call as 10) | event `mark_local_out_of_stock` |

Endpoint names may differ from the spec's suggestions — but the parcours must be clear
and documented in the README.

## Endpoint contracts

All custom endpoints require a tenant scope. Pick one convention and apply it everywhere
(query param `tenantId`, header `x-tenant-id`, or body field) — the spec's examples use
`?tenantId=`. **Every business query filters on it.**

### `GET /api/discogs/search?tenantId=<id>&q=<query>`
→ `200 { results: DiscogsSearchResult[] }` · logs `search_release`

### `POST /api/products/:id/attach-discogs-release`
body `{ tenantId, releaseId }`
→ fetches the release, stores `discogsReleaseId` (+ `discogsMasterId`), optionally
backfills empty product metadata from the release.
→ `200 { product }` · `404` if product not in tenant

### `POST /api/sellable-units/:id/check-discogs-completeness`
body `{ tenantId }`
→ `200 { isValid, missingFields, errors }` · logs `check_completeness`
Never throws on invalid — an incomplete unit is a `200` with `isValid: false`.

### `POST /api/sellable-units/:id/publish-discogs`
body `{ tenantId }`
→ runs completeness first; if invalid, `422 { isValid:false, missingFields }`, listing
goes `failed`, event logged with `status: error`.
→ on success upserts the ChannelListing (`published`, `externalListingId`,
`externalUrl`, `publishedPrice`, `lastSyncedAt`) and returns `200 { listing }`.
Logs `publish_listing`.

### `POST /api/sellable-units/:id/simulate-discogs-sale`
body `{ tenantId, quantity? }` (default 1)
→ decrements quantity; unit becomes `sold` when it hits 0 (or `out_of_stock` per your
documented rule); listing `listingStatus` → `removed`; logs `mark_local_out_of_stock`.
→ `200 { unit, listing }`

## Layering rule

```
route → controller (HTTP shape, tenant extraction, status codes)
      → service   (business logic, tenant scoping, DB writes, event logging)
      → connector (Discogs only, mock or http)
```

Controllers stay thin. Services never talk HTTP. The connector never touches the DB.

## Error handling

- unknown tenant / entity outside the tenant → `404`
- failed completeness → `422` with the missing-fields list
- connector failure → `502`, listing `sync_error`, `lastErrorMessage` filled, event with
  `status: error`
