/**
 * Outbound email over the Resend HTTP API (works on Cloudflare Workers — no
 * SMTP / nodemailer). With no RESEND_API_KEY the message is logged to the
 * server console so flows still work in local dev.
 *
 * Resend needs a verified sending domain for real deliverability; until then
 * you can send from `onboarding@resend.dev` (their shared test address).
 */
import { APP_NAME, appUrl } from "@/lib/constants";

type Mail = { to: string | string[]; subject: string; text: string; html?: string };

/**
 * Brand palette, matching the customer-facing "Trust Blue" marketing
 * palette (`.mkt` in app/globals.css) — these are inline because email
 * clients don't read CSS variables. Email clients also don't render
 * `next/font` or SVG reliably, so the logo is a static PNG served from
 * `public/brand/icon-512.png` (absolute URL — relative paths break in a
 * mail client) and the wordmark/eyebrow use a web-safe stack rather than
 * loading Geist or Plex Mono.
 *
 * Styled flat and document-like on purpose — editorial, not a rounded
 * "notification card" on a pastel page. Matches the "borders, not shadows;
 * mono uppercase micro-labels" language the rest of the product uses.
 */
const BRAND = {
  blue: "#1e40af",
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
};
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const SANS = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

/** Wraps a content fragment in the shared branded shell (eyebrow header + footer). */
function emailShell(eyebrow: string, bodyHtml: string): string {
  // The full lockup (icon + wordmark baked into one image), same asset as the
  // marketing footer — never render the icon next to a separately-coded
  // APP_NAME string as a fake lockup.
  const logoUrl = appUrl("/brand/lockup-allcaps-email.png");
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;font-family:${SANS};">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <tr><td style="height:3px;line-height:3px;font-size:0;background:${BRAND.blue};">&nbsp;</td></tr>
            <tr>
              <td style="padding:20px 2px 18px;border-bottom:1px solid ${BRAND.line};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="vertical-align:middle;">
                    <img src="${logoUrl}" width="86" height="22" alt="${APP_NAME}" style="display:block;">
                  </td>
                  <td align="right" style="vertical-align:middle;font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};">
                    ${eyebrow}
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 2px;color:${BRAND.ink};font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 2px 28px;border-top:1px solid ${BRAND.line};font-family:${MONO};font-size:10.5px;letter-spacing:0.04em;color:${BRAND.muted};">
                ${APP_NAME} · take orders from your DMs
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** A solid filled button, matching the app's Btn component (mono uppercase, tracked). */
function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 2px;"><tr>
<td style="background:${BRAND.blue};border-radius:6px;">
<a href="${href}" style="display:inline-block;padding:11px 20px;font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${label}</a>
</td></tr></table>`;
}

export async function sendEmail({ to, subject, text, html }: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? `${APP_NAME} <onboarding@resend.dev>`;
  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0) return;

  if (!key) {
    console.info(
      `\n[email:dev] to ${recipients.join(", ")}\nsubject: ${subject}\n${text}\n`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: recipients, subject, text, html: html ?? text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  await sendEmail({
    to,
    subject: `Reset your ${APP_NAME} password`,
    text: `Someone asked to reset the password for your ${APP_NAME} account.\n\nReset it here (expires in 1 hour):\n${url}\n\nIf this wasn't you, ignore this email — your password won't change.`,
    html: emailShell(
      "Password reset",
      `<p style="margin:0">Someone asked to reset the password for your <strong>${APP_NAME}</strong> account.</p>
${emailButton(url, "Reset password →")}
<p style="margin:14px 0 0;font-size:12.5px;color:${BRAND.muted}">This link expires in 1 hour. If this wasn't you, ignore this email — your password won't change.</p>`,
    ),
  });
}

/** Sent to the shop owner(s) when a customer places an order from the storefront. */
export async function sendNewOrderEmail(
  to: string | string[],
  o: {
    shopName: string;
    orderNumber: number;
    customerName: string;
    customerPhone: string;
    city?: string;
    paymentMethod?: string;
    currency: string;
    total: string;
    items: string[];
    note?: string;
    url: string;
  },
): Promise<void> {
  const lines = o.items.map((l) => `  • ${l}`).join("\n");
  await sendEmail({
    to,
    subject: `New order #${o.orderNumber} — ${o.customerName} (${o.currency} ${o.total})`,
    text: [
      `${o.customerName} placed order #${o.orderNumber} on your ${o.shopName} storefront.`,
      ``,
      lines,
      ``,
      `Total: ${o.currency} ${o.total}`,
      `Phone: ${o.customerPhone}`,
      o.city ? `City: ${o.city}` : null,
      o.paymentMethod ? `Payment: ${o.paymentMethod}` : null,
      o.note ? `Note: ${o.note}` : null,
      ``,
      `It's waiting in your desk as Pending — accept or decline it:`,
      o.url,
    ]
      .filter((x) => x !== null)
      .join("\n"),
    html: emailShell(
      `Order #${o.orderNumber}`,
      `<p style="margin:0 0 4px"><strong>${escapeHtml(o.customerName)}</strong> placed an order on your ${escapeHtml(o.shopName)} storefront.</p>
<p style="margin:0 0 18px;font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#b7791f">Pending</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.line};">
${o.items
  .map(
    (l) =>
      `<tr><td style="padding:9px 0;border-bottom:1px solid ${BRAND.line};font-size:13.5px;">${escapeHtml(l)}</td></tr>`,
  )
  .join("")}
<tr><td style="padding:12px 0 0;font-family:${MONO};font-size:15px;font-weight:600;">Total&nbsp; ${o.currency} ${escapeHtml(o.total)}</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:13px;color:${BRAND.muted};">
<tr><td style="padding:3px 0;width:72px;">Phone</td><td style="padding:3px 0;color:${BRAND.ink};">${escapeHtml(o.customerPhone)}</td></tr>
${o.city ? `<tr><td style="padding:3px 0;">City</td><td style="padding:3px 0;color:${BRAND.ink};">${escapeHtml(o.city)}</td></tr>` : ""}
${o.paymentMethod ? `<tr><td style="padding:3px 0;">Payment</td><td style="padding:3px 0;color:${BRAND.ink};">${escapeHtml(o.paymentMethod)}</td></tr>` : ""}
${o.note ? `<tr><td style="padding:3px 0;">Note</td><td style="padding:3px 0;color:${BRAND.ink};">${escapeHtml(o.note)}</td></tr>` : ""}
</table>
${emailButton(o.url, "Open in desk →")}`,
    ),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
