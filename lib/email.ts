/**
 * Outbound email over the Resend HTTP API (works on Cloudflare Workers — no
 * SMTP / nodemailer). With no RESEND_API_KEY the message is logged to the
 * server console so flows still work in local dev.
 *
 * Resend needs a verified sending domain for real deliverability; until then
 * you can send from `onboarding@resend.dev` (their shared test address).
 */
import { APP_NAME } from "@/lib/constants";

type Mail = { to: string; subject: string; text: string; html?: string };

export async function sendEmail({ to, subject, text, html }: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? `${APP_NAME} <onboarding@resend.dev>`;

  if (!key) {
    console.info(`\n[email:dev] to ${to}\nsubject: ${subject}\n${text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text, html: html ?? text }),
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
