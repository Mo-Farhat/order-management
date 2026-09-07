import { AuthShell } from "@/components/auth/auth-shell";

export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthShell
      headline={
        <>
          You&apos;re almost in.
          <br />
          <span className="text-white/70">One quick step.</span>
        </>
      }
      points={[
        "Your business name becomes your storefront address",
        "Your WhatsApp number is where storefront orders land",
        "Change both later in Settings — nothing is locked in",
      ]}
    >
      {children}
    </AuthShell>
  );
}
