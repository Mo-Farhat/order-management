import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Terms of Service · ${APP_NAME}` };

// ⚠️ Starting template — have a lawyer review and fill the [bracketed] fields
// before public launch. Placeholders: legal entity, jurisdiction, contact.

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-muted">
        Last updated: <strong>[effective date]</strong>. These terms are between you and{" "}
        <strong>[Company legal name]</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;), the operator of {APP_NAME}
        (the &ldquo;Service&rdquo;).
      </p>

      <h2>1. Acceptance</h2>
      <p>
        By creating an account or using the Service you agree to these terms and to our{" "}
        <a href="/privacy">Privacy Policy</a>. If you don&apos;t agree, don&apos;t use the Service.
      </p>

      <h2>2. What the Service does</h2>
      <p>
        {APP_NAME} is a tool for small businesses to keep a product catalog, take and track
        orders, and share a public catalog link that hands off to WhatsApp. The Service does{" "}
        <strong>not</strong> process payments, hold funds, or act as a marketplace — money is
        collected by you, directly from your customers, off-platform.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>You must give accurate information and keep your login credentials secure.</li>
        <li>You&apos;re responsible for everything done under your account.</li>
        <li>One account represents one business. You must be 18 or older.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>sell goods or services that are illegal where you or your customers are located;</li>
        <li>send spam, or share a catalog link for anything other than your own business;</li>
        <li>upload malware, probe or disrupt the Service, or circumvent limits or security;</li>
        <li>resell, sublicense, or white-label the Service without our written permission.</li>
      </ul>

      <h2>5. Your content and your customers&apos; data</h2>
      <p>
        You keep ownership of the product information, orders, and customer details you put into
        the Service (&ldquo;Your Content&rdquo;). You grant us the limited licence needed to host and
        operate the Service for you.
      </p>
      <p>
        For personal data about <em>your</em> customers, <strong>you are the data controller</strong>{" "}
        and we are your processor, acting on your instructions (see the Privacy Policy). You confirm
        you have the right to collect and share that data and that you meet your own legal
        obligations to your customers.
      </p>

      <h2>6. Fees</h2>
      <ul>
        <li>New accounts get a 14-day free trial. After that, continued use requires a paid subscription.</li>
        <li>Fees are billed in advance for each period and are non-refundable except where required by law.</li>
        <li>Prices are exclusive of any applicable taxes, which you are responsible for.</li>
        <li>We may change pricing with at least 30 days&apos; notice before your next renewal.</li>
      </ul>

      <h2>7. Suspension and termination</h2>
      <p>
        You can cancel any time from account settings. We may suspend or terminate your account for
        breach of these terms or non-payment. On non-payment your account goes read-only, and if it
        stays unpaid we may delete your data after 90 days (see the Privacy Policy for retention).
      </p>

      <h2>8. Availability and &ldquo;as is&rdquo;</h2>
      <p>
        We work to keep the Service available and reliable but provide it &ldquo;as is&rdquo;, without
        warranties, and without a formal uptime commitment at this stage. We may change or
        discontinue features.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the extent permitted by law, our total liability arising from the Service is limited to
        the fees you paid us in the 12 months before the claim. We are not liable for indirect,
        incidental, or consequential losses, or for lost profits, revenue, data, or goodwill.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms. If a change is material we&apos;ll give reasonable notice by
        email or in the app. Continued use after a change means you accept it.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws of <strong>[jurisdiction — e.g. Sri Lanka]</strong>, and
        disputes are subject to the courts of that jurisdiction.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms: <strong>[contact email]</strong>.
      </p>
    </>
  );
}
