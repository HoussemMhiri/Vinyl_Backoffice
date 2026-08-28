# 01 — Data Model

Five content-types. Every one of them carries a `tenant` relation.

## Relations overview

```
Tenant 1─────N Product 1─────N SellableUnit 1─────N ChannelListing
  │                │                  │                    │
  └────────────────┴──────────────────┴────────────────────┴──► MarketplaceSyncEvent
                        (all optional refs on the event)
```

---

## `tenant`

| Field | Type | Notes |
|---|---|---|
| `name` | string | required |
| `slug` | uid (from name) | required, unique |
| `isActive` | boolean | default `true` |

---

## `product` — the catalog sheet

Describes the *release*, not a physical copy. Several units can point to one product.

| Field | Type | Notes |
|---|---|---|
| `tenant` | relation → tenant | required |
| `productType` | enum | `vinyl` only, default + fixed |
| `title` | string | required |
| `artist` | string | required |
| `description` | text | |
| `label` | string | |
| `year` | integer | |
| `country` | string | |
| `format` | string | e.g. `2xLP` |
| `barcode` | string | optional — barcode or catalog reference |
| `discogsReleaseId` | string | optional |
| `discogsMasterId` | string | optional |

---

## `sellable-unit` — the physical copy being sold

| Field | Type | Notes |
|---|---|---|
| `tenant` | relation → tenant | required |
| `product` | relation → product | required |
| `sku` | string | **generated backend-side**, unique, format `VIN-000001` |
| `price` | decimal | required |
| `currency` | string | default `EUR` |
| `mediaCondition` | enum | disc condition, Discogs grading |
| `sleeveCondition` | enum | sleeve condition, Discogs grading |
| `sellerComment` | text | optional |
| `status` | enum | `available` \| `reserved` \| `sold` \| `out_of_stock` \| `archived`, default `available` |
| `quantity` | integer | default `1` |
| `internalLocation` | string | optional |

**SKU rule:** never user-input. Generated in a `beforeCreate` lifecycle (or a dedicated
service) as `VIN-` + a zero-padded 6-digit counter. Sequence is per tenant. Must be
covered by a unit test.

Grading enums (verified against the Discogs API — see [06-research-notes.md](06-research-notes.md)).
Store slugs in the DB, map them to the exact Discogs strings in the connector.

- `mediaCondition`: `M`, `NM`, `VG_PLUS`, `VG`, `G_PLUS`, `G`, `F`, `P`
- `sleeveCondition`: the same eight **plus** `GENERIC`, `NOT_GRADED`, `NO_COVER`

The two lists differ on purpose — Discogs accepts three extra sleeve values.

---

## `channel-listing` — publication of a unit on a channel

| Field | Type | Notes |
|---|---|---|
| `tenant` | relation → tenant | required |
| `sellableUnit` | relation → sellable-unit | required |
| `channel` | enum | `discogs` only for now |
| `externalListingId` | string | filled after publish |
| `externalUrl` | string | filled after publish |
| `status` | enum | `not_published` \| `pending` \| `published` \| `failed` \| `removed` \| `sync_error`, default `not_published` |
| `publishedPrice` | decimal | price actually sent to the channel |
| `lastSyncedAt` | datetime | |
| `lastErrorMessage` | text | |

Uniqueness: one listing per (`sellableUnit`, `channel`) — publish must upsert, not duplicate.

---

## `marketplace-sync-event` — persistent business log

Append-only. One row per marketplace operation attempt, success or failure.

| Field | Type | Notes |
|---|---|---|
| `tenant` | relation → tenant | required |
| `channel` | enum | `discogs` |
| `action` | enum | see below |
| `status` | enum | `success` \| `error` (add `skipped` if useful) |
| `product` | relation → product | optional |
| `sellableUnit` | relation → sellable-unit | optional |
| `channelListing` | relation → channel-listing | optional |
| `message` | text | human-readable |
| `payload` | json | technical payload / raw response, optional |
| `occurredAt` | datetime | default now |

### Required `action` values

| Action | Emitted by |
|---|---|
| `search_release` | Discogs search endpoint |
| `check_completeness` | completeness validation |
| `publish_listing` | publish to Discogs |
| `mark_local_out_of_stock` | local sale / out-of-stock transition |
