/**
 * Logs the user out via the `/logout` route handler (a real form POST, so the
 * cookie-clearing redirect response is honoured on every runtime).
 */
export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action="/logout" method="post" className="contents">
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
