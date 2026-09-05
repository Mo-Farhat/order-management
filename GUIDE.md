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

That's the only DB credential needed. Drizzle handles migrations; there's no
separate admin console to configure.

> Later (Phase 2+) we'll add a second, restricted DB role for the app runtime so
> row-level security becomes enforced rather than latent. Not needed now.

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

## 4. Cloudflare  **[need from you, before Phase 2 / deploy]**

Not used by Phase 1 code yet. Set up when we start catalog photos (Phase 2) or
the first deploy.

### 4a. R2 (object storage for product photos)

1. Cloudflare dashboard → **R2** → **Create bucket** (e.g. `storefront-desk-media`).
2. **R2 → Manage API Tokens → Create API Token** (Object Read & Write, scoped to the bucket).
3. Provide:
   - `R2_ACCOUNT_ID` (Cloudflare account ID, right sidebar of the dashboard)
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET` (the bucket name)
4. Enable a public bucket URL or attach a custom domain (`media.<yourdomain>`) and
   provide it as `R2_PUBLIC_BASE_URL`.

### 4b. Hosting (Cloudflare Pages / Workers)

Decision still open on Pages vs Workers for a Next 16 app. When we deploy:

- Connect the GitHub repo to Cloudflare Pages, **or** deploy via `@opennextjs/cloudflare`.
- Add every `.env.local` value as a Pages/Workers environment variable
  (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` = the real domain, `EMAIL_*`, `R2_*`, `APP_NAME`).
- Point `desk.<yourdomain>` DNS at the deployment.

### 4c. Domain

The product needs its own name and domain before public signup (PRD §14). Until
then everything uses the "Storefront Desk" placeholder and localhost.

---

## 5. Summary — what to send me

| Priority | Value | From |
|---|---|---|
| **Now** | `DATABASE_URL` | Neon (step 1) |
| Soon | `EMAIL_SERVER_*` + `EMAIL_FROM` | Resend (step 3) |
| Phase 2 | `R2_*` + `R2_PUBLIC_BASE_URL` | Cloudflare R2 (step 4a) |
| Deploy | Cloudflare account access + chosen domain | step 4b/4c |

Paste them into `.env.local`. Never commit that file (it's gitignored).

---

## Known advisories

`npm audit` reports issues in `drizzle-kit`'s bundled esbuild (dev-only, dev
server) and in `nodemailer` via `@auth/core` (the `raw` message option — unused
here). Both are transitive and upstream; no action needed for the pilot. Revisit
at the Phase 5 (billing) hardening pass.
