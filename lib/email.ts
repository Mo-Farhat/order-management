/**
 * Outbound email over the Resend HTTP API (works on Cloudflare Workers — no
 * SMTP / nodemailer). With no RESEND_API_KEY the message is logged to the
 * server console so flows still work in local dev.
 *
 * Resend needs a verified sending domain for real deliverability; until then
 * you can send from `onboarding@resend.dev` (their shared test address).
 */
import { APP_NAME } from "@/lib/constants";

type Mail = { to: string | string[]; subject: string; text: string; html?: string };

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
    html: `<p>Someone asked to reset the password for your <strong>${APP_NAME}</strong> account.</p>
<p><a href="${url}">Reset your password</a> — this link expires in 1 hour.</p>
<p style="color:#697386;font-size:13px">If this wasn't you, ignore this email — your password won't change.</p>`,
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
      o.note ? `Note: ${o.note}` : null,
      ``,
      `It's waiting in your desk as Pending — accept or decline it:`,
      o.url,
    ]
      .filter((x) => x !== null)
      .join("\n"),
    html: `<p><strong>${escapeHtml(o.customerName)}</strong> placed order <strong>#${o.orderNumber}</strong> on your ${escapeHtml(o.shopName)} storefront.</p>
<ul>${o.items.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>
<p><strong>Total: ${o.currency} ${escapeHtml(o.total)}</strong><br>
Phone: ${escapeHtml(o.customerPhone)}${o.note ? `<br>Note: ${escapeHtml(o.note)}` : ""}</p>
<p>It's waiting in your desk as <strong>Pending</strong>.<br>
<a href="${o.url}">Open it to accept or decline →</a></p>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
