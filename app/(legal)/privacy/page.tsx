import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Privacy Policy · ${APP_NAME}` };

// ⚠️ Starting template — have a lawyer review and fill the [bracketed] fields
// before public launch.

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-muted">
        Last updated: <strong>[effective date]</strong>. This explains what{" "}
        <strong>[Company legal name]</strong> (&ldquo;we&rdquo;) does with personal data in {APP_NAME}
        (the &ldquo;Service&rdquo;).
      </p>

      <h2>1. Who this covers</h2>
      <p>
        This policy is for people who hold a {APP_NAME} account. It also describes how we handle
        data about <em>your</em> customers that you enter into the Service — for that data you are
        the controller and we act on your instructions.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> your email address, name (optional), and a securely hashed
          password.
        </li>
        <li>
          <strong>Business:</strong> business name, WhatsApp number, currency and delivery settings,
          your product catalog and photos.
        </li>
        <li>
          <strong>Order data you enter:</strong> your customers&apos; names, phone numbers, delivery
          addresses, and the items, notes, and payment status of their orders.
        </li>
        <li>
          <strong>Automatic:</strong> basic log data (IP address, request time, error traces) used
          for security, abuse prevention, and debugging.
        </li>
      </ul>
      <p>We do not use tracking or advertising cookies.</p>

      <h2>3. How we use it</h2>
      <ul>
        <li>To provide and support the Service.</li>
        <li>To secure the Service and prevent abuse (including rate limiting).</li>
        <li>To bill you and manage your subscription.</li>
        <li>To improve the product, using aggregated or de-identified data.</li>
      </ul>
      <p>
        We only process your customers&apos; personal data to run the Service for you. We do not use
        it for our own purposes and we never sell personal data.
      </p>

      <h2>4. Who we share it with</h2>
      <p>We use a small number of service providers, each bound to protect the data:</p>
      <ul>
        <li><strong>Neon</strong> — managed Postgres database hosting.</li>
        <li><strong>Cloudflare</strong> — application hosting, CDN, and object storage (product photos).</li>
        <li><strong>Resend</strong> — transactional email (e.g. password resets).</li>
        <li><strong>[Payment provider]</strong> — subscription billing (added when billing launches; card details are handled by them, not us).</li>
      </ul>
      <p>We may also disclose data if required by law or to protect our rights or users&apos; safety.</p>

      <h2>5. Where data is stored</h2>
      <p>
        Data is stored in <strong>[Neon region — e.g. AWS ap-south-1 / Mumbai]</strong>. Backups are
        stored with the providers above.
      </p>

      <h2>6. How long we keep it</h2>
      <p>
        We keep account and business data while your account is active. After cancellation we keep
        it for 90 days (so you can reactivate), then delete it. Automated backups rotate out within
        [30–90] days. Log data is kept for up to 12 months.
      </p>

      <h2>7. Security</h2>
      <ul>
        <li>All traffic is encrypted in transit (HTTPS).</li>
        <li>Passwords are hashed (bcrypt); we can&apos;t see them.</li>
        <li>Each business&apos;s data is isolated at the database level (row-level security).</li>
        <li>Internal access is limited and audited.</li>
      </ul>

      <h2>8. Your rights</h2>
      <p>
        You can access, correct, export (self-serve CSV export of customers, products, and orders),
        or delete your data. To delete your account entirely, contact us at{" "}
        <strong>[contact email]</strong>.
      </p>
      <p>
        If one of <em>your</em> customers asks us to access or delete their data, we&apos;ll pass the
        request to you (the business responsible for it) and help you action it.
      </p>

      <h2>9. Children</h2>
      <p>The Service is for businesses and is not directed at anyone under 18.</p>

      <h2>10. Changes</h2>
      <p>We&apos;ll post changes here and, if material, notify you by email or in the app.</p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions or requests: <strong>[contact email]</strong>.
      </p>
    </>
  );
}
