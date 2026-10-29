# Jazz chord-grid specification: ship this UI for Sunday's prototype

## 1. Display requirements

- **Practice view:** default to `Chords` when an exercise includes a chart, alongside switchable `Player`. Otherwise default to exercise instructions in `Player` (never show an unrelated generic chart). Optional `Sheet music` only if real MusicXML/engraved notation is available.
- White/ivory chart background, crisp dark barlines, readable chord symbols using UTF-8 `♭`, `♯`, `Δ` optional but **store semantic chord qualities**, not display strings alone.
- **4 measures across** on tablet/desktop like a jazz lead sheet; **2 per row on portrait phones** unless a legible responsive scale allows 4. Measures should occupy meaningful horizontal width, not mini fretboard columns.
- Bar numbers 1–12 (or longer), `A`/`B` markers, time signature `4/4`, concert key and feel (Swing). Highlight active bar; tap a bar to select/start point; show loop region start/end as visible bar markers.
- Two chords can occupy beat 1/beat 3 in the same 4/4 measure; store beat timing explicitly for future playback alignment, not an ambiguous space-delimited string.
- Basic section repeats, alternate endings, `%` previous-measure repeat, `N.C.`, slash-bass chords, chord qualities m7 / maj7 / 7 / dim7 / m7b5 / sus and alterations later. Represent them semantically; not required to implement every iReal Pro symbol by Sunday.
- **Never show guitar fingering boxes as the primary practice chart.** A tap on a chord could later open voicing/fingering details as a separate optional teaching aid.

## 2. Original educational jazz blues (F concert, Swing, 4/4)

This is an independently authored/common-practice *example arrangement of 12-bar jazz-blues changes* (many valid variations exist). Each array item is a measure; pairs show one chord on beats 1–2 and another on 3–4.

| Bar | Chord events (in concert pitch) |
|---|---|
| 1 | F7 |
| 2 | B♭7 |
| 3 | F7 |
| 4 | Cm7 (beats 1–2), F7 (3–4) |
| 5 | B♭7 |
| 6 | Bdim7 |
| 7 | F7 (1–2), D7 (3–4) |
| 8 | Gm7 (1–2), C7 (3–4) |
| 9 | Gm7 |
| 10 | C7 |
| 11 | F7 (1–2), D7 (3–4) |
| 12 | Gm7 (1–2), C7 (3–4) |

This chart is **not a guitar fretboard chart**. Do not insert melody notation not supplied by an authorized source.

### ii–V–I example in C concert (4 bars, 4/4)

| Bar | Changes |
|---|---|
| 1 | Dm7 |
| 2 | G7 |
| 3 | Cmaj7 |
| 4 | Cmaj7 |

## 3. Data model

```ts
type ChordQuality = 'maj7' | 'm7' | '7' | 'dim7' | 'm7b5' | '7alt' | 'sus7' | 'major' | 'minor';
interface ChordEvent { beat: number; durationBeats: number; root: string; quality: ChordQuality; bass?: string; }
interface ChartBar { number: number; section?: string; repeat?: 'begin'|'end'|'percent'; events: ChordEvent[]; }
interface JazzChart {
  id: string; title: string; concertKey: string; meter: [number, number];
  form?: 'blues-12'|'aaba-32'|'abac-32'|'custom'; feel?: 'swing'|'straight'|'bossa'|'ballad';
  bars: ChartBar[]; source?: string; creatorId?: string; license?: string;
}
interface RecordingAsset {
  id: string; sourceLicense: string; originalKey: string; originalTempoBpm?: number;
  mixUrl?: string; stems?: {instrument: string; url: string; offsetMs: number}[];
  // Optional verified timing data mapping musical measures to real audio times:
  barStartTimesSec?: number[];
}
```

Chart transpose applies to on-screen chord spellings **only** until a tested pitch-shifting processor exists for recordings. Horn instrument transposition (concert B♭ becomes written C for B♭ instruments) is **independent** of the track's sounding key and any optional user-selected song key.

## 4. Acceptance tests

- Display exactly 12 bars with correct chords in F, each with visible bar number; no unlicensed tune melody or fabricated score.
- On a 390px wide viewport, chord names including B♭7 and split bars (Cm7/F7) readable at normal zoom. No horizontal overflow of the full app; 2 columns or a controlled local chart zoom/scroll is acceptable.
- Clicking a bar highlights exactly that bar; a selected loop range visibly highlights only selected bars. Chart-only loop selection is not real audio looping without verified recording timestamps.
- Chords / Player switch state works; Practice timer works regardless of audio availability.
- Changing chart display key updates its labels correctly without falsely updating the actual recording; B♭ or E♭ instrument changes are labeled **Written pitch** and never change original audio playback.
- Actual recorded mix, stem sliders and recorded-audio tempo/key effects are visibly disabled or labeled Preview when absent. No MIDI/Tone.js assumptions.

## 5. Seed integration correction (Oct 28 review)

`jazz-seed-content.json` now includes a `charts` array with explicit 4/4 chord-event beats and eleven original educational examples: `blues-f-12` and `ii-v-i-c`. Each exercise has a `chart_id` pointing to one of these charts, or `null`. On Practice, render the current exercise’s chart **only if its `chart_id` is not null**; otherwise default to exercise instructions. Keep the chart key and a horn written-pitch toggle independent from audio playback. Never infer a chart from title or re-use a generic blues chart for unrelated exercises. Run `python validate_suite.py` before seeding.

For 16- and 32-bar original standard-form studies, see `POPULAR-STANDARDS-CHARTS.md`. The chord-only studies are not represented as exact tune-specific lead sheets.
