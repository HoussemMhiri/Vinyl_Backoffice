# Working Docs — Strapi Vinyl Backoffice + Discogs

Decomposition of [`../test-technique.md`](../test-technique.md) into reference files to
work from. The original spec remains the source of truth.

| File | Use it when |
|---|---|
| [00-brief.md](00-brief.md) | you need the scope, the structural principles, or what is forbidden |
| [01-data-model.md](01-data-model.md) | creating or editing content-types and fields |
| [02-connector.md](02-connector.md) | writing anything Discogs — interface, mock, completeness, fixtures |
| [03-api-and-workflow.md](03-api-and-workflow.md) | writing routes/controllers/services, or the README parcours |
| [06-research-notes.md](06-research-notes.md) | you need the verified Strapi 5 / Discogs API contracts and the decisions they force |
| [phase-1-bootstrap.md](phase-1-bootstrap.md) | executing Phase 1 |
| [04-build-plan.md](04-build-plan.md) | deciding what to do next, or what to cut |
| [05-acceptance-checklist.md](05-acceptance-checklist.md) | before declaring anything done |

## The one-paragraph version

Multi-tenant Strapi (TypeScript + PostgreSQL) backoffice slice. Five models — `tenant`,
`product` (vinyl catalog sheet), `sellable-unit` (physical copy, auto SKU `VIN-000001`),
`channel-listing` (Discogs publication), `marketplace-sync-event` (persistent log). A
Discogs connector behind a generic interface, mock mode by default. Four custom endpoints
drive a 12-step parcours: search → attach release → check completeness → publish →
simulate sale → out of stock, logging every marketplace action. ~8h budget; structure is
graded, not feature count.
