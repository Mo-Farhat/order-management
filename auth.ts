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

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth({
  ...authConfig,
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
      // On first sign-in `user` is set; on `update()` calls we re-resolve.
      if (user?.id) token.sub = user.id;

      if (user || trigger === "update" || token.tenantId === undefined) {
        const userId = token.sub;
        if (userId) {
          const membership = await loadMembership(userId);
          token.tenantId = membership?.tenantId ?? null;
          token.tenantSlug = membership?.tenantSlug ?? null;
          token.role = membership?.role ?? null;

          // FR-2: reject tokens issued before the last password change.
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { passwordChangedAt: true },
          });
          const changedAt = dbUser?.passwordChangedAt?.getTime();
          const issuedAt = (token.iat as number | undefined) ?? 0;
          if (changedAt && issuedAt * 1000 < changedAt) {
            // Returning null invalidates the session.
            return null;
          }
        }
      }
      return token;
    },
  },
});
