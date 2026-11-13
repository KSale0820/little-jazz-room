/**
 * Opt-in, device-local sample musician. Never writes to Supabase or to an
 * anonymous/real user's keys. Reset only removes keys owned by this fixture.
 */
import { createLocalRepository } from '../repository/localRepository';
import { createChartRepository } from '../features/charts/chartRepository';
import { journalKey, notesKey, persistLocalList, type ChartNote, type PracticeJournalEntry } from './practicePlayerNotes';
import { saveProfileName } from './profileName';
import { savePracticeGoal, savePinnedPracticeRoutine } from './practiceHomePreferences';
import { saveRoutineBookmarks } from './routineBookmarks';
import type { Chart, LocalExercise, LocalRoutine, PracticeSessionRecord } from '../types/content';

export const DEMO_SCOPE = 'sample-jazz-student';
export const DEMO_NAME = 'Alex Rivera';
export const DEMO_CHART_ID = 'chart-local-demo-blue-hour';
export const DEMO_ROUTINE_ID = 'local-rt-demo-blue-hour';
const DEMO_FLAG = 'little-jazz-room:sample-profile-active:v1';
const DEMO_SEEDED = 'little-jazz-room:sample-profile-seeded:v1:' + DEMO_SCOPE;

export function isDemoProfileActive(): boolean {
  try { return localStorage.getItem(DEMO_FLAG) === 'true'; }
  catch { return false; }
}

export function setDemoProfileActive(active: boolean): void {
  if (active) localStorage.setItem(DEMO_FLAG, 'true');
  else localStorage.removeItem(DEMO_FLAG);
}

function localDate(daysAgo: number, hour = 16): string {
  const now = new Date();
  // Keep timestamps within the user's local calendar day, including today.
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo,
    daysAgo === 0 ? Math.min(hour, now.getHours()) : hour,
    daysAgo === 0 ? Math.min(30, now.getMinutes()) : 30);
  return date.toISOString();
}

function createBlueHourChart(): Chart {
  const progression: Array<[string, Chart['bars'][number]['events'][number]['quality']]> = [
    ['D', 'm7'], ['G', '7'], ['C', 'maj7'], ['A', '7'],
    ['D', 'm7'], ['G', '7'], ['E', 'm7'], ['A', '7'],
    ['D', 'm7'], ['G', '7'], ['C', 'maj7'], ['C', 'maj7'],
    ['F', 'maj7'], ['F', 'm7'], ['C', 'maj7'], ['G', '7'],
  ];
  return {
    id: DEMO_CHART_ID,
    title: 'Blue Hour Changes',
    concert_key: 'C',
    time_signature: [4, 4],
    feel: 'Swing',
    form: '16-bar AABA study',
    is_custom: true,
    created_at: localDate(27),
    updated_at: localDate(2),
    practice_focus: 'Voice leading, guide tones and melodic ii–V–I lines',
    bars: progression.map(([root, quality], index) => ({
      number: index + 1,
      section: index % 4 === 0 ? ['A1', 'A2', 'B', 'A3'][Math.floor(index / 4)] : null,
      events: [{ beat: 1, duration_beats: 4, root, quality }],
    })),
  };
}

function createExercises(): LocalExercise[] {
  return [
    {
      id: 'local-ex-demo-guide-tones',
      title: 'Blue Hour Guide Tones', description: 'Connect thirds and sevenths through a ii–V–I.',
      category: 'Harmony', level: 'Intermediate', duration_minutes: 10,
      instructions: 'Play the 3rd and 7th of each chord in Blue Hour Changes. Find the closest voice leading between bars. Repeat softly at 72 BPM, then create two-note melodies.',
      suggested_material: 'Blue Hour Changes, bars 1–8',
      suggested_bpm: 72, audio_asset_id: null, visibility: 'private', is_seed: false,
      chart_id: DEMO_CHART_ID, applicable_instruments: ['Piano'],
    },
    {
      id: 'local-ex-demo-melodic-phrases',
      title: 'Four-Bar Call and Response', description: 'Build one simple phrase and answer it.',
      category: 'Improvisation', level: 'Intermediate', duration_minutes: 12,
      instructions: 'Over Blue Hour Changes, improvise a 2-bar question and a 2-bar answer. Leave silence between ideas. Start with only the notes C, D, E, G and A; expand on the second pass.',
      suggested_material: 'Blue Hour Changes, repeat in 4-bar groups',
      suggested_bpm: 84, audio_asset_id: null, visibility: 'private', is_seed: false,
      chart_id: DEMO_CHART_ID, applicable_instruments: ['Piano'],
    },
    {
      id: 'local-ex-demo-intonation',
      title: 'Slow, Steady Warm-Up', description: 'Center the beat before learning a tune.',
      category: 'Technique', level: 'Beginner', duration_minutes: 8,
      instructions: 'Start at 60 BPM. Play a C major scale hands separately, then ii–V–I arpeggios. Record which tempo felt comfortable without rushing.',
      suggested_material: 'Piano and metronome',
      suggested_bpm: 60, audio_asset_id: null, visibility: 'private', is_seed: false,
      chart_id: 'ii-v-i-c', applicable_instruments: ['Piano'],
    },
  ];
}

