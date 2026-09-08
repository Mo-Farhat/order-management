/**
 * Marketing screenshot pack. Spins up a realistic demo boutique ("Marlowe
 * Studio"), drives the real app with Playwright, writes clean (un-annotated)
 * high-res PNGs to docs/marketing/screenshots/, then deletes the demo data.
 *
 *   npx playwright install chromium                        # once
 *   STORAGE_PUBLIC_BASE_URL=https://images.unsplash.com npm run dev   # other terminal
 *   npm run marketing
 *
 * The STORAGE_PUBLIC_BASE_URL override makes product-photo URLs resolve to
 * Unsplash for the run (real storage isn't wired locally).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

// Neuter `server-only` — this script legitimately calls the server libs from a
// plain node process, outside Next's server bundle.
import { createRequire } from "node:module";
const _req = createRequire(import.meta.url);
try {
  const id = _req.resolve("server-only");
  // @ts-expect-error - internal
  _req.cache[id] = { id, filename: id, loaded: true, exports: {} };
} catch {
  /* not installed — fine */
}

import path from "node:path";
import { chromium, type Page } from "playwright";

const BASE = process.env.GUIDE_BASE ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "docs/marketing/screenshots");
const stamp = Date.now();

const CREDS = {
  email: `marketing+${stamp}@sfdesk-demo.test`,
  password: "marketingdemo12345",
};

const PHOTOS = [
  "photo-1556905055-8f358a7a47b2",
  "photo-1521572163474-6864f9cf17ab",
  "photo-1594633312681-425c7b97ccd1",
  "photo-1434389677669-e08b4cac3105",
  "photo-1630329273801-8f629dba0a72",
  "photo-1523381210434-271e8be1f52b",
].map((id) => `${id}?auto=format&fit=crop&w=900&h=900&q=75`);

const PRODUCTS = [
  { name: "Merino Wool Crewneck", price: "8900", category: "Knitwear", stockQty: 14,
    description: "Fine-gauge merino in a classic crew. Breathable, holds its shape, machine-washable cold. Unisex fit — size down for a trimmer look." },
  { name: "Cotton Twill Overshirt", price: "6400", category: "Shirts", stockQty: 22,
    description: "Mid-weight brushed twill that works open over a tee or buttoned as a light jacket. Chest and side pockets, corozo buttons." },
  { name: "Straight-Leg Selvedge Denim", price: "12500", category: "Denim", stockQty: 9,
    description: "13.5oz raw selvedge, straight through the leg with a mid rise. Wears in fast — expect honest fades in 3–4 months." },
  { name: "Wool-Blend Overcoat", price: "24000", category: "Outerwear", stockQty: 4,
    description: "Unstructured single-breasted coat in a wool-cashmere blend. Fully lined, welt pockets, falls just above the knee." },
  { name: "Cable-Knit Cardigan", price: "11200", category: "Knitwear", stockQty: 7,
    description: "Chunky hand-framed cable knit with a shawl collar and horn buttons. Deep enough to layer over a hoodie." },
  { name: "Boxy Linen Shirt", price: "6800", category: "Shirts", stockQty: 30,
    description: "100% washed European linen, cut boxy with a camp collar. Gets softer every wash. Runs relaxed." },
];

