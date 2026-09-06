# Setup & key handover guide

Everything you (Mohamed) need to provide for Phase 1 to run against real
infrastructure. Work top to bottom. The app runs locally with placeholders
already; the items marked **[need from you]** unblock a real database and real
email.

---

## 0. Local quick start (no external accounts)

```bash
npm install
cp .env.example .env.local        # already created with placeholders + a real AUTH_SECRET
npm run dev
```

You can load `/`, `/signup`, `/login`. Submitting signup/onboarding will fail
until `DATABASE_URL` points at a real Neon database (step 1).

---

## 1. Neon (Postgres)  **[need from you: DATABASE_URL]**

1. Create an account at <https://neon.tech> → **New Project**.
   - Region: pick the one closest to Sri Lanka (currently **AWS ap-south-1 / Mumbai**).
   - Postgres version: latest.
2. In the project → **Connection Details**:
   - Toggle **Connection pooling** ON.
   - Copy the connection string (looks like
     `postgresql://neondb_owner:...@ep-...-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require`).
3. Put it in `.env.local` as `DATABASE_URL="..."`.
4. Apply the schema and security policies:

   ```bash
   npm run db:migrate
   npm run db:rls
   ```

### 1a. Enforcing row-level security  **[recommended before real tenant data]**

By default the app connects as the Neon owner role, which *bypasses* RLS — the
policies are installed but latent. To make them load-bearing, provision a
restricted runtime role once:

```bash
RUNTIME_DB_PASSWORD='pick-a-long-random-string' npm run db:rls
```

It prints a `DATABASE_URL_RUNTIME="..."` line — paste that into `.env.local`.
All tenant-scoped **writes** then run as a `NOBYPASSRLS` role, so Postgres
rejects any cross-tenant insert/update even if the application layer has a bug.
Onboarding (which runs before any tenant exists) still uses the owner role.
Leave `DATABASE_URL_RUNTIME` unset and everything still works — just without the
second safety net.

---

## 2. Auth.js secret  **[already done]**

`.env.local` already has a generated `AUTH_SECRET`. To rotate it:

```bash
npx auth secret          # writes a new AUTH_SECRET to .env.local
```

Rotating it signs everyone out. `AUTH_URL` should be the app's public origin
(`http://localhost:3000` locally; the real domain in production).

---

## 3. Email / magic links  **[need from you: an email sender, when ready]**

Not required for local dev — sign-in links print to the terminal running
`npm run dev`. For real email, easiest path is **Resend**:

1. <https://resend.com> → add and verify a sending domain (or use their test domain to start).
2. Create an API key.
3. In `.env.local`:

   ```
   EMAIL_SERVER_HOST="smtp.resend.com"
   EMAIL_SERVER_PORT="587"
   EMAIL_SERVER_USER="resend"
   EMAIL_SERVER_PASSWORD="re_xxxxxxxxxxxx"
   EMAIL_FROM="Storefront Desk <login@yourdomain.com>"
   ```

Cloudflare does not offer outbound SMTP, so email stays with a dedicated provider
(Resend / Postmark / SES). Free tiers are ample for the 5-pilot validation phase.

---

## 4a. Object storage — Cloudflare R2  **[need from you: STORAGE_*]**

Product photos. The storage client is S3-compatible; these steps are for R2.
(R2 has a generous always-free tier, but Cloudflare asks for a card on the
account to enable R2 — it won't charge within the free limits.)

1. Cloudflare dashboard → **R2** → **Create bucket** (e.g. `storefront-desk-media`).
2. **R2 → Manage API Tokens → Create API Token** — *Object Read & Write*, scoped
   to that bucket. Copy the **Access Key ID** and **Secret Access Key**.
3. Grab your **Account ID** (R2 overview page, or the dashboard right sidebar).
4. Give the bucket a public URL: **bucket → Settings → Public access** — either
   enable the `r2.dev` dev URL or attach a custom domain (`media.<yourdomain>`).
5. In `.env.local`:

   ```
   STORAGE_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
   STORAGE_REGION="auto"
   STORAGE_ACCESS_KEY_ID="<access key id>"
   STORAGE_SECRET_ACCESS_KEY="<secret access key>"
   STORAGE_BUCKET="storefront-desk-media"
   STORAGE_PUBLIC_BASE_URL="https://<public bucket URL or custom domain>"
   ```

Leave these unset and the app hides photo upload — products still save.

## 4b. Hosting — Cloudflare Workers (OpenNext)

The repo is already scaffolded: `open-next.config.ts`, `wrangler.jsonc`, and
`npm run cf:*` scripts. The adapter is `@opennextjs/cloudflare` (Pages'
`next-on-pages` is deprecated). `npm run cf:preview` builds the Worker and runs
it locally; `npm run build` is enough for CI/typecheck.

**First deploy:**

1. `npx wrangler login` (opens a browser; needs a Cloudflare account).
2. Push secrets (once each — values from `.env.local`):

   ```bash
   for k in DATABASE_URL DATABASE_URL_RUNTIME AUTH_SECRET \
            EMAIL_SERVER_HOST EMAIL_SERVER_PORT EMAIL_SERVER_USER \
            EMAIL_SERVER_PASSWORD EMAIL_FROM \
            STORAGE_ENDPOINT STORAGE_REGION STORAGE_ACCESS_KEY_ID \
            STORAGE_SECRET_ACCESS_KEY STORAGE_BUCKET STORAGE_PUBLIC_BASE_URL; do
     npx wrangler secret put "$k"
   done
   ```

   Non-secret vars (`APP_NAME`, `AUTH_URL` = the real https origin) go in the
   `"vars"` block of `wrangler.jsonc` — safe to commit.
3. `npm run cf:deploy`.
4. In the Cloudflare dashboard: **Workers → storefront-desk → Settings → Domains
   & Routes** → add `desk.<yourdomain>` (and the apex/`www` if the marketing site
   lives elsewhere). DNS records are created for you.
5. Set `AUTH_URL` to that final `https://desk.<yourdomain>` and redeploy.

**Free-plan note:** a Next 16 Worker bundle is ~4 MB gzipped, which is over the
Workers **Free** plan limit (3 MB). If `cf:deploy` is rejected for size, the
Workers **Paid** plan ($5/mo) raises it to 10 MB — reasonable for a product you
charge for. (The bundle is mostly the Next runtime; the app's own code is small.)

**Migrations** run from your machine against the production `DATABASE_URL`, not
from the Worker: `npm run db:migrate && npm run db:rls` after each schema change.

### 4c. Domain

The product needs its own name and domain before public signup (PRD §14). Until
then everything uses the "Storefront Desk" placeholder and localhost.

---

## 5. Summary — what to send me

| Priority | Value | From |
|---|---|---|
| **Now** | `DATABASE_URL` | Neon (step 1) |
| **Now** | run `RUNTIME_DB_PASSWORD=… npm run db:rls` → `DATABASE_URL_RUNTIME` | Neon (step 1a) |
| Soon | `STORAGE_*` | Cloudflare R2 (step 4a) |
| Soon | `EMAIL_SERVER_*` + `EMAIL_FROM` | Resend (step 3) |
| Deploy | Cloudflare account (`wrangler login`) + chosen domain | step 4b/4c |

Paste them into `.env.local`. Never commit that file (it's gitignored).

---

## Known advisories

`npm audit` reports issues in the bundled esbuild of `drizzle-kit` / `wrangler`
(dev-only) and in `nodemailer` via `@auth/core` (the `raw` message option —
unused here). All transitive and upstream; no action needed for the pilot.
Revisit at the Phase 5 (billing) hardening pass.
