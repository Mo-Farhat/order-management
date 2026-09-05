import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config: no database, no bcrypt, no adapter.
 *
 * `proxy.ts` builds a NextAuth instance from just this file so it can decode the
 * JWT session at the edge without pulling Node-only modules. The full config
 * (providers, Drizzle adapter, enrichment) lives in `auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    // FR-2: sessions persist 30 days.
    maxAge: 60 * 60 * 24 * 30,
  },
  providers: [],
  callbacks: {
    // Keep the token payload shape identical to what auth.ts writes so the edge
    // can read `tenantId` / `role` without a database round-trip.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.tenantId = (token.tenantId as string | null) ?? null;
        session.user.tenantSlug = (token.tenantSlug as string | null) ?? null;
        session.user.role = (token.role as "owner" | "staff" | "viewer" | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
