# Read API (`/api/v1`)

The upgrade-to-website bridge (PRD FR-22). A **read-only**, tenant-scoped API so
an external storefront — built by any agency — can render a catalog without
touching the Order Desk database.

## Auth

Create a key in the desk: **Settings → API access**. The plaintext is shown once.

```
Authorization: Bearer sd_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Keys are revocable and scoped to one business. Use them **server-side** — anyone
with the key can read the catalog. Missing/invalid/revoked → `401`.

CORS is open (`*`) for `GET`/`OPTIONS`. Responses are cacheable for 30s.

## `GET /api/v1/catalog`

Everything an external storefront needs in one call.

```json
{
  "business": { "name": "Aisha's Kitchen", "slug": "aishas-kitchen", "currency": "LKR" },
  "categories": ["Bakery", "Drinks"],
  "products": [
    {
      "id": "uuid",
      "name": "Chocolate Croissant",
      "description": null,
      "sku": null,
      "category": "Bakery",
      "price": "450.00",
      "currency": "LKR",
      "in_stock": true,
      "photos": ["https://media.example.com/…"]
    }
  ]
}
```

`in_stock` is a boolean only — exact quantities are never exposed. When the
tenant has stock tracking off, everything is `in_stock: true`.

## `GET /api/v1/products`

Flat product list with paging. Same product shape as above.

| Query param | Default | Notes |
|---|---|---|
| `category` | — | exact match |
| `limit` | 500 | max 500 |
| `offset` | 0 | |

```json
{ "data": [ /* products */ ], "total": 42, "limit": 500, "offset": 0 }
```

## Not included

No orders, customers, prices history, or any write path — by design. Archived
products are excluded. Rate limiting is not enforced yet.
