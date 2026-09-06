/**
 * Uploads a local file to the object store under `backups/<name>`.
 * Used by .github/workflows/backup.yml. No-ops (exit 0) when STORAGE_* is unset
 * so the workflow's GitHub-artifact copy is still the source of truth.
 *
 *   npx tsx scripts/upload-backup.ts ./backup-2026-09-07.sql.gz
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { s3Fetch, type S3Config } from "../lib/s3-sigv4";

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("usage: upload-backup.ts <file>");

  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  const bucket = process.env.STORAGE_BUCKET;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    console.log("STORAGE_* not set — skipping R2 upload (GitHub artifact kept instead).");
    return;
  }

  const cfg: S3Config = {
    endpoint,
    region: process.env.STORAGE_REGION ?? "auto",
    accessKeyId,
    secretAccessKey,
    bucket,
  };

  const body = new Uint8Array(await readFile(path));
  const key = `backups/${basename(path)}`;
  const res = await s3Fetch(cfg, "PUT", key, body, {
    "content-type": "application/gzip",
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${await res.text()}`);
  console.log(`uploaded ${key} (${(body.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
