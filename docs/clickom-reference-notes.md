# Clickom reference notes (for Storefront Desk)

Pulled from the Noora Modesty Cloudflare repo's live Clickom integration
(`lib/server/clickom.ts`, `clickomOmsWeb.ts`, `clickomOrderPayload.ts`,
`clickomProductSync.ts`, `sanity/schemas/product.ts`). Clickom is a full
Ultimate POS-style ERP — this pulls out only what's relevant to a
stupidly-simple Order Desk (§7.2/§7.3 of the PRD), not a spec to replicate.

## Why look at Clickom at all

Clickom is the "grow up" version of exactly what Storefront Desk replaces:
an order/catalog system for an SME. It's overbuilt for our target user
(multi-warehouse, tax rates, recurring invoices, POS registers, HR — all
explicitly out of scope per PRD §12), but its **data shapes for
product/variation/order are a proven, already-battle-tested schema** for
this exact problem (single-color-per-listing apparel with size variants,
COD-heavy delivery-first orders). Worth stealing the shape, not the scope.

## 1. Product model — maps to FR-4, FR-5, FR-7

Clickom's product/variation split is two levels:

- **Product** — id, `sku`, `name`. One product per **colorway**, not per
  style (Noora's Sanity schema mirrors this: `colorName`/`colorHex` live on
  the product itself, and a `styleGroup` string links sibling colors of the
  same design together for a "same design, other colors" panel).
- **Variation → sub-variation** — a product has `variations[]`, each of
  which can have `sub_variations[]`. For apparel this ends up being
  Variation = size, occasionally with a second axis nested under it. Each
  sub-variation carries its own `variation_id` (the real addressable unit)
  and `sub_sku`.
- **Stock** lives on the sub-variation (`stock` field), keyed by
  `variation_id` — never on the product.

Our PRD's FR-4 is deliberately flatter ("no variants in v1" — Product
Principle #2), but if/when size variants get requested, this is the shape
to copy: **product = name+price+photos, sizes = array of `{ size, sku,
stock }` sub-objects**, each with its own stock count and SKU — not a
separate "variant" document type. Noora's own Sanity schema already does
this (`subVariations[]` on the product document, validated for unique
size + unique SKU per product — see `validateSubVariations` in
`sanity/schemas/product.ts`). That validation rule (no duplicate size, no
duplicate SKU within one product) is worth lifting verbatim whenever FR-4
grows a size axis.

Relevant product fields actually used downstream (i.e. proven necessary,
not speculative):

| Field | Purpose |
|---|---|
| `name` / `title` | display + matching key when no SKU |
| `sku` | stable external-system join key (product-level) |
| `price` | current price — **never trusted for historical orders**, see FR-10 below |
| `colorName` / `colorHex` | swatch display, one product doc per color |
| `styleGroup` | groups colorway siblings for "other colors" UI — free string match, not a relation |
| `subVariations[]` (`size`, `sku`, stock) | the actual sellable units |
| `enablePreOrders` | stock rule escape hatch: a variation with `enablePreOrders` can be ordered with zero stock (relevant if FR-9's pipeline ever needs a "backorder" branch) |
| `isVisible` | soft product hide, independent of stock |

**Matching strategy worth stealing** (`clickomProductSync.ts`): match
external/imported products by normalized SKU first, fall back to
normalized-name match only if it's unambiguous (exactly one candidate),
otherwise flag for manual review. Useful directly for FR-7 (CSV import) —
the same three-way outcome (matched / unmatched / ambiguous) with a
before-commit report is exactly the "preview-before-commit" AC on FR-7.

## 2. Stock movement — maps to FR-5

Clickom's own stock write is a blunt `PUT` of a new stock number — no
ledger. Noora's own app (not Clickom) is the better reference here, and is
worth copying instead: **stock lives in the storefront's own DB, decremented
in one transaction per order, with an audit row per change** — this is
`lib/server/stockLedger.ts` in the cloudflare repo, `reserveStock` /
`releaseStock`. Two lessons from its production history apply directly to
FR-5's AC ("verified by a StockMovement audit row per change, attributing
actor and reason"):

- **Reserve stock at order creation, not at a later "confirm" step**, and
  store a boolean flag on the order (`stockReserved`) recording whether
  units have already been taken out. Otherwise a later status change (e.g.
  a rejection) can't tell whether it needs to put stock back or not, and a
  repeat action can double-release.
- **Never clamp a decrement read to zero.** If two concurrent orders race
  for the last unit, the decrement can go negative — that negative value is
  itself the signal to roll the reservation back. If you clamp the read to
  zero "to be safe," you silently disarm the very overselling check FR-5's
  AC exists to catch.

## 3. Order statuses — maps to FR-9

Clickom exposes an order status **code**, not a label — worth knowing the
shape even though our pipeline is fixed/uneditable per FR-9's AC:

```ts
type ClickomStatusCode = "pd" | "pc" | "oh" | "cp" | "cn" | "rf" | "fl" | "sp";
// pending, processing, on-hold, completed, cancelled, refunded, failed, suspended (typical Ultimate-POS-style set)
```

Two separate status axes exist in Clickom, and Noora's own app deliberately
keeps them distinct rather than collapsing to one field — directly
supports FR-9 + FR-11's "every status change timestamped and attributed":

- **Sale/order status** (the codes above) — the ERP-side lifecycle.
- **Call status** / **delivery status** / **waybill status** — courier-side
  fields, populated by a completely separate system (their dispatch admin
  panel), not the sales API. These read as free-text (`"pending"`,
  `"delivered"`, etc.) scraped off an admin list page, not a fixed enum.

For our own pipeline (`Draft → Confirmed → Packed → Shipped → Delivered`,
branches `Cancelled`/`Returned`), the useful takeaway isn't the specific
codes but the **two-axis pattern**: an internal fulfillment status the
owner drives, plus (optionally, later) a courier-status field that's
allowed to be free text/unknown rather than forced into the same enum —
useful if a future FR ever adds courier integration, but out of scope for
v1 (§12 excludes "Instagram/WhatsApp Business API auto-import" and
third-party API, and courier tracking isn't in the FR list at all — note
it as a "don't build yet" rather than importing the complexity now).

Noora's actual production schema (not Clickom's) is the more directly
reusable reference for FR-9, since it's simpler and already fits a
single-owner tool:

