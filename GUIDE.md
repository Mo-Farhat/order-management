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

## 3. Email — Resend  **[need from you: RESEND_API_KEY]**

Used for transactional mail (password resets). Not required for local dev — the
email body prints to the terminal running `npm run dev`.

We call Resend's **HTTP API** (Cloudflare Workers can't do SMTP), so no
nodemailer.

1. <https://resend.com> → create an account (free tier, no card).
2. **API Keys → Create** → copy `re_...`.
3. Sending address:
   - **To start / test:** leave `EMAIL_FROM` unset — mail sends from
     `onboarding@resend.dev`. Fine for you to test with; may land in spam for
     real users.
   - **For production:** you need a **domain**. In Resend → **Domains → Add**,
     then add the DNS records it shows (SPF, DKIM, DMARC) at your registrar or
     Cloudflare DNS. Once verified, set `EMAIL_FROM="Name <hi@yourdomain.com>"`.
4. In `.env.local` (and Cloudflare vars):

   ```
   RESEND_API_KEY="re_xxxxxxxx"
   EMAIL_FROM="Name <hi@yourdomain.com>"   # optional until your domain is verified
   ```

So: **yes, a verified domain is needed for good deliverability**, but the reset
flow works today with the test address or the console fallback.

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

The repo is scaffolded: `open-next.config.ts`, `wrangler.jsonc`, `npm run cf:*`
scripts. Adapter is `@opennextjs/cloudflare` (Pages' `next-on-pages` is
deprecated). `npm run cf:preview` builds + runs the Worker locally.

### Option A — connect the GitHub repo (auto-deploy on push)

1. **Workers & Pages → Create → Import a repository.** Authorise GitHub, pick the repo.
2. Build settings — override the defaults:
   - **Project name:** `storefront-desk` (must match `name` in `wrangler.jsonc`)
   - **Build command:** `npx opennextjs-cloudflare build`
   - **Deploy command:** `npx wrangler deploy`
   - Root directory: leave `/`.
3. **Variables and Secrets** — add all of these (tick "also available at build
   time" for `DATABASE_URL` and `AUTH_SECRET` — the build imports the DB adapter):
   `DATABASE_URL`, `DATABASE_URL_RUNTIME`, `AUTH_SECRET`, `APP_NAME`
   (+ `RESEND_API_KEY`, `EMAIL_FROM`, `STORAGE_*` once you have them).
4. **Save and Deploy.** First run: Cloudflare asks you to pick a
   `*.workers.dev` subdomain for the account — do it.
5. After it deploys, note the URL (`https://storefront-desk.<you>.workers.dev`),
   add `AUTH_URL` = that URL as a variable, and redeploy (Retry deployment, or
   push a commit). Sign-in won't work until `AUTH_URL` is set.

### Option B — deploy from your laptop

`npx wrangler login`, then `npx wrangler secret put <NAME>` for each value above,
then `npm run cf:deploy`. `APP_NAME` / `AUTH_URL` can instead go in the `"vars"`
block of `wrangler.jsonc`.

### After deploy

- **Migrations** run from your machine against the production `DATABASE_URL`
  (`npm run db:migrate && npm run db:rls`) — never from the Worker.
- **Custom domain:** step 4c.

**Free-plan size note:** a Next 16 Worker bundle is ~4 MB gzipped, over the
Workers **Free** limit (3 MB). If the deploy is rejected for size, Workers
**Paid** ($5/mo) raises it to 10 MB. (Mostly the Next runtime; the app code is small.)

**Migrations** run from your machine against the production `DATABASE_URL`, not
from the Worker: `npm run db:migrate && npm run db:rls` after each schema change.

### 4c. Domain

You can run on `*.workers.dev` indefinitely for the pilot. For a real domain:

1. The domain must be **on Cloudflare** first: **Websites → Add a site** → enter
   the domain → follow the steps to change its nameservers at your registrar
   (takes a few minutes to a few hours to activate).
2. Then **Workers & Pages → storefront-desk → Settings → Domains & Routes → Add →
   Custom Domain** → `desk.<yourdomain>`. Cloudflare creates the DNS record.
3. Update `AUTH_URL` to `https://desk.<yourdomain>` and redeploy.

The product still needs its own name before public signup (PRD §14).

---

## 5. Summary — what to send me

| Priority | Value | From |
|---|---|---|
| **Now** | `DATABASE_URL` | Neon (step 1) |
| **Now** | run `RUNTIME_DB_PASSWORD=… npm run db:rls` → `DATABASE_URL_RUNTIME` | Neon (step 1a) |
| Soon | `STORAGE_*` | Cloudflare R2 (step 4a) |
| Soon | `RESEND_API_KEY` (+ `EMAIL_FROM` once domain verified) | Resend (step 3) |
| Optional | `ADMIN_EMAILS` (comma list) → `/admin` cross-tenant operator view | your email |
| Deploy | Cloudflare account (`wrangler login`) + chosen domain | step 4b/4c |

Paste them into `.env.local`. Never commit that file (it's gitignored).

---

## Known advisories

`npm audit` reports issues in the bundled esbuild of `drizzle-kit` / `wrangler`
(dev-only) and in `nodemailer` via `@auth/core` (the `raw` message option —
unused here). All transitive and upstream; no action needed for the pilot.
Revisit at the Phase 5 (billing) hardening pass.
