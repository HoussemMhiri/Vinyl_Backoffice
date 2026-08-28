# Phase 3 — Channel Models (~1h)

**Goal:** the two models that record what happened on the marketplace — the current state
of a publication (`channel-listing`) and the append-only history (`marketplace-sync-event`).

**Definition of done:** both content-types boot, relations resolve, and a single
`sync-event` service is the only code in the project that writes a log row.

---

## Checklist

### 3.1 — `channel-listing` content-type
- [ ] `tenant` manyToOne required, `sellableUnit` manyToOne required
- [ ] `channel` enum `["discogs"]`, default `discogs`, required
- [ ] `listingStatus` enum `not_published | pending | published | failed | removed | sync_error`,
      default `not_published`, required
- [ ] `externalListingId`, `externalUrl`, `publishedPrice` (decimal), `lastSyncedAt` (datetime),
      `lastErrorMessage` (text) — all optional, filled by the workflow
- [ ] `draftAndPublish: false`
- [ ] inverse relation `channelListings` on `sellable-unit`

### 3.2 — `marketplace-sync-event` content-type
- [ ] `tenant` manyToOne required
- [ ] `channel` enum `["discogs"]`, required
- [ ] `action` enum `search_release | check_completeness | publish_listing | mark_local_out_of_stock`, required
- [ ] `eventStatus` enum `success | error | skipped`, required
- [ ] `product`, `sellableUnit`, `channelListing` — optional manyToOne, no inverse
- [ ] `message` text, `payload` json, `occurredAt` datetime required
- [ ] `draftAndPublish: false`

### 3.3 — `sync-event` service
- [ ] `src/api/marketplace-sync-event/services/sync-event.ts`
- [ ] one function: `logSyncEvent({ tenantId, action, eventStatus, message, payload, product?, sellableUnit?, channelListing? })`
- [ ] sets `occurredAt` and `channel` itself — callers never pass them
- [ ] never throws: a failure to log must not roll back the business operation it describes
- [ ] `src/domain/sync-event.types.ts` — the action and status unions, framework-free

### 3.4 — Verify
- [ ] boot clean, tables + link tables created
- [ ] a listing and an event can be created from the admin
- [ ] `npm test` still green
- [ ] commit, push, PR

---

## Decisions taken

| # | Decision | Why |
|---|---|---|
| 1 | `listingStatus` / `eventStatus`, never `status` | `status` is reserved by Strapi 5 and fails in the admin only — see [06](06-research-notes.md) |
| 2 | Listing relations are **not** unique-constrained in the schema | Strapi cannot express a composite unique key on (unit, channel); the upsert in Phase 6 enforces one listing per unit per channel |
| 3 | `marketplace-sync-event` has no inverse relations | the log points at business records, but a product does not need to carry its log history; avoids three useless relation fields |
| 4 | `logSyncEvent` swallows its own errors | a broken log must never fail a successful publish; it warns instead |
| 5 | `payload` is `json`, not text | it stores real connector responses and must stay queryable |
| 6 | `occurredAt` is explicit, not `createdAt` | the event time is business data; `createdAt` is a framework artefact |
| 7 | Both models stay **write-only from services** | nothing outside `sync-event.ts` creates events, so the log format cannot drift |

## Trade-off accepted

`channel-listing` duplicates `publishedPrice` from the unit's `price`. That is deliberate:
the listing records **what was actually sent to Discogs**, which can differ from the unit's
current price after a local edit. Without it, "is the marketplace in sync with us?" is
unanswerable.

## Not in this phase

Anything Discogs (Phase 4), custom endpoints (Phase 5), the publish/sale workflow that
actually writes these rows (Phase 6).