```ts
type AdminStatus = "pending_approval" | "approved" | "rejected";
type OrderStatus = "pending" | "confirmed" | "processing" | "dispatched" | "shipped" | "completed" | "cancelled";
```

The split into **two status fields** (an internal gate vs. a
customer-facing tracking status) is deliberate there and is worth naming
explicitly in our architecture doc even though FR-9 doesn't currently call
for an approval gate: it means a future "does this need owner approval
before it's real" feature is a new field, not a pipeline redesign.

## 4. Order/line-item fields — maps to FR-10, FR-11, FR-13

The order payload sent to Clickom (`ClickomSalePayload`) is the clearest
"what does a real order need" checklist available, since it's what actually
survives contact with a live courier + accounting system:

```ts
{
  invoice_no: string;          // == our order number, human-facing
  custom_order_id: number;     // stable numeric id derived from invoice_no
  transaction_date: string;
  mobile: string;              // customer join key — see FR-13
  customer_full_name: string;
  customer_address_line_1: string;
  customer_address_line_2?: string;
  customer_city: string;
  customer_zip_code: string;   // repurposed as "district" in Noora's own schema — Sri Lanka has no postal-code culture
  customer_country: string;
  discount_type?: "fixed" | "percentage";
  discount_amount?: number;
  additional_notes?: string;   // free-text pressure valve — see Product Principle #3
  products: Array<{
    product_id: number;
    variation_id: number;
    quantity: number;
    unit_price: number;        // snapshotted, not looked up live — see FR-10
    note?: string;
  }>;
  payment?: Array<{ amount: number; method: "cash" | "bank_transfer"; note?: string }>;
}
```

Direct takeaways:

- **FR-10 (price/name snapshot):** Noora's own `OrderItemSnapshot` extends
  the cart-input type with `title`, `unitPrice`, `image` captured at order
  time — exactly the shape FR-10 needs. Confirmed in production: editing a
  product's price afterward never touches historical orders, because the
  order document carries its own copy, not a reference.
- **FR-13 (customer keyed on phone):** Clickom's own contact lookup
  (`findContactId`/`createContact` in `clickomOmsWeb.ts`) resolves-or-creates
  a contact by **normalized mobile number** before creating an order — this
  is precisely FR-13's "customer records created automatically from orders,
  keyed on phone number." Their phone normalization is worth copying
  verbatim for a Sri Lanka–first tool:
  ```ts
  function normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("94") && digits.length === 11) return `0${digits.slice(2)}`;
    if (digits.length === 9) return `0${digits}`;
    if (digits.startsWith("0") && digits.length === 10) return digits;
    return digits.slice(-10);
  }
  ```
  (Generalize the `94`/9-digit assumptions if Storefront Desk ever goes
  outside Sri Lanka — flagged as a hardcoded regional assumption, not a
  general algorithm.)
- **`additional_notes` as a genuine free-text field on the order** — this is
  Product Principle #3 (the note field as pressure valve) already proven
  out in a live system: Noora uses it to carry custom-size measurements,
  color/size text redundantly, and pre-order flags — all things that don't
  justify their own schema columns.
- **Line-item note fields exist per-product too** (`sell_line_note`), not
  just at order level — worth having both a per-order note and a per-item
  note if custom sizing / special requests ever come up in a pilot.

## 5. What NOT to copy

- Clickom's status codes, its two-tier variation model with `parentName`
  string-matching, its tax/discount-type combinatorics, and its whole
  payment sub-schema (card fields, cheque numbers, "change return" —
  clearly a full POS register form) are overbuilt for a DM/WhatsApp seller.
  None of this belongs in Storefront Desk; it's evidence of what "grows
  into a bigger tool" looks like, which is useful context for §14's "pivot
  trigger" conversation, not a checklist to implement.
- Clickom has no concept of a public share-link/catalog page (FR-15–18) —
  that's a Noora/Next.js-side invention, not something to look for in
  Clickom's model.
- Don't copy Clickom's web-scraping fallback pattern (an entire second
  integration path scraping HTML because the REST API doesn't index
  web-created orders) — that's a scar from *their* system's limitations,
  not a pattern to design around from day one.

## 6. One live cautionary tale worth keeping in mind

Noora's OMS integration has a documented failure class worth designing
around from the start rather than discovering later: a field that looks
server-rendered but is actually populated by client-side JS after page
load reads as empty/zero on any server-side fetch of that page. If
Storefront Desk's read API (FR-22) or any future integration ever scrapes
or embeds another system's admin page instead of using its real API,
treat every value as suspect until confirmed present in the raw HTML
response, not just present in the rendered browser DOM.
