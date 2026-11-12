/** Local first notes for class demo. User scope prevents cross-account leakage on a shared browser. */
export interface ChartNote { bar: number; text: string; updatedAt: string }
export interface PracticeJournalEntry {
  id: string; sessionId: string; chartId: string; chartTitle: string; text: string;
  createdAt: string; updatedAt: string; durationSeconds: number;
  /** Optional device-local tuner graphs linked to this session reflection. */
  pitchCaptureIds?: string[];
}
export const INLINE_ANNOTATION_LIMIT = 12;
export function notesKey(scope: string, chartId: string) {
  return 'little-jazz-room:chart-annotations:v1:' + scope + ':' + chartId;
}
export function journalKey(scope: string) { return 'little-jazz-room:practice-journals:v1:' + scope; }
export function readLocalList<T>(key: string): T[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]'); return Array.isArray(value) ? value as T[] : []; }
  catch { return []; }
}
export function persistLocalList<T>(key: string, value: T[]): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function chartAnnotationDisplay(text: string): 'inline' | 'bubble' {
  return text.trim().length <= INLINE_ANNOTATION_LIMIT ? 'inline' : 'bubble';
}
export function nextRepeatCount(value: number, delta: -1 | 1) {
  if (delta === 1) return value >= 11 ? 11 : value + 1;
  return value >= 11 ? 10 : Math.max(0, value - 1);
}
export function repeatLabel(value: number) { return value >= 11 ? '∞' : value + '×'; }
