import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { db } from "@/db";
import { accounts, memberships, sessions, users, verificationTokens } from "@/db/schema";
import { sendMagicLinkEmail } from "@/lib/email";
import { credentialsSchema } from "@/lib/validation";

/**
 * Loads the caller's single membership. v1 is one-membership-per-user; when the
 * invite UI lands (v1.1) this becomes "active membership" resolution.
 */
async function loadMembership(userId: string) {
  const row = await db.query.memberships.findFirst({
    where: eq(memberships.userId, userId),
  });
  if (!row) return null;
  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq: e }) => e(t.id, row.tenantId),
    columns: { id: true, slug: true },
  });
  return tenant ? { tenantId: tenant.id, tenantSlug: tenant.slug, role: row.role } : null;
}

async function loadPasswordChangedAt(userId: string): Promise<number> {
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { passwordChangedAt: true },
  });
  return dbUser?.passwordChangedAt?.getTime() ?? 0;
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });
        if (!user?.hashedPassword) return null;

        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM ?? "Storefront Desk <onboarding@example.com>",
      async sendVerificationRequest({ identifier, url }) {
        await sendMagicLinkEmail(identifier, url);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // Initial sign-in: `user` is set. Snapshot everything into the token.
      if (user?.id) {
        token.sub = user.id;
        const membership = await loadMembership(user.id);
        token.tenantId = membership?.tenantId ?? null;
        token.tenantSlug = membership?.tenantSlug ?? null;
        token.role = membership?.role ?? null;
        token.pwdAt = await loadPasswordChangedAt(user.id);
        return token;
      }

      if (!token.sub) return token;

      // `updateSession()` after onboarding — re-resolve the membership.
      if (trigger === "update") {
        const membership = await loadMembership(token.sub);
        token.tenantId = membership?.tenantId ?? null;
        token.tenantSlug = membership?.tenantSlug ?? null;
        token.role = membership?.role ?? null;
        return token;
      }

      // Every subsequent request: FR-2 — if the password changed after this
      // token was issued, invalidate it.
      const changedAt = await loadPasswordChangedAt(token.sub);
      const snapshot = typeof token.pwdAt === "number" ? token.pwdAt : 0;
      if (changedAt > snapshot) return null;

      // While the user has no tenant (the onboarding window), keep checking on
      // every request so the token picks up the membership the moment it's
      // created — even if the explicit `updateSession()` call was missed.
      if (token.tenantId == null) {
        const membership = await loadMembership(token.sub);
        token.tenantId = membership?.tenantId ?? null;
        token.tenantSlug = membership?.tenantSlug ?? null;
        token.role = membership?.role ?? null;
      }
      return token;
    },
  },
});
