# 01 — Onboarding & Auth

Scope for v1: get an owner from "never heard of this" to "has added one product" in under two minutes, without talking to us. Nothing here is optional to simplify further — this is already the minimum.

## Flow

```
Landing page
    │
    ▼
Sign up (email + password OR magic link)
    │
    ▼
Business basics (name, WhatsApp number) — 2 fields
    │
    ▼
Empty catalog, single prompt: "Add your first product"
    │
    ├─ Adds product ──────────► Product added, progress strip advances
    │                              │
    │                              ▼
    │                       "Create your first order" prompt
    │
    └─ Has an existing list ─► CSV import offered inline
```

No wizard, no modal tour, no required tutorial. A persistent but dismissible three-step progress strip (Add a product → Take an order → Share your link) is the only guidance.

## Screens

### S1 — Landing / Sign up
**Purpose:** one decision — start, or come back later. Nothing to browse.
**Elements:**
- Single headline naming the problem in plain language (not the product's feature list) — e.g. framing around "orders stop living in your DMs"
- One primary CTA: "Start free — no card needed"
- Email field + password field, OR a single "Email me a link instead" toggle
- Small trust line under the button: what happens after signup (14 days, no card)
**States:** default, submitting, error (invalid email, weak password, account exists → offer login instead)
**Copy tone:** speaks to the owner's daily mess, not to features.

### S2 — Business basics
**Purpose:** the only setup step before the product is usable.
**Elements:**
- Business name (becomes their share-link slug, auto-generated, editable)
- WhatsApp number (used for the share-link handoff later)
- One button: "Continue"
**States:** default, slug-taken (auto-suggest a variant, never block)

### S3 — Empty catalog
**Purpose:** the first real screen. An empty state that acts, not a dashboard with nothing on it.
**Elements:**
- Large single prompt: "Add your first product" with a plus action
- Secondary, lower-emphasis link: "Have a product list already? Import a CSV"
- Progress strip (dismissible), showing step 1 of 3 active
**States:** empty (default), CSV upload in progress, CSV preview-before-commit

### S4 — Magic link sent / Login
**Purpose:** low-friction return path.
**Elements:** confirmation message, resend action (rate-limited), fallback to password login
**States:** sent, expired-link, already-used-link

## Notes for Claude Design
- Mobile-first. Assume a mid-range Android phone, not a laptop, as the primary canvas.
- No stock illustration or hero graphic — the product's personality should come from clarity and pace, not decoration.
- This is not a marketing site; treat S1 as a functional gate, not a landing page pitch.
