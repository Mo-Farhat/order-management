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

## 4a. Object storage — Supabase Storage  **[need from you: STORAGE_*]**

Product photos. **Supabase's free tier needs no credit card** (unlike R2). Any
S3-compatible store works; these steps are for Supabase.

1. <https://supabase.com> → **New project** (free plan, no card). Pick a region
   near Sri Lanka. Note the project ref (the `xxxxxxxx` in `xxxxxxxx.supabase.co`).
2. **Storage → New bucket** → name it `product-photos`, tick **Public bucket**.
3. **Project Settings → Storage → S3 Connection**: enable it, note the
   **endpoint** and **region**, then **New access key** → copy the key ID + secret.
4. In `.env.local`:

   ```
   STORAGE_ENDPOINT="https://xxxxxxxx.supabase.co/storage/v1/s3"
   STORAGE_REGION="<region from step 3>"
   STORAGE_ACCESS_KEY_ID="<key id>"
   STORAGE_SECRET_ACCESS_KEY="<secret>"
   STORAGE_BUCKET="product-photos"
   STORAGE_PUBLIC_BASE_URL="https://xxxxxxxx.supabase.co/storage/v1/object/public/product-photos"
   ```

Leave these unset and the app hides photo upload — products still save.

## 4b. Hosting (Cloudflare Pages / Workers)

Decision still open on Pages vs Workers for a Next 16 app. When we deploy:

- Connect the GitHub repo to Cloudflare Pages, **or** deploy via `@opennextjs/cloudflare`.
- Add every `.env.local` value as a Pages/Workers environment variable
  (`DATABASE_URL`, `DATABASE_URL_RUNTIME`, `AUTH_SECRET`, `AUTH_URL` = the real
  domain, `EMAIL_*`, `STORAGE_*`, `APP_NAME`).
- Point `desk.<yourdomain>` DNS at the deployment.

### 4c. Domain

The product needs its own name and domain before public signup (PRD §14). Until
then everything uses the "Storefront Desk" placeholder and localhost.

---

## 5. Summary — what to send me

| Priority | Value | From |
|---|---|---|
| **Now** | `DATABASE_URL` | Neon (step 1) |
| **Now** | run `RUNTIME_DB_PASSWORD=… npm run db:rls` → `DATABASE_URL_RUNTIME` | Neon (step 1a) |
| Soon | `STORAGE_*` | Supabase Storage (step 4a) — no card |
| Soon | `EMAIL_SERVER_*` + `EMAIL_FROM` | Resend (step 3) |
| Deploy | Cloudflare account access + chosen domain | step 4b/4c |

Paste them into `.env.local`. Never commit that file (it's gitignored).

---

## Known advisories

`npm audit` reports issues in `drizzle-kit`'s bundled esbuild (dev-only, dev
server) and in `nodemailer` via `@auth/core` (the `raw` message option — unused
here). Both are transitive and upstream; no action needed for the pilot. Revisit
at the Phase 5 (billing) hardening pass.
