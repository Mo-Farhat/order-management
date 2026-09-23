/**
 * Browser-side image downscaling, run before an upload leaves the device.
 *
 * Sellers upload straight from a phone camera roll — 3–5 MB for a photo that
 * ends up in a ~300px grid tile. Shrinking here cuts what we store in R2 and,
 * far more importantly, what a customer on a mid-range Android over mobile data
 * has to download.
 *
 * Every failure path returns the original file: a browser without
 * `createImageBitmap`, a HEIC the canvas can't decode, a re-encode that came out
 * bigger. Uploading something is always better than uploading nothing.
 */

export type ResizeOptions = {
  /** Longest edge, in pixels. */
  maxDim: number;
  /** 0–1, for the lossy encoders. */
  quality?: number;
};

/** Sensible ceilings per image role — a logo never needs 2000px. */
export const RESIZE_PRESETS = {
  product: { maxDim: 1600, quality: 0.82 },
  logo: { maxDim: 512, quality: 0.9 },
  banner: { maxDim: 2000, quality: 0.82 },
} satisfies Record<string, ResizeOptions>;

/** The upload endpoint only accepts these, so never encode to anything else. */
const ENCODE_ORDER = ["image/webp", "image/jpeg"] as const;

function extensionFor(mime: string): string {
  return mime === "image/webp" ? "webp" : "jpg";
}

async function toBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

export async function resizeImageFile(file: File, opts: ResizeOptions): Promise<File> {
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  // Animated GIFs would lose their animation; leave them alone.
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, opts.maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    for (const mime of ENCODE_ORDER) {
      const blob = await toBlob(canvas, mime, opts.quality ?? 0.82);
      // A browser that can't encode this type silently hands back a PNG.
      if (!blob || blob.type !== mime) continue;
      if (blob.size >= file.size) return file; // re-encoding made it worse
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      return new File([blob], `${base}.${extensionFor(mime)}`, { type: mime });
    }
    return file;
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}

export async function resizeImageFiles(files: File[], opts: ResizeOptions): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) out.push(await resizeImageFile(f, opts));
  return out;
}

/**
 * Put the shrunken files back on the input so the surrounding form submits them
 * unchanged. Returns false where `DataTransfer` isn't available, in which case
 * the caller should leave the originals alone.
 */
export function setInputFiles(input: HTMLInputElement, files: File[]): boolean {
  try {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    input.files = dt.files;
    return true;
  } catch {
    return false;
  }
}

/** Total bytes, for the "saved X" hint. */
export function totalBytes(files: File[]): number {
  return files.reduce((n, f) => n + f.size, 0);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
