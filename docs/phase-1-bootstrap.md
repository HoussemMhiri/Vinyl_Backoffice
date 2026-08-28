# Phase 1 — Bootstrap (~1h)

**Goal:** `npm run develop` boots cleanly against local PostgreSQL, secrets are out of
git, and the repo is reproducible by a stranger from the README.

**Definition of done:** the Strapi admin loads at http://localhost:1337/admin and the
tables live in the `vinyl_backoffice` Postgres database (not SQLite).

## Starting state (verified)

- Strapi 5.52.2, TypeScript, deps installed in `backoffice/`
- `pg` driver already present
- `config/database.ts` already handles `postgres` via `DATABASE_*` env vars
- PostgreSQL 18 running locally, port 5432, `psql` at `C:\Program Files\PostgreSQL\18\bin`
- No content-types yet, no seed, no git repo

---

## Checklist

### 1.1 — Create the database and role
- [ ] create role `vinyl` and database `vinyl_backoffice` in Postgres
- [ ] run manually: it needs the `postgres` superuser password, which stays off the record
- [ ] verify: connecting as `vinyl` to `vinyl_backoffice` succeeds

### 1.2 — Point Strapi at Postgres
- [ ] confirm `DATABASE_CLIENT=postgres` in `backoffice/.env` (currently unverified)
- [ ] set `DATABASE_HOST` / `PORT` / `NAME` / `USERNAME` / `PASSWORD` / `SSL=false`
- [ ] remove the SQLite fallback risk: no `DATABASE_FILENAME` in play
- [ ] verify: `config/database.ts` needs no edit (it already reads these)

### 1.3 — Boot check
- [ ] `npm run develop` from `backoffice/`
- [ ] verify: no connection error, Strapi creates its internal tables
- [ ] verify: admin reachable at `/admin`, create the first admin user
- [ ] verify in Postgres: `\dt` lists `strapi_*` / `admin_*` tables

### 1.4 — Secrets hygiene (graded constraint)
- [ ] `.env` never committed; `.env.example` lists **every** var with placeholder values
- [ ] add the `DATABASE_*` vars to `.env.example` (scaffold only ships server + secrets)
- [ ] add `DISCOGS_MODE=mock` and `DISCOGS_TOKEN=` now, so mock-by-default is documented from day one
- [ ] verify: no secret value appears anywhere in tracked files

### 1.5 — Git
- [ ] `git init` at the repo root (not inside `backoffice/`)
- [ ] `.gitignore` covers `node_modules`, `.env`, `.tmp`, `build`, `dist`, `.strapi`
- [ ] verify: `git status` shows no `.env` and no `node_modules`
- [ ] first commit: "chore: bootstrap strapi typescript + postgres"

### 1.6 — Root README skeleton
- [ ] prerequisites (Node 20+, PostgreSQL)
- [ ] install steps, env setup, DB creation commands
- [ ] `npm run develop`
- [ ] a "Test parcours" heading left empty — filled in Phase 7
- [ ] verify: someone else could follow it from zero

---

## Explicitly NOT in Phase 1

Content-types, the seed script, any Discogs code, any custom route. Those are Phases 2–7.

## Decisions taken

| Decision | Choice | Why |
|---|---|---|
| DB provisioning | local PostgreSQL 18, no Docker | it's already installed and running |
| DB / role names | `vinyl_backoffice` / `vinyl` | explicit, disposable |
| Repo layout | docs + README at root, app in `backoffice/` | spec docs stay outside the framework tree |
| Git | init at root | a technical test is delivered as a repo |
