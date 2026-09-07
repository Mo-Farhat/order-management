/**
 * Renders docs/getting-started.md (with its screenshots inlined) to
 * docs/getting-started.pdf. Not part of the app.
 *
 *   npx playwright install chromium     # once
 *   npm run guide:pdf
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { chromium } from "playwright";

const DOCS = path.join(process.cwd(), "docs");
const MD = path.join(DOCS, "getting-started.md");
const OUT = path.join(DOCS, "getting-started.pdf");

const EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function inlineImages(md: string): string {
  // ![alt](images/foo.png) -> data URI so the PDF is self-contained
  return md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (whole, alt, src) => {
    if (/^(https?:|data:)/.test(src)) return whole;
    const abs = path.resolve(DOCS, src);
    try {
      const buf = readFileSync(abs);
      const mime = EXT[path.extname(abs).toLowerCase()] ?? "image/png";
      return `![${alt}](data:${mime};base64,${buf.toString("base64")})`;
    } catch {
      console.warn("  missing image:", src);
      return whole;
    }
  });
}

const CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    font: 15px/1.65 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1f36; margin: 0; padding: 0;
  }
  h1 { font-size: 30px; line-height: 1.15; margin: 0 0 8px; letter-spacing: -0.02em; }
  h2 {
    font-size: 20px; margin: 34px 0 12px; padding-top: 18px;
    border-top: 1px solid #e4e6ec; letter-spacing: -0.01em;
  }
  h1 + p { color: #697386; font-size: 16px; }
  p { margin: 10px 0; }
  a { color: #b3410f; text-decoration: none; }
  strong { font-weight: 650; }
  hr { display: none; }
  ul { margin: 10px 0; padding-left: 22px; }
  li { margin: 4px 0; }
  code {
    background: #f5f6f8; border: 1px solid #e4e6ec; border-radius: 4px;
    padding: 1px 5px; font-size: 0.86em;
    font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
  }
  blockquote {
    margin: 14px 0; padding: 10px 16px; border-left: 3px solid #f0a020;
    background: #fdf6e9; border-radius: 0 6px 6px 0; color: #5c4a20;
  }
  blockquote p { margin: 0; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 14px; }
  th, td { border: 1px solid #e4e6ec; padding: 8px 12px; text-align: left; vertical-align: top; }
  th { background: #f5f6f8; font-weight: 600; }
  img {
    display: block; margin: 16px auto;
    width: auto; height: auto;
    max-width: 100%; max-height: 235mm;   /* stay within one A4 page */
    border: 1px solid #e4e6ec; border-radius: 8px;
  }
  h2, h3 { break-after: avoid; }
  img, table, blockquote { break-inside: avoid; }
`;

async function main() {
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <style>${CSS}</style></head><body>
    ${await marked.parse(inlineImages(readFileSync(MD, "utf8")))}
    </body></html>`;

  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "screen" });
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
  });
  await browser.close();
  console.log("→", path.relative(process.cwd(), OUT));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
