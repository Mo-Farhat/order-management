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

  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 500, 500);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

  let list = catalog.products;
  if (category) list = list.filter((p) => p.category === category);
  const page = list.slice(offset, offset + limit);

  return json({ data: page, total: list.length, limit, offset });
}
