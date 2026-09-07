/**
 * Default country calling code, used only when someone types a bare local
 * number with a trunk `0` and no country code. Sellers outside this default
 * should enter their number in full international form (`+<code> …`), which is
 * always preserved as typed.
 */
const DEFAULT_COUNTRY_CODE = "94";

/**
 * Normalise a *customer's* phone number to a single canonical form so the same
 * person dedupes to one record regardless of how it was typed
 * (`+94 77 123 4567`, `0771234567`, `77 123 4567` → `0771234567`).
 *
 * This is a dedupe key, not a dialable number — it deliberately collapses
 * formatting. Longer international numbers fall back to their last 10 digits,
 * which still dedupes consistently. Use `toWhatsAppNumber` for anything that
 * needs to be dialled or linked.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // +94 77 1234567  ->  0771234567
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }
  // 771234567       ->  0771234567
  if (digits.length === 9) return `0${digits}`;
  // 0771234567      ->  as-is
  if (digits.startsWith("0") && digits.length === 10) return digits;
  // anything else — keep the last 10 digits as a best effort
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Full international, digits-only form for `wa.me` deep links.
 *
 * Works from the raw string so an explicitly-entered country code survives —
 * `+1 415 555 1234` → `14155551234`. A bare local number written with a trunk
 * `0` and no country code is assumed to be `DEFAULT_COUNTRY_CODE`, which is
 * what keeps older stored numbers (`0771234567`) working.
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  // Explicit international form — already carries a country code.
  if (trimmed.startsWith("+")) return digits;
  // 00 international access prefix.
  if (digits.startsWith("00")) return digits.replace(/^0+/, "");
  // Local number with a trunk 0 → swap it for the default country code.
  if (digits.startsWith("0")) return `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  return digits;
}
