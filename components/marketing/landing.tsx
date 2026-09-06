import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { MarketingNav } from "@/components/marketing/nav";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { DashboardMock, PhoneStorefrontMock } from "@/components/marketing/mockups";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mkt-eyebrow text-[11px] text-accent">{children}</p>;
}

const STEPS = [
  {
    n: "01",
    title: "Add your products",
    body: "Name, price, a photo, stock if you track it. Takes a couple of minutes.",
  },
  {
    n: "02",
    title: "Share your storefront link",
    body: "One link (and a QR) for your bio, your status, your cards. Customers browse and build their order.",
  },
  {
    n: "03",
    title: "Orders land in your desk",
    body: "Each one arrives as Pending. Accept it and track it through delivery and payment — no more scrolling chats.",
  },
];

const FEATURES = [
  {
    title: "A storefront, not just a form",
    body: "Your catalog with photos, categories and a delivery note — on your colours. Customers pick, confirm, and send.",
  },
  {
    title: "Straight to your DMs",
    body: "WhatsApp opens pre-filled with the order. Instagram copies it and opens the chat. You reply where you already talk.",
  },
  {
    title: "One order pipeline",
    body: "Order, delivery and payment tracked separately — dispatched, delivered, partial, paid — so you always know what's owed and what's out.",
  },
  {
    title: "Customers & exports",
    body: "Every buyer saved with their history. Pull customers or orders to CSV whenever you want them.",
  },
  {
    title: "Stock that keeps count",
    body: "Confirmed orders draw down stock. Low-stock flags on the dashboard before you sell what you don't have.",
  },
  {
    title: "Built for one phone",
    body: "The whole desk works one-handed, mid-conversation. No laptop, no team required.",
  },
];

export function Landing() {
  return (
    <div className="mkt flex flex-col text-foreground">
      <MarketingNav />

      {/* Hero */}
      <section className="mkt-haze">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-ok" />
            For sellers on Instagram & WhatsApp
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-[2.75rem] leading-[1.03] sm:text-6xl">
            Your orders stop living in your <em>DMs</em>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
            {APP_NAME} gives you a mini storefront customers can order from, and a desk that
            tracks every order to delivery — all from your phone.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-xs font-bold uppercase tracking-[0.16em] text-accent-fg hover:bg-accent/90"
            >
              Start free — no card
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center justify-center rounded-md border border-line bg-card px-6 text-xs font-bold uppercase tracking-[0.16em] hover:border-accent/50"
            >
              See how it works
            </a>
          </div>
          <p className="mt-3 text-xs text-muted">14 days free. LKR 1,500/month after.</p>

          <div className="mx-auto mt-14 max-w-4xl">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* Channels strip */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 sm:flex-row sm:justify-between">
          <p className="mkt-eyebrow text-[11px] text-muted">
            Works with how Sri Lanka already sells
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted">
            <span>Instagram</span>
            <span>WhatsApp</span>
            <span>Facebook</span>
            <span>TikTok bio</span>
            <span>QR at the counter</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mkt-scroll">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
              From &ldquo;DM to order&rdquo; to &ldquo;delivered &amp; paid&rdquo;
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-line bg-card p-6">
                <span className="mkt-serif text-2xl text-accent">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Storefront showcase */}
      <section className="mkt-haze-soft border-y border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <div>
            <Eyebrow>Your mini storefront</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
              A link you can actually be <em>proud</em> to send
            </h2>
            <p className="mt-4 text-muted">
              Not a Google Form. A clean, branded shop — your photos, your categories, your
              accent colour and delivery terms. The customer confirms their order and sends it
              straight to your WhatsApp or Instagram.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-sm">
              {[
                "Customer picks items and confirms — no back-and-forth",
                "Order pre-fills WhatsApp / copies to Instagram",
                "Lands in your desk as a Pending order to accept",
              ].map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-ok">✓</span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <PhoneStorefrontMock />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mkt-scroll">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <Eyebrow>Features</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
              Everything you need to run orders — nothing you don&apos;t
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-line bg-card p-6">
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — PLACEHOLDER: replace with real quotes before launch */}
      <section className="mkt-haze-soft border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <Eyebrow>From early sellers</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
              Off the spreadsheet, off the stress
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              [
                "I used to lose orders in the chat when it got busy. Now every order is in one list and I just work down it.",
                "Home baker, Nugegoda",
              ],
              [
                "The link goes in my Instagram bio. People order without messaging me first, and I only step in to confirm.",
                "Thrift store, Kandy",
              ],
              [
                "Knowing what's unpaid at a glance changed how I chase money. That alone is worth it.",
                "Preloved fashion, Colombo",
              ],
            ].map(([quote, who]) => (
              <figure key={who} className="rounded-2xl border border-line bg-card p-6">
                <blockquote className="text-sm">&ldquo;{quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-xs font-medium text-muted">— {who}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mkt-scroll">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
              One simple plan to <em>start</em>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              Start free for 14 days. Keep going for LKR 1,500 a month. Bigger plans are on the
              way as you grow.
            </p>
          </div>
          <div className="mt-12">
            <Pricing />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mkt-scroll mkt-haze-soft border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">Questions, answered</h2>
          </div>
          <div className="mt-12">
            <Faq />
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="mkt-cta-band">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center text-white">
          <h2 className="text-[2rem] leading-[1.05] sm:text-[2.9rem]">
            Take your first order on {APP_NAME} <em>today</em>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/85">
            Set up your storefront in minutes. Free for 14 days, no card — you decide after.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-xs font-bold uppercase tracking-[0.16em] text-accent hover:bg-white/90"
          >
            Start free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-accent text-xs text-accent-fg">
              {APP_NAME.charAt(0)}
            </span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-ink">Log in</Link>
            <Link href="/signup" className="hover:text-ink">Start free</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
