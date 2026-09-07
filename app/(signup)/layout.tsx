import { AuthShell } from "@/components/auth/auth-shell";

/**
 * Signup gets its own group so it can use a wider card than login/reset — it
 * lays its fields out in two columns and should fit without scrolling.
 */
export default function SignupLayout({ children }: LayoutProps<"/">) {
  return <AuthShell cardWidth="max-w-[720px]">{children}</AuthShell>;
}
