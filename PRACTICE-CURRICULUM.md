# Little Jazz Room — practical jazz learning & seed content

**Research revision: October 28, 2026.** Deployable seed material: `jazz-seed-content.json` includes **27 exercises, 14 ready-made routines, and 3 recommended learning paths**. All texts are original; no commercially recorded audio or copyrighted lead sheets bundled.

## Product-specific user pains and responses

| Practice pain | Product response | Priority |
|---|---|---|
| Don't know what to work on or how long | One clear “Today's Practice” chosen by skill goal; 10/15/20/30-minute sessions, editable and remixable | **Sunday** |
| Know scales but can't make musical solos | Guide-tone/chord-tone, motif, call-and-response tasks with simple instructions | **Sunday** |
| Forget where they are in a chorus | Default whole-chart measure grid, bar numbers, optional highlighting; straightforward 12-bar blues | **Sunday** |
| Player controls distract from reading | Chords/Player switch, persistent big play, no decoration across chart, optional full-chart view | **Sunday UI** |
| Need to work on a tiny section | Select start/end bar, save loop in routine step; audio looping only if synchronized recording allows | **UI Sunday, processing later** |
| Difficulty changing tempo accurately | Number entry + large +/- + presets (slow/medium/original); don't fake pitch-preserving playback | **UI Sunday** |
| Instruments play in different written keys | Concert + B♭/E♭ written chart setting; recorded audio remains in concert pitch | **Sunday chart** |
| Stuck improvising with a backing track | Silence, metronome on 2 & 4, and recorded band as separate modes | **Sunday mode UI** |
| Soloing over a monotonous backing band | Recording-first audio with real ensemble performance and optional individual stems in future | **Data model Sunday** |
| Can't practice without a song/recording | Original chord progressions, ear-training, silent exercises, custom practice instructions | **Sunday** |

## What to prepopulate and how

- **Instruments:** Piano, Guitar, Alto Sax, Tenor Sax, Trumpet, Bass, Drums. A user can change instrumentation; no assumption every exercise requires a pitched instrument.
- **Technique:** seventh-chord arpeggios, scales, walking bass, shell voicings; show relevant instrument suggestions without separate duplicative exercise sets.
- **Harmony/improv:** ii–V–I in C, a self-authored 12-bar F blues, guide tones, chord-tone improvisation, motifs, call-and-response, comping space.
- **Rhythm:** swing on 2 and 4, count form without accompaniment, rhythmic displacement. Make “metronome on 2 & 4” an explicit mode, not an unspecified ordinary click.
- **Ear/repertoire:** sing roots, follow bass, transcribe four bars of an authorized recording, learn a short original melody by ear; label listening prompts when no recording is available.
- **Practice routines:** `Daily Jazz Warm-Up` (10m), `First Jazz Improvisation` (15m), `12-Bar Blues from Zero` (20m), `ii–V–I Workout` (15m), `Swing and Timing` (10m), `Intermediate Soloing` (30m), `Walking Bass Basics` (15m), `Comping with Space` (15m), `Ear Training Mini Session` (15m), `No-Backing-Track Challenge` (10m).
- **Learning paths:** `Your First Week of Jazz` (7 recommended, **not necessarily consecutive** sessions), `Learn a Tune by Ear`, `Better Swing and Time Feel`. These are suggested schedules rather than rigid streaks.

## Acceptance: quality not just content quantity

1. Each exercise has a clear goal, 1–3 actionable sentences, time, difficulty, and relevant instrument/track optionality. Avoid filler like “practice improvisation.”
2. All seed routine durations equal the sum of step durations. Steps can be reordered, removed, and independently edited by remixes.
3. Chord symbols follow recognized jazz shorthand (`Dm7`, `G7`, `Cmaj7`, `F7`, `B♭7`); charts show measures, not fretboards. Support concert and horn written key without changing actual audio.
4. Exercise complete state is not automatically “skill mastered”; session history records **minutes, practiced material, optional reflection**. Streak copy is gentle.
5. A novice gets 2–3 pathways, not a 50-card exercise wall. Default Explore is **Routines**, with an **Exercises** tab and **Browse by Category** text tiles.
6. Accessible: font sizes readable on phones, all controls keyboard reachable, no autoplay, optional reduced motion, no disclosure of private exercises in shared routine details.

## What NOT to build for Sunday

- Social friends feed, public challenges/leaderboards, rankings, profile cosmetics unlock economy (at most clearly labeled previews).
- AI skill grading from microphone, notation recognition, stem separation, real recorded audio pitch shifting or time stretch; none are in the Sunday budget.
- Duplicate per-instrument libraries, 50 backing styles, full MusicXML editor, copyrighted standard catalog.
- Punitive streak rules, fake generated progress, misleading “Mix” sliders that pretend to alter an inseparable mixed recording.

## Audio and rights

Real recordings are the intended foundation. No recording is bundled. Use a clear **“No recording selected”** state and allow metronome-only/silent exercises. For eventual audio, attach provenance, composer/performer permissions, type (mixed vs stems), BPM, key, time signature, reference start offset, loudness, duration, and sync validation. Treat **chart transposition separately from recording transposition**. Do not download or host unauthorized YouTube audio even temporarily.

## Research references

- Berklee's play-along exercise sets include versions without piano, guitar, melody, or drums: https://college.berklee.edu/admissions/undergraduate/practiceexercises
- Berklee's individual practice course emphasizes skills/weakness review and performance-oriented goals: https://college.berklee.edu/courses/psij-332
- iReal Pro offers measures/loops/count-in and its own chart and style tools: https://www.irealpro.com/learn/play-a-song/
- iReal Pro distinguishes written transposition from changing the playback key: https://www.irealpro.com/learn/transposition/
- Learn Jazz Standards seven-step pedagogy: https://www.learnjazzstandards.com/ljs-podcast/ljs-260-7-steps-for-improvising-over-jazz-standards-from-scratch/
- Some jazz musicians emphasize metronome-only and alternate backing approaches: https://www.reddit.com/r/jazzguitar/comments/1it7e3o
- Forum users describe the importance of full-chart readability and larger tempo controls: https://www.jazzguitar.be/forum/recording-music-software/104307-quartet-app-2.html
- Quartet demonstrates that real-recording playback isn't unique, and includes audio tempo/key processing: https://www.quartetapp.com/help/

## Current seed chart linking

Seed JSON includes eleven semantic original educational charts and each exercise’s `chart_id` or `null`. Do not show a chart for an unrelated no-chart exercise. Original practice instructions and sessions remain valid without recorded audio. `validate_suite.py` enforces chart references and routine timing.

## Additional repertoire foundations

Nine new chart-linked exercises and four seed routines cover rhythm changes, bossa, modal, major/minor ii–V cycles, blues variants, ABAC/AABA song forms and ballads. Refer to `POPULAR-STANDARDS-CHARTS.md`; these are original chord-only studies and **not exact transcriptions** of copyrighted standards.
