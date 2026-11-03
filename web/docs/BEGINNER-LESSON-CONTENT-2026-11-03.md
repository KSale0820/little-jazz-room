# Beginner lessons: structured content handoff

Scope: **lesson content only**. Agent 1 owns the teaching interface and practice player.
This work is based on `class-demo-2026-10-31` and does not change the shared player, audio,
navigation, chart builder, database tables or storage keys.

## Where the lessons live

- `web/src/data/beginnerLessonContent.ts`: authored copy for **all 18** original Beginner exercise IDs.
- `web/src/data/seed.ts`: applies lesson copy to the exported `seedExercises` and routine descriptions to `seedRoutines`.
- `web/src/types/content.ts`: optional `Exercise.description` and `Exercise.lesson` fields.

Content lives in a separate source file rather than directly rewriting
`jazz-seed-content.json`. This avoids a parallel-edit conflict with the searchable Routine
Builder agent, which is also updating beginner seed JSON. Every consumer of `seedExercises`,
`exercisesById`, and `seedRoutines` still receives the final beginner-friendly text.
Raw JSON IDs, Supabase schema, old local drafts and existing chart references do not change.

## Agent 1 rendering contract

```ts
import { getStructuredLesson } from '../data/beginnerLessonContent';

const lesson = getStructuredLesson(exercise);
if (lesson) {
  // Render lesson.goal, lesson.steps (numbered), lesson.listenFor, lesson.success.
  // Optional terminologyHelp is additional, not required to follow the steps.
  // Pick a short line from lesson.catPrompts for the selected companion bubble.
} else {
  // Existing custom/cloud/intermediate exercises remain readable:
  // render exercise.instructions.
}
```

Fields:
- `exercise.title`: plain-language title.
- `exercise.description?`: one-sentence introduction.
- `exercise.lesson?.goal: string`: what the student is learning.
- `exercise.lesson?.steps: string[]`: ordered, playable/performable directions.
- `exercise.lesson?.listenFor: string`: musical listening target.
- `exercise.lesson?.success: string`: ready-to-move-on check.
- `exercise.lesson?.terminologyHelp?: string`: nonessential jazz vocabulary.
- `exercise.lesson?.catPrompts: string[]`: short, supportive prompts; no new image assets.
- `exercise.lesson?.learningOrder: number`: suggested beginner lesson order (1–18).

**Compatibility:** `exercise.instructions` remains a plain text string containing Goal,
numbered steps, Listen for, Ready to move on, and terminology so the existing Practice
Player and Supabase snapshots keep working. `lesson` is optional and missing on legacy
saved/custom/shared exercises. No UI should assume it exists.

**Note naming:** Note names are **concert pitch**; transposing instruments should follow
their chart's existing instrument/transposition setting. Lessons do not change chart data.

## Before and after examples

| Exercise ID | Before | Now |
| --- | --- | --- |
| `thirds-sevenths` | Guide Tones Through ii–V–I; move voices by the smallest distance | **Practice the Important Notes in Each Chord**. Play F and C for Dm7, B and F for G7, E and B for Cmaj7. Listen for notes that stay put or move a small step. Success: four smooth rounds. Explain guide tones afterward. |
| `seventh-arpeggios` | Seventh-Chord Arpeggio Paths; play 1–3–5–7 | **Play the Notes of Each Chord**. Play D–F–A–C, G–B–D–F, C–E–G–B up and down. Listen for the three chord sounds. Success: all groups at a slow tempo without mistakes. |
| `walking-bass` | Roots and Approach Tones; approach next chord chromatically | **Play a Walking Bass Line**. Play F–A–C–B for F7, then B♭–D–F–E for B♭7, one note per beat. Listen for the final note pulling into the next root. |
| `modal-space` | Modal Motif: Leave Space; shift motif up a semitone | **Repeat a Two-Note Musical Idea**. Play D–F in measures 1–8, E♭–G♭ in measures 9–12, back to D–F at 13. Listen for the same rhythm even when pitches rise. |

## Learning progression

`beginnerLearningSequence` in `seed.ts` lists all 18 Beginner exercises in intentional
order: feel the beat → hear/count the blues → find chord roots → play chord notes →
connect guide tones → learn the blues scale → call and response → chord-tone solo →
free improvisation → ear training and bass → new keys, minor blues, bossa and modal
studies. The learning order is a **suggestion**, never a lock.

All 14 existing routine IDs are stable. Two Beginner presets no longer require an
Intermediate exercise (`12bar-blues`, `rhythm-time`); they now use the existing
Beginner `question-answer` exercise instead. In three presets, existing steps are
sequenced from simpler toward harder content. Total routine durations are unchanged.
Intermediate exercises remain intact.

## Checks

`web/src/data/beginnerLessonContent.test.ts` checks all Beginner teaching fields,
cat prompts, legacy fallback, stable exercise/routine/chart IDs, referenced chart IDs,
routine totals, and the ordering of the beginner path. Run:

```bash
cd web
npm ci
npm run build
npm test
```

No Chart Builder changes are included in this PR.
