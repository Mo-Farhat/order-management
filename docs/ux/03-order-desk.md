# 03 — Order Desk

The daily habit. Designed for one-handed use, phone in the other hand reading a DM. Target: under 30 seconds from "open app" to "order saved."

## Flow

```
Order board (list view, mobile default)
    │
    ├─ Tap "+ New order"
    │       │
    │       ▼
    │   Find or add customer (phone number search)
    │       │
    │       ▼
    │   Tap products from grid, adjust quantity
    │       │
    │       ▼
    │   Review: items, delivery fee, discount, note
    │       │
    │       ▼
    │   Save as Draft (or Confirm directly)
    │
    └─ Tap existing order ──► Order detail ──► Advance status (one tap) / Edit (Owner-only past Confirmed) / Cancel
```

Status pipeline (fixed, not configurable):
`Draft → Confirmed → Packed → Shipped → Delivered`
Side branches at any point before Delivered: `Cancelled`, `Returned` (after Delivered only).

## Screens

### S1 — Order list (default view)
**Purpose:** "what needs my attention right now."
**Elements:**
- Segmented control or tabs by status, with "Needs action" (Confirmed + Packed) as the default landing tab, not "All"
- Each row: customer name, item count, total, status pill, time since last update
- Search by customer name, phone, or order number
- Floating "+ New order" action
**States:** default, empty ("No orders yet — your first one will show up here"), filtered-by-status

### S2 — Board view (secondary, desktop/tablet only)
**Purpose:** columns by status for a wider screen, same data as S1.
**Elements:** one column per pipeline stage, drag or tap-to-advance card between columns
**States:** default, column-empty

### S3 — New order: find/add customer
**Purpose:** the first friction point — must resolve to a customer record in one or two taps for repeat buyers.
**Elements:**
- Phone number input with live search against existing customers
- Existing match shown immediately with name + last order date, tap to select
- "No match — add new customer" inline, just name + phone
**States:** default, match-found, no-match, duplicate-phone-warning

### S4 — New order: add items
**Purpose:** fastest possible product selection.
**Elements:**
- Grid of product thumbnails with price, same visual language as catalog list
- Tap to add, quantity stepper appears inline on the tile once added
- Running subtotal pinned at bottom, tappable to jump to review
- Search/filter within the grid for large catalogs
**States:** default, item-out-of-stock (shown but disabled, with stock count), cart-has-items (bottom bar active)

### S5 — Review & save
**Purpose:** the one screen where fees, discounts, and notes get added — kept off the item-selection screen deliberately.
**Elements:**
- Line items with snapshot price, editable quantity, remove action
- Delivery fee field (flat, optional)
- Discount field (flat or %, optional)
- Free-text note (the "wants it before Friday" field)
- Two actions: "Save as Draft" and "Confirm order" — both visible, Confirm visually primary
**States:** default, validation-error (empty cart), saved-confirmation

### S6 — Order detail
**Purpose:** single source of truth for one order, including its history.
**Elements:**
- Customer name/phone (tap to call or open WhatsApp)
- Items, fees, total
- Status pill with a single primary action to advance to the next stage
- Timeline of status changes with timestamps and actor
- Note field, editable
- Cancel action (confirmation required, states reason optional)
**States:** default, terminal (Delivered/Cancelled/Returned — advance action replaced with a static label), editing-locked (past Confirmed, edit disabled for Staff role, visible but greyed with a tooltip-equivalent explanation)

## Notes for Claude Design
- Design S3–S5 as a single continuous mobile flow (like a checkout), not three separate modal dialogs — momentum matters here more than anywhere else in the product.
- Status pills need to be distinguishable at a glance without relying on colour alone (add an icon or label) — this will be used by people with low attention bandwidth mid-conversation with a customer.
- Avoid decorative empty states; the empty order list should read as "clean," not "abandoned."
