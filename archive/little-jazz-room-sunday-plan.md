> **ARCHIVE NOTICE (2026-10-28):** This long historical draft contains superseded Google OAuth/public-registration instructions. Current decisions are in `CURSOR-PRIMARY-BRIEF.md`, `TEAM-BETA-AUTH.md`, `SUNDAY-TEAM-BETA.md`, and `POPULAR-STANDARDS-CHARTS.md`. Do not follow contradictory text below.

> **ARCHIVE/DETAILED REFERENCE:** `CURSOR-PRIMARY-BRIEF.md` is now the authoritative implementation prompt. If details below conflict, follow the primary brief and `MVP-LAUNCH-GATES.md`.

# Little Jazz Room — Sunday MVP implementation handoff

**Target:** Sunday, November 1, 2026  
**Budget:** $0 beyond existing ChatGPT, Cursor, and Claude subscriptions. Do not enable paid usage, on-demand API billing, or credit top-ups.  
**Primary development agent:** Cursor Agent using an included Cursor model (Composer 2.5 when available). Verify the included allowance and disable paid top-ups; do not assume third-party models are included.  
**Architecture:** Vite + React + TypeScript, Tailwind CSS, accessible components, React Router, Supabase (PostgreSQL + Auth + RLS), Cloudflare Pages. No server framework is necessary for this MVP.  
**Design starting point:** `jazz-jazz-chart-ui-preview.html` is the current light-theme interactive UI/chord-grid reference; `jazz-room-prototype.html` is an earlier functional/content reference, **not a source of truth for its old dark colors or screen density**. Port/adapt it to modular React, not an iframe. The ZIP includes the user-provided `reference-cozy-blue-room.png` and `reference-rainy-botanical-window.png`; use them only for rainy, botanical, softly illuminated pixel-art *accents*, not as dark whole-screen UI backgrounds. Create original inspired artwork; do not reproduce or ship the two user-provided third-party references without rights confirmation. `jazz-grid-updated-mockup.png` is a newly generated design reference, not production-ready artwork. **Final user-approved direction supersedes all earlier mockups: light throughout, including Practice, and substantially simpler than the busy concept images.**

## FIRST READ (updated after jazz chart/practice research, Oct 28)

Before writing code, read `DESIGN-DECISIONS.md`, `JAZZ-RESEARCH.md`, and `JAZZ-CHART-STANDARD.md`. **The current UI source is `jazz-jazz-chart-ui-preview.html`** (open it in a browser) and the approved five-screen reference is `jazz-grid-updated-mockup.png`. The older dark `jazz-room-prototype.html` is now a historical example of local interactions only. The new chord-grid decisions and visual-approval details override any contrary examples below.

**MVP distinction:** shareable jazz practice *routines and exercises* + readable professional *chord changes* + architecture for **future real recorded stems**. Do not clone iReal Pro, borrow its copyrighted UI graphics, or reproduce copyrighted tune melodies. Build original charts and examples.

**Chart-first, NOT fretboard-first:** When an exercise has an attached chord chart, default Practice > **Chords** view uses a light white/cream *measure grid*, normally 4 bars per row on a tablet/desktop, with readable 2 bars per row on narrow phones where necessary. Include bar numbers, chord names such as Dm7, G7, Cmaj7, F7, Bb7, Bdim7, up to two chords in a 4/4 bar where needed, sections and simple repeat marks. Chord diagrams (guitar/piano fingerings) are optional educational reference *only*, never the default jazz chart. Adjacent **Player** view shows instructions/timer/recorded track metadata and collapsible stem/tempo/key controls. **For rhythm, ear training, or technique exercises without a chord chart, default to instructions/Player instead of showing irrelevant chord changes.** Chart remains readable on mobile. `JAZZ-CHART-STANDARD.md` contains a verified 12-bar original jazz-blues example and structured measure schema. Do not substitute fake musical notation or random chords.

**Copyright/audio ownership:** Sunday uses no unlicensed YouTube downloads. A recording is an optional, replaceable/deletable asset with license, attribution, and source metadata; removing an audio asset must not delete its associated routine or exercise. Berklee demo audio illustrates pedagogical use but is not automatically licensed for reuse. A silent practice timer is acceptable with an honest "No recording attached" state.

**Instrument transposition distinction:** display notation in concert pitch or B♭/E♭ transposed *written pitch* for relevant horns while underlying audio stays in concert pitch. This is separate from actual key-shifting the recording. A chart may transpose as text now; audio shifting MUST be labeled Preview until independently implemented and verified. Same rule for playback tempo vs timer tempo.

