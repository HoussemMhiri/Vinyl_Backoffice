# Project — Vinyl Backoffice (Strapi + Discogs)

Technical test, ~8h budget. Strapi 5.52 TypeScript + PostgreSQL, in `backoffice/`.
Full spec: `test-technique.md`. Working decomposition: `docs/`.

## Read before working

- `docs/00-brief.md` — scope and what is forbidden
- `docs/01-data-model.md` — the five content-types
- `docs/06-research-notes.md` — verified Strapi 5 / Discogs contracts
- `docs/07-engineering-conventions.md` — how the code must be written
- `docs/09-architecture.md` — folder structure, layer boundaries, naming

## Non-negotiables

- Comments only where they add information the code cannot. No restating code, no
  section banners, no step-by-step narration. See conventions.
- Layering: `api/` → `connectors/` → `domain/`, dependencies inward only. `domain/`
  imports nothing — no strapi, no io. Nothing imports `api/`.
- Controllers hold no business logic; services never touch `ctx`; the connector never
  touches the DB; `sync-event` is the only writer of log rows.
- Structure and naming follow `docs/09-architecture.md`. New file in the wrong layer is
  a blocker, not a nit.
- Every business query is scoped by tenant.
- Pure logic (SKU, completeness, condition mapping) stays framework-free and unit-tested.
- No secrets in tracked files; mock mode is the default and needs no token.
- `draftAndPublish: false` on all content-types; `:id` in custom routes means `documentId`.

## Out of scope — do not build

Fnac, Amazon, Stripe, orders, shipping, email, CMS, advanced roles, a full custom admin
UI, BullMQ, S3, pricing rules, tax, document generation.

## Working style

Phase by phase, per `docs/04-build-plan.md`. Finish and verify a phase before starting
the next. Run `/code-review` after a phase, `/security-review` before delivery.
