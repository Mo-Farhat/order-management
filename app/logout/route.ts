import { NextResponse } from "next/server";
import { signOut } from "@/auth";

/**
 * Logout endpoint. A route handler (not a server action) so the
 * cookie-clearing headers are emitted on the redirect response reliably on
 * every runtime, including Cloudflare Workers / OpenNext where server-action
 * cookie writes didn't survive the redirect and left the user signed in.
 *
 * Posted to by `components/auth/logout-button.tsx`.
 */
async function handle(req: Request): Promise<Response> {
  try {
    await signOut({ redirect: false });
  } catch {
    // fall through — the explicit cookie clearing below is the real mechanism
  }

  const res = NextResponse.redirect(new URL("/login", req.url), { status: 303 });

  // Auth.js default session cookie is `authjs.session-token`, prefixed
  // `__Secure-` on https, and split into `.0` / `.1` chunks when the JWT is
  // large. Expire every variant.
  const bases = ["authjs.session-token", "__Secure-authjs.session-token"];
  for (const base of bases) {
    for (const name of [base, `${base}.0`, `${base}.1`, `${base}.2`]) {
      res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: "lax",
        secure: name.startsWith("__Secure-"),
      });
    }
  }
  return res;
}

export const POST = handle;
export const GET = handle;