**Competitive nuance:** iReal Pro currently has professionally recorded jazz drums in its playback engine, so do not imply that it is strictly synthetic/MIDI. Our eventual differentiation is *full recorded ensemble/stem flexibility plus user-created shareable learning routines*, not the mere existence of real audio.

**Music practice expectations:** include chart position, count-in (optional), practice without backing, loop bars, repeat choruses, metronome on beats 2 & 4 as a future/functional feature if feasible, technique/ear training/transcription/guide-tone exercises, and saveable routines. Loop playback of real recordings only with time-aligned bar markers; a chart-only loop preview may select bar ranges without lying about audio. 12-bar blues and 32-bar AABA are valid form presets; do not invent lyrics/melodies. Responsive controls must be touch sized.

**SUNDAY NON-NEGOTIABLE:** all five pages visually complete, large Home room with taps on piano (Practice), book/sheet music (Exercises), notebook (Saved Routines) AND obvious alternate buttons; time-of-day art and manual override; simplified daily goal, streak, Start Practicing, Today's Practice, Quick Access, Long-Term Goal; Explore has routine list and text-only skill categories; Create ordered text-only exercise list; Practice has switchable Chords/Player plus a correct 12-bar blues grid. Cat appears only on Home and Profile/progress. **All navigation controls have original pixel icons, while browse-by-category tiles and individual exercises contain no icons.** Cats must have exactly one head, four legs (or plausible hidden limbs), two ears, and one tail, no doubled or stray anatomy. Many recognizable jazz instruments in the illustrated room (piano, upright bass, saxophone, trumpet, guitar, drums), without obscuring controls. No fabricated audio playback.

## APPROVED UI DESIGN (must override contradictory prototype/mockups)

**Light theme on every screen, including Practice.** Jazz musicians must be able to read sheet music and chord changes like printed notation, not through a dark-mode filter. The dark bedroom reference describes the *atmosphere* only. Dark navy is permitted for tiny accents/illustrations; never for a main full-screen Practice layout or notation canvas.

- Main background: warm ivory `#F8F6F0`; panels: soft cream `#FFFDF8`; music canvas: pure white `#FFFFFF`; primary text/notation: near-black `#182323`; muted accents: sage `#8DB79C`, dark forest `#315B49`, pale mint `#DDEEDF`, dusty lavender `#B7A7CA`, peach `#F2B6A2`.
- Main Practice surface: bright, large, uncluttered **jazz chord grid by default**, with optional real MusicXML-rendered sheet music when genuinely available. Legible black barlines, chord symbols, measure numbers, and sections; no fretboard diagrams as the primary chart. If no MusicXML exists, do not fake notation. Reserve maximum usable vertical space for the musical material. Avoid atmospheric overlays, texture, rain, animation, and low-contrast text on the score.
- Practice hierarchy: **Chords / Player switcher; chord chart or exercise instructions; playback/timer** first, then collapsible track mixer, tempo/key and other advanced controls. Controls must remain touch-sized and usable while holding an instrument; support portrait phones.
- Visual density: remove exercise icons/thumbnails, icons from browse-by-category tiles, unnecessary card stacks, repeated stats, oversized achievements, noisy gradients and excessive decorative imagery. At most one restrained pixel-art hero per major screen; Home may use a cozy rainy window header, while Create/Practice should be task-first. Use generous whitespace and simple navigation. No dark Practice mode by default.
- Friendly but professional: original pixel-art cat **on Home and Profile only**, plants and warm lighting as small atmosphere; prioritize readable typography and accessible contrast. No animations over sheet music. Reduced-motion support and no automatic audio.
- The preferred reference is the prior **Concept B structural layout, simplified further**, with **its light treatment extended to the Practice page**. Do not recreate Concept A's dark Practice page.

### Home-only dynamic room lighting (approved; implement in Phase 1)

The Home illustration should feel alive through **three time-of-day palettes** applied to the **same room**:

| Device-local time (default) | Mode | Home room art, not page UI |
|---|---|---|
| 06:00–16:59 | Sunshine | Soft daylight, fresh sage greens, pale sky, sunny window |
| 17:00–19:59 | Twilight | Peach/lavender sunset, warm amber lamp, muted shadows |
| 20:00–05:59 | Night | Indigo/violet outside, cozy glowing lamps, faint stars or rain |

**UI constraint:** Every page stays light at all hours. The Practice page remains white/cream with high-contrast black sheet music and chord charts. Time of day alters only the Home room's *illustrated window, scene lighting, and small decorative accents*, never global theme tokens or music notation.

