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

const BLANK = '____';

/** Clitic prefixes tried longest-first when stripping a candidate word. */
const PREFIXES = ['بال', 'وال', 'فال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك'];

/** Trailing noise tried when stripping a candidate word (plural/dual, ة/ه slips). */
const SUFFIXES = ['ين', 'ات', 'ان'];

/**
 * Date/time roots that should get a trailing blank when found in a
 * dictated phrase, each with the fixed spelling to render.
 */
const ROOTS: { root: string; render: string }[] = [
  { root: 'تاريخ', render: 'تاريخ' },
  { root: 'يوم', render: 'يوم' },
  { root: 'اسبوع', render: 'الأسبوع' },
  { root: 'شهر', render: 'شهر' },
  { root: 'سنة', render: 'السنة' },
  { root: 'سنت', render: 'السنة' },
  { root: 'عام', render: 'العام' },
  { root: 'ساعة', render: 'الساعة' },
  { root: 'دقيقة', render: 'الدقيقة' },
  { root: 'ثانية', render: 'الثانية' },
  { root: 'وقت', render: 'الوقت' },
  { root: 'موعد', render: 'الموعد' },
];

const DAY_NAMES: { root: string; render: string }[] = [
  { root: 'احد', render: 'الأحد' },
  { root: 'اثنين', render: 'الإثنين' },
  { root: 'ثلاثاء', render: 'الثلاثاء' },
  { root: 'اربعاء', render: 'الأربعاء' },
  { root: 'خميس', render: 'الخميس' },
  { root: 'جمعة', render: 'الجمعة' },
  { root: 'سبت', render: 'السبت' },
];

const MONTH_NAMES: { root: string; render: string }[] = [
  { root: 'يناير', render: 'كانون الثاني' },
  { root: 'كانون الثاني', render: 'كانون الثاني' },
  { root: 'فبراير', render: 'شباط' },
  { root: 'شباط', render: 'شباط' },
  { root: 'مارس', render: 'آذار' },
  { root: 'اذار', render: 'آذار' },
  { root: 'ابريل', render: 'نيسان' },
  { root: 'نيسان', render: 'نيسان' },
  { root: 'مايو', render: 'أيار' },
  { root: 'ايار', render: 'أيار' },
  { root: 'يونيو', render: 'حزيران' },
  { root: 'حزيران', render: 'حزيران' },
  { root: 'يوليو', render: 'تموز' },
  { root: 'تموز', render: 'تموز' },
  { root: 'اغسطس', render: 'آب' },
  { root: 'سبتمبر', render: 'أيلول' },
  { root: 'ايلول', render: 'أيلول' },
  { root: 'اكتوبر', render: 'تشرين الأول' },
  { root: 'نوفمبر', render: 'تشرين الثاني' },
  { root: 'ديسمبر', render: 'كانون الأول' },
];

const RELATIVE_DAYS: { root: string; render: string }[] = [
  { root: 'اليوم', render: 'اليوم' },
];


const ALL_ROOTS = [...ROOTS, ...DAY_NAMES, ...MONTH_NAMES, ...RELATIVE_DAYS];

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
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Matches a single word against the root dictionary, tolerating a small
 * spelling slip so Vosk mishears like "السنت" for "السنة" still
 * resolve. Tolerance scales with root length so short roots (e.g. "يوم")
 * require an exact or near-exact hit and don't swallow unrelated words.
 */
function matchRoot(word: string): string | null {
  const candidates = candidateForms(word);
  let best: { render: string; distance: number } | null = null;

  for (const entry of ALL_ROOTS) {
    const normalizedRoot = normalize(entry.root);
    const tolerance = normalizedRoot.length <= 3 ? 0 : normalizedRoot.length <= 5 ? 1 : 2;
    for (const candidate of candidates) {
      if (candidate.length < 2) continue;
      const distance = editDistance(candidate, normalizedRoot);
      if (distance <= tolerance && (!best || distance < best.distance)) {
        best = { render: entry.render, distance };
      }
    }
  }
  return best?.render ?? null;
}

function isCompoundStarter(word: string, dictionary: { root: string; render: string }[]): boolean {
  const candidates = candidateForms(word);
  return dictionary.some((entry) =>
    candidates.some((c) => editDistance(c, normalize(entry.root)) <= (entry.root.length <= 3 ? 0 : 1)),
  );
}

/**
 * Walks every word in the phrase and appends a blank after each
 * recognized date/time word. "يوم <weekday>" and "الساعة <صباحا|مساء>"
 * collapse into a single trailing blank instead of stacking two.
 */
export function expandDateTimeKeywords(text: string): string {
  const tokens = text.split(/(\s+)/); // keep whitespace tokens to rebuild exactly
  const result: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '' || /^\s+$/.test(token)) {
      result.push(token);
      continue;
    }

    if (!matchRoot(token)) {
      result.push(token);
      continue;
    }

    result.push(token);

    const isDayWord = isCompoundStarter(token, [{ root: 'يوم', render: 'يوم' }]);

    if (isDayWord) {
      const spaceIdx = i + 1;
      const nextWordIdx = i + 2;
      const nextWord = tokens[nextWordIdx];
      if (/^\s+$/.test(tokens[spaceIdx] ?? '') && nextWord && isCompoundStarter(nextWord, DAY_NAMES)) {
        result.push(tokens[spaceIdx], nextWord);
        i = nextWordIdx;
      }
    }

    result.push(` ${BLANK}`);
  }

  return result.join('').replace(/\s+/g, ' ').trim();
}
