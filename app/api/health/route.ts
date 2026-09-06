/**
 * Liveness + config check. Imports nothing from the app (no db, no auth) so it
 * can't 500 for the reasons the rest of the app might. Reports which env vars
 * are *present* (never their values) to make a misconfigured deploy obvious.
 *
 * Excluded from the proxy matcher, so it runs with no middleware.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  return Response.json({
    ok: true,
    time: new Date().toISOString(),
    runtime: typeof process !== "undefined" ? (process.version || "workerd") : "unknown",
    env: {
      DATABASE_URL: has("DATABASE_URL"),
      DATABASE_URL_RUNTIME: has("DATABASE_URL_RUNTIME"),
      AUTH_SECRET: has("AUTH_SECRET"),
      AUTH_URL: has("AUTH_URL"),
      APP_NAME: has("APP_NAME"),
      STORAGE_ENDPOINT: has("STORAGE_ENDPOINT"),
      EMAIL_SERVER_HOST: has("EMAIL_SERVER_HOST"),
    },
  });
}
