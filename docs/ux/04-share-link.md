# 04 — Share Link (the bridge)

This is the only screen a business's actual customers ever see. It has to work well enough to be genuinely useful, and be visibly a taste of the eventual website — not a full replacement for one. Two different audiences, two different files: this one is the customer-facing page; owner-side settings for it are minimal and covered at the end.

## Flow

```
Customer opens desk.fortypixels.com/{business-slug}
    │
    ▼
Browses catalog (read-only, mobile-first)
    │
    ▼
Selects items, adjusts quantity
    │
    ▼
Taps "Order on WhatsApp"
    │
    ▼
Pre-filled WhatsApp message opens (item list + reference code)
    │
    ▼
Customer sends message to the business's WhatsApp number
    │
    ▼
Owner receives it, pastes/enters the reference code in Order Desk
    │
    ▼
Converts into a Draft order with line items pre-populated
```

No account, no login, no payment on this page. It ends at WhatsApp — everything after is off-platform, by design.

## Screens

### S1 — Public catalog page
**Purpose:** browse and select, nothing else.
**Layout:** one configurable layout wrapped in a shared shell (`getStorefrontChrome` in the route layout wraps every state — catalog, product, paused, empty, error):
- Sticky top nav: logo + name (home link), category links (URL-addressable `?category=`), live cart button
- Optional masthead (Studio+): banner image + hero headline / subhead / tagline
- Responsive product grid (2 → 3–4 columns) with a sort control (`?sort=` newest / price asc / price desc)
- Footer: WhatsApp + Instagram links, policy note, "powered by" (removable on Pro)
**Elements:**
- Product grid: photo, name, price, stock status (in stock / low stock / out of stock — no exact count shown to customers)
- Category filter is **server-side and URL-addressable** — a filtered/sorted URL is reload-safe and shareable
- Persistent "cart" indicator once an item is selected (count + subtotal), synced across the nav badge and the grid
**States:** default, empty-catalog (business hasn't added products yet — should not be publicly reachable in this state, redirect or show a simple "coming soon"), out-of-stock-item (shown, disabled)

### S2 — Item selection
**Purpose:** minimal cart-building, no separate cart page.
**Elements:** quantity stepper appears on tap, inline on the product card (same pattern as internal Order Desk S4 — the customer-facing and owner-facing add-to-order interactions should feel like the same product)
**States:** default, item-added, quantity-adjusted

### S3 — Checkout handoff
**Purpose:** the moment this page hands off to WhatsApp — the actual conversion point.
**Elements:**
- Summary of selected items and subtotal
- Delivery note field (optional, free text — "any request for the seller")
- Single button: "Order on WhatsApp" — opens WhatsApp with a pre-filled message containing item list, quantities, subtotal, and a short reference code
**States:** default, empty-selection (button disabled with a nudge to add items)

## Owner-side: share link settings (tier-gated)
**Purpose:** the configuration surface for this page — bounded, one layout, more knobs on higher tiers. Fields the shop's tier doesn't unlock render greyed with a "✦ Studio" / "✦ Pro" pill; a downgrade keeps stored values but stops rendering them on the storefront.
**Elements:**
- **Basic:** logo upload · accent + on-accent colour · category nav order · delivery/policy note · page live/paused · copyable link + QR
- **Studio:** banner image · secondary colour · background tone · font · tagline · hero headline/subhead · section show-hide (banner / policy note / category nav) · default product sort
- **Pro:** remove the "powered by" line · read API keys (`/desk/settings`) · `pro_website_discount` offer (operator-set)
- Business name (inherited from account, editable in Settings)
**States:** default, page-paused (shows a simple "we're not taking orders right now" page to visitors)

## Notes for Claude Design
- This page should look intentionally good but stay one constrained layout — Studio/Pro add a banner, hero copy, font and section toggles, but never new pages, a rearrangeable layout, or a checkout. The gap between this and a full website should still be visible: this is the taste of the eventual site, not the site.
- Design this and the internal Order Desk item-selection screen (03, S4) as visual siblings — same tile pattern, same interaction — since one literally feeds the other.
- QR code should be a first-class element on the owner settings screen, not an afterthought link — many of these businesses operate a physical counter as well as DMs.