function createRoutine(): LocalRoutine {
  return {
    id: DEMO_ROUTINE_ID,
    title: 'My Evening Jazz Session',
    description: 'An approachable piano session: settle the beat, connect the changes, then improvise.',
    level: 'Intermediate', duration_minutes: 30, visibility: 'private',
    is_seed: false, applicable_instruments: ['Piano'],
    steps: [
      { exercise_id: 'local-ex-demo-intonation', duration_minutes: 8,
        player_settings: { reference_bpm: 60 } },
      { exercise_id: 'local-ex-demo-guide-tones', duration_minutes: 10,
        player_settings: { reference_bpm: 72, chart_key: 'C', loop_enabled: true,
          loop_sections: [{ startBar: 1, endBar: 4, plays: 2 }] } },
      { exercise_id: 'local-ex-demo-melodic-phrases', duration_minutes: 12,
        player_settings: { reference_bpm: 84, chart_key: 'C' } },
    ],
  };
}

const SESSION_DAYS = [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 14, 16, 18, 21, 24, 28, 31, 36, 43];
const SESSION_MINUTES = [32, 45, 26, 36, 42, 31, 29, 38, 33, 27, 48, 24, 36, 40, 28, 38, 35, 34, 45, 22];

function createSessions(): PracticeSessionRecord[] {
  return SESSION_DAYS.map((daysAgo, index) => ({
    id: 'demo-session-' + String(index + 1).padStart(2, '0'),
    finishedAt: localDate(daysAgo),
    durationSeconds: SESSION_MINUTES[index] * 60,
    ...(index % 3 === 0 ? { routineId: DEMO_ROUTINE_ID, routineTitle: 'My Evening Jazz Session' }
      : index % 3 === 1 ? { exerciseId: 'local-ex-demo-guide-tones' }
      : { exerciseId: 'local-ex-demo-melodic-phrases' }),
  }));
}

const REFLECTIONS = [
  'My guide-tone lines finally sounded connected. Played bars 1–4 at 72 BPM, then tried 84. Keep the left hand light.',
  'Improvised over Blue Hour Changes. Two-bar phrases felt more musical than filling every beat. The response needs more space.',
  'Today felt harder. Rushed the G7 to Cmaj7 resolution. Slowing back to 64 BPM helped.',
  'Worked on Blue Bossa phrasing and listened for the change into the minor ii–V. Loved the second chorus!',
  'Finished the entire evening routine. Biggest win: relaxed shoulders and a clear pulse at 80 BPM.',
  'Played Autumn Leaves slowly. I can hear the descending cycle now, but the bridge is still shaky.',
  'Left hand stayed on beats 2 and 4. Next time: try the same exercise with the metronome off for one chorus.',
  'Tried three choruses of call and response. My second answer was much stronger when I repeated one rhythmic idea.',
  'Short session today. Practiced 3rds and 7ths only, no pressure to increase the tempo.',
  'A full half hour of Blue Hour Changes. Finally connecting the B section back to A with fewer pauses.',
  'Started writing my own chart! The turnaround is tricky, so I added an annotation to bar 16.',
  'First time this month with a consistent 30-minute block. I want to keep recording a small takeaway each day.',
];

const NOTE_SETS: Array<{ chartId: string; notes: Array<[number, string, number]> }> = [
  { chartId: DEMO_CHART_ID, notes: [
    [1, 'Start with F and C (3rd and 7th of Dm7).', 0],
    [2, 'Resolve C down to B for the G7 guide tone.', 1],
    [3, 'Land clearly on E; leave a breath after the resolution.', 2],
    [4, 'Try a short chromatic approach into bar 5.', 3],
    [8, 'A7 turnaround: hear C♯ pulling toward D.', 4],
    [12, 'Hold the major 7th here, then soften the next phrase.', 5],
    [16, 'Leave space before returning to the first Dm7.', 6],
  ] },
  { chartId: 'ii-v-i-c', notes: [
    [1, 'Keep the ii chord voicing small and relaxed.', 7],
    [2, 'Hear the tritone resolving by a half step.', 5],
    [3, 'Let the I chord ring without filling the silence.', 2],
  ] },
  { chartId: 'minor-bossa-cm-16', notes: [
    [1, 'Try a two-bar melody, not a scale run.', 3],
    [9, 'Mark where the minor ii–V starts.', 7],
  ] },
];

