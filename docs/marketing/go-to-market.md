# SFDesk — go-to-market plan

Working doc. Built to be pasted into Claude Design as context when making
carousels, or worked from section by section.

Product in one line: **a mini storefront your customers order from, plus an
order desk that tracks every order — for shops that sell over Instagram /
WhatsApp DMs.**

Price: **LKR 1,500/mo**, 14-day free trial, no card. Storefront owners get 20%
off a future full-website build.

Screenshot pack for designs: `docs/marketing/screenshots/` (regenerate any time
with `npm run marketing`). See the index at the bottom.

---

## 0. The one distinction that matters

**Building in public ≠ acquiring customers.** They are different motions with
different audiences:

| Track | Audience | Channel | Purpose |
|---|---|---|---|
| **Founder / build-in-public** | founders, indie hackers | Twitter/X, LinkedIn | credibility, occasional early users, learning in public |
| **Customer acquisition** | small IG / WhatsApp shops | Instagram, TikTok, seller communities, DMs | revenue |

Run both. Do not let the founder track eat the time the customer track needs.

**The money math:** at ~$5/mo you need *hundreds* of shops for meaningful
revenue, so acquisition cost has to be ~$0. No paid ads — they don't work at
$5 ARPU. Everything here is organic, community, and direct outreach.

---

## 1. Phase 0 — Design partners (next 2–3 weeks, before any public post)

Don't launch to strangers. Onboard 5–8 real shops for free, personally.

**Why:** zero proof exists today. No testimonials, no real storefronts, no
"here's a seller who switched." Every carousel made now would be hypothetical.

**Do:**
- List 15–20 small IG/WhatsApp shops (friends, friends-of-friends, local — any
  niche: fashion, food, plants, crafts).
- DM: *"I built an order system for DM shops — free storefront + order tracker.
  Want me to set yours up? 10 minutes, I'll do it with you on a call."*
- Onboard 5–8. Note where they get stuck (that's the real onboarding-friction
  list).
- After a week: ask each for a 2-sentence reaction + permission to screenshot
  their storefront.

**Blockers to clear in parallel (launch-gating):**
- **Real domain.** `*.workers.dev` cannot appear on a marketing graphic.
- **The name.** "SFDesk" / "Storefront Desk" is a placeholder — pick the real
  one *before* branding 30 pieces of content.
- **A way to collect money.** Bank transfer + the admin plan toggle is fine for
  the first ~10 paying shops. Lemon Squeezy later.
- **Trial enforcement.** Right now nothing gates on plan status — "paid" and
  "expired" are identical. At minimum: day-14 banner → read-only around day 21,
  storefront stays live.
- Legal `[contact email]` / `[jurisdiction]` placeholders in Terms/Privacy.

**Phase 0 output:** one genuinely beautiful real storefront (help your best
partner style it), 3–5 seller quotes, a folder of real screenshots.

---

## 2. Phase 1 — The founder story (build-in-public, starts now, runs forever)

Low effort, compounding. Builds *your* credibility; occasionally drips in early
users.

**The first post** — concrete and human, not "I built a SaaS":

> *"My friend runs a clothing shop entirely through Instagram DMs. Watching her
> scroll back through 200 chats to find one order broke my brain. So I built her
> a proper order system — a storefront customers actually order from, and a desk
> that tracks every order. Here's what it looks like 👇"*
>
> [30s screen recording: storefront → customer picks items → order lands in the
> desk → accept]

