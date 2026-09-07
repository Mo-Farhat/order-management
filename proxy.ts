import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

/**
 * Route protection (PRD §7.1 authorization).
 *
 * Runs at the edge, decoding only the JWT session — no database. `tenantId` and
 * `role` were baked into the token at sign-in by `auth.ts`, so we can route on
 * them here. Server Actions and route handlers re-check on every mutation; this
 * is a fast first gate, not the enforcement point.
 *
 * Next 16 renamed the `middleware` file convention to `proxy`.
 */
const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/logout",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/api/auth",
  "/api/v1", // public read API — authenticated by its own bearer key (FR-22)
  "/s/", // public share-link pages (Phase 4)
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const hasTenant = !!req.auth?.user?.tenantId;

  const isPublic =
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));

  if (isPublic) {
    // Signed-in users don't need the auth screens.
    if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(
        new URL(hasTenant ? "/desk" : "/onboarding/business", req.url),
      );
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in but hasn't finished onboarding → business basics.
  if (!hasTenant && pathname !== "/onboarding/business") {
    return NextResponse.redirect(new URL("/onboarding/business", req.url));
  }

  // Onboarding done → keep them out of the onboarding step.
  if (hasTenant && pathname === "/onboarding/business") {
    return NextResponse.redirect(new URL("/desk", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // `logout` is excluded outright: the auth() wrapper re-issues a rolling
    // session cookie on every request it sees, which raced (and undid) the
    // cookie clear from the /logout route handler.
    "/((?!_next/static|_next/image|favicon.ico|api/health|logout|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
