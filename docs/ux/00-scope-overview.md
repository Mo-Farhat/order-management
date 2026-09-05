# Storefront Desk — UX Scope Overview

Read this first. These four files cover the entire v1 surface — nothing else needs designing before the validation phase (five committed businesses) is done.

## The single problem this solves

An owner is taking orders through Instagram DMs and WhatsApp and losing track of them — what's confirmed, what's packed, what's been paid, who ordered what. That's it. Everything in these flows serves that one problem or the one bridge out of it (the share link).

## What's in scope for v1 design

1. **Onboarding & Auth** (01) — signup to first product added, under 2 minutes
2. **Catalog** (02) — products with one price, one stock number, no variants
3. **Order Desk** (03) — the daily loop, optimised for one-handed mobile use under 30 seconds
4. **Share Link** (04) — the customer-facing page and its handoff to WhatsApp

## What's deliberately not designed yet

Don't build screens for these — they either don't exist in v1 or are covered by a single settings row, not a flow:

- Product variants (size/colour) — flat catalog only
- Dashboard analytics beyond four numbers — no charts
- Billing/subscription management UI — needed eventually, not for validation
- Multi-user roles UI (Staff/Viewer invites) — real in the spec, not needed to test the core loop with five businesses
- CSV import detail screens — mentioned as an entry point, not fully specced
- Any payment processing — out of scope permanently, not just for v1

If you find yourself wanting to design one of these before the five-business validation is done, that's a sign the scope is creeping — go back to the spec's validation gate first.

## Design direction for Claude Design

- Primary canvas: mobile, one-handed, mid-range Android, patchy connection. Desktop is secondary everywhere except the order board (03, S2).
- The product's personality should come from clarity, pace, and restraint — not decoration. This is a working tool for someone in the middle of a sale, not a showcase.
- The share link page (04) is the one screen where visual polish matters most, because it's the only one a paying customer's actual customer ever sees, and it's the taste of the eventual website. Everything else can be plainer.
- Treat the internal Order Desk item-grid (03, S4) and the public share-link item-grid (04, S2) as the same interaction pattern, designed together — one literally produces the other.

## File map

- `01-onboarding-auth.md` — signup, business basics, empty catalog
- `02-catalog.md` — product list, add/edit product, stock editing
- `03-order-desk.md` — order list/board, new order flow, order detail
- `04-share-link.md` — public catalog page, checkout handoff, owner settings