**Implementation:** Use device-local `Date` (no geolocation, sunrise service, weather API, extra costs) plus a small **Auto / Sunshine / Twilight / Night** control on Home. Default Auto; persist manual selection in `localStorage`; update Auto while the page is open and on visibility/focus. Reuse a single layered original pixel-art room illustration with CSS custom properties or three original room images with identical layout. Avoid real-time rerenders every second; minute-level updates are plenty. Provide smooth but subtle transitions only if reduced motion is off. Keep decorative room art separate from data/auth code.

**Exit check:** switch all three modes and Auto manually on mobile; ambience changes without affecting other screens, score contrast, playback, responsive layout, or user data. This is a working UI feature and can be implemented without Supabase.

**Visual acceptance:** all five screens use the light design system; Practice jazz chord grid is readable without zooming at 390px and uses two bars per row as needed; no overwhelming artwork; primary actions obvious; no faux-dark screen; 360px, 390px, and 1280px verified.

## Priority and scope

Prior discussion established these ranks, not verified numerical percentages:
1. Community-created and shareable practice routines, including custom exercises.
2. Adjustability of backing accompaniment, notably instrument mixer, tempo, key, fade-out. High-fidelity stems and upload separation are beyond the Sunday deadline.
3. Guided skill development, personal practice, and gentle gamification.
4. Strong cozy lo-fi pixel-art style across the whole product is a **must-have in the Sunday deliverable**, even for non-working preview features.

**Make all five top-level sections visually polished and navigable:** Home, Explore, Create, Practice, Profile. Every visible control must either function, navigate to a convincing UI preview, or explicitly show a “Coming soon / Preview” state. Never simulate a save, login, publication, audio effect, or sharing action that did not occur.

**Mandatory Sunday working vertical slice:** Google sign-in -> create exercise -> create ordered routine from exercises -> publish public OR unlisted OR private -> open public/unlisted from second browser -> remix as independent copy -> play through timer -> completion saved to progress. Anonymous users can browse *public* routines, and unlisted links with correct tokens; private data stays protected. If OAuth cannot be completed in time, UI prototype remains usable and a test-mode beta can use invited authorized team accounts, but do not claim public accounts work.

**Polished UI-only previews:** friends, community challenges, badges/avatar accessories, long-term goals if not connected, recording/replay, audio stem upload/separation, and advanced mixing. Prefer a small amount of beautiful, coherent UI over repetitive card collections or decorative clutter. Include reduced-motion setting and no autoplay audio.

**Recording-based audio requirement:** The canonical audio asset is a real recording with optional synchronized stems (piano, bass, drums, melody), not a MIDI/synthesis source. The app should support playback of one short, permission-cleared recorded demo and, if stems are supplied, independent stem gain using the Web Audio API. Keep robust track metadata (license, source, bpm, key, sample rate, duration, stem URLs, offsets, original recording credits). Design explicit future adapter boundaries for time-stretch, pitch-shift, and uploaded-track stem separation. Tempo/key/fade-out are clearly marked previews unless genuinely functional on available recorded assets. No synthesized default accompaniment. Do not download or incorporate copyrighted recordings without permission.

**Seed content:** seven instruments (piano, guitar, alto sax, tenor sax, trumpet, bass, drums), at least 10 of the following exercises: scales, blues scales, seventh chord arpeggios, ii–V–I, guide-tone voice leading, call-and-response, melody imitation, swing eighths, chord-tone soloing, walking bass, comping, 12-bar blues. Ten preloaded routine examples (see `jazz-seed-content.json`): My First Jazz Improvisation (15m), Daily Jazz Warm-Up (10m), Learn a Blues Melody (20m), ii–V–I Workout (15m), Swing and Timing Practice (10m), Intermediate Soloing Practice (30m).


## OCT 28 ADDENDUM — compulsory for CURSOR PROMPTS 1–4

**This addendum supersedes earlier conflicting specifications.** Read `CAT-COMPANIONS.md`, `PRACTICE-CURRICULUM.md`, `jazz-seed-content.json`, `jazz-cat-collection.png`, and `cat-starter-code/` before writing UI code.

