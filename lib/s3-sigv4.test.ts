import { describe, it, expect, vi, afterEach } from "vitest";
import { sha256Hex, s3Fetch, type S3Config } from "@/lib/s3-sigv4";

const cfg: S3Config = {
  endpoint: "https://acct123.r2.cloudflarestorage.com",
  region: "auto",
  accessKeyId: "AKIAEXAMPLE",
  secretAccessKey: "secretExampleKey",
  bucket: "media",
};

const FIXED = new Date("2026-01-02T03:04:05.000Z");

afterEach(() => vi.restoreAllMocks());

describe("sha256Hex", () => {
  it("matches the known digest of the empty string", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});

describe("s3Fetch signing", () => {
  it("path-style URL, SigV4 Authorization header, required amz headers", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await s3Fetch(
      cfg,
      "PUT",
      "tenant-1/products/pic.jpg",
      new Uint8Array([1, 2, 3]),
      { "content-type": "image/jpeg" },
      FIXED,
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://acct123.r2.cloudflarestorage.com/media/tenant-1/products/pic.jpg",
    );
    const headers = init.headers as Record<string, string>;
    expect(headers["x-amz-date"]).toBe("20260102T030405Z");
    expect(headers["x-amz-content-sha256"]).toMatch(/^[0-9a-f]{64}$/);
    expect(headers.Authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE\/20260102\/auto\/s3\/aws4_request, SignedHeaders=[a-z0-9;-]+, Signature=[0-9a-f]{64}$/,
    );
    expect(headers.Authorization).toContain("content-type;host;x-amz-content-sha256;x-amz-date");
    expect(init.method).toBe("PUT");
  });

  it("produces a stable signature for fixed inputs (regression guard)", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    await s3Fetch(cfg, "DELETE", "a/b.png", undefined, {}, FIXED);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE/20260102/auto/s3/aws4_request, " +
        "SignedHeaders=host;x-amz-content-sha256;x-amz-date, " +
        "Signature=76398eff4af4af69e17cef0431308e7e959c3ac7b00340a9d338d60e6b7612d9",
    );
  });
});
