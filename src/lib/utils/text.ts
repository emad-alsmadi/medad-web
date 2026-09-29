const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;

/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits → 0-9, so a number typed on an Arabic keyboard matches. */
export function normalizeDigits(value: string): string {
  return value.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const zero =
      code >= EXTENDED_ARABIC_INDIC_ZERO ? EXTENDED_ARABIC_INDIC_ZERO : ARABIC_INDIC_ZERO;
    return String(code - zero);
  });
}

/**
 * Folds the spelling variants people type interchangeably: diacritics and
 * tatweel dropped, أ/إ/آ/ٱ → ا, ى → ي, ة → ه, digits normalized, spaces collapsed —
 * the same variants the backend's own search ignores.
 */
export function normalizeArabic(value: string): string {
  return normalizeDigits(value)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Case-, diacritic- and hamza-insensitive "contains". An empty query matches everything. */
export function matchesSearch(text: string, query: string): boolean {
  const needle = normalizeArabic(query);
  return needle === '' || normalizeArabic(text).includes(needle);
}
