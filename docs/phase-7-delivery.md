# Phase 7 — Seed, README, Integration Test (~1h)

**Goal:** a stranger clones the repo and reproduces the whole parcours without asking a
question.

**Definition of done:** `npm run seed` creates a working tenant, the README lists the 12
steps as runnable requests, and one integration test covers the critical endpoint.

---

## Checklist

### 7.1 — Seed script
- [ ] `backoffice/scripts/seed.ts`, run with `npm run seed`
- [ ] creates tenant `Vinyl Store Paris`, the Daft Punk product, one sellable unit
- [ ] idempotent: running it twice does not duplicate anything
- [ ] prints the documentIds the README needs, so the parcours is copy-pastable
- [ ] leaves the product **without** `discogsReleaseId`, so step 4 has something to do

### 7.2 — Integration test
- [ ] `tests/integration/publish-discogs.test.ts`
- [ ] runs against real Postgres, not SQLite — Strapi's own guide does not work on Windows
- [ ] covers: publish succeeds, listing is created, event is written, second publish
      updates rather than duplicates
- [ ] creates and removes its own tenant, so it never touches seeded data
- [ ] separate script `npm run test:integration`, kept out of the fast unit run

### 7.3 — README
- [ ] fill the empty Seed and Test parcours sections
- [ ] the 12 steps as curl commands with placeholders
- [ ] document `DISCOGS_MODE`, mock by default
- [ ] a "Known gaps" section: no auth on custom routes, racy SKU sequence, no retry
      or rate limiting, no marketplace polling

### 7.4 — Close
- [ ] `tsc` clean, unit + integration green
- [ ] acceptance checklist reviewed line by line
- [ ] commit, push, PR

---

## Decisions taken

| # | Decision | Why |
|---|---|---|
| 1 | Seed is idempotent and re-runnable | an evaluator will run it twice; duplicates would look like a bug |
| 2 | Seed stops short of attaching the release | otherwise the parcours has nothing to demonstrate |
| 3 | Integration test isolates its own tenant | it must not corrupt the data the README tells the reader to use |
| 4 | Integration kept out of `npm test` | the fast suite must stay fast and need no database |
| 5 | Known gaps are written down | naming a limit reads as judgement; hiding it reads as an oversight |