1. Preload eight free selectable jazz cats (Luna, Milo, Maple, Mochi, Pepper, Patches, Chai, Biscuit). Use ONLY verified `jazz-cat-assets/*.svg` for functional UI: exact one head, two ears, four paws, one tail. Cat chooser lives on Profile and can be opened from room cat. Persist choice locally in phase 1 and via owner-only `profiles.selected_cat_id` during phase 2. Same sprite should appear on Home room, long-term-goal card, and Profile. Subtle breathing motion and reduced-motion preference; no automatic sounds. **Do not leave baked-in calico cat when user selects a different cat**: use a cat-free room background and a separate transparent sprite. Existing three room JPGs have baked-in calico, so they are *concept references*, not final replacement-friendly background assets. Never show cats over charts, exercise lists, or Create forms.
2. Seed app with original `jazz-seed-content.json`: 18 exercises, 10 routines with durations summing correctly, 3 pathways; display a curated subset by default to keep Explore uncluttered. Every exercise needs actionable written instructions, duration, level, category, optional notation/audio. Preserve the existing light, calm, text-only categories and numbered exercise rows.
3. Prioritize a user journey: beginner chooses instrument and short goal → picks a routine → reads measure grid → chooses silence/metronome/recorded accompaniment (when asset exists) → practices → optional reflection and progress. No hard claim about automatic skill mastery.
4. Do NOT ship fake player features: no bundled audio, no actual source stems, no automatic separation or pitch-stable processing. The canonical audio asset representation remains recorded tracks/stems with rights/provenance metadata, not MIDI.
5. Sunday gates now explicitly include cat selection persistence, motion/reduced-motion and 8-cat visual QA. Move optional badges/friends/challenges out of critical path rather than expanding scope.

### Required phase-specific integration instructions

**Append to CURSOR PROMPT 1:** "Copy verified cat SVGs into `public/jazz-cat-assets/`; use `cat-starter-code/CatCompanion.tsx` and `cat-companion.css` as starting code; implement same chosen cat on Home/Profile and localStorage persistence, prevent any background-baked duplicate; test all eight variants. Load `jazz-seed-content.json` into local repository and make short guided practice routines browsable. Maintain 5-page minimal light UX."

**Append to CURSOR PROMPT 2:** "Include `selected_cat_id` on `public.profiles` with a constrained roster and default `luna`; authenticated owners alone may change it. Implement the `CatPreferenceRepository` Supabase adapter; test account isolation and cross-device persistence. Merge the provided optional SQL into the base profiles migration without duplicate constraints."

**Append to CURSOR PROMPT 3:** "Do not let cat choice or seeded content break public/unlisted/private routine RLS. Seed exercises/routines under an explicit seed publisher identity, preserving authorship and no private leaks; test that community browse displays curated routines."

**Append to CURSOR PROMPT 4:** "Perform reduced-motion, 390px mobile, cat count/anatomy, and 3-light-mode checks; review 10 seed routine durations and no-audio behavior. Add status for real-vs-preview features."

## Calendar / release gates

| Date | Focus | Exit gate |
|---|---|---|
| Wed Oct 28 | Working repo and striking polished UI for all screens, with honest preview states | Run locally; phone 375px and desktop 1280px; five screens navigate; Home room cycles through three local-time modes and manual overrides; sample content populated; no JS console or build errors |
| Thu Oct 29 | Exercise + routine builder using mock-data repository interface; install Supabase schema and authentication | Form validation, ordered steps, local creation tested; migration and RLS policies ready; Google login working on localhost where possible |
| Fri Oct 30 | Supabase persistence, visibility/share token, saved/remixed routines, Explore | Cross-browser test: public and unlisted can be opened; private inaccessible; independently remixed copy stays unchanged if source edited |
| Sat Oct 31 | Timers/progress, recording-based player and one lawful short demo if available, visual polish, mobile UX, security tests | Start/pause/skip/finish, persist session, no service role secrets, QA pass for mobile and desktop |
| Sun Nov 1 | Deploy and test with a teammate on a different device; stabilize | Production URL working; share link works; auth callback works; no critical bugs; clear list of preview-only features |

## ONE-TIME USER ACTIONS (minimal)

1. Create or use a **private GitHub repo**; give Cursor permission to initialize and push code. A GitHub account is free.
2. Open/create a free Supabase project and note the project URL and **publishable (or anon) key**. Never paste the `service_role` key into Cursor chat or the frontend. If Cursor can authenticate to the Supabase CLI, it can apply SQL migrations; otherwise paste its reviewed SQL into Supabase SQL Editor once.
3. For public beta sign-ins, configure Google OAuth in Google Cloud and Supabase; register localhost and the production Pages URL as allowed redirect URLs. Supabase's default email server cannot email arbitrary testers. Manual setup of Google's OAuth client ID/secret is unavoidable; use private project settings, not the Vite client bundle.
4. Create free Cloudflare account; connect the GitHub repo to Pages, build command `npm run build`, output folder `dist`, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Cloudflare build env. Configure the Supabase redirect URLs for `http://localhost:5173` and the deployed `https://...pages.dev` URL. Publishable key is meant to be exposed; `service_role` and OAuth secret are not.
5. Disable automatic/overage billing and paid API top-ups. Use an included Cursor model (for example Composer 2.5 if included); avoid paid third-party models. Usage pools differ by plan.

