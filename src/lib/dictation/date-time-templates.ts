/**
 * Inserts a fill-in-the-blank slot after every date/time/day word
 * recognized during voice dictation — e.g. "الساعة" -> "الساعة ____" —
 * so the user can fill in the exact value by hand.
 *
 * Vosk output is colloquial and imperfect: the same concept shows up
 * with different clitic prefixes ("الساعة", "بالساعة", "والساعة"),
 * different spellings ("الساعة" vs "الساعه"), and recognition slips
 * ("السنت" for "السنة"). Matching whole words against a fixed keyword
 * list (the original approach) missed all of these, and only expanded
 * the FIRST match in the whole phrase instead of every one.
 *
 * This version walks every word, tries a handful of ways to strip
 * common Arabic clitic prefixes/suffixes from it, and fuzzy-matches
 * (small edit distance) each candidate against a small root dictionary
 * — so "بالساعة", "والساعه", and "الساعة" all resolve to "ساعة".
 */

/** Kind-specific blanks so the UI can render a date-picker, time-picker, or small text slot. */
export const DATE_BLANK = '____DATE____';
export const TIME_BLANK = '____TIME____';
export const TEXT_BLANK = '____TEXT____';

/** Clitic prefixes tried longest-first when stripping a candidate word. */
const PREFIXES = ['بال', 'وال', 'فال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك'];

/** Trailing noise tried when stripping a candidate word (plural/dual, ة/ه slips). */
const SUFFIXES = ['ين', 'ات', 'ان'];

type BlankKind = 'date' | 'time' | 'text';

/**
 * Date/time roots that should get a trailing blank when found in a
 * dictated phrase, each with the fixed spelling to render and whether
 * the blank should become a date-picker or a time-picker slot.
 */
const ROOTS: { root: string; render: string; kind: BlankKind }[] = [
  { root: 'تاريخ', render: 'تاريخ', kind: 'date' },
  { root: 'يوم', render: 'يوم', kind: 'date' },
  { root: 'اسبوع', render: 'الأسبوع', kind: 'date' },
  { root: 'شهر', render: 'شهر', kind: 'date' },
  { root: 'سنة', render: 'السنة', kind: 'date' },
  { root: 'سنت', render: 'السنة', kind: 'date' },
  { root: 'عام', render: 'العام', kind: 'date' },
  { root: 'ساعة', render: 'الساعة', kind: 'time' },
  { root: 'دقيقة', render: 'الدقيقة', kind: 'time' },
  { root: 'ثانية', render: 'الثانية', kind: 'time' },
  { root: 'وقت', render: 'الوقت', kind: 'time' },
  { root: 'موعد', render: 'الموعد', kind: 'time' },
];

const DAY_NAMES: { root: string; render: string; kind: BlankKind }[] = [
  { root: 'احد', render: 'الأحد', kind: 'date' },
  { root: 'اثنين', render: 'الإثنين', kind: 'date' },
  { root: 'ثلاثاء', render: 'الثلاثاء', kind: 'date' },
  { root: 'اربعاء', render: 'الأربعاء', kind: 'date' },
  { root: 'خميس', render: 'الخميس', kind: 'date' },
  { root: 'جمعة', render: 'الجمعة', kind: 'date' },
  { root: 'سبت', render: 'السبت', kind: 'date' },
];

const MONTH_NAMES: { root: string; render: string; kind: BlankKind }[] = [
  { root: 'يناير', render: 'كانون الثاني', kind: 'date' },
  { root: 'كانون الثاني', render: 'كانون الثاني', kind: 'date' },
  { root: 'فبراير', render: 'شباط', kind: 'date' },
  { root: 'شباط', render: 'شباط', kind: 'date' },
  { root: 'مارس', render: 'آذار', kind: 'date' },
  { root: 'ابريل', render: 'نيسان', kind: 'date' },
  { root: 'نيسان', render: 'نيسان', kind: 'date' },
  { root: 'مايو', render: 'أيار', kind: 'date' },
  { root: 'ايار', render: 'أيار', kind: 'date' },
  { root: 'يونيو', render: 'حزيران', kind: 'date' },
  { root: 'حزيران', render: 'حزيران', kind: 'date' },
  { root: 'يوليو', render: 'تموز', kind: 'date' },
  { root: 'تموز', render: 'تموز', kind: 'date' },
  { root: 'اغسطس', render: 'آب', kind: 'date' },
  { root: 'سبتمبر', render: 'أيلول', kind: 'date' },
  { root: 'ايلول', render: 'أيلول', kind: 'date' },
  { root: 'اكتوبر', render: 'تشرين الأول', kind: 'date' },
  { root: 'نوفمبر', render: 'تشرين الثاني', kind: 'date' },
  { root: 'ديسمبر', render: 'كانون الأول', kind: 'date' },
];

const RELATIVE_DAYS: { root: string; render: string; kind: BlankKind }[] = [
  { root: 'اليوم', render: 'اليوم', kind: 'date' },
];

/**
 * Identity/contact-number roots — "رقم" alone means a generic number,
 * "رقم وطني"/"الرقم الوطني" is detected as the compound "رقم" + "وطني"
 * (same mechanism as "يوم <weekday>"). These always get a small text
 * blank, never a date/time picker.
 */
const ID_NUMBER_ROOTS: { root: string; render: string; kind: BlankKind }[] = [
  { root: 'رقم', render: 'رقم', kind: 'text' },
  { root: 'قيد', render: 'قيد', kind: 'text' },
  { root: 'هاتف', render: 'هاتف', kind: 'text' },
  { root: 'جوال', render: 'جوال', kind: 'text' },
  { root: 'موبايل', render: 'موبايل', kind: 'text' },
  { root: 'ارضي', render: 'أرضي', kind: 'text' },
];

