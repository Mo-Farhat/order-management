"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/actions/session";

/**
 * Logs the user out, then hard-navigates to /login. The full page load ensures
 * the cleared session cookie is in effect before route protection runs again.
 */
export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={() =>
        start(async () => {
          try {
            await signOutAction();
          } finally {
            window.location.href = "/login";
          }
        })
      }
    >
      {children}
    </button>
  );
}