const OWNED_KEYS = [
  'little-jazz-room:local-exercises:v1:',
  'little-jazz-room:local-routines:v1:',
  'little-jazz-room:practice-sessions:v1:',
  'little-jazz-room:create-draft:v1:',
  'little-jazz-room:charts:v1:',
  'little-jazz-room:practice-journals:v1:',
  'little-jazz-room:profile-name:v1:',
  'little-jazz-room:daily-practice-goal:v1:',
  'little-jazz-room:practice-off-days:v1:',
  'little-jazz-room:pinned-practice-routine:v1:',
  'little-jazz-room:routine-bookmarks:v1:',
  'little-jazz-room:unlocked-companions:v1:',
  'little-jazz-room:selected-cat:v1:',
  'little-jazz-room:chart-annotations:v1:',
];

export function clearDemoProfile(): void {
  const clearScopedKeys = (store: Storage) => {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith('little-jazz-room:') &&
          (key === DEMO_SEEDED || key.endsWith(':' + DEMO_SCOPE) ||
            key.includes(':' + DEMO_SCOPE + ':') ||
            OWNED_KEYS.some(prefix => key === prefix + DEMO_SCOPE))) {
        keys.push(key);
      }
    }
    for (const key of keys) store.removeItem(key);
  };
  clearScopedKeys(localStorage);
  // Chart builder drafts live in sessionStorage; resetting must clear those too.
  try { clearScopedKeys(sessionStorage); } catch { /* private-mode storage can be blocked */ }
}

/** Idempotent: entering again never overwrites a user's edits to the sample. */
export function seedDemoProfile(): void {
  if (localStorage.getItem(DEMO_SEEDED) === '1') return;
  const repo = createLocalRepository(DEMO_SCOPE);
  const chart = createBlueHourChart();
  createChartRepository(DEMO_SCOPE).saveChart(chart);
  for (const exercise of createExercises()) repo.saveLocalExercise(exercise);
  repo.saveLocalRoutine(createRoutine());
  const sessions = createSessions();
  for (const session of sessions) repo.addSession(session);
  const journals: PracticeJournalEntry[] = REFLECTIONS.map((text, index) => ({
    id: 'demo-journal-' + String(index + 1).padStart(2, '0'),
    sessionId: sessions[index].id,
    chartId: index === 3 ? 'minor-bossa-cm-16' : index === 5 ? 'autumn-leaves-gm-video-35' : DEMO_CHART_ID,
    chartTitle: sessions[index].routineId ? 'My Evening Jazz Session'
      : index === 3 ? 'Blue Bossa' : index === 5 ? 'Autumn Leaves' : 'Blue Hour Changes',
    text, createdAt: sessions[index].finishedAt, updatedAt: sessions[index].finishedAt,
    durationSeconds: sessions[index].durationSeconds,
  }));
  if (!persistLocalList(journalKey(DEMO_SCOPE), journals)) throw new Error('Cannot write sample journals.');
  for (const group of NOTE_SETS) {
    const notes: ChartNote[] = group.notes.map(([bar, text, daysAgo]) =>
      ({ bar, text, updatedAt: localDate(daysAgo) }));
    if (!persistLocalList(notesKey(DEMO_SCOPE, group.chartId), notes)) {
      throw new Error('Cannot write sample chart notes.');
    }
  }
  if (!saveProfileName(DEMO_SCOPE, DEMO_NAME)) throw new Error('Cannot save sample profile.');
  savePracticeGoal(DEMO_SCOPE, 30);
  savePinnedPracticeRoutine(DEMO_SCOPE, DEMO_ROUTINE_ID);
  saveRoutineBookmarks(DEMO_SCOPE, [DEMO_ROUTINE_ID, 'daily-warm-up']);
  localStorage.setItem('little-jazz-room:selected-cat:v1:' + DEMO_SCOPE, 'maple');
  // Write the completion marker last. Interrupted imports can be retried safely.
  localStorage.setItem(DEMO_SEEDED, '1');
}