const NATIONAL_ID_SUFFIX: { root: string; render: string; kind: BlankKind }[] = [
  { root: 'وطني', render: 'وطني', kind: 'text' },
];

const ALL_ROOTS = [...ROOTS, ...DAY_NAMES, ...MONTH_NAMES, ...RELATIVE_DAYS, ...ID_NUMBER_ROOTS];

/** Normalizes Arabic letter variants so spelling slips don't block a match. */
function normalize(word: string): string {
  return word
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[ؤئ]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ً-ٟ]/g, ''); // strip tashkeel/tanween marks
}

/**
 * All plausible "de-cliticized" forms of a word: the word itself, with
 * one prefix removed, with one suffix removed, and with both removed.
 * Trying every candidate (instead of always stripping) avoids
 * mis-stripping short roots that only coincidentally end/start like a
 * clitic — e.g. "غدا" must NOT lose its final "ا", and "الاثنين" must
 * keep its "ين" (a root spelling, not a plural suffix here).
 */
function candidateForms(word: string): string[] {
  const base = normalize(word);
  const forms = new Set([base]);

  for (const prefix of PREFIXES) {
    if (base.length > prefix.length + 1 && base.startsWith(prefix)) {
      forms.add(base.slice(prefix.length));
    }
  }
  for (const suffix of SUFFIXES) {
    if (base.length > suffix.length + 2 && base.endsWith(suffix)) {
      forms.add(base.slice(0, -suffix.length));
    }
  }
  for (const prefix of PREFIXES) {
    if (base.length > prefix.length + 1 && base.startsWith(prefix)) {
      const noPrefix = base.slice(prefix.length);
      for (const suffix of SUFFIXES) {
        if (noPrefix.length > suffix.length + 2 && noPrefix.endsWith(suffix)) {
          forms.add(noPrefix.slice(0, -suffix.length));
        }
      }
    }
  }
  return [...forms];
}

/** Levenshtein distance — small dictionary, short words, so O(n*m) is fine. */
function editDistance(a: string, b: string): number {
  // Two rolling rows instead of the full table: row i only ever reads row i - 1.
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] =
        a[i - 1] === b[j - 1]
          ? previous[j - 1]!
          : 1 + Math.min(previous[j]!, current[j - 1]!, previous[j - 1]!);
    }
    previous = current;
  }
  return previous[b.length]!;
}

/**
 * Matches a single word against the root dictionary, tolerating a small
 * spelling slip so Vosk mishears like "السنت" for "السنة" still
 * resolve. Tolerance scales with root length so short roots (e.g. "يوم")
 * require an exact or near-exact hit and don't swallow unrelated words.
 */
function matchRoot(word: string): { render: string; kind: BlankKind } | null {
  const candidates = candidateForms(word);
  let best: { render: string; kind: BlankKind; distance: number } | null = null;

  for (const entry of ALL_ROOTS) {
    const normalizedRoot = normalize(entry.root);
    const tolerance = normalizedRoot.length <= 3 ? 0 : normalizedRoot.length <= 5 ? 1 : 2;
    for (const candidate of candidates) {
      if (candidate.length < 2) continue;
      const distance = editDistance(candidate, normalizedRoot);
      if (distance <= tolerance && (!best || distance < best.distance)) {
        best = { render: entry.render, kind: entry.kind, distance };
      }
    }
  }
  return best ? { render: best.render, kind: best.kind } : null;
}

function isCompoundStarter(
  word: string,
  dictionary: { root: string; render: string; kind: BlankKind }[],
): boolean {
  const candidates = candidateForms(word);
  return dictionary.some((entry) =>
    candidates.some((c) => editDistance(c, normalize(entry.root)) <= (entry.root.length <= 3 ? 0 : 1)),
  );
}

function blankFor(kind: BlankKind): string {
  if (kind === 'time') return TIME_BLANK;
  if (kind === 'text') return TEXT_BLANK;
  return DATE_BLANK;
}

/**
 * Walks every word in the phrase and appends a blank after each
 * recognized date/time/id-number word. "يوم <weekday>", "الساعة
 * <صباحا|مساء>", and "رقم <وطني>" collapse into a single trailing blank
 * instead of stacking two. The blank is DATE_BLANK/TIME_BLANK/TEXT_BLANK
 * depending on the matched root's kind, so the UI can render a
 * date-picker, a time-picker, or a small text slot.
 */
export function expandDateTimeKeywords(text: string): string {
  const tokens = text.split(/(\s+)/); // keep whitespace tokens to rebuild exactly
  const result: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token === '' || /^\s+$/.test(token)) {
      result.push(token);
      continue;
    }

    const match = matchRoot(token);
    if (!match) {
      result.push(token);
      continue;
    }

    result.push(token);

    const isDayWord = isCompoundStarter(token, [{ root: 'يوم', render: 'يوم', kind: 'date' }]);
    const isIdNumberWord = isCompoundStarter(token, [{ root: 'رقم', render: 'رقم', kind: 'text' }]);
    const compoundDictionary = isDayWord ? DAY_NAMES : isIdNumberWord ? NATIONAL_ID_SUFFIX : null;

    if (compoundDictionary) {
      const spaceIdx = i + 1;
      const nextWordIdx = i + 2;
      const nextWord = tokens[nextWordIdx];
      if (
        /^\s+$/.test(tokens[spaceIdx] ?? '') &&
        nextWord &&
        isCompoundStarter(nextWord, compoundDictionary)
      ) {
        result.push(tokens[spaceIdx]!, nextWord);
        i = nextWordIdx;
      }
    }

    result.push(` ${blankFor(match.kind)}`);
  }

  return result.join('').replace(/\s+/g, ' ').trim();
}
