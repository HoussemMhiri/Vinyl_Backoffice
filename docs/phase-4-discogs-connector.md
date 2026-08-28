# Phase 4 — Discogs Connector (~1h30)

**Goal:** every Discogs concept lives behind one interface, with a mock implementation
that runs the whole workflow offline and an optional real HTTP mode.

**Definition of done:** `tsc` clean, the connector resolves to mock with no token present,
and completeness validation plus condition mapping are covered by unit tests that need no
database and no Strapi.

---

## Checklist

### 4.1 — Types and the generic interface
- [ ] `src/connectors/marketplace-connector.ts` — `MarketplaceConnector` with the five spec methods
- [ ] `src/connectors/discogs/discogs.types.ts` — `DiscogsRelease`, `DiscogsSearchResult`,
      `ListingPayload`, `PublishResult`, `ValidationResult`
- [ ] the interface is generic: nothing in it names Discogs, so a second channel would implement it

### 4.2 — Pure domain rules
- [ ] `src/domain/conditions.ts` — slug → exact Discogs grading string, both directions,
      media (8 values) and sleeve (11 values) kept separate
- [ ] `src/domain/completeness.ts` — `validateListingPayload(unit)` returning
      `{ isValid, missingFields, errors }`, reporting **all** problems at once
- [ ] both are framework-free: no strapi, no io, no imports from the project

### 4.3 — Mock connector
- [ ] `src/connectors/discogs/discogs.fixtures.ts` — the spec's exact data:
      Daft Punk / Discovery / 2001 / France / 2xLP / Virgin / release `123456`,
      listing `discogs-listing-0001`
- [ ] `src/connectors/discogs/discogs.mock.ts` — implements the interface, no network
- [ ] `searchReleases` filters the fixtures by query so an unrelated search returns nothing
- [ ] `publishListing` refuses to publish an incomplete unit, as the real API would

### 4.4 — Real HTTP connector (optional mode)
- [ ] `src/connectors/discogs/discogs.http.ts` using `fetch`
- [ ] `Authorization: Discogs token=` and a custom `User-Agent`, both from env
- [ ] `GET /database/search`, `GET /releases/:id`, `POST /marketplace/listings`
- [ ] maps our condition slugs to Discogs strings, sends `sku` as `external_id`

### 4.5 — Mode selection
- [ ] `src/connectors/discogs/index.ts` — `getDiscogsConnector()`
- [ ] mock unless `DISCOGS_MODE=api` **and** a token is present
- [ ] falls back to mock with a warning rather than crashing on a missing token

### 4.6 — Tests
- [ ] `tests/unit/conditions.test.ts` — mapping both ways, every value, unknown input
- [ ] `tests/unit/completeness.test.ts` — valid unit, and one case per missing field
- [ ] `tests/unit/discogs-mock.test.ts` — fixtures returned, search miss, publish refusal
- [ ] `npm test` green

---

## Decisions taken

| # | Decision | Why |
|---|---|---|
| 1 | Validation is pure and synchronous | it is the single most testable rule in the project; no reason for it to touch io |
| 2 | Slugs in the database, Discogs strings only at the boundary | the DB stays vendor-neutral; a second marketplace maps from the same slugs |
| 3 | Mock enforces the same rules as the real API | a mock that always succeeds proves nothing and hides bugs until integration |
| 4 | Missing token downgrades to mock with a warning | the project must always run; the spec makes mock the default |
| 5 | Connector never touches the database | it receives a unit, returns a result; persistence is the service's job |
| 6 | `sku` is sent as Discogs `external_id` | it is the field Discogs provides for the seller's own reference |
| 7 | No retry, no rate limiting | out of scope for 8h; noted in the README as a known gap |

## Completeness rules

A unit is publishable only when all of these hold. All failures are reported together.

- product has `discogsReleaseId`
- product has `title`, `artist`, `year`, `format`
- unit has `price` > 0 and a `currency`
- unit has `mediaCondition` and `sleeveCondition`
- unit `saleStatus` is `available`
- unit `quantity` >= 1

## Not in this phase

Endpoints (Phase 5), persisting listings and events (Phase 6), the seed (Phase 7).
Nothing in this phase writes to the database.
