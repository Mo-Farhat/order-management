import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Landing } from "@/components/marketing/landing";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.tenantId ? "/desk" : "/onboarding/business");
  }
  return <Landing />;
}
