# 02 — Catalog

This is the spine — the object that becomes the storefront later. v1 cuts variants entirely: one price, one stock number, per product. Add variants back only once real usage demands it.

## Flow

```
Product list
    │
    ├─ Tap "+ Add product" ──► Add product form (4 fields) ──► Saved ──► back to list, new item at top
    │
    ├─ Tap existing product ─► Product detail / edit ──► Save / Archive
    │
    └─ Tap stock number inline ─► Quick stock editor (+/-, or type) ──► Saved instantly
```

## Screens

### S1 — Product list
**Purpose:** the home base. Scannable, not a spreadsheet.
**Elements:**
- Search bar (name only, v1)
- List of product rows: photo thumbnail, name, price, stock count (inline editable), low-stock badge if under threshold
- Floating "+ Add product" action, always reachable
- Category filter chip row — only shown once 2+ categories exist
**States:** default, empty (see onboarding S3), searching-no-results, low-stock-badge-visible

### S2 — Add product
**Purpose:** four fields, nothing more, on the first screen.
**Elements:**
- Photo (tap to open camera or gallery; client-side crop to square before upload)
- Name
- Price
- Stock quantity
- Collapsed link: "More details" → expands description, category, low-stock threshold, SKU
**States:** default, photo-uploading, validation-error (missing name or price), saved-confirmation (returns to list, no modal)

### S3 — Product detail / edit
**Purpose:** same form as Add, pre-filled, plus destructive actions.
**Elements:**
- Same fields as S2, editable inline
- Stock movement history (compact list: date, change, reason, who)
- "Archive" action (soft delete — removed from share link, kept in past orders)
- "Delete" only enabled if the product has never appeared in an order; otherwise disabled with an explanatory note, not hidden
**States:** default, has-order-history (delete disabled), archived (shown greyed in list, filterable)

### S4 — Quick stock editor
**Purpose:** the single most frequent interaction after order-taking — must be near-instant.
**Elements:** large +/- steppers, direct number entry, save-on-blur (no explicit save button)
**States:** default, saving (subtle inline indicator, not a spinner overlay)

## Notes for Claude Design
- Photos matter more here than almost any other screen — this is what the customer sees on the share link. Give the thumbnail real visual weight in the list, don't shrink it to an icon.
- No variant UI in v1 — do not design a size/colour grid yet, it will imply complexity that isn't built.
- Low-stock badge should read as informational, not alarming (avoid red/error framing for a normal business state).
