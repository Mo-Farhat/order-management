import { requireUser } from "@/lib/session";
import { BusinessBasicsForm } from "./form";

export const metadata = { title: "Set up your business" };

export default async function BusinessBasicsPage() {
  // `proxy.ts` only routes users here when their token has no tenantId. A user
  // who has actually finished onboarding is redirected to /desk before reaching
  // this page, so anyone who lands here still needs to submit the form —
  // `saveBusinessBasics` is idempotent and will just refresh a stale session.
  const { email } = await requireUser();
  return <BusinessBasicsForm email={email} />;
}
