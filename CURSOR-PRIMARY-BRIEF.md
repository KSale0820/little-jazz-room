# CURSOR PRIMARY BRIEF — Little Jazz Room

Read `START-HERE.md` and `FINAL-DESIGN-LOCK.md` FIRST. The approved image `APPROVED-VISUAL-REFERENCE.png` is **the** visual specification; preserve the light, minimal, jazz-forward look. Older boards and lengthy historical plans are reference only. Build a deployable **Vite + React + TypeScript** web app with Supabase Auth/Postgres/RLS, Cloudflare Pages hosting and a GitHub repo; $0 incremental spend, no paid AI APIs or Lovable.

## Scope (Sunday November 1, 2026)

**Team-only authentication:** Owner and teammates are pre-provisioned with separate Supabase email/password accounts, public signup disabled, no SMTP/Google OAuth. Anonymous people may view *public* routines and original seed studies without accounts; must authenticate to save/remix/publish. Details `TEAM-BETA-AUTH.md`.

**Mandatory working workflow:** choose profile/companion -> discover 27 exercises and 11 structured original chord studies -> create/edit an exercise -> create/reorder a multi-exercise routine -> save to Supabase -> publish PUBLIC/PRIVATE -> browse public -> share public link -> second team account remixes independent step snapshots -> start/pause/skip/finish a silent/metronome practice routine -> database progress persists. For unlisted, token-based sanitized share access only if audited; otherwise show disabled Preview. Keep 14 starter routines and three paths as seeded sample content. Clearly distinguish demo seed content from real user-published routines.

**Mandatory visual:** five navigable screens **Home, Explore, Create, Practice, Profile**. Exact approved hierarchy in `FINAL-DESIGN-LOCK.md`. Interactive big Home room, cat-free scenery with Sunshine/Twilight/Night+Auto, 8 distinct selected jazz cats on Home/Profile (optional unobtrusive Practice scene below controls). Same selected cat across app. All notation/chord grids on bright ivory and fully readable; jazz charts are bars/measures **NOT fretboxes**. Two chart bars per phone row (four on wider screens), proper chord timing and readable number/section/loop labels; separate notational transpose and B♭/E♭ instrument written-pitch toggle from recorded audio processing. No icons in exercise rows or Browse by Category cards; pixel-icons on app nav and quick actions. Home: daily goal, nonpunitive streak, Today's Practice, large Start, Quick Access, long-term goal. Companions selectable with eight original character coats/ages/builds/jazz roles; some accessories, not all. Sprite files are tagged geometry but still require visual check.

**Recording-first:** future real mixed recordings + optional separately licensed synchronized stems are the audio sources. None bundled or assumed licensed. Exercises/routines work without audio. Audio metadata can be replaced/deleted independently; never claim working pitch/time shift, recording or AI stem separation. Disable controls for nonexistent audio capabilities. See `AUDIO-DATA-CONTRACT.md`.

## Deliverable steps

**Phase 1 UI:** Implement complete functional local React prototype, mobile/desktop, theme, all five screens, eleven chart picker, cat chooser with chosen cat persistence, seed routines, local create/reorder, timer, accessible labels, reduced motion. Honor `FINAL-DESIGN-LOCK.md`; use approved image as guide but don't embed collage as a functioning UI. Create same-layout CAT-FREE illustrated room art for all time modes; do not use the old JPG with a permanent cat. Cat role instruments may be staged as separate decor when anatomically safe; exactly one selected cat visible in room. Run `python validate_suite.py`, npm build and browser smoke tests. Stop and request UI approval.

**Phase 2 data:** Add version-controlled Supabase migrations, schema, profile/settings, exercises, routine step snapshots, saved/remixed routines, practice sessions, long-term goal, audio metadata, minimal rewards. Write owner-only RLS and explicit public reads. Sign in/out with precreated accounts. Use publishable key only in Vite env; never expose service_role. Backend adapter preserves domain API. RLS test user A, B, anonymous; fail closed. See `SUPABASE-SECURITY-TESTS.md`.

**Phase 3 sharing:** Real save/publish/share with public/private; distinct independent remix copies and creator attribution; no private exercise/profile leaks through joins; unlisted token only if positive/negative security tests pass. Test cross-account and anonymous; show real loading and error states.

**Phase 4 practice/deploy:** Accurate timer and step advancement, persisted sessions/history/streak; appropriate no-recording state; metronome if actually built/tested; focus mode and reduced motion; validate B♭/E♭ chord notation, form sections and chart switching. Cloudflare Pages production deploy; test share links, redirects, refresh and mobile with team devices. Create `DEMO_STATUS.md` marking WORKING/PREVIEW/BLOCKED truthfully.

## Explicit non-goals for Sunday

AI stem separation, licensed recording catalog, professional audio time stretching and pitch shifting, user uploads, recording/replay, full sheet music engraving, dedicated friends feed, user-generated challenges backend, leaderboards, streak shame, complex rewards/economy, animations beyond gentle verified idle, public signup, password reset/email infrastructure.

## Release gates

Use `MVP-LAUNCH-GATES.md` for *objective* acceptance. If privacy/security cannot be verified, do not loosen RLS or silently ship. Public/private first; unlisted remains clearly disabled Preview if not audited. Real routine save and sharing is more important than optional visual extras. Do not claim tests you have not run. Project owner handles only external console authorizations and visual sign-off.
