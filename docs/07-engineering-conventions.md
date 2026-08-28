# 07 — Engineering Conventions

Rules the code must follow. Written down so they're enforceable in review, not vibes.

## Comments

Code should read as if a developer wrote it under time pressure and knew what they were
doing — not as if it were narrated for an audience.

- **No comment that restates the code.** `// create the listing` above `createListing()`
  is noise.
- **No section-banner comments** (`// ===== HELPERS =====`), no `@param`/`@returns`
  JSDoc blocks on obviously-typed functions, no step-by-step numbered narration.
- **Do comment the non-obvious:** a business rule with no local justification, a
  workaround for a framework quirk, an intentional deviation from the spec.
- Rule of thumb: if deleting the comment loses no information, delete it.

Good:
```ts
// Discogs rejects requests without a User-Agent, even authenticated ones
headers['User-Agent'] = env.userAgent;
```

Bad:
```ts
// Set the headers
// This function publishes a listing to Discogs
// Step 1: validate the payload
```

## Naming

- Domain language over framework language: `publishListing`, `markOutOfStock`,
  `assertTenantOwnership` — not `handleData`, `doProcess`, `manager`.
- Booleans read as assertions: `isValid`, `hasDiscogsRelease`.
- No abbreviations except the domain's own (`sku`, `id`, `url`).
- Files kebab-case, types PascalCase, functions/vars camelCase, enum slugs SCREAMING_SNAKE.

## Types

- No `any` in the domain layer. Unknown external input is `unknown`, then narrowed.
- Domain types live in one place per module (`*.types.ts`) and are imported, not redeclared.
- Enums as `as const` string unions, not TS `enum`.
- Function signatures are the documentation — if a param list needs explaining, it needs
  an options object instead.

## Layering (hard rule)

```
route  → shape only: method, path, handler
controller → HTTP: parse ctx, extract tenant, map result to status code
service    → business logic, tenant scoping, DB writes, event logging
connector  → Discogs only, mock or http
```

- Controllers contain no business rules and no `strapi.documents()` call.
- Services never touch `ctx` and never throw HTTP errors — they return results or throw
  domain errors the controller maps.
- The connector never touches the database.
- Pure logic (SKU formatting, completeness validation, condition mapping) lives in
  standalone functions with no `strapi` global, so it's unit-testable with zero harness.

## Multi-tenancy

- Every business query filters on tenant. No exceptions, no "we'll add it later".
- One helper resolves and validates the tenant once per request; services take a
  `tenantId` argument rather than digging it out themselves.
- An entity fetched outside the caller's tenant is a `404`, never a `403` — don't leak
  the existence of other tenants' data.

## Errors

- Fail with the reason, not a generic message: include what was missing.
- `404` unknown/foreign entity · `422` failed completeness · `502` connector failure.
- Every marketplace operation writes a `marketplace-sync-event` on **both** success and
  failure. A failed publish that logs nothing is a bug.
- Never swallow an error into a boolean.

## Secrets

- No token, password, or URL with credentials in tracked files. Ever.
- Everything through `env()`, mirrored in `.env.example` with placeholder values.
- Mock mode is the default so the project runs with no secret at all.

## Tests

- Pure functions get unit tests: SKU format, completeness validation, condition mapping.
- Test names state the rule: `rejects a unit whose product has no discogsReleaseId`.
- One integration test on the critical path (`publish-discogs`), against Postgres.
- No test asserts on implementation details of Strapi.

## Git

- Small, scoped commits with conventional prefixes (`feat:`, `chore:`, `test:`, `docs:`).
- One commit per phase minimum; the history should read as the build order.
- Never commit `.env`, `node_modules`, `.tmp`, `build`, `dist`.

## Definition of done for any phase

Code written · types clean · conventions above respected · the phase's checklist boxes
ticked · committed.
