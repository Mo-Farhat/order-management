"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { INDUSTRY_PRESETS, variantLabel, type Industry } from "@/lib/industries";

export type OptionsInitial = {
  option1Name: string;
  option2Name: string;
  variants: { id: string; option1: string; option2: string | null; price: string | null; stockQty: number }[];
};

type Row = { id?: string; price: string; stockQty: string };

const rowKey = (o1: string, o2: string) => `${o1}\u0000${o2}`;
const uniq = (xs: string[]) => [...new Set(xs)];

/**
 * "This product comes in sizes / colours…" — up to two options, every
 * combination gets its own price (blank = the base price) and stock. Posts one
 * hidden `options` JSON field the server validates (productOptionsSchema).
 *
 * `onActiveChange` lets the form hide the single stock field while options own
 * the stock.
 */
export function OptionsEditor({
  industry,
  initial,
  basePrice,
  error,
  onActiveChange,
}: {
  industry: Industry;
  initial?: OptionsInitial;
  basePrice: string;
  error?: string;
  onActiveChange: (active: boolean) => void;
}) {
  const hadOptions = Boolean(initial?.variants.length);
  const preset = INDUSTRY_PRESETS[industry];

  const [active, setActive] = useState(hadOptions);
  const [name1, setName1] = useState(initial?.option1Name ?? "");
  const [name2, setName2] = useState(initial?.option2Name ?? "");
  const [values1, setValues1] = useState<string[]>(
    uniq(initial?.variants.map((v) => v.option1) ?? []),
  );
  const [values2, setValues2] = useState<string[]>(
    uniq((initial?.variants.map((v) => v.option2).filter(Boolean) as string[]) ?? []),
  );
  const [showSecond, setShowSecond] = useState(Boolean(initial?.option2Name));
  const [rows, setRows] = useState<Record<string, Row>>(() => {
    const out: Record<string, Row> = {};
    for (const v of initial?.variants ?? []) {
      out[rowKey(v.option1, v.option2 ?? "")] = {
        id: v.id,
        price: v.price ?? "",
        stockQty: String(v.stockQty),
      };
    }
    return out;
  });

  const second = showSecond && values2.length > 0;
  const combos = useMemo(
    () =>
      values1.flatMap((o1) =>
        second ? values2.map((o2) => ({ o1, o2 })) : [{ o1, o2: "" }],
      ),
    [values1, values2, second],
  );

  function turnOn() {
    setActive(true);
    onActiveChange(true);
    if (!hadOptions && values1.length === 0) {
      setName1(preset.option1.name);
      setValues1(preset.option1.values);
    }
  }
  function turnOff() {
    setActive(false);
    onActiveChange(false);
  }

  const payload = active
    ? JSON.stringify({
        option1Name: name1.trim(),
        option2Name: second ? name2.trim() || "Option" : "",
        variants: combos.map(({ o1, o2 }) => {
          const r = rows[rowKey(o1, o2)];
          return {
            id: r?.id,
            option1: o1,
            option2: o2,
            price: (r?.price ?? "").trim(),
            stockQty: Number(r?.stockQty || "0") || 0,
          };
        }),
      })
    : hadOptions
      ? JSON.stringify({ option1Name: "", option2Name: "", variants: [] })
      : "";

  const total = combos.reduce((n, { o1, o2 }) => n + (Number(rows[rowKey(o1, o2)]?.stockQty) || 0), 0);

  if (!active) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-dashed border-line px-3 py-3">
        <input type="hidden" name="options" value={payload} />
        <button
          type="button"
          onClick={turnOn}
          className="self-start text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          + Add options (size, colour…)
        </button>
        <span className="text-xs text-muted">
          For products that come in different sizes, colours or flavours — customers pick one.
        </span>
        {hadOptions && (
          <span className="text-xs text-warn">
            Saving now removes this product&apos;s options; stock goes back to one number.
          </span>
        )}
      </div>
    );
  }

  const inputCls =
    "h-10 w-full rounded-md border border-line bg-surface px-2.5 text-sm outline-none focus:border-ink";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line p-3">
      <input type="hidden" name="options" value={payload} />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          Options
        </span>
        <button type="button" onClick={turnOff} className="text-xs text-muted underline">
          Remove options
        </button>
      </div>

      <OptionGroup
        label="Option"
        name={name1}
        onName={setName1}
        namePlaceholder="e.g. Size"
        values={values1}
        onValues={setValues1}
        valuePlaceholder={preset.option1.values.length ? `e.g. ${preset.option1.values.slice(0, 3).join(", ")}` : "e.g. Small, Large"}
      />

      {showSecond ? (
        <OptionGroup
          label="Second option"
          name={name2}
          onName={setName2}
          namePlaceholder={preset.option2Name ? `e.g. ${preset.option2Name}` : "e.g. Colour"}
          values={values2}
          onValues={setValues2}
          valuePlaceholder="e.g. Red, Blue"
          onRemove={() => {
            setShowSecond(false);
            setValues2([]);
            setName2("");
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setShowSecond(true);
            if (!name2) setName2(preset.option2Name);
          }}
          className="self-start text-xs font-medium text-accent hover:underline"
        >
          + Add a second option{preset.option2Name ? ` (e.g. ${preset.option2Name.toLowerCase()})` : ""}
        </button>
      )}

      {combos.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
              Price &amp; stock per option
            </span>
            <span className="text-xs text-muted">{total} in stock</span>
          </div>
          <div className="flex flex-col divide-y divide-line rounded-md border border-line">
            {combos.map(({ o1, o2 }) => {
              const k = rowKey(o1, o2);
              const r = rows[k] ?? { price: "", stockQty: "0" };
              const set = (patch: Partial<Row>) => setRows((prev) => ({ ...prev, [k]: { ...r, ...patch } }));
              return (
                <div key={k} className="grid grid-cols-[1fr_6.5rem_5rem] items-center gap-2 px-2.5 py-2">
                  <span className="truncate text-sm font-medium">{variantLabel(o1, o2 || null)}</span>
                  <input
                    value={r.price}
                    onChange={(e) => set({ price: e.target.value })}
                    inputMode="decimal"
                    placeholder={basePrice || "Price"}
                    aria-label={`Price for ${variantLabel(o1, o2 || null)}`}
                    className={inputCls}
                  />
                  <input
                    value={r.stockQty}
                    onChange={(e) => set({ stockQty: e.target.value.replace(/[^0-9]/g, "") })}
                    inputMode="numeric"
                    aria-label={`Stock for ${variantLabel(o1, o2 || null)}`}
                    className={`${inputCls} text-center`}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted">Leave a price blank to use the base price.</p>
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function OptionGroup({
  label,
  name,
  onName,
  namePlaceholder,
  values,
  onValues,
  valuePlaceholder,
  onRemove,
}: {
  label: string;
  name: string;
  onName: (v: string) => void;
  namePlaceholder: string;
  values: string[];
  onValues: (v: string[]) => void;
  valuePlaceholder: string;
  onRemove?: () => void;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const next = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (next.length) onValues([...values, ...next].slice(0, 30));
    setDraft("");
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      onValues(values.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder={namePlaceholder}
          aria-label={`${label} name`}
          maxLength={30}
          className="h-10 w-36 rounded-md border border-line bg-surface px-2.5 text-sm font-medium outline-none focus:border-ink"
        />
        <span className="text-xs text-muted">{label}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="ml-auto text-xs text-muted underline">
            remove
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface p-1.5 focus-within:border-ink">
        {values.map((v) => (
          <span key={v} className="inline-flex h-8 items-center gap-1 rounded-md bg-card px-2 text-sm shadow-[0_0_0_1px_var(--line)]">
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => onValues(values.filter((x) => x !== v))}
              className="text-muted hover:text-danger"
            >
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => draft.trim() && commit(draft)}
          placeholder={values.length ? "Add another…" : valuePlaceholder}
          aria-label={`${label} values`}
          className="h-8 min-w-28 flex-1 bg-transparent px-1 text-sm outline-none"
        />
      </div>
    </div>
  );
}
