/**
 * Minimal AWS Signature V4 for S3-compatible PUT/DELETE over `fetch` — no SDK.
 * Keeps the Worker bundle small and works on any Web-Crypto runtime (Node 20+,
 * Cloudflare Workers). Path-style addressing only (fine for R2 / Supabase / MinIO).
 */

const enc = new TextEncoder();

async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const buf = typeof data === "string" ? enc.encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", buf as BufferSource);
  return hex(new Uint8Array(digest));
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function uriEncodeKey(key: string): string {
  // Encode each path segment but keep the slashes.
  return key
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}

export type S3Config = {
  endpoint: string; // https://<host> (no bucket)
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export async function s3Fetch(
  cfg: S3Config,
  method: "PUT" | "DELETE" | "GET",
  key: string,
  body: Uint8Array | undefined,
  extraHeaders: Record<string, string> = {},
  now: Date = new Date(),
): Promise<Response> {
  const url = new URL(cfg.endpoint);
  const host = url.host;
  const canonicalUri = `/${encodeURIComponent(cfg.bucket)}/${uriEncodeKey(key)}`;

  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(body ?? "");

  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...Object.fromEntries(Object.entries(extraHeaders).map(([k, v]) => [k.toLowerCase(), v])),
  };

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders =
    Object.keys(headers)
      .sort()
      .map((k) => `${k}:${headers[k].trim()}`)
      .join("\n") + "\n";

  const canonicalRequest = [
    method,
    canonicalUri,
    "", // no query
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  let signingKey: ArrayBuffer | Uint8Array = enc.encode(`AWS4${cfg.secretAccessKey}`);
  for (const part of [dateStamp, cfg.region, "s3", "aws4_request"]) {
    signingKey = await hmac(signingKey, part);
  }
  const signature = hex(new Uint8Array(await hmac(signingKey, stringToSign)));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(`${url.origin}${canonicalUri}`, {
    method,
    headers: { ...extraHeaders, ...headers, Authorization: authorization },
    body: body as BodyInit | undefined,
  });
}

export { sha256Hex };