async function prep(page: Page) {
  // wait out any loading.tsx skeleton
  await page
    .locator('.animate-pulse')
    .first()
    .waitFor({ state: "detached", timeout: 15_000 })
    .catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      nextjs-portal,#__next-build-watcher,[data-nextjs-toast],[data-nextjs-dialog-overlay]{display:none!important}
      /* blank out the demo account email in the desk sidebar footer */
      aside .border-t.border-line p.truncate{color:transparent!important}
    `,
  });
  await page.waitForTimeout(450);
}

async function waitContent(page: Page, text: string | RegExp) {
  await page.getByText(text).first().waitFor({ timeout: 15_000 }).catch(() => {});
}

async function waitImages(page: Page) {
  await page
    .waitForFunction(
      () => {
        const imgs = [...document.querySelectorAll("main img")];
        return imgs.length > 0 && imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0);
      },
      { timeout: 15_000 },
    )
    .catch(() => {});
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("  ✓", name);
}

async function seed() {
  const { pooledDb } = await import("@/db/tenant");
  const { db } = await import("@/db");
  const { users, tenants, memberships, products, productPhotos, stockMovements } =
    await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const { hashPassword } = await import("@/lib/password");
  const { resolveSlug, trialEndsAt } = await import("@/lib/provisioning");
  const { createStorefrontOrder, acceptStorefrontOrder, setDeliveryStatus, updatePayment, setOrderStatus } =
    await import("@/lib/orders");

  const hashedPassword = await hashPassword(CREDS.password);
  const slug = await resolveSlug("Marlowe Studio");

  const { tenantId, userId } = await pooledDb().transaction(async (tx) => {
    const [u] = await tx
      .insert(users)
      .values({ email: CREDS.email, hashedPassword, passwordChangedAt: new Date() })
      .returning({ id: users.id });
    const [t] = await tx
      .insert(tenants)
      .values({
        name: "Marlowe Studio",
        slug,
        whatsappNumber: "+1 555 240 1180",
        instagramHandle: "marlowestudio",
        currency: "LKR",
        accentColor: "#1e40af",
        sharePolicyText:
          "Island-wide delivery in 2–3 working days. Bank transfer or cash on delivery. DM us to arrange a fitting.",
        trialEndsAt: trialEndsAt(),
      })
      .returning({ id: tenants.id });
    await tx.insert(memberships).values({ userId: u.id, tenantId: t.id, role: "owner" });

    for (let i = 0; i < PRODUCTS.length; i++) {
      const p = PRODUCTS[i];
      const [row] = await tx
        .insert(products)
        .values({
          tenantId: t.id,
          name: p.name,
          price: p.price,
          category: p.category,
          description: p.description,
          stockQty: p.stockQty,
          lowStockThreshold: 5,
        })
        .returning({ id: products.id });
      await tx.insert(productPhotos).values({ tenantId: t.id, productId: row.id, key: PHOTOS[i], sortOrder: 0 });
      await tx.insert(stockMovements).values({
        tenantId: t.id,
        productId: row.id,
        delta: p.stockQty,
        balanceAfter: p.stockQty,
        reason: "initial",
        actorUserId: u.id,
      });
    }
    return { tenantId: t.id, userId: u.id };
  });

  const prod = await db.select().from(products).where(eq(products.tenantId, tenantId));
  const pid = (name: string) => prod.find((p) => p.name.startsWith(name))!.id;

  const ctx = {
    userId,
    email: CREDS.email,
    tenantId,
    tenantSlug: slug,
    role: "owner" as const,
  };

  // 2 pending (fresh storefront orders awaiting review)
  await createStorefrontOrder(tenantId, {
    customerName: "Jane Doe",
    customerPhone: "+1 555 981 2210",
    deliveryAddress: "27 Alder Street, Apt 4, Riverside",
    items: [{ productId: pid("Merino"), quantity: 1 }, { productId: pid("Boxy"), quantity: 2 }],
    note: "Please gift-wrap the scarf.",
  });
  await createStorefrontOrder(tenantId, {
    customerName: "Chris Bennett",
    customerPhone: "+1 555 604 7788",
    deliveryAddress: "9 Kestrel Court, Northgate",
    items: [{ productId: pid("Straight-Leg"), quantity: 1 }],
  });

  // 1 confirmed + dispatched + partly paid
  const o3 = await createStorefrontOrder(tenantId, {
    customerName: "Priya Anand",
    customerPhone: "+1 555 220 9043",
    deliveryAddress: "154 Bramble Lane, Eastwick",
    items: [{ productId: pid("Wool-Blend"), quantity: 1 }],
  });
  await acceptStorefrontOrder(ctx, o3.id);
  await setDeliveryStatus(ctx, o3.id, "dispatched");
  await updatePayment(ctx, o3.id, "partial", "12000");

  // 1 completed + delivered + paid
  const o4 = await createStorefrontOrder(tenantId, {
    customerName: "Marco Reyes",
    customerPhone: "+1 555 771 3320",
    deliveryAddress: "3 Wharf Road, Southbank",
    items: [{ productId: pid("Cotton Twill"), quantity: 2 }, { productId: pid("Cable-Knit"), quantity: 1 }],
  });
  await acceptStorefrontOrder(ctx, o4.id);
  await setDeliveryStatus(ctx, o4.id, "delivered");
  await updatePayment(ctx, o4.id, "paid", "24000");
  await setOrderStatus(ctx, o4.id, "completed");

  return { slug, pendingOrderId: (await db.select().from(products)) && o3.id };
}

async function cleanup() {
  const { db } = await import("@/db");
  const { users, memberships, tenants } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const u = await db.query.users.findFirst({ where: eq(users.email, CREDS.email) });
  if (u) {
    const m = await db.query.memberships.findFirst({ where: eq(memberships.userId, u.id) });
    if (m) await db.delete(tenants).where(eq(tenants.id, m.tenantId));
    await db.delete(users).where(eq(users.id, u.id));
    console.log("  ✓ removed demo tenant + user");
  }
}

async function run() {
  console.log("seeding demo boutique…");
  const { slug } = await seed();
  const storeUrl = `${BASE}/s/${slug}`;

  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.warn("  [pageerror]", e.message));

  // log in
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await prep(page);
  await page.fill('input[name="email"]', CREDS.email);
  await page.fill('input[name="password"]', CREDS.password);
  await Promise.all([
    page.waitForURL(/\/desk(\/|$|\?)/, { timeout: 30_000 }),
    page.getByRole("button", { name: /log in/i }).click(),
  ]);
  await page.waitForLoadState("networkidle");

  // ---- desk (desktop) ----
  console.log("desk shots…");
  await page.goto(`${BASE}/desk`, { waitUntil: "networkidle" });
  await waitContent(page, "To dispatch");
  await prep(page);
  await shot(page, "05-desk-dashboard.png");

  await page.goto(`${BASE}/desk/orders`, { waitUntil: "networkidle" });
  await waitContent(page, /of 4/);
  await prep(page);
  await shot(page, "04-desk-orders.png");

  await page.goto(`${BASE}/desk/share`, { waitUntil: "networkidle" });
  await waitContent(page, "Your link");
  await prep(page);
  await shot(page, "07-desk-share.png");

  // an order detail — grab the first row's id from the orders page
  await page.goto(`${BASE}/desk/orders`, { waitUntil: "networkidle" });
  await prep(page);
  const { db } = await import("@/db");
  const { orders, tenants, memberships, users } = await import("@/db/schema");
  const { eq, and, desc } = await import("drizzle-orm");
  const u = await db.query.users.findFirst({ where: eq(users.email, CREDS.email) });
  const m = await db.query.memberships.findFirst({ where: eq(memberships.userId, u!.id) });
  const paid = await db.query.orders.findFirst({
    where: and(eq(orders.tenantId, m!.tenantId), eq(orders.status, "completed")),
  });
  const pending = await db.query.orders.findFirst({
    where: and(eq(orders.tenantId, m!.tenantId), eq(orders.status, "pending")),
    orderBy: desc(orders.createdAt),
  });
  if (paid) {
    await page.goto(`${BASE}/desk/orders/${paid.id}`, { waitUntil: "networkidle" });
    await waitContent(page, "Order #");
    await prep(page);
    await shot(page, "06-desk-order-detail.png");
  }
  if (pending) {
    await page.goto(`${BASE}/desk/orders/${pending.id}`, { waitUntil: "networkidle" });
    await waitContent(page, /awaiting your review/i);
    await prep(page);
    await shot(page, "08-desk-accept.png");
  }

  // ---- storefront (phone) ----
  console.log("storefront shots…");
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(storeUrl, { waitUntil: "networkidle" });
  await prep(page);
  await waitImages(page);
  await shot(page, "01-storefront.png");

  {
    const href = await page.locator("main a[href*='/s/']").first().getAttribute("href");
    await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
    await prep(page);
    await waitImages(page);
    await shot(page, "02-storefront-product.png");
    await page.goto(storeUrl, { waitUntil: "networkidle" });
    await prep(page);
    await waitImages(page);
  }

  // build a cart and open the review step
  await page.goto(storeUrl, { waitUntil: "networkidle" });
  await prep(page);
  await waitImages(page);
  const addBtns = page.locator("main button", { hasText: /^Add$/ });
  await addBtns.nth(0).click();
  await addBtns.nth(1).click();
  await page.locator("header button", { hasText: "Order" }).first().click();
  await page.getByRole("button", { name: /^Continue$/ }).click();
  await page.locator('label:has-text("Your name") input').fill("Jane Doe");
  await page.locator('label:has-text("Phone") input').fill("+1 555 981 2210");
  await page.locator('label:has-text("Delivery address") input').fill("27 Alder Street, Apt 4, Riverside");
  await page.getByRole("button", { name: /review order/i }).click();
  await page.waitForTimeout(400);
  await shot(page, "03-storefront-cart.png");

  await browser.close();
}

(async () => {
  let code = 0;
  try {
    await run();
  } catch (err) {
    console.error(err);
    code = 1;
  } finally {
    await cleanup().catch((e) => console.error("cleanup failed", e));
  }
  console.log(code ? "failed" : "done");
  process.exit(code);
})();
