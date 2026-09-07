/**
 * One-off: walks the whole onboarding + first-order flow with Playwright,
 * puts a red box around the primary element on each screen, and writes
 * screenshots to docs/images/. Creates a throwaway tenant and deletes it at
 * the end. Not part of the app.
 *
 *   npx playwright install chromium     # once
 *   npm run build && npm run start      # in another terminal, port 3000
 *   npm run guide
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import path from "node:path";
import { chromium, type Locator, type Page } from "playwright";

const BASE = process.env.GUIDE_BASE ?? "http://localhost:3000";
const IMG_DIR = path.join(process.cwd(), "docs/images");

const stamp = Date.now();
const CREDS = {
  email: `guide+${stamp}@sfdesk-demo.test`,
  password: "guidedemo12345",
  business: "Harbor & Co.",
  whatsapp: "+1 555 210 4477",
  instagram: "harborandco",
};

async function prep(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content:
      "nextjs-portal,#__next-build-watcher,[data-nextjs-toast],[data-nextjs-dialog-overlay]{display:none!important}",
  });
  await page.waitForTimeout(300);
}

async function box(page: Page, locator: Locator) {
  const el = locator.first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(150);
  const bb = await el.boundingBox().catch(() => null);
  if (!bb) {
    console.warn("  (target not found — plain screenshot)");
    return;
  }
  await page.evaluate((bb) => {
    document.querySelectorAll(".__g").forEach((e) => e.remove());
    const pad = 6;
    const d = document.createElement("div");
    d.className = "__g";
    Object.assign(d.style, {
      position: "absolute",
      left: `${bb.x - pad}px`,
      top: `${bb.y - pad}px`,
      width: `${bb.width + pad * 2}px`,
      height: `${bb.height + pad * 2}px`,
      border: "3px solid #e11d48",
      borderRadius: "10px",
      boxShadow: "0 0 0 5px rgba(225,29,72,0.18), 0 0 30px rgba(225,29,72,0.4)",
      zIndex: "2147483647",
      pointerEvents: "none",
    } as unknown as CSSStyleDeclaration);
    document.body.appendChild(d);
  }, bb);
  await page.waitForTimeout(120);
}

async function clearBox(page: Page) {
  await page.evaluate(() => document.querySelectorAll(".__g").forEach((e) => e.remove()));
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(IMG_DIR, name) });
  console.log("  ✓", name);
}

async function main() {
  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage({
    viewport: { width: 1360, height: 900 },
    deviceScaleFactor: 2,
  });
  page.on("pageerror", (e) => console.warn("  [pageerror]", e.message));

  // 1 — Registration
  console.log("1. registration");
  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await prep(page);
  await page.fill('input[name="email"]', CREDS.email);
  await page.fill('input[name="password"]', CREDS.password);
  await page.fill('input[name="businessName"]', CREDS.business);
  await page.fill('input[name="whatsappNumber"]', CREDS.whatsapp);
  await page.fill('input[name="instagramHandle"]', CREDS.instagram);
  await box(page, page.getByRole("button", { name: /create my storefront/i }));
  await shot(page, "01-registration.png");

  await clearBox(page);
  await page.getByRole("button", { name: /create my storefront/i }).click();
  await page.waitForURL("**/desk", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await prep(page);

  // 2 — Dashboard overview
  console.log("2. dashboard");
  await box(page, page.locator('[data-guide="getting-started"]'));
  await shot(page, "02-dashboard.png");

  // 3 — Add your first product
  console.log("3. add product");
  await clearBox(page);
  await page.goto(`${BASE}/desk/catalog/new`, { waitUntil: "networkidle" });
  await prep(page);
  await page.fill('input[name="name"]', "Harbor Tote — Natural");
  await page.fill('input[name="price"]', "4200");
  const stock = page.locator('input[name="stockQty"]');
  if (await stock.count()) await stock.first().fill("25");
  await box(page, page.getByRole("button", { name: /save product/i }));
  await shot(page, "03-add-product.png");

  await clearBox(page);
  await page.getByRole("button", { name: /save product/i }).click();
  await page.waitForURL(/\/desk\/catalog(\/|\?|$)/, { timeout: 25_000 });
  await page.getByText("Harbor Tote").first().waitFor({ timeout: 10_000 });

  // 4 — Share your storefront
  console.log("4. share storefront");
  await page.goto(`${BASE}/desk/share`, { waitUntil: "networkidle" });
  await prep(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  const linkUrl = (await page.locator("code").first().textContent())?.trim() ?? "";
  await box(page, page.locator("section", { has: page.locator("code") }).first());
  await shot(page, "04-share.png");

  // 5 — What the customer sees
  console.log("5. storefront", linkUrl);
  await page.setViewportSize({ width: 430, height: 920 });
  await page.goto(linkUrl, { waitUntil: "networkidle" });
  await prep(page);
  const addBtn = page.locator("main button", { hasText: /^Add$/ }).first();
  await addBtn.waitFor({ state: "visible", timeout: 10_000 });
  await box(page, addBtn);
  await shot(page, "05-storefront.png");

  // 6 — Customer places the order
  console.log("6. customer checkout");
  await clearBox(page);
  await addBtn.click();
  await page.locator("header button", { hasText: "Order" }).first().click();
  await page.getByRole("button", { name: /^Continue$/ }).click();
  await page.locator('label:has-text("Your name") input').fill("Jane Doe");
  await page.locator('label:has-text("Phone") input').fill("+1 555 987 6543");
  await page
    .locator('label:has-text("Delivery address") input')
    .fill("41 Coburg Lane, Apt 2, Springfield");
  await page.getByRole("button", { name: /review order/i }).click();
  await page.getByRole("button", { name: /confirm & place order/i }).click();
  await page.getByText(/Order .* placed/i).waitFor({ timeout: 15_000 });
  await prep(page);
  await box(page, page.getByRole("link", { name: /send on whatsapp/i }));
  await shot(page, "06-customer-checkout.png");

  await page.setViewportSize({ width: 1360, height: 900 });

  // 7 — The order lands in your desk
  console.log("7. order in desk");
  await page.goto(`${BASE}/desk/orders`, { waitUntil: "networkidle" });
  await prep(page);
  await box(page, page.getByRole("button", { name: /^Review$/ }));
  await shot(page, "07-order-pending.png");

  // 8 — Accept it
  console.log("8. accept order");
  const { db } = await import("@/db");
  const { orders, memberships, users } = await import("@/db/schema");
  const { eq, and } = await import("drizzle-orm");
  const u = await db.query.users.findFirst({ where: eq(users.email, CREDS.email) });
  const m = u
    ? await db.query.memberships.findFirst({ where: eq(memberships.userId, u.id) })
    : null;
  const pendingOrder = m
    ? await db.query.orders.findFirst({
        where: and(eq(orders.tenantId, m.tenantId), eq(orders.status, "pending")),
      })
    : null;
  if (pendingOrder) {
    await page.goto(`${BASE}/desk/orders/${pendingOrder.id}`, { waitUntil: "networkidle" });
    await prep(page);
    await box(page, page.getByRole("button", { name: /accept order/i }));
    await shot(page, "08-accept-order.png");
  } else {
    console.warn("  no pending order found — skipped 08");
  }

  await clearBox(page);
  await browser.close();
}

async function cleanup() {
  console.log("cleanup");
  const { db } = await import("@/db");
  const { users, memberships, tenants } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const u = await db.query.users.findFirst({ where: eq(users.email, CREDS.email) });
  if (u) {
    const m = await db.query.memberships.findFirst({ where: eq(memberships.userId, u.id) });
    if (m) await db.delete(tenants).where(eq(tenants.id, m.tenantId)); // cascades
    await db.delete(users).where(eq(users.id, u.id));
    console.log("  ✓ removed demo tenant + user");
  }
}

(async () => {
  let code = 0;
  try {
    await main();
  } catch (err) {
    console.error(err);
    code = 1;
  } finally {
    await cleanup().catch((e) => console.error("cleanup failed", e));
  }
  console.log(code ? "failed" : "done");
  process.exit(code);
})();
