import "server-only";
import { withTenant } from "@/db/tenant";
import { auditLog, products, stockMovements } from "@/db/schema";
import { productSchema, type ProductInput } from "@/lib/validation";
import type { ActiveContext } from "@/lib/session";

/** Minimal RFC-4180-ish CSV parser: quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const COLUMN_ALIASES: Record<keyof ProductInput, string[]> = {
  name: ["name", "product", "title"],
  price: ["price", "cost", "amount"],
  stockQty: ["stock", "stock qty", "quantity", "qty", "stock quantity"],
  description: ["description", "desc"],
  category: ["category", "cat"],
  lowStockThreshold: ["low stock threshold", "low stock", "reorder level", "threshold"],
  sku: ["sku", "code"],
  storefrontHidden: [], // not importable — always defaults to visible
};

export type PreviewRow = {
  line: number;
  raw: Record<string, string>;
  data?: ProductInput;
  errors: string[];
};

export type ImportPreview = {
  rows: PreviewRow[];
  validCount: number;
  errorCount: number;
  unmappedHeaders: string[];
};

export function buildPreview(text: string): ImportPreview {
  const grid = parseCsv(text);
  if (grid.length === 0) {
    return { rows: [], validCount: 0, errorCount: 0, unmappedHeaders: [] };
  }

  const header = grid[0].map((h) => h.trim().toLowerCase());
  const colIndex: Partial<Record<keyof ProductInput, number>> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [
    keyof ProductInput,
    string[],
  ][]) {
    const idx = header.findIndex((h) => aliases.includes(h));
    if (idx >= 0) colIndex[field] = idx;
  }

  const mappedIdx = new Set(Object.values(colIndex));
  const unmappedHeaders = header.filter((_, i) => !mappedIdx.has(i) && header[i] !== "");

  const rows: PreviewRow[] = [];
  for (let i = 1; i < grid.length; i++) {
    const cells = grid[i];
    const raw: Record<string, string> = {};
    header.forEach((h, j) => {
      if (h) raw[h] = (cells[j] ?? "").trim();
    });

    const candidate = {
      name: colIndex.name != null ? (cells[colIndex.name] ?? "").trim() : "",
      price: colIndex.price != null ? (cells[colIndex.price] ?? "").trim() : "",
      stockQty: colIndex.stockQty != null ? (cells[colIndex.stockQty] ?? "0").trim() : "0",
      description:
        colIndex.description != null ? (cells[colIndex.description] ?? "").trim() : "",
      category: colIndex.category != null ? (cells[colIndex.category] ?? "").trim() : "",
      lowStockThreshold:
        colIndex.lowStockThreshold != null
          ? (cells[colIndex.lowStockThreshold] ?? "").trim()
          : "",
      sku: colIndex.sku != null ? (cells[colIndex.sku] ?? "").trim() : "",
    };

    const parsed = productSchema.safeParse(candidate);
    rows.push({
      line: i + 1,
      raw,
      data: parsed.success ? parsed.data : undefined,
      errors: parsed.success ? [] : parsed.error.issues.map((iss) => iss.message),
    });
  }

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  return {
    rows,
    validCount,
    errorCount: rows.length - validCount,
    unmappedHeaders,
  };
}

/** FR-7: all-or-nothing. Throws if any row is invalid; nothing is written. */
export async function commitImport(
  ctx: ActiveContext,
  text: string,
): Promise<{ imported: number }> {
  const preview = buildPreview(text);
  if (preview.rows.length === 0) throw new Error("No rows found in that file.");
  if (preview.errorCount > 0) {
    throw new Error(
      `${preview.errorCount} row(s) have errors. Fix the file and re-upload — nothing was imported.`,
    );
  }

  return withTenant(ctx.tenantId, async (tx) => {
    let imported = 0;
    for (const row of preview.rows) {
      const d = row.data!;
      const [p] = await tx
        .insert(products)
        .values({
          tenantId: ctx.tenantId,
          name: d.name,
          price: d.price,
          stockQty: d.stockQty,
          description: d.description?.trim() || null,
          category: d.category?.trim() || null,
          lowStockThreshold:
            d.lowStockThreshold === "" || d.lowStockThreshold == null
              ? null
              : Number(d.lowStockThreshold),
          sku: d.sku?.trim() || null,
        })
        .returning({ id: products.id });

      if (d.stockQty !== 0) {
        await tx.insert(stockMovements).values({
          tenantId: ctx.tenantId,
          productId: p.id,
          delta: d.stockQty,
          balanceAfter: d.stockQty,
          reason: "import",
          actorUserId: ctx.userId,
        });
      }
      imported++;
    }

    await tx.insert(auditLog).values({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "catalog.imported",
      entity: "catalog",
      after: { imported },
    });

    return { imported };
  });
}
