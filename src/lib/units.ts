/**
 * Weight display units. Kilograms stay the canonical stored form everywhere —
 * the database, the plan defaults and the coach's context are all kg — and this
 * module converts only at the edges: what a screen renders, and what the user
 * just typed. Nothing is ever stored in pounds, so switching units can never
 * degrade the saved data.
 */
export type Units = 'metric' | 'imperial';

const LB_PER_KG = 2.20462262;

export const kgToLb = (kg: number): number => kg * LB_PER_KG;
export const lbToKg = (lb: number): number => lb / LB_PER_KG;

/** Short label for the current unit — `kg` or `lb`. */
export const weightUnit = (units: Units): string => (units === 'metric' ? 'kg' : 'lb');

/** One decimal at most, with a trailing `.0` dropped: `22`, not `22.0`. */
function trim(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

/** A canonical kg figure as a bare number in the display unit, for prose. */
export function weightValue(kg: number, units: Units): string {
  return trim(units === 'metric' ? kg : kgToLb(kg));
}

/** A canonical kg figure with its unit: `82 kg` / `180.8 lb`. */
export function displayWeight(kg: number, units: Units): string {
  return `${weightValue(kg, units)} ${weightUnit(units)}`;
}

/** A canonical kg range with the unit written once: `1.5–3 kg` / `3.3–6.6 lb`. */
export function weightRange(lowKg: number, highKg: number, units: Units): string {
  return `${weightValue(lowKg, units)}–${weightValue(highKg, units)} ${weightUnit(units)}`;
}

interface ParsedWeight {
  kg: number;
  /** Whatever trailed the unit — `/hand` in `10 kg/hand`. */
  suffix: string;
}

/** Leading number, optional unit, then any qualifier the user kept. */
const WEIGHT_RE = /^\s*(\d+(?:[.,]\d+)?)\s*(kgs?|lbs?)?\s*(.*)$/i;

/**
 * Reads a weight string into canonical kg. An explicit `kg`/`lb` in the text
 * wins; otherwise the number is read as `assumed`. Returns `null` for anything
 * that doesn't start with a number — "bodyweight" and "red band" are weights a
 * user may legitimately have typed, and they must survive untouched.
 */
export function parseWeight(raw: string, assumed: Units): ParsedWeight | null {
  const match = WEIGHT_RE.exec(raw);
  if (!match) return null;

  const n = Number(match[1]!.replace(',', '.'));
  if (!Number.isFinite(n)) return null;

  const written = match[2]?.toLowerCase();
  const isPounds = written ? written.startsWith('lb') : assumed === 'imperial';
  return { kg: isPounds ? lbToKg(n) : n, suffix: match[3]!.trim() };
}

/** Re-attaches a qualifier, keeping `10 kg/hand` tight but `20 kg each` spaced. */
function withSuffix(base: string, suffix: string): string {
  if (!suffix) return base;
  return suffix.startsWith('/') ? `${base}${suffix}` : `${base} ${suffix}`;
}

/** Renders a stored (kg) working weight in the user's units. */
export function formatStoredWeight(stored: string, units: Units): string {
  const parsed = parseWeight(stored, 'metric');
  if (!parsed) return stored;
  return withSuffix(displayWeight(parsed.kg, units), parsed.suffix);
}

/**
 * Plate jumps, substituted rather than converted: a 2.5 kg step is a 5 lb step
 * in an imperial gym, not 5.5 lb — no such plate exists. Matches the increments
 * quoted on the Guide tab and in the coach's prompt.
 */
const INCREMENTS: Record<string, string> = { '2.5': '5 lb', '5': '10 lb' };

/**
 * Rewrites the kg increments inside a progression sentence for imperial readers.
 * Only `<number> kg` is touched; a figure with no stocked equivalent falls back
 * to a plain conversion rather than being left in the wrong unit.
 */
export function localiseIncrements(text: string, units: Units): string {
  if (units === 'metric') return text;
  return text.replace(
    /(\d+(?:\.\d+)?)\s*kg/g,
    (_, n: string) => INCREMENTS[n] ?? `${weightValue(Number(n), 'imperial')} lb`,
  );
}

/**
 * Turns what the user typed — in whatever units they're currently reading — back
 * into the kg string we store. Unparseable text is stored verbatim.
 */
export function toStoredWeight(input: string, units: Units): string {
  const trimmed = input.trim();
  const parsed = parseWeight(trimmed, units);
  if (!parsed) return trimmed;
  return withSuffix(`${trim(parsed.kg)} kg`, parsed.suffix);
}
