# Phase 6 — Publish & Sale Workflow (~1h)

**Goal:** close the 12-step parcours. A unit can be published to Discogs, the listing
records the external id, a sale can be simulated, and the unit goes out of stock — all
journalised.

**Definition of done:** steps 7 to 12 of [03-api-and-workflow.md](03-api-and-workflow.md)
run end to end in mock mode, and re-publishing updates the same listing instead of
creating a second one.

---

## Checklist

### 6.1 — Listing store
- [ ] `src/api/channel-listing/services/listing-store.ts`
- [ ] `findListing(tenantId, unitId, channel)` and `upsertListing(...)`
- [ ] upsert is the rule that enforces one listing per (unit, channel)

### 6.2 — `POST /sellable-units/:id/publish-discogs`
- [ ] completeness first; invalid means `422` with the missing fields
- [ ] invalid also writes a listing in `failed` with `lastErrorMessage`
- [ ] success stores `externalListingId`, `externalUrl`, `publishedPrice`, `lastSyncedAt`,
      status `published`, and clears the previous error
- [ ] connector failure means `502`, listing `sync_error`, error message kept
- [ ] logs `publish_listing` in all three cases

### 6.3 — `POST /sellable-units/:id/simulate-discogs-sale`
- [ ] body `{ tenantId, quantity? }`, default 1
- [ ] a unit with no published listing is `409`: there is nothing to sell on Discogs
- [ ] decrements quantity, `sold` at zero, otherwise stays `available`
- [ ] a depleted unit removes its listing (`removed`)
- [ ] logs `mark_local_out_of_stock`

### 6.4 — Verify
- [ ] full parcours over HTTP, twice, to prove the upsert
- [ ] `tsc` clean, `npm test` green
- [ ] commit, push, PR

---

## Decisions taken

| # | Decision | Why |
|---|---|---|
| 1 | A failed publish still writes a listing row | "we tried and it failed" is state worth keeping; a missing row loses the error |
| 2 | Re-publish updates the same listing | a marketplace has one listing per item; duplicates would be a real-world billing bug |
| 3 | Selling with no published listing is `409` | simulating a Discogs sale for something never on Discogs is meaningless |
| 4 | `publishedPrice` is written from the connector result | it records what was actually sent, not what the unit costs now |
| 5 | Depleted unit sets the listing to `removed` | the marketplace no longer offers it; `sold` belongs to the unit, not the listing |
| 6 | Quantity is validated as a positive integer | a negative sale would silently restock the shelf |
| 7 | Sale never calls the connector's network | the spec asks for a *local* transition, and Discogs has no public sale-polling endpoint |

## Not in this phase

Seed script and README parcours (Phase 7).