## CURSOR PROMPT 1 — BUILD THE UI FIRST (Wednesday)

> **New approved UI requirement:** The Home room automatically switches between Sunshine (local 06:00–16:59), Twilight (17:00–19:59), and Night (20:00–05:59) using device-local time. Also add a persistent Auto/Sunshine/Twilight/Night control to preview/override the scene. Use the same original pixel-art room for all modes. This **only changes the Home illustration lighting/window**, not the overall light UI, chord sheets, or the Practice screen. Make this functional during Phase 1, motion-safe and without external APIs. Refer to **Home-only dynamic room lighting** above.

Paste into a **new Cursor Agent chat** with `jazz-room-prototype.html` and both bundled visual references available in the repo root:

> Before coding: read `DESIGN-DECISIONS.md`, `JAZZ-RESEARCH.md`, `JAZZ-CHART-STANDARD.md`, and inspect `jazz-jazz-chart-ui-preview.html` plus `jazz-grid-updated-mockup.png`. Implement their layout, light treatment, approved controls, non-icon exercise list, and jazz measure grid. **These supersede older content in this document.**
>
> You are my senior frontend engineer and pixel-art UI designer. Build a production-oriented Vite + React + TypeScript application called **Little Jazz Room**. **Read APPROVED UI DESIGN above before coding; it overrides the old dark HTML prototype and old mockups.** Inspect `jazz-room-prototype.html` for app terminology, layout ideas, and initial sample content, NOT its dark palette. Port appropriate interactions to modular React rather than embedding the HTML as an iframe. Keep routes, components, features, data and services modular with semantic HTML.
>
> **Practice is chart-first.** Implement **Chords / Player** segmented switch with a correct original 12-bar F jazz-blues chart in standard 4-bars-per-line format (responsive 2 per row on phones). Render chords as bar-based events, not guitar chord boxes. Use the `JAZZ-CHART-STANDARD.md` schema; give every bar a tap target and a current-bar highlight (manual tap works; only auto-follow an actual recorded track if timing metadata exists). Show concert/B♭/E♭ written-pitch setting for notation, without claiming it changes recorded audio. A very small `ii–V–I in C` chart is also seeded. Add a readable Player mode with timer and collapsible recording metadata/audio controls marked Preview if unavailable.
>
> **Required art direction: LIGHT EVERYWHERE, INCLUDING PRACTICE.** Build a clean warm-ivory/cream/sage interface with restrained original cozy rainy pixel art, botanical plants and small jazz-cat companions. References guide atmospheric illustrations only; do not make the Practice background midnight blue. Place sheet music/chord charts on a large, plain white, high-contrast notation canvas with dark ink-style symbols. Treat score and playback/timer as primary, audio adjustments as a collapsible secondary panel. Simplify the previous busy mockups: fewer cards and stats, more whitespace, one small illustrated hero at most, task-first Create and Practice screens. No decorative textures or animation behind chords/notes. Use original CSS/SVG artwork or original generated assets, never copied copyrighted images. Reduced-motion toggle; no autoplay. Mobile bottom navigation and desktop sidebar.
>
> Create all five navigable sections: **Home, Explore, Create, Practice, Profile**, plus accessible UI preview entry points for friends, challenges, avatar/badges, long-term goal, recording, and future audio tools. Do NOT omit screens because they lack backend integration. All preview-only features must have an explicit Preview label or honest coming-soon view. No dead buttons. Show the provided instruments, exercises, and ten seed routines. Build a searchable Explore and visual Create exercise/routine editors. Add a routine player with a working client-side timer and a clearly disabled mixer preview; its backing-track domain model must assume real recordings with optional synchronized stems, not MIDI.
>
> Implement a `dataRepository` interface so the app can use a localStorage-backed mock implementation now and a Supabase implementation later. Prefer preserving types and domain functions across the transition. Provide clear TypeScript models and a README explaining what's mock vs working. Use accessible inputs, proper focus, meaningful aria labels, and mobile layouts at 360/390px and desktop 1280px.
>
> Work in small commits. Run installation, typecheck/lint/build, fix errors, and test navigation in a browser if possible. **Do not connect Supabase in this prompt; first make the app look excellent and usable.** Show screenshots or explain how to preview. Do not buy services or enable paid usage. Finish with a short acceptance checklist; do not call an untested feature complete.

**Exit test:** Actually open all five screens, view at phone size, create one local exercise and routine, try timer, test reduced motion. UI is clearly coherent and visually differentiated from a corporate dashboard.

## CURSOR PROMPT 2 — DATA DESIGN + AUTH (Thursday)

