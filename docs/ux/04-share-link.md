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
**Elements:**
- Business name, logo, one accent colour (owner-set), WhatsApp contact icon
- Product grid: photo, name, price, stock status (in stock / low stock / out of stock — no exact count shown to customers)
- Category filter if the business has categories
- Persistent "cart" indicator once an item is selected (count + subtotal)
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

## Owner-side: share link settings (minimal)
**Purpose:** the only configuration surface for this page — deliberately small.
**Elements:**
- Logo upload
- One accent colour picker
- Business name (inherited from account, editable here)
- Delivery note / policy text (shown on S3)
- Toggle: page live / paused
- Copyable link + QR code for offline sharing (business cards, physical shop)
**States:** default, page-paused (shows a simple "we're not taking orders right now" page to visitors)

## Notes for Claude Design
- This page should look intentionally good but obviously constrained — same product photography and clean type as a real storefront, but simpler layout, no custom sections, no brand storytelling. The gap between this and a full website should be visible without being ugly.
- Design this and the internal Order Desk item-selection screen (03, S4) as visual siblings — same tile pattern, same interaction — since one literally feeds the other.
- QR code should be a first-class element on the owner settings screen, not an afterthought link — many of these businesses operate a physical counter as well as DMs.
