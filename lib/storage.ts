import { s3Fetch, type S3Config } from "@/lib/s3-sigv4";

/**
 * Object storage for product photos over the S3-compatible API, signed with a
 * tiny SigV4 helper (no AWS SDK — keeps the Cloudflare Worker bundle small).
 *
 * Provider: **Cloudflare R2** (see GUIDE.md step 4a). Provider-agnostic — repoint
 * STORAGE_* (endpoint, region, key/secret, bucket, public base URL) at any
 * S3-compatible store.
 *
 * If STORAGE_* isn't set, `isStorageConfigured()` is false and the catalog UI
 * hides photo upload — products still save without photos.
 */

const endpoint = process.env.STORAGE_ENDPOINT; // e.g. https://<accountid>.r2.cloudflarestorage.com
const region = process.env.STORAGE_REGION ?? "auto";
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
const bucket = process.env.STORAGE_BUCKET;
const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL;

export function isStorageConfigured(): boolean {
  return Boolean(endpoint && accessKeyId && secretAccessKey && bucket && publicBaseUrl);
}

function config(): S3Config {
  if (!isStorageConfigured()) {
    throw new Error(
      "Object storage is not configured. Set STORAGE_* in .env.local — see GUIDE.md step 4a.",
    );
  }
  return {
    endpoint: endpoint!,
    region,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
  };
}

const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export function publicUrlForKey(key: string): string {
  return `${publicBaseUrl!.replace(/\/$/, "")}/${key}`;
}

export async function uploadProductPhoto(
  tenantId: string,
  file: File,
): Promise<{ key: string }> {
  const ext = ALLOWED.get(file.type);
  if (!ext) throw new Error("Photos must be JPEG, PNG, or WebP.");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Each photo must be under 6 MB.");

  const key = `${tenantId}/products/${crypto.randomUUID()}.${ext}`;
  const body = new Uint8Array(await file.arrayBuffer());

  const res = await s3Fetch(config(), "PUT", key, body, {
    "content-type": file.type,
    "cache-control": "public, max-age=31536000, immutable",
  });
  if (!res.ok) {
    throw new Error(`Photo upload failed (${res.status}). Check your STORAGE_* settings.`);
  }
  return { key };
}

export async function deleteObject(key: string): Promise<void> {
  if (!isStorageConfigured()) return;
  await s3Fetch(config(), "DELETE", key, undefined);
}
