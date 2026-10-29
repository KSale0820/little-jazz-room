# Little Jazz Room — consolidated handoff decisions and changes

## User decisions preserved (Oct 28, 2026)

1. Keep the original five-tab structure (Home, Explore, Create, Practice, Profile), **warm light interface on every screen** including Practice, visually simpler than the mockups.
2. Home's **large illustrated, interactive jazz room** is the visual anchor. Its **sunshine, twilight, and night** lighting changes according to local time, with Auto/manual override; page UI remains cream/sage. Jazz instruments include piano, upright bass, sax, trumpet, guitar and drums, with tappable piano/sheet music/notebook hotspots and explicit navigation buttons.
3. Preserve exactly the Home blocks the user highlighted: daily goal + streak, large Start Practicing, Today's Practice, three Quick Access tiles, long-term goal and progress. Streaks must not guilt users for breaks.
4. All navigation and quick-action icons use **original pixel icons**, while individual exercise rows and **Browse by Category** tiles have no icons. Exercise lists are plain numbered text. Cats only on Home and Profile; reject anatomical mistakes (duplicated limbs/tails/heads).
5. Explore has both searchable routines/exercises and plain-text skill categories. Create Routine uses simple title/description/instruments/difficulty/ordered exercises/save/publish. Custom exercises can exist without any song.
6. Practice has a switchable **Chords / Player** mode. The Chords surface is as readable as printed sheet music, with large black chord symbols and a light background. The Player surface holds instructions, timer, optional recorded audio, and collapsed advanced controls. No guitar fretboards by default.
7. Recordings are the ultimate audio source of truth. A mixed recording now, synchronized band stems later. No MIDI-first architecture. Future pitch/time processing and instrument separation marked Preview. Audio may be replaced or removed without losing routines.

## Research-backed changes over earlier prompts

- Replaced decorative fretboard/chord fingering pictures with genuine **jazz measure grids** (4 bars/row tablet, 2/row phone), chord event timing, sections and repeats. Seed original 12-bar F jazz blues + four-bar ii–V–I in C.
- Added bar selection/current-bar highlighting, repeat/loop *UI*, chart-only transposition and independent written pitch for B♭/E♭ horns. Notation changes must never claim audio changed.
- Added optional metronome-only/no-backing practice, count-in/chorus/2-and-4 future controls and guide-tone, chord-tone, swing and ear-training seed exercises.
- Upgraded recording metadata: license, original key/BPM, stem offsets, and optional measured bar-to-audio times; real recorded stems for mixer, no pretend isolation.
- Added competitive nuance: iReal Pro already uses recorded jazz drums. Product differentiation: high-quality *recorded ensemble stems* + shared practice routines, not a generic claim of being the only real-recording product.
- Specified privacy model: public/discoverable, private/owner-only, unlisted/high-entropy share token; remix steps are independent snapshots.

## Included material

- `jazz-jazz-chart-ui-preview.html`: interactive *local* five-section visual prototype; not backed by Supabase, with clear preview labels and local sample content. Keep the three adjacent `jazz-room-*-art.jpg` files.
- `jazz-grid-updated-mockup.png`: latest concept reference, **not** production app assets. The images are illustrations; notation accuracy is enforced by `JAZZ-CHART-STANDARD.md` instead.
- `DESIGN-DECISIONS.md`: detailed approved UI decisions.
- `JAZZ-RESEARCH.md` and `JAZZ-CHART-STANDARD.md`: references and music notation/data design rules.
- `little-jazz-room-sunday-plan.md`: comprehensive four-phase Cursor agent prompts with go/no-go gates.
- `jazz-room-prototype.html`: legacy interaction example, not approved visual theme.

## Oct 28 — further jazz research & cat choice implementation

- Added eight preloaded hand-audited pixel cat sprites in `jazz-cat-assets`; consistent 1 head/2 ears/4 paws/1 tail. See `jazz-cat-collection.png`.
- Added profile cat chooser, local selection persistence, chosen cat on Home/Profile and gentle motion to interactive HTML prototype. React/TS starter, style file, and profile SQL supplied.
- Clarified Home production art must not contain an unchangeable painted cat behind the selected sprite; old room JPGs are reference art.
- Added original 18-exercise / 10-routine / 3-pathway seed curriculum focused on guide tones, ear, form, swing, comping and improvisation.
- UX: full-chart view and large tempo controls favored over clutter; no-audio/metronome options explicitly part of practice flow. Defer social feed, unlock economy, fake skill grading and AI stem isolation.

