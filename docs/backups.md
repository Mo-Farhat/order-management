# Backups & restore

Three layers, in order of "reach for it first":

## 1. Neon point-in-time restore (automatic)

Neon keeps a WAL history for every project — restore the branch to any second
within the retention window from the Neon console (**Branches → Restore**), or
create a branch at a past timestamp to inspect without touching production.

- Free plan: ~24 hours of history.
- Paid plans: up to 30 days (configurable). **Bump this to ≥ 7 days before
  onboarding paying customers.**

This covers "someone ran a bad delete an hour ago" — the common case.

## 2. Daily logical dump (`.github/workflows/backup.yml`)

Runs `pg_dump` (pinned to `postgres:17` via Docker so the client version always
matches Neon) at 02:17 UTC, gzips it, and stores it two ways:

- **GitHub Actions artifact** — always, 30-day retention. Off-Neon, zero setup.
- **Cloudflare R2** at `backups/backup-<timestamp>.sql.gz` — only when the
  `STORAGE_*` repo secrets are set (`scripts/upload-backup.ts` no-ops otherwise).

### Repo secrets it needs

| Secret | For |
|---|---|
| `DATABASE_URL` | the dump (**required**) |
| `STORAGE_ENDPOINT` / `STORAGE_REGION` / `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` / `STORAGE_BUCKET` | the R2 copy (optional) |

Set an **R2 lifecycle rule** to expire `backups/` objects after 30–90 days.

Trigger a run manually from the Actions tab (**Run workflow**) to smoke-test.

## 3. Restore drill (quarterly — put a reminder in your calendar)

1. Download the latest `backup-*.sql.gz` (Actions artifact or R2).
2. Create a scratch Neon branch: **Branches → New branch** (`restore-test`).
3. `gunzip -c backup-*.sql.gz | psql "<restore-test branch connection string>"`
4. Sanity-check: row counts on `tenants` / `orders` / `products` look right,
   a couple of orders open correctly.
5. Delete the branch.

Record the date + result somewhere (this file's git history is fine).
