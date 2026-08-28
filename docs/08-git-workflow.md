# 08 — Git Workflow

## Model

One branch per build phase, merged into `main` through a GitHub pull request.
`main` always boots.

```
main
 ├── feat/phase-1-bootstrap
 ├── feat/phase-2-core-models
 ├── feat/phase-3-channel-models
 ├── feat/phase-4-discogs-connector
 ├── feat/phase-5-endpoints
 ├── feat/phase-6-workflow
 └── feat/phase-7-tests-readme
```

Prefixes: `feat/` for scope, `chore/` for tooling and config, `fix/` for corrections,
`docs/` for documentation-only work.

## Rules

- Never commit directly to `main`.
- A branch is opened for one phase and closed when that phase's checklist is fully ticked.
- Commits are small and scoped, conventional prefix, imperative mood
  (`feat: generate SKU on sellable unit creation`).
- The commit body explains **why** when the change is not self-evident. No body needed
  for an obvious change.
- Run `/code-review` on the branch before opening the PR.
- PR description states what the phase delivers and which checklist items it closes.
- Squash on merge only if the branch history is messy; otherwise keep the commits —
  they document the build order.

## Never committed

`.env` · `node_modules/` · `.tmp/` · `build/` · `dist/` · `.strapi/` · any database dump.

Enforced by `.gitignore` at the repo root.

## Secret incident (resolved)

The initial scaffold commit tracked `backoffice/.env` and was pushed. All six Strapi
secrets were rotated, the file was untracked, and `main` history was rewritten so no
`.env` exists in any reachable commit. Kept here as a record — a reviewer seeing a
force-push in the reflog should know why it happened.
