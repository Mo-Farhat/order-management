import "server-only";
import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/api-keys";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { ...CORS, "Cache-Control": "public, max-age=30, s-maxage=30" },
  });
}

export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** Resolves the bearer key to a tenant id (rate-limited) or returns an error response. */
export async function authenticate(
  req: Request,
): Promise<{ tenantId: string } | { error: NextResponse }> {
  const limit = await rateLimit(`apiv1:${clientIpFrom(req)}`, 120, 60);
  if (!limit.ok) {
    return {
      error: json(
        { error: "rate_limited", message: `Too many requests. Retry in ${limit.retryAfter}s.` },
        429,
      ),
    };
  }

  const tenantId = await resolveApiKey(req.headers.get("authorization"));
  if (!tenantId) {
    return {
      error: json(
        { error: "unauthorized", message: "Provide a valid API key as `Authorization: Bearer <key>`." },
        401,
      ),
    };
  }
  return { tenantId };
}
