"use server";

import { cookies } from "next/headers";
import { signOut } from "@/auth";

/**
 * Clears the session cookie but does NOT redirect. The client component that
 * calls this then does a full-page navigation to `/login`, which guarantees the
 * cleared cookie is sent before the next request hits `proxy.ts` — a
 * server-side redirect here raced the cookie write and could land the user
 * back in the app still "logged in".
 */
export async function signOutAction() {
  try {
    await signOut({ redirect: false });
  } catch {
    // Belt and braces: drop the Auth.js session cookies directly.
    const jar = await cookies();
    for (const name of [
      "authjs.session-token",
      "__Secure-authjs.session-token",
    ]) {
      jar.delete(name);
    }
  }
}
