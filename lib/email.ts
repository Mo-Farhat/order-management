/**
 * Outbound email. Phase 1 needs exactly one message: the magic-link sign-in.
 *
 * With no SMTP configured (local dev, or before Cloudflare/Resend keys are in
 * place) the link is logged to the server console so you can still sign in.
 * See GUIDE.md for wiring up a real sender.
 */

const APP_NAME = process.env.APP_NAME ?? "Storefront Desk";

export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  const host = process.env.EMAIL_SERVER_HOST;

  if (!host) {
    console.info(
      `\n[email:dev] Magic sign-in link for ${to}:\n${url}\n(Set EMAIL_SERVER_* in .env.local to send real email — see GUIDE.md)\n`,
    );
    return;
  }

  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  await transport.sendMail({
    to,
    from: process.env.EMAIL_FROM ?? `${APP_NAME} <onboarding@example.com>`,
    subject: `Sign in to ${APP_NAME}`,
    text: `Sign in to ${APP_NAME}:\n${url}\n\nThis link expires in 24 hours. If you didn't request it, ignore this email.`,
    html: `<p>Sign in to <strong>${APP_NAME}</strong>:</p><p><a href="${url}">Sign in</a></p><p style="color:#666;font-size:13px">This link expires in 24 hours. If you didn't request it, ignore this email.</p>`,
  });
}
