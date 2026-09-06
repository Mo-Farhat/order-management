import { PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Object storage for product photos over the S3-compatible API.
 *
 * Provider: **Cloudflare R2** (see GUIDE.md step 4a). The client is
 * provider-agnostic — any S3-compatible store works by repointing STORAGE_*
 * (endpoint, region, key/secret, bucket, public base URL).
 *
 * If STORAGE_* isn't set, `isStorageConfigured()` is false and the catalog UI
 * hides photo upload — products still save without photos (FR-4 says "up to 6",
 * not "at least one").
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

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error(
      "Object storage is not configured. Set STORAGE_* in .env.local — see GUIDE.md step 4a.",
    );
  }
  client ??= new S3Client({
    region,
    endpoint,
    forcePathStyle: true, // works for R2; required by Supabase / MinIO
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });
  return client;
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
  const body = Buffer.from(await file.arrayBuffer());

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket!,
      Key: key,
      Body: body,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return { key };
}

export async function deleteObject(key: string): Promise<void> {
  if (!isStorageConfigured()) return;
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket!, Key: key }));
}
