import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { MarketingNav } from "@/components/marketing/nav";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/reveal";
import { SOCIALS } from "@/components/marketing/social-logos";
import {
  DashboardMock,
  PhoneStorefrontMock,
  MiniPipeline,
  MiniChannels,
  MiniStock,
  MiniExport,
} from "@/components/marketing/mockups";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mkt-eyebrow mkt-amber text-[11px]">{children}</p>;
}

const STEPS = [
  {
    n: "01",
    title: "Add your products",
    body: "Name, price, a photo, stock if you track it. A couple of minutes and your catalog is live.",
  },
  {
    n: "02",
    title: "Share your storefront link",
    body: "One link and a QR for your bio, your status, your cards. Customers browse and build their order.",
  },
  {
    n: "03",
    title: "Orders land in your desk",
    body: "Each one arrives as Pending. Accept it, then track it through delivery and payment — no scrolling chats.",
  },
];

export function Landing() {
  return (
    <div className="mkt flex flex-col text-foreground">
      <MarketingNav />

      {/* Hero — deep blue bleeding into the page */}
      <section className="mkt-hero -mt-[68px] px-5 pb-24 pt-32 text-center sm:pt-40">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="mkt-eyebrow text-[12px] text-white/80">
              ◆ &nbsp;Storefront &nbsp;+&nbsp; order desk
            </p>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="mx-auto mt-6 max-w-2xl text-white [text-wrap:balance]">
              <span className="block text-[2.9rem] leading-[1.02] sm:text-[4.25rem]">
                Take the order.
              </span>
              <span className="mkt-italic block text-[2.9rem] leading-[1.05] sm:text-[4.25rem]">
                Skip the chaos.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-white/85 sm:text-base">
              {APP_NAME} gives you a mini storefront your customers order from, and a desk
              that tracks every order — pending, dispatched, paid — straight from your phone.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-9 flex flex-col items-center gap-3">
              <Link
                href="/signup"
                className="mkt-btn mkt-btn-light h-12 px-7 text-[12px] uppercase tracking-[0.16em]"
              >
                Start free — no card
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-white/70">
                <span>14-day free trial</span>
                <span className="text-white/30">•</span>
                <span>No card</span>
                <span className="text-white/30">•</span>
                <span>Cancel anytime</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* floating, tilted app mockup that fades into the page */}
        <Reveal delay={120} className="mx-auto mt-16 max-w-4xl">
          <div className="mkt-hero-fade mkt-tilt">
            <div className="mkt-float">
              <DashboardMock />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Channels strip */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-5 py-9 sm:flex-row sm:justify-between">
          <p className="mkt-eyebrow text-[11px] text-muted">Works with how you already sell</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            {SOCIALS.map(({ name, Logo }) => (
              <span key={name} className="flex items-center gap-2 text-sm font-medium text-ink">
                <Logo className="size-6" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mkt-scroll">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal className="text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
              From &ldquo;DM to order&rdquo; to &ldquo;delivered &amp; paid&rdquo;
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="mkt-card h-full rounded-2xl border border-line bg-card p-6">
                  <span className="mkt-serif mkt-amber text-3xl">{s.n}</span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Storefront showcase */}
      <section className="mkt-haze-soft border-y border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-2">
          <Reveal>
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
                  <span className="text-accent">✓</span>
                  {x}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100}>
            <div className="mkt-float">
              <PhoneStorefrontMock />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features — bento with live-ish visuals */}
      <section id="features" className="mkt-scroll">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal className="text-center">
            <Eyebrow>Features</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
              Everything to run orders — <em>nothing</em> you don&apos;t
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <Reveal className="md:col-span-2">
              <FeatureCard
                title="One order pipeline"
                body="Order, delivery and payment tracked on separate axes — so you always know what's out and what's owed."
              >
                <MiniPipeline />
              </FeatureCard>
            </Reveal>
            <Reveal delay={90}>
              <FeatureCard
                title="Straight to your DMs"
                body="WhatsApp opens pre-filled. Instagram copies the order and opens the chat."
              >
                <MiniChannels />
              </FeatureCard>
            </Reveal>
            <Reveal delay={60}>
              <FeatureCard
                title="Stock that keeps count"
                body="Confirmed orders draw down stock. Low-stock flags before you oversell."
              >
                <MiniStock />
              </FeatureCard>
            </Reveal>
            <Reveal delay={120} className="md:col-span-2">
              <FeatureCard
                title="Customers & exports"
                body="Every buyer saved with their history. Pull customers or orders to CSV whenever you want them."
              >
                <MiniExport />
              </FeatureCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mkt-scroll mkt-haze-soft border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal className="text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
              One simple plan to <em>start</em>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              Start free for 14 days. Keep going for LKR 1,500 a month. Bigger plans are on the
              way as you grow.
            </p>
          </Reveal>
          <Reveal delay={80} className="mt-14 block">
            <Pricing />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mkt-scroll">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal className="text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">Questions, answered</h2>
          </Reveal>
          <Reveal delay={80} className="mt-14 block">
            <Faq />
          </Reveal>
        </div>
      </section>

      {/* CTA band */}
      <section className="mkt-cta-band">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center text-white">
          <Reveal>
            <h2 className="text-[2rem] leading-[1.05] sm:text-[2.9rem]">
              Take your first order on {APP_NAME} <em>today</em>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/85">
              Set up your storefront in minutes. Free for 14 days, no card — you decide after.
            </p>
            <Link
              href="/signup"
              className="mkt-btn mkt-btn-light mt-8 h-12 px-7 text-[12px] uppercase tracking-[0.16em]"
            >
              Start free
            </Link>
          </Reveal>
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

function FeatureCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mkt-card flex h-full flex-col rounded-2xl border border-line bg-card p-6">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <div className="mt-5 rounded-xl border border-line bg-surface/60 p-3">{children}</div>
    </div>
  );
}