> Inspect the existing repository carefully. Preserve the completed visual design. Replace the mock repository with a Supabase adapter without changing existing components unnecessarily. Create version-controlled SQL migrations, a `.env.example`, typed Supabase client, and setup instructions. Do not create a second app or framework.
>
> Include chart-specific models for `chord_charts` (title, concert key, meter, form, feel, creator/visibility/licensing), `chart_bars` (chart id, bar index, section, repeat/ending markers), and ordered `chord_events` (bar id, beat start, beat duration, concert-pitch chord root, quality, bass note, optional display spelling) or a carefully validated per-chart structured JSON document. Favor the minimum secure model needed by Sunday. Do not tie chart notation to a specific audio asset. Optional recording `beat_map`/`bar_markers` map the real recording to the chart later. See `JAZZ-CHART-STANDARD.md`.
>
> Data model: `profiles` (auth.user reference, instrument, weekly goal, optional long-term goal), `exercises` (user-owned or seed-owned; instructions, category, skill level, duration, instrument tags, optional tempo/key/progression and visibility), `routines` (owner, title, description, goal, difficulty, visibility public/unlisted/private, share_token, original_routine_id, original_creator_id), `routine_steps` (routine, position, source exercise id if applicable, step snapshot JSON including full user-facing instructions, minutes, tempo/key), `saved_routines`, `practice_sessions`, and `audio_assets` / `audio_stems` metadata (with source/license/key/BPM/offsets and file URLs), plus optionally `achievements`. Snapshot routine steps on remix so source edits cannot change copies. Use ordered positions enforced unique within a routine. Use database constraints for bounded values and indexes for list queries.
>
> **Security is crucial:** implement Supabase RLS with operation-specific grants and select/insert/update/delete policies. Public routines may be listed to anonymous visitors; private routines only to owners. UNLISTED routines must NOT become enumerable just because anonymous users can query their UUIDs. Implement a carefully reviewed SECURITY DEFINER RPC / Edge Function that takes a high-entropy share token and returns only the sanitized matching unlisted routine and its step snapshots; make token lookup callable without a session, but not general unlisted list queries. Fix `search_path`, make execute grants explicit, and write tests for allow and deny cases. Handle exercising published snapshots without exposing unrelated private exercises or profiles. No access to private recordings, no `service_role` key in the browser or repository, and no secret in `VITE_*` variables.
>
> Implement login/logout using Supabase Google OAuth, clear auth loading/error UI, and ownership-aware pages. Signed-out visitors can browse public and open a valid unlisted share link, but must sign in to save/publish. Keep any account-specific stubs honest if Google OAuth credentials are not yet configured. Make SQL runnable using Supabase CLI or provide one migration to paste in SQL Editor. Test typecheck/build. Summarize EXACT manual steps I must perform in Supabase/Google consoles and the secrets I must not share.

**Exit test:** Migration applies; Google sign-in works for one tester, or blocker accurately identified; RLS tests prohibit unauthorized private reads/writes. No sample data overwritten on migration.

## CURSOR PROMPT 3 — MAKE SHARING REAL (Friday)

> Preserve the existing UI. Implement a full vertical slice end-to-end using the Supabase adapter: create/edit a custom exercise; add/reorder steps to a routine; save draft; publish public, unlisted, or private; search/browse public community routines; generate a shareable unlisted URL with a high-entropy token; open it in a private/incognito window as a signed-out visitor; save an accessible routine; remix it into an independent owned copy and retain creator credit. Show distinct owner/editor and visitor states. Never leak private exercises through routine joins. Do not make up success messages before the database confirms a write. Resolve loading/empty/error states.
>
> Write regression tests for creating, publishing, loading, and remixing. Require all RLS positive AND negative cases to pass, especially anonymous unlisted enumeration, private routine access, and writes from a second user. Run build and tests, then manually test actual share URLs in two browsers. Fix any issues before moving to player/audio. Do not add friends/challenges yet.

**Exit test:** A second person can use the link on a different device; private routines are genuinely inaccessible; edits to the original don't modify remix copies.

## CURSOR PROMPT 4 — PLAYER, POLISH, DEPLOY (Saturday/Sunday)

