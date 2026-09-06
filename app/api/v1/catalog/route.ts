import { getApiCatalog } from "@/lib/public-api";
import { authenticate, json, preflight } from "@/lib/api-v1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET(req: Request) {
  const auth = await authenticate(req);
  if ("error" in auth) return auth.error;

  const catalog = await getApiCatalog(auth.tenantId);
  if (!catalog) return json({ error: "not_found" }, 404);
  return json(catalog);
}
