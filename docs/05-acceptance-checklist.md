# 05 — Acceptance Checklist

Copied from the spec's *Critere de reussite*. Nothing ships until every box is checked.

## Success criteria

- [ ] the project starts locally (documented commands, clean boot)
- [ ] models `tenant` / `product` / `sellable-unit` / `channel-listing` exist
- [ ] `marketplace-sync-event` exists and is written to
- [ ] SKU is generated automatically, format `VIN-000001`
- [ ] a Discogs release can be searched
- [ ] a release can be attached to a product
- [ ] a unit can be published to Discogs in mock mode
- [ ] `externalListingId` is stored on the ChannelListing
- [ ] a Discogs sale can be simulated
- [ ] the unit moves to `sold` / `out_of_stock`
- [ ] events are journalised for all 4 actions
- [ ] the README lets a reader reproduce the whole parcours

## Mandatory technical constraints

- [ ] TypeScript throughout
- [ ] readable, structured code
- [ ] **no hardcoded secrets**
- [ ] `.env.example` present and complete
- [ ] Discogs logic isolated in a service/connector
- [ ] business logs persisted in the DB
- [ ] clear README

## Structural checks (what's actually being evaluated)

- [ ] every business query is scoped by `tenantId` — visibly, in the service layer
- [ ] `Product` and `SellableUnit` are distinct models with a real 1→N relation
- [ ] `ChannelListing` is a separate model, not fields bolted onto the unit
- [ ] a generic `MarketplaceConnector` interface exists; Discogs is one implementation
- [ ] mock mode is the default and needs no network and no token
- [ ] controllers are thin; connector never touches the DB

## Recommended

- [ ] unit tests: SKU generation
- [ ] unit tests: completeness validation
- [ ] unit tests: mock Discogs service
- [ ] integration test: one critical endpoint

## Scope discipline

- [ ] nothing built from the out-of-scope list (Fnac, Amazon, Stripe, orders, shipping,
      email, CMS, advanced roles, full custom admin UI, BullMQ, S3, pricing rules, tax,
      documents)
