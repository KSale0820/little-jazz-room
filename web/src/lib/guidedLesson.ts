/** Convert current or future exercise lessons into safe, readable teaching sections.
 * No persisted schema or seed data changes are required.
 */
export interface GuidedLesson {
  title: string;
  goal: string;
  steps: string[];
  listenFor: string;
  success: string;
  terminologyHelp: { term: string; explanation: string }[];
  /** Explicit 1-based chart-bar ranges for each instruction step; absent for unmatched charts. */
  stepChordRanges?: Array<[number, number] | null>;
  catPrompts: string[];
}

export interface LessonBase {
  title: string;
  instructions: string;
}

type Fields = Record<string, unknown>;
const isFields = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function pick(source: Fields, camel: string, snake?: string): unknown {
  return source[camel] ?? (snake ? source[snake] : undefined);
}

function stringField(source: Fields, camel: string, snake?: string): string {
  return text(pick(source, camel, snake));
}

function readSteps(value: unknown): string[] {
  if (typeof value === 'string') return [value.trim()].filter(Boolean);
  if (!Array.isArray(value)) return [];
  return value.map(item => text(item) || (isFields(item) ? text(item.text) || text(item.instruction) : '')).filter(Boolean);
}

function plainTextSteps(instructions: string): string[] {
  const lines = instructions.split(/\r?\n/).map(x => x.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  // Most legacy lessons are two or three commands separated by sentences.
  return instructions.split(/(?<=[.!?])\s+(?=[A-Z])/u).map(part => part.trim()).filter(Boolean);
}

function terms(value: unknown): GuidedLesson['terminologyHelp'] {
  if (typeof value === 'string' && value.trim()) return [{ term: 'Terminology', explanation: value.trim() }];
  if (isFields(value)) {
    return Object.entries(value).filter(([, meaning]) => text(meaning)).map(([term, explanation]) => ({ term, explanation: text(explanation) }));
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (typeof item === 'string' && item.trim()) return [{ term: 'Tip', explanation: item.trim() }];
    if (!isFields(item)) return [];
    const explanation = stringField(item, 'explanation') || stringField(item, 'definition') || stringField(item, 'meaning');
    return explanation ? [{ term: stringField(item, 'term') || 'Tip', explanation }] : [];
  });
}

function readChordRanges(raw: unknown): Array<[number, number] | null> | undefined {
  if (!Array.isArray(raw) || !raw.length) return undefined;
  const validated = raw.map((range): [number, number] | null => {
    if (range === null) return null;
    if (!Array.isArray(range) || range.length !== 2) return null;
    const [start, end] = range;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) return null;
    return [start, end];
  });
  return validated.some(Boolean) ? validated : undefined;
}

function structuredCarrier(raw: unknown): Fields {
  if (!isFields(raw)) return {};
  const nested = raw.lesson ?? raw.guidedLesson ?? raw.lessonContent ?? raw.lesson_content;
  return { ...raw, ...(isFields(nested) ? nested : {}) };
}

function hasStructure(raw: unknown): boolean {
  const data = structuredCarrier(raw);
  return ['goal','steps','listenFor','listen_for','success','terminologyHelp','terminology_help','catPrompt','catPrompts','cat_prompts'].some(key => data[key] != null);
}

export function normalizeGuidedLesson(base: LessonBase, exercise?: unknown, snapshot?: unknown): GuidedLesson {
  // Snapshot is authoritative when it contains structured teaching data. For
  // older snapshots, use live exercise lesson fields but retain snapshot text.
  const source = structuredCarrier(hasStructure(snapshot) ? snapshot : exercise ?? snapshot);
  const title = text(base.title) || stringField(source, 'title') || 'Practice exercise';
  const instructions = text(base.instructions) || stringField(source, 'instructions');
  const fallbackSteps = plainTextSteps(instructions);
  const steps = readSteps(source.steps);
  const rawPrompt = pick(source, 'catPrompts', 'cat_prompts');
  const catPrompts = (Array.isArray(rawPrompt) ? rawPrompt.map(text) : [text(rawPrompt)])
    .filter(Boolean).map(line => line.length > 115 ? line.slice(0, 112).trimEnd() + '…' : line);
  const singlePrompt = stringField(source, 'catPrompt', 'cat_prompt');
  const liveSource = structuredCarrier(exercise);
  const liveSteps = readSteps(liveSource.steps);
  const sameSteps = JSON.stringify(liveSteps) === JSON.stringify(steps.length ? steps : fallbackSteps);
  // The selected snapshot can be older than the seeded lesson metadata. Only
  // recover live range mappings when the actual instruction steps still match.
  const stepChordRanges = readChordRanges(pick(source, 'stepChordRanges', 'step_chord_ranges')) ??
    (sameSteps ? readChordRanges(pick(liveSource, 'stepChordRanges', 'step_chord_ranges')) : undefined);

  return {
    title,
    goal: stringField(source, 'goal') || `Practice ${title.toLowerCase()} at a comfortable pace.`,
    steps: steps.length ? steps : fallbackSteps.length ? fallbackSteps : ['Start slowly and work through this exercise at your own pace.'],
    listenFor: stringField(source, 'listenFor', 'listen_for') ||
      'Listen for a steady pulse and clear, controlled changes.',
    success: stringField(source, 'success') || stringField(source, 'successCriteria', 'success_criteria') ||
      'You can complete the steps smoothly and repeat them without losing the beat.',
    terminologyHelp: terms(pick(source, 'terminologyHelp', 'terminology_help')),
    stepChordRanges,
    catPrompts: catPrompts.length ? catPrompts : singlePrompt ? [singlePrompt] : [
      'Let\'s start slowly.',
      'Listen for smooth note changes.',
      'Nice work. Ready for the next step?',
    ],
  };
}
