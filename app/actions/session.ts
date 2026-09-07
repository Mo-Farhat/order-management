"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signOut } from "@/auth";

/**
 * Sign out, then redirect to /login ourselves.
 *
 * We deliberately don't use `signOut({ redirectTo })` — in this setup its own
 * redirect resolved to `/` and sometimes left the session cookie in place. So:
 * clear the cookie with `redirect: false`, delete it directly as a fallback,
 * then do our own `redirect()`. Invoked as a `<form action={...}>` so the
 * response's Set-Cookie is applied before the redirect is followed.
 */
export async function signOutAction() {
  try {
    await signOut({ redirect: false });
  } catch {
    // ignore — the manual cookie clear below is the backstop
  }

  const jar = await cookies();
  for (const name of [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.session-token.0",
    "authjs.session-token.1",
  ]) {
    if (jar.has(name)) jar.delete(name);
  }

  redirect("/login");
}
