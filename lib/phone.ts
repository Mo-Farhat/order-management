/**
 * Normalise a phone number to a single canonical form so the same person
 * dedupes to one customer record regardless of how it was typed
 * (`+94 77 123 4567`, `0771234567`, `77 123 4567` → `0771234567`).
 *
 * Sri Lanka–first (the target market): assumes local mobile numbers and a
 * `94` country code. Generalise if Storefront Desk ever goes multi-country.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // +94 77 1234567  ->  0771234567
  if (digits.startsWith("94") && digits.length === 11) return `0${digits.slice(2)}`;
  // 771234567       ->  0771234567
  if (digits.length === 9) return `0${digits}`;
  // 0771234567      ->  as-is
  if (digits.startsWith("0") && digits.length === 10) return digits;
  // anything else — keep the last 10 digits as a best effort
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * International, digits-only form for `wa.me` / `ig.me` deep links.
 * `0771234567` → `94771234567`, `+94 77 123 4567` → `94771234567`.
 * Returns null if there's nothing usable.
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  const canonical = normalizePhone(raw);
  if (!canonical) return null;
  const digits = canonical.replace(/\D/g, "");
  if (!digits) return null;
  // Local Sri Lanka form (leading 0, 10 digits) → swap the 0 for the 94 code.
  if (digits.startsWith("0") && digits.length === 10) return `94${digits.slice(1)}`;
  return digits;
}
