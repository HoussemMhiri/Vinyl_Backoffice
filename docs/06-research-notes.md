# 06 — Research Notes (verified against official docs)

Facts gathered before coding, so the implementation matches the real APIs instead of
guesses. Sources at the bottom.

## Strapi 5 — what actually applies here

Installed version: **5.52.2**, TypeScript.

### Content-types
- Path: `src/api/<api-name>/content-types/<content-type-name>/schema.json`
- Sections: `kind` (`collectionType`), `collectionName`, `info`
  (`singularName`, `pluralName`, `displayName`), `options`, `attributes`
- Relation syntax:
  ```json
  "product": { "type": "relation", "relation": "manyToOne",
               "target": "api::product.product", "inversedBy": "sellableUnits" }
  ```
- `options.draftAndPublish` defaults to **true** → set it to `false` on all five models.
  Business entities have no editorial draft state, and D&P doubles every row into
  draft/published versions, which would badly complicate SKU uniqueness and listings.

### Reserved attribute names
`status` is reserved: the Content Manager uses it for document draft/published state.
An attribute named `status` is rejected by the admin API with "Invalid status" while the
Document Service still accepts it — so it looks like it works from scripts and fails only
in the UI. Business statuses are therefore `saleStatus`, `listingStatus`, `eventStatus`.

### Lifecycles (SKU generation)
- Path: `src/api/<api>/content-types/<ct>/lifecycles.ts`
- `beforeCreate(event)` → mutate `event.params.data` directly.
- **Caveat:** bulk lifecycles (`createMany`, `updateMany`, `deleteMany`) are *never*
  triggered by Document Service methods. Fine for us — units are created one at a time.

### Document Service API (Strapi 5's data layer)
```ts
await strapi.documents('api::product.product').findMany({ filters, populate, fields });
await strapi.documents('api::product.product').findOne({ documentId, populate });
await strapi.documents('api::product.product').create({ data });
await strapi.documents('api::product.product').update({ documentId, data });
```
- **`documentId` (24-char string) replaces `id` as the public identifier in v5.** Our
  custom routes take `:id` — decide it means `documentId` and stay consistent.
- Tenant scoping is just `filters: { tenant: { documentId: tenantId } }` on every call.

### Custom routes
- Path: `src/api/<api>/routes/01-custom.ts` (numeric prefix loads before core routes —
  matters, otherwise `/sellable-units/:id` swallows `/sellable-units/:id/publish-discogs`)
```ts
import type { Core } from '@strapi/strapi';
const config: Core.RouterConfig = {
  type: 'content-api',
  routes: [{ method: 'POST', path: '/sellable-units/:id/publish-discogs',
             handler: 'api::sellable-unit.sellable-unit.publishDiscogs',
             config: { auth: false, policies: [], middlewares: [] } }],
};
export default config;
```
- Handler format: `api::<api-name>.<controller>.<action>`

### Controllers
```ts
import { factories } from '@strapi/strapi';
export default factories.createCoreController('api::sellable-unit.sellable-unit',
  ({ strapi }) => ({
    async publishDiscogs(ctx) { /* ctx.params.id, ctx.request.body, ctx.query */ },
  }));
```
- Errors: `ctx.badRequest()` 400, `ctx.notFound()` 404, `ctx.throw(422, msg)`.

---

## Discogs API — real contract worth mirroring in the mock

### Search — `GET /database/search`
- Params: `q`, `type` (`release` | `master` | `artist` | `label`), plus `artist`,
  `release_title`, `label`, `year`, `country`, `format`, `barcode`, `catno`,
  `page`, `per_page`.
- Auth required even for search.

### Release — `GET /releases/{release_id}`

### Create listing — `POST /marketplace/listings`
| Param | Required | Notes |
|---|---|---|
| `release_id` | yes | integer |
| `condition` | yes | media grading, exact strings below |
| `price` | yes | |
| `sleeve_condition` | no | wider value set than `condition` |
| `status` | no | `For Sale` / `Draft` |
| `comments`, `allow_offers`, `external_id`, `location`, `weight`, `format_quantity` | no | |

`external_id` is notable: it's Discogs' own field for the seller's internal reference —
**our `sku` maps onto it naturally.** Nice detail to implement.

### Grading values (exact strings)
- `condition`: `Mint (M)`, `Near Mint (NM or M-)`, `Very Good Plus (VG+)`,
  `Very Good (VG)`, `Good Plus (G+)`, `Good (G)`, `Fair (F)`, `Poor (P)`
- `sleeve_condition`: the same eight, **plus** `Generic`, `Not Graded`, `No Cover`

→ Our two enums must not be identical. Store slugs in the DB, map slug → exact Discogs
string in the connector. That mapping is a good, cheap unit test.

### Auth (real mode only)
- `Authorization: Discogs token=<token>` header
- **A custom `User-Agent` is mandatory** — Discogs rejects requests without one.

### Marketplace search caveat
There is **no public endpoint to search the marketplace by release_id** — the
undocumented one was closed. Irrelevant for us: our "simulate a sale" step is explicitly
local, which the spec already asks for (`markLocalSoldOrOutOfStock`). Worth one line in
the README: it justifies why the sale is simulated rather than polled.

---

## Testing — Windows constraint

Strapi's official testing guide uses Jest + Supertest with an **in-memory SQLite** DB and
states plainly it **does not work on Windows** (SQLite file locking). We're on Windows.

Consequence:
- **Unit tests stay framework-free.** SKU formatting, completeness validation, and the
  condition-slug mapping are written as pure functions with no `strapi` global, so Jest
  tests them directly with zero harness. This is the right design anyway.
- **Integration test** on `publish-discogs` runs against a real `vinyl_backoffice_test`
  Postgres database, not SQLite. It's the recommended-not-mandatory item, so it goes last
  and gets dropped first if time runs out.

---

## Design decisions this research forces

| # | Decision |
|---|---|
| 1 | `draftAndPublish: false` on all five content-types |
| 2 | `:id` in custom routes means `documentId` |
| 3 | Custom route files prefixed `01-` so they load before core routes |
| 4 | Business logic in pure functions, not lifecycles, so it's testable without a harness |
| 5 | Media and sleeve condition enums differ; connector maps slug → Discogs string |
| 6 | `sku` is sent as Discogs `external_id` |
| 7 | Real mode sends `Authorization: Discogs token=` + a custom `User-Agent` |
| 8 | No attribute may be named `status` — reserved by Strapi 5 |

## Sources

- [Strapi 5 — Models](https://docs.strapi.io/cms/backend-customization/models)
- [Strapi 5 — Routes](https://docs.strapi.io/cms/backend-customization/routes)
- [Strapi 5 — Controllers](https://docs.strapi.io/cms/backend-customization/controllers)
- [Strapi 5 — Services](https://docs.strapi.io/cms/backend-customization/services)
- [Strapi 5 — Document Service API](https://docs.strapi.io/cms/api/document-service)
- [Strapi 5 — Lifecycle hooks & Document Service](https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/lifecycle-hooks-document-service)
- [Strapi 5 — Testing](https://docs.strapi.io/cms/testing)
- [Discogs API — Home / authentication](https://www.discogs.com/developers)
- [Discogs API — Marketplace listing](https://www.discogs.com/developers/resources/marketplace/listing.html)
