/**
 * Expands date/time/day keywords recognized during voice dictation into
 * a ready-made template with a blank slot the user fills in by hand
 * (typing or a follow-up dictation pass) — e.g. "يوم" -> "يوم ____".
 *
 * Matching is whole-word and case-insensitive-equivalent (Arabic has no
 * case), applied to each finalized Vosk phrase before it's appended to
 * the field, so it never touches text the user already typed manually.
 */

/** Visual placeholder inserted after a matched keyword. Long enough to be
 *  clearly a "fill me in" slot without needing extra explanation text. */
const BLANK = '____';

interface DateTimeRule {
  /** Arabic keywords that trigger this template, matched as whole words. */
  keywords: string[];
  /** Template with `{}` marking where the blank goes relative to the keyword. */
  template: string;
}

const RULES: DateTimeRule[] = [
  // Compound day phrases ("يوم الاثنين") must be checked before the bare
  // weekday names below, otherwise both rules fire on the same phrase and
  // "يوم" gets inserted twice (once standalone, once from the weekday rule).
  { keywords: ['يوم الأحد', 'يوم الاحد'], template: 'يوم الأحد {}' },
  { keywords: ['يوم الإثنين', 'يوم الاثنين'], template: 'يوم الإثنين {}' },
  { keywords: ['يوم الثلاثاء'], template: 'يوم الثلاثاء {}' },
  { keywords: ['يوم الأربعاء', 'يوم الاربعاء'], template: 'يوم الأربعاء {}' },
  { keywords: ['يوم الخميس'], template: 'يوم الخميس {}' },
  { keywords: ['يوم الجمعة'], template: 'يوم الجمعة {}' },
  { keywords: ['يوم السبت'], template: 'يوم السبت {}' },
  { keywords: ['الأحد', 'الاحد'], template: 'يوم الأحد {}' },
  { keywords: ['الإثنين', 'الاثنين'], template: 'يوم الإثنين {}' },
  { keywords: ['الثلاثاء'], template: 'يوم الثلاثاء {}' },
  { keywords: ['الأربعاء', 'الاربعاء'], template: 'يوم الأربعاء {}' },
  { keywords: ['الخميس'], template: 'يوم الخميس {}' },
  { keywords: ['الجمعة'], template: 'يوم الجمعة {}' },
  { keywords: ['السبت'], template: 'يوم السبت {}' },
  { keywords: ['يوم'], template: 'يوم {}' },

  // Explicit "on/at date" phrasing
  { keywords: ['بتاريخ'], template: 'بتاريخ {}' },
  { keywords: ['تاريخ'], template: 'تاريخ {}' },

  // Time of day — compound phrases before the bare "الساعة" rule, same
  // reasoning as the weekday compounds above.
  { keywords: ['الساعة صباحا', 'الساعة صباحاً'], template: 'الساعة {} صباحاً' },
  { keywords: ['الساعة مساء', 'الساعة مساءً'], template: 'الساعة {} مساءً' },
  { keywords: ['صباحا', 'صباحاً'], template: 'الساعة {} صباحاً' },
  { keywords: ['مساء', 'مساءً'], template: 'الساعة {} مساءً' },
  { keywords: ['الساعة', 'ساعة'], template: 'الساعة {}' },
  { keywords: ['الوقت'], template: 'الوقت {}' },

  // Months (Gregorian, as commonly used in Arabic official documents)
  { keywords: ['شهر'], template: 'شهر {}' },
  { keywords: ['كانون الثاني', 'يناير'], template: '{} كانون الثاني' },
  { keywords: ['شباط', 'فبراير'], template: '{} شباط' },
  { keywords: ['آذار', 'اذار', 'مارس'], template: '{} آذار' },
  { keywords: ['نيسان', 'ابريل', 'أبريل'], template: '{} نيسان' },
  { keywords: ['أيار', 'ايار', 'مايو'], template: '{} أيار' },
  { keywords: ['حزيران', 'يونيو'], template: '{} حزيران' },
  { keywords: ['تموز', 'يوليو'], template: '{} تموز' },
  { keywords: ['آب', 'اب', 'اغسطس', 'أغسطس'], template: '{} آب' },
  { keywords: ['أيلول', 'ايلول', 'سبتمبر'], template: '{} أيلول' },
  { keywords: ['تشرين الأول', 'تشرين الاول', 'اكتوبر', 'أكتوبر'], template: '{} تشرين الأول' },
  { keywords: ['تشرين الثاني', 'نوفمبر'], template: '{} تشرين الثاني' },
  { keywords: ['كانون الأول', 'كانون الاول', 'ديسمبر'], template: '{} كانون الأول' },

  // Relative dates
  { keywords: ['اليوم'], template: 'اليوم {}' },
  { keywords: ['غدا', 'غداً'], template: 'غداً {}' },
  { keywords: ['أمس', 'امس'], template: 'أمس {}' },
  { keywords: ['الأسبوع', 'الاسبوع'], template: 'الأسبوع {}' },
  { keywords: ['السنة'], template: 'السنة {}' },
  { keywords: ['العام'], template: 'العام {}' },
];

/**
 * Rules are matched in the array order above (compound phrases first, then
 * their single-word fallbacks) — NOT re-sorted by keyword length. Sorting
 * by length would let a later single-word rule's alphabetically-longer
 * keyword outrank an earlier compound rule and match first, reintroducing
 * the duplicate-"يوم" bug the ordering above exists to avoid.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Expands the first date/time keyword found in `text` into its blank
 * template. Only the first match is expanded per call — dictation
 * phrases are short, and expanding every match risks compounding
 * unrelated words into one run-on template.
 */
export function expandDateTimeKeywords(text: string): string {
  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      const pattern = new RegExp(`(^|\\s)(${escapeRegExp(keyword)})(?=\\s|$)`, 'u');
      const match = pattern.exec(text);
      if (!match) continue;

      const before = text.slice(0, match.index + match[1].length);
      const after = text.slice(match.index + match[0].length);
      const expansion = rule.template.replace('{}', BLANK);
      return `${before}${expansion}${after}`.replace(/\s+/g, ' ').trim();
    }
  }
  return text;
}
