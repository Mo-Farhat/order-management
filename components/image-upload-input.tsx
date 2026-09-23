"use client";

import { useRef, useState } from "react";
import {
  RESIZE_PRESETS,
  formatBytes,
  resizeImageFiles,
  setInputFiles,
  totalBytes,
  type ResizeOptions,
} from "@/lib/image-resize";
import { Spinner } from "@/components/desk/ui";

/**
 * A plain file input that downscales what the seller picked before the form
 * submits it. Keeps the native input (so the server action still receives the
 * files as FormData) and swaps its `files` for the shrunken versions.
 */
export function ImageUploadInput({
  name,
  preset,
  multiple = false,
  hint,
  className = "",
}: {
  name: string;
  preset: keyof typeof RESIZE_PRESETS;
  multiple?: boolean;
  hint?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ before: number; after: number } | null>(null);

  async function onChange() {
    const input = ref.current;
    if (!input?.files?.length) {
      setSaved(null);
      return;
    }
    const picked = Array.from(input.files);
    const before = totalBytes(picked);
    setBusy(true);
    try {
      const opts: ResizeOptions = RESIZE_PRESETS[preset];
      const resized = await resizeImageFiles(picked, opts);
      const after = totalBytes(resized);
      if (after < before && setInputFiles(input, resized)) {
        setSaved({ before, after });
      } else {
        setSaved(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <input
        ref={ref}
        type="file"
        name={name}
        multiple={multiple}
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        className="text-xs text-muted"
      />
      {busy && (
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Spinner /> Optimising…
        </span>
      )}
      {!busy && saved && (
        <span className="text-xs text-ok">
          Optimised — {formatBytes(saved.before)} → {formatBytes(saved.after)} (
          {Math.round((1 - saved.after / saved.before) * 100)}% smaller)
        </span>
      )}
      {!busy && !saved && hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}