**Ongoing, ~3–4×/week on Twitter/X (repost to LinkedIn):**
- Build progress + a screenshot ("added seller order emails — every storefront
  order now hits your inbox")
- Problems you hit and how you solved them (the logout/cookie saga, the
  Cloudflare Workers stuff — devs love this)
- Numbers, once you have them ("3 shops live, first paid customer today")
- Occasional reasoning thread (why DM sellers, why $5, why not just a Google
  Form)
- The customer-track carousels also go here — founders reshare good design.

---

## 3. Phase 2 — The customer content engine

**Channels, priority order:**
1. **Instagram** (feed carousels + Reels) — where the customers already are
2. **TikTok** (repurpose the Reels) — best organic reach for demo content
3. **Facebook groups / WhatsApp communities** for online sellers — post value,
   never a bare link; DM interested people
4. **Direct DM outreach** to shops with visibly chaotic ordering — ~5/day,
   ongoing

**5 content pillars — rotate them:**

| Pillar | Angle | Format | Screenshot to use |
|---|---|---|---|
| **Pain** | "Your DMs are not a spreadsheet." The 3am scroll to find an order. Lost order = lost money. | Carousel | — (illustration) |
| **Demo** | 15–30s screen recording of one real flow. No voiceover needed. | Reel / TikTok | screen recording |
| **Before / After** | Google Form vs. a real storefront. Chat-scroll vs. the order desk. | Carousel + side-by-side | `01-storefront`, `04-desk-orders` |
| **Proof** | A real partner shop's storefront + their words. | Carousel / Story | partner's own |
| **Education** | "How organized DM sellers track orders" — genuinely useful, product is the answer at slide 8. | Carousel | `05-desk-dashboard`, `06-desk-order-detail` |

**Cadence for a solo founder (batch it):**
- 2 carousels + 1 Reel per week
- Daily-ish Story: a poll ("what's your biggest DM ordering headache?"),
  behind-the-build, a partner spotlight
- One design session in Claude Design → 4–6 carousels. One screen-recording
  session → 4 Reels.

---

## 4. First 4 weeks — concrete calendar

**Week 1 (still Phase 0, seed the story)**
- Twitter: the friend-shop origin post + 30s video
- IG Story: "building something for DM sellers — what's your worst ordering
  horror story?"
- Start partner onboarding

**Week 2**
- Carousel: *"5 signs your shop has outgrown DMs"* (pain)
- Reel: storefront demo, customer POV — browse, add, send order (`01`, `03`)
- IG Story: partner #1's storefront reveal

**Week 3**
- Carousel: *"Google Form vs. a real storefront"* (before/after)
- Reel: the order desk — accept an order, mark it dispatched, mark it paid
  (`08`, `06`)
- Twitter: "3 shops live" + a metric

**Week 4 — soft launch**
- Carousel: *"I built a storefront + order tracker for DM sellers. Everything it
  does."* (feature tour — use the synced design system for the graphics)
- Reel: full 60s walkthrough
- Twitter / LinkedIn: launch post with the founder story, link, "first 10 shops
  get [X]"
- DM every warm lead from the last 3 weeks

---

## 5. Assets to build in Claude Design

The design system is synced (project: *SFDesk Design System*) — the `.mkt`
palette (blue `#1e40af` primary, amber `#f59e0b`), Geist headlines, Spline body.
Have the agent build:

- **Carousel master** — 1080×1350, `.mkt` palette, so the whole feed reads as
  one brand
- **Feature cards** — one per capability: storefront, order desk, WhatsApp
  handoff, stock tracking, CSV exports
- **Comparison graphic** — Google Form vs. SFDesk
- **"What you get" / pricing card** — LKR 1,500, 14-day trial, the 20%-off hook
- **Testimonial card template** — drop in partner quotes
- **Phone-mockup frame** — to wrap the storefront screenshots (`01`, `02`, `03`)

---

## 6. Screenshot pack — `docs/marketing/screenshots/`

All 1440-wide desk / 430-wide phone, 2× density, real product photos, generated
from the live app with a demo boutique ("Marlowe Studio"). Regenerate:
`npm run marketing`.

| File | Shows | Best for |
|---|---|---|
| `01-storefront.png` | phone — the storefront grid, branded, category chips, delivery note | hero shot, "a link you can be proud to send" |
| `02-storefront-product.png` | phone — a product detail page with photo + description | "your shop looks professional" |
| `03-storefront-cart.png` | phone — the confirm-order sheet: items, customer details, place-order | "customers build their own order" |
| `04-desk-orders.png` | desk — the orders table, 4 orders across every state (pending / confirmed / dispatched / paid) | "every order in one place", before/after vs chat-scroll |
| `05-desk-dashboard.png` | desk — populated dashboard: outstanding balance, to-dispatch, low stock, recent orders | "know what's owed and what's out at a glance" |
| `06-desk-order-detail.png` | desk — one order end to end: line items, payment breakdown, full activity timeline | "track it from pending to delivered and paid" |
| `07-desk-share.png` | desk — the share page: storefront link + QR code + settings | "share your link / print the QR for your counter" |
| `08-desk-accept.png` | desk — a pending storefront order with the Accept / Decline bar | "orders arrive as Pending — you accept them" |

---

## 7. What "working" looks like

- **Phase 0:** 5+ shops actively using it, 3 usable quotes, 1 flagship storefront
- **Month 1:** first paying customer, ~500 IG followers who are *sellers* (not
  founders), 10+ inbound DMs
- **Month 3:** ~20 paying shops (~$100 MRR — small, but proof the loop works),
  a repeatable "DM → onboard → pay" motion

At 20 paying shops you'll know if the content engine converts. If it does, pour
in more time. If it doesn't, the product / price / ICP is wrong — better learned
at $100 MRR than after a big launch.