> Implement/test the selected-bar highlight and the Chords/Player switch. Chart transposition must update *notation only* and be explicitly separate from audio pitch shifting. A loop-bars UI may select measures but should not claim that a recording is looped unless audio timing data supports it.
>
> Keep the Practice screen **light, notation-first, and low-clutter**, never the old dark mockup. Make the practice player fully usable with routine step order, start/pause/skip/finish controls, an accurate session timer, and Supabase session completion records; progress view updates from real data. Create gentle, non-punitive goal/streak messaging. For streaks, count completed practice days using the user's local date and timezone; do not shame for missed days. Keep all preview screens beautifully navigable and clearly labeled.
>
> If the core vertical slice passes its tests, add ONE short, original or appropriately licensed *recorded* jazz backing sample with documented source/license, loaded on an explicit play action via the Web Audio API. The production audio model is a recorded mix and optionally individual synchronized stems with offsets and individual gain controls. Implement stem mixing only when separate real stems are available; otherwise keep independent mixer sliders labeled Preview and nonfunctional. Keep tempo change, key transposition, progressive melody fade, uploaded-track separation, and record/replay as clearly labeled previews unless implemented correctly with real audio. Do not simulate success. Do not preload or autoplay. No MIDI-first/Tone.js implementation. Prioritize the real sharing workflow over audio experiments.
>
> Run all tests and npm build. Test on desktop and mobile widths, fix visual overflow and broken flows. Prepare Cloudflare Pages deployment (GitHub integration, build `npm run build`, output `dist`, env vars), document all Supabase site/callback redirect values, deploy if access allows, and check share links and OAuth on production URL. If you can't log into a console, give me the minimum exact manual clicks and settings. Add a `DEMO_STATUS.md` with a table of working vs preview-only features and the URLs/tests needed to confirm. Commit changes. Do not create paid resources.

**Exit test:** Public site reachable from another device, all five pages attractive, cross-browser share/remix works, timers/progress work, preview controls never pretend to do audio processing.

## CLAUDE OR CHATGPT AUDIT PROMPT (optional, after Friday)

> Act as a skeptical senior engineer reviewing a four-day React/Supabase jazz practice MVP. Read the database migration, RLS policies, unlisted routine RPC, and routine publishing/remixing code supplied. Focus only on critical defects: privilege escalation, private-data leaks, token enumeration, publication leaks from private exercises, invalid auth, loss of independent remix snapshots, missing real database writes, and deployment blockers. Provide a prioritized list of concrete corrections with file/line or SQL references. Do not request a redesign or add features. Never suggest exposing Supabase service-role credentials to the browser.

If the organization's Claude Enterprise access has policy restrictions about personal projects, avoid uploading the repository there. You can instead paste sanitized SQL here in ChatGPT for the same review.

## Fallback rules (save the deadline)

- **If design isn't good by Thursday:** stop backend work briefly and improve Home/Practice/Explore first. A poor UI defeats the primary demonstration goal. Keep all five navigable.
- **If Google OAuth is blocking >1 hour:** secure Supabase data and publish a fully navigable visual preview and sample routine player. Allow only project-team email testing with documented limits; don't present it as public signup. Don't disable confirmation for strangers in production.
- **If unlisted sharing isn't secure:** keep the unlisted interface a clearly labeled preview, ship tested public/private sharing; never make all unlisted rows globally readable.
- **If licensed recorded audio/stems are not ready:** ship the player UI with clear audio-preview labels and a working practice timer. Do not substitute synthesized backing as the main audio architecture.
- **Do not build upload stem separation, a friend graph, competitions, subscription billing, or sophisticated recording storage before Sunday.** They may appear as honest UI previews.

## Minimum launch acceptance check

- [ ] Site opens on phone and desktop, with five navigable polished **light-theme** screens; the correct 12-bar F jazz-blues measure grid is readable in Chords view at 390px, Player view works, and no fretboard is shown by default.
- [ ] Custom exercise and routine creation persists via Supabase after refreshing.
- [ ] Public sharing and unlisted token sharing work in another browser.
- [ ] Private routines and private user data are inaccessible to non-owners.
- [ ] Remix is an independent copy with creator attribution.
- [ ] Practice timers can start/pause/skip/finish; sessions persist.
- [ ] Recording-first audio model and meaningful preview labels for not-yet-functional mixing/tempo/key/stem separation/friends/challenges/badges.
- [ ] No paid services enabled; no secrets committed; production OAuth works.
- [ ] `npm run build` and relevant tests pass; no broken buttons or console errors.

## PROMPT FOR CHATGPT (use before each step, optional but effective)

> You are my product lead and technical QA for Little Jazz Room, a Sunday-deadline React/TypeScript/Supabase jazz practice app. Priorities in order are: (1) user-created, shareable exercises/routines, (2) recording-first adjustable backing-track experience, (3) guided practice/progress, with a **light, uncluttered, notation-first UI on every screen** mandatory. Review the screenshots, current Cursor output, reported build/test results, and files I provide. Return ONLY: blockers (maximum 3), what should change next, one paste-ready Cursor fix prompt, and whether the current phase exit gate genuinely passes. Do not add features or recommend paid products. Do not assume a tested function from a screenshot alone.

