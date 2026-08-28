# 02 — Discogs Connector

All Discogs logic lives behind one interface, in its own folder. **No Discogs knowledge
leaks into controllers or lifecycles.**

```
src/connectors/
  marketplace-connector.ts     # generic interface (proves the architecture generalises)
  discogs/
    discogs.connector.ts       # picks mock or http based on config
    discogs.mock.ts            # default mode, no network
    discogs.http.ts            # optional, used only when a token is provided
    discogs.types.ts           # DiscogsRelease, DiscogsSearchResult, ListingPayload...
    discogs.completeness.ts    # pure validation, easiest thing to unit-test
```

## Interface

```ts
export interface MarketplaceConnector {
  searchReleases(query: string): Promise<DiscogsSearchResult[]>;
  getRelease(releaseId: string): Promise<DiscogsRelease>;
  validateListingPayload(unit: SellableUnitWithProduct): ValidationResult;
  publishListing(unit: SellableUnitWithProduct): Promise<PublishResult>;
  markLocalSoldOrOutOfStock(unit: SellableUnitWithProduct): Promise<LocalStockResult>;
}
```

- `ValidationResult` → `{ isValid: boolean; missingFields: string[]; errors: string[] }`
- `PublishResult` → `{ externalListingId: string; externalUrl: string; publishedPrice: number }`
- `validateListingPayload` is **synchronous and pure** — no DB, no network. Test it directly.

## Two modes

| Mode | Trigger | Behaviour |
|---|---|---|
| **mock** (default) | `DISCOGS_MODE=mock` or no token set | returns plausible data, zero network |
| real | `DISCOGS_MODE=api` **and** `DISCOGS_TOKEN` present | calls the real Discogs API |

The whole 12-step workflow must be runnable end to end in mock mode. Never hardcode a
token; read it from env, document it in `.env.example`.

## Completeness rules (`validateListingPayload`)

A unit is publishable only if:

- its product has a `discogsReleaseId`
- product has `title`, `artist`, `year`, `format`
- unit has `price` > 0 and a `currency`
- unit has `mediaCondition` and `sleeveCondition`
- unit `status` is `available` and `quantity` >= 1

Return every missing field at once, not just the first one.

## Mock fixtures (from the spec — use these exact values)

```ts
export const MOCK_RELEASE = {
  releaseId: '123456',
  artist: 'Daft Punk',
  title: 'Discovery',
  year: 2001,
  country: 'France',
  format: '2xLP',
  label: 'Virgin',
};

export const MOCK_PUBLISH_RESULT = {
  externalListingId: 'discogs-listing-0001',
  externalUrl: 'https://www.discogs.com/sell/item/discogs-listing-0001',
};
```

## Logging contract

Every connector call made through a business service writes exactly one
`marketplace-sync-event` — on success **and** on failure. The connector itself stays
pure-ish; the service layer owns persistence and logging.
