import { signOutAction } from "@/app/actions/session";

/**
 * Renders a submit button inside a form that posts to `signOutAction`. A real
 * form submission (not a client RPC) so the cleared-cookie response is applied
 * before the redirect to /login is followed.
 */
export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action={signOutAction} className="contents">
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
