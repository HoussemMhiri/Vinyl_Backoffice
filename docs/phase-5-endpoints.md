# Phase 5 — Custom Endpoints (~1h)

**Goal:** the workflow is reachable over HTTP, every business query is tenant-scoped, and
each marketplace operation writes exactly one sync event.

**Definition of done:** search, attach and completeness work end to end against the mock
connector, and an entity from another tenant is invisible rather than forbidden.

---

## Checklist

### 5.1 — Tenant scoping utility
- [ ] `src/utils/tenant.ts` — `requireTenant(tenantId)` and `findScoped(uid, documentId, tenantId, populate)`
- [ ] an entity outside the caller's tenant returns `null`, which controllers turn into `404`
- [ ] an inactive tenant is refused: it must not publish to a marketplace

### 5.2 — `GET /api/discogs/search`
- [ ] `src/api/discogs/` — routes + controller + service, no content-type
- [ ] query params `tenantId`, `q`
- [ ] logs `search_release` with the query and result count
- [ ] empty `q` is a `400`, not an empty search

### 5.3 — `POST /api/products/:id/attach-discogs-release`
- [ ] `src/api/product/routes/01-product-discogs.ts`
- [ ] body `{ tenantId, releaseId }`
- [ ] stores `discogsReleaseId` and `discogsMasterId`
- [ ] backfills only **empty** product fields from the release, never overwrites the seller's data
- [ ] unknown release is `404`, logged as an error event

### 5.4 — `POST /api/sellable-units/:id/check-discogs-completeness`
- [ ] `src/api/sellable-unit/routes/01-sellable-unit-discogs.ts`
- [ ] returns `200 { isValid, missingFields, errors }` even when invalid
- [ ] logs `check_completeness`, `success` when valid and `skipped` when not

### 5.5 — Verify
- [ ] `tsc` clean, `npm test` green
- [ ] the three endpoints exercised against the running server
- [ ] commit, push, PR

---

## Decisions taken

| # | Decision | Why |
|---|---|---|
| 1 | `:id` means `documentId` everywhere | Strapi 5's public identifier; mixing it with numeric `id` breaks silently |
| 2 | Foreign entity returns `404`, never `403` | a `403` confirms the record exists and leaks another tenant's data |
| 3 | Inactive tenant is refused | an inactive account must not reach a marketplace |
| 4 | Failed completeness is `200`, not an error | "this unit is not ready" is a valid answer to the question asked |
| 5 | Attach backfills only empty fields | the seller's own metadata outranks Discogs' |
| 6 | Routes are `auth: false` | no auth layer is in scope for this test; stated in the README as a known gap |
| 7 | Controllers map results to status codes and nothing else | keeps business rules testable without HTTP |

## Logging contract

| Endpoint | Action | Success | Failure |
|---|---|---|---|
| search | `search_release` | `success` + result count | `error` + message |
| attach | `search_release` | `success` + release id | `error` when the release is unknown |
| completeness | `check_completeness` | `success` when valid | `skipped` with the missing fields |

## Not in this phase

Publish and simulate-sale (Phase 6) — they write listings, which needs the upsert rule.
