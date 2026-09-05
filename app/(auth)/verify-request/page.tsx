import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium tracking-tight">Check your email</h1>
      <p className="text-sm text-muted">
        We sent a sign-in link to your inbox. It expires in 24 hours and can only
        be used once. You can close this tab.
      </p>
      <p className="text-sm text-muted">
        Wrong address or nothing arriving?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Try again
        </Link>
        .
      </p>
    </div>
  );
}
