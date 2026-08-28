# Vinyl Backoffice — Strapi + Discogs

Technical test: a vertical slice of a multi-tenant backoffice for selling vinyl records,
with a mockable Discogs marketplace integration.

Stack: Strapi 5.52 · TypeScript · PostgreSQL.

## Requirements

- Node.js 20+ (tested on 22)
- PostgreSQL 14+ running locally
- npm

## Install

```bash
git clone https://github.com/HoussemMhiri/test-tech.git
cd test-tech/backoffice
npm install
```

## Database

Create the database and its role:

```sql
CREATE USER vinyl WITH PASSWORD 'vinyl';
CREATE DATABASE vinyl_backoffice OWNER vinyl;
```

On Windows, `psql` lives at `C:\Program Files\PostgreSQL\<version>\bin\psql.exe`:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE USER vinyl WITH PASSWORD 'vinyl';"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE vinyl_backoffice OWNER vinyl;"
```

## Environment

```bash
cp .env.example .env
```

Then fill the secrets. Generate each one with:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

`APP_KEYS` takes four comma-separated values. Set `DATABASE_PASSWORD` to the password
used above.

Discogs runs in **mock mode by default** — no token required. Set `DISCOGS_MODE=api` and
`DISCOGS_TOKEN` only to hit the real API.

## Run

```bash
npm run develop
```

Strapi starts on http://localhost:1337 — create the first admin user at `/admin`.

## Seed

<!-- phase 7 -->

## Test parcours

<!-- phase 7: the 12 steps, as runnable requests -->

## Project structure

```
backoffice/          Strapi application
  src/api/           content-types, controllers, routes, services
  src/connectors/    marketplace connectors (Discogs: mock + http)
docs/                working specification and build notes
test-technique.md    original test subject
```

## Documentation

The subject is decomposed in [`docs/`](docs/README.md): data model, connector contract,
API workflow, engineering conventions, and the acceptance checklist.

## Scope

One product type (`vinyl`), one channel (`discogs`). Fnac, Amazon, Stripe, orders,
shipping, email, CMS, workers and file storage are explicitly out of scope — see
[`docs/00-brief.md`](docs/00-brief.md).
