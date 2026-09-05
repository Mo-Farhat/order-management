import type { DefaultSession } from "next-auth";
import type { Role } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string | null;
      tenantSlug: string | null;
      role: Role | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string | null;
    tenantSlug?: string | null;
    role?: Role | null;
  }
}
