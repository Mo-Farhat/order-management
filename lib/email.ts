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
 * mail client) and the wordmark is a web-safe bold sans, approximating
 * Geist rather than loading it.
 */
const BRAND = {
  blue: "#1e40af",
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  bg: "#f8fafc",
};

/** Wraps a content fragment in the shared branded shell (logo header + footer). */
function emailShell(bodyHtml: string): string {
  const logoUrl = appUrl("/brand/icon-512.png");
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.bg};-webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid ${BRAND.line};border-radius:12px;">
            <tr>
              <td style="padding:22px 28px;border-bottom:1px solid ${BRAND.line};">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                  <td style="padding-right:9px;">
                    <img src="${logoUrl}" width="26" height="26" alt="" style="display:block;border-radius:6px;">
                  </td>
                  <td style="font-size:17px;font-weight:700;letter-spacing:-0.02em;color:${BRAND.ink};">
                    ${APP_NAME}
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:${BRAND.ink};font-size:14px;line-height:1.65;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid ${BRAND.line};color:${BRAND.muted};font-size:12px;">
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
    html: emailShell(`<p style="margin:0 0 16px">Someone asked to reset the password for your <strong>${APP_NAME}</strong> account.</p>
<p style="margin:0 0 16px"><a href="${url}" style="color:${BRAND.blue};font-weight:600;text-decoration:none">Reset your password →</a><br>
<span style="color:${BRAND.muted};font-size:13px">This link expires in 1 hour.</span></p>
<p style="margin:0;color:${BRAND.muted};font-size:13px">If this wasn't you, ignore this email — your password won't change.</p>`),
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
    html: emailShell(`<p style="margin:0 0 16px"><strong>${escapeHtml(o.customerName)}</strong> placed order <strong>#${o.orderNumber}</strong> on your ${escapeHtml(o.shopName)} storefront.</p>
<ul style="margin:0 0 16px;padding-left:20px">${o.items.map((l) => `<li style="margin-bottom:4px">${escapeHtml(l)}</li>`).join("")}</ul>
<p style="margin:0 0 16px;border-top:1px solid ${BRAND.line};padding-top:14px">
<strong>Total: ${o.currency} ${escapeHtml(o.total)}</strong><br>
Phone: ${escapeHtml(o.customerPhone)}${o.city ? `<br>City: ${escapeHtml(o.city)}` : ""}${o.paymentMethod ? `<br>Payment: ${escapeHtml(o.paymentMethod)}` : ""}${o.note ? `<br>Note: ${escapeHtml(o.note)}` : ""}
</p>
<p style="margin:0">It's waiting in your desk as <strong style="color:#b7791f">Pending</strong>.<br>
<a href="${o.url}" style="color:${BRAND.blue};font-weight:600;text-decoration:none">Open it to accept or decline →</a></p>`),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