## Oct 28 — Jazz Cat builds and face refinement

- Retained eight approved cats; added physically distinct size/age silhouettes: Mochi kitten, Milo and Chai thin, Maple lean, Luna medium, Patches chubby, Biscuit large and round, Pepper fluffy senior.
- Rebuilt SVG avatars with symmetric, anchored eyes/nose/mouth and explicit anatomy tags; colors and distinguishing coat markings retained. Added `age`, `build`, `shape` to metadata/chooser.
- Updated interactive preview and React starter so selected cat uses these corrected transparent sprites everywhere it is shown.
- Kept dark/modular Create and Practice screens cat-free; cats appear as chosen companion only in the Home room and Profile/progress.
- Static AI mood-board images may still contain inconsistent cats; source of truth is the new eight transparent SVG assets, not generated collages.


### Cat artwork follow-up
Updated two illustrative concept boards and added `CAT-ART-QA-REVISIONS.md`. Requirements: correct Milo saxophone, Patches anatomy, stretch/play/lie/sleep frames, Milo eyes on Explore, Practice cat pose, and Milo/Maple footer. Artwork remains a visual reference; production relies on canonical checked sprites.

## Final package audit: primary Cursor brief + testable content

- Introduced authoritative concise `CURSOR-PRIMARY-BRIEF.md` so Cursor does not interpret contradictory historical prompts as current requirements. `START-HERE.md` now has only six user steps.
- Added structured `charts` and explicit exercise `chart_id` links in `jazz-seed-content.json` to prevent showing the blues chart on unrelated exercises. Two original chords-only progressions, zero unlicensed recordings.
- Added `AUDIO-DATA-CONTRACT.md`, `SUPABASE-SECURITY-TESTS.md`, `MVP-LAUNCH-GATES.md` for recording-first architecture and objective shipping requirements.
- Added `validate_suite.py`: verifies eight static cats, 18 exercises, ten duration-consistent routines, three learning paths, chart IDs/beat coverage and HTML inline JS syntax. This does **not** test the browser, React build or Supabase.
- Improved starter cat hook to avoid a late remote preference read overwriting a newly chosen local cat. Removed scale stretch from the CSS idle animation; only gentle vertical bobbing remains.
- Kept both generated animation concept boards reference-only (they failed pose anatomy review); only base SVGs may ship. Room JPGs also contain a fixed cat; Cursor must create matching cat-free art before claiming that selectable-cat Home is complete.

## Team beta + chart expansion (2026-10-28)

- Explicit user approval: ONLY teammates need accounts. Switched to manually pre-created Supabase email/password users, open registration disabled, no Google OAuth/SMTP dependency.
- Added nine original harmony studies linked to repertoire forms commonly encountered in popular jazz standards (not exact copyrighted song transcriptions). Total now eleven structured charts.
- Added nine exercises and four routines. Total now 27 exercises, 14 routines, 3 paths; all original.
- Updated validator for 4/12/16/32-bar charts, bars and beat event coverage, F♯/G♭, and repertoire metadata.
- Added `TEAM-BETA-AUTH.md`, `SUNDAY-TEAM-BETA.md`, `POPULAR-STANDARDS-CHARTS.md`, and `CURSOR-PROMPTS-TEAM.md` as authoritative implementation supplements.

## Oct 28 FINAL: explicit newest user art approval (supersedes earlier style opinions)
Approved `APPROVED-VISUAL-REFERENCE.png` (Modern Jazz Companions, final anatomy revision), minimalist light UI, eight jazz-instrument associations, only a few accessories (Milo sunglasses, Pepper scarf, Biscuit headphones), livelier cat expressions, no new malformed sprites. Added `FINAL-DESIGN-LOCK.md` and `CAT-JAZZ-IDENTITIES.json` as authoritative; all old art boards historical/reference only. Latest approved Practice mockup permits a small cat below controls, hidden with Focus Mode.