## OPTIONAL LOVABLE PROMPT (use ONLY if Cursor UI is struggling)

Do not connect Lovable to Supabase or start a second backend. Use its free credits only if the current Cursor visual UI is poor and you want one independent design direction. Copy ideas manually into Cursor, or export code to GitHub deliberately rather than automatically overwriting the established app.

> Create a *visual-only* prototype for Little Jazz Room, a cozy mobile-first jazz practice app. Build five navigable screens: Home, Explore, Create, Practice, Profile. Highest priorities: shared routines and exercise creator; expressive recording-based player controls (instrument volumes, tempo, key, fade-out displayed as Preview when unimplemented); daily practice timer; progress. Art direction: **light warm-ivory UI on every page including Practice**, white score/chord canvas with dark notation, restrained original pixel art accents, rainy window, plants, sage, peach lights and jazz-playing cat. Simplify clutter, remove excessive cards, no dark Practice background or corporate dashboard. Home is a large interactive illustrated room; other pages use a restrained scene header. Jazz Chords view must display an authentic 12-bar four-measures-per-row jazz chord grid, not guitar fretboard diagrams. Create and browse exercises have NO icons; browse-by-category tiles have NO icons; navigation uses PIXEL icons. Cat only on Home and Profile. Use Chords/Player switcher. One small illustration maximum per non-Home page. Accessible compact controls, mobile bottom navigation, reduced motion. Use local sample data only. No backend or paid integrations. Make any placeholder action clear as a preview.

## QUICK START: USE THESE FILES

1. Unzip the starter. **Read `DESIGN-DECISIONS.md` and open `jazz-jazz-chart-ui-preview.html` first**; use `jazz-grid-updated-mockup.png` as the approved visual reference. Earlier `jazz-room-prototype.html` is legacy content only.
2. In Cursor: **File → Open Folder** → `little-jazz-room`, then **Agent**. Paste CURSOR PROMPT 1. Both inspiration images are already included in this folder. Let Cursor run npm setup and verify screens.
3. When the UI gate passes, create a *private* GitHub repo and free Supabase project. Provide Cursor only project URL and publishable key through `.env.local` (excluded from Git). Run CURSOR PROMPT 2.
4. Configure Google OAuth using the Supabase Google sign-in documentation. Put the OAuth client secret only in Supabase's provider settings. Have Cursor explain exact dashboard clicks and redirects.
5. Use CURSOR PROMPT 3 and verify public/unlisted/private access with separate sessions.
6. Use CURSOR PROMPT 4. Connect GitHub to Cloudflare Pages (build `npm run build`, output `dist`). Check the deployed site from a second phone.
7. Use the CLAUDE OR CHATGPT AUDIT PROMPT to check code/security only after Friday's sharing build. If Enterprise Claude disallows personal projects, use ChatGPT for the audit.

**Reminder:** Use the original recorded track and synchronized stem model throughout. Even a polished preview of tempo/key controls must never claim to transform an actual recording until the processing exists.

## Mandatory cat visual update — distinct bodies and ages (Oct 28)

This section supersedes any earlier instruction that all eight cat sprites have identical silhouettes. Keep the eight IDs and names but use the **new** `jazz-cat-assets/` files and `cats.json` with age/build fields, not previous mockups. Specific visible archetypes: kitten Mochi, slim adult Milo, slender Chai, lean young Maple, medium Luna, fluffy senior Pepper, chubby Patches, and large round Biscuit. Preserve selected-cat persistence, gentle motion and reduced-motion support. Faces must be coherent: exactly two aligned eyes, centered nose, mouth, two ears; one tail, four paws, one head. Check at 48, 64, and 120 px. For UI production, a single chosen transparent sprite overlays a **cat-free** room background so switching cats never leaves a second baked-in one. No cats on music/chord canvases. The React starter code, interactive HTML demo, and docs have been updated. No Supabase schema changes needed beyond `selected_cat_id` already planned.

### Non-negotiable updated cat QA gate (second visual audit)
See `CAT-ANATOMY-AUDIT-ROUND2.md`: latest multi-pose image still FAILS. Use only canonical `jazz-cat-assets/*.svg` as the current idle sprite; use nonmorphing 1-2px breathing/bobbing. Do not claim six different animated states are present or verified. Run `python verify-static-cat-structure.py`, then manually review 48px / 128px renders and selection across day parts. The generated visual board has two poses beneath three labels for seven cats and an ambiguous Practice Patches. New per-pose art requires six actual poses, correct action semantics, and visual checks of appendage attachment and transitions before inclusion.
