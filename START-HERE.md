# START HERE — Little Jazz Room (final handoff, Oct 28, 2026)

**Goal:** team-only, no-new-spend beta by **Sunday November 1, 2026**. This is a **Cursor starter kit**, not yet a finished React/Supabase app.

**Already decided:** The final approved look is `APPROVED-VISUAL-REFERENCE.png`; clean LIGHT app UI, large interactive Home room, eight personalized jazz cats, iReal-like measure grids, recording-first audio architecture, shared routines, 11 original harmonic studies, 27 exercises, 14 routines, 3 paths, manually created team accounts, no public registration.

## Do this

1. Extract ZIP, then open the **`little-jazz-room` folder** in Cursor (the folder, not just a file). Attach/open `APPROVED-VISUAL-REFERENCE.png` in Cursor Agent as a visual reference.
2. Start **Cursor Agent**. Paste **PROMPT 1** below. It must read `CURSOR-PRIMARY-BRIEF.md`, `FINAL-DESIGN-LOCK.md` and `MVP-LAUNCH-GATES.md` **before coding**.
3. When Cursor reports Phase 1 finished, **look at the app yourself on a phone-width preview**, especially the selected cat and Home controls. Do not advance until `MVP-LAUNCH-GATES.md` Phase 1 passes. Then paste Phase 2/3/4 in `CURSOR-PROMPTS-TEAM.md`, one at a time.
4. Only actions you need in consoles: GitHub repo authorization; create free Supabase project, disable public signup and provision **individual email/password team users** (see `TEAM-BETA-AUTH.md`); connect free Cloudflare Pages; test a shared link with a teammate.
5. **Never enable overage or pay-as-you-go billing**. No Lovable credits needed. Do not paste privileged keys, passwords, or unlicensed audio into AI chats.

### PROMPT 1 — COPY INTO CURSOR AGENT

> You are my lead React/TypeScript engineer and visual implementer. Read `CURSOR-PRIMARY-BRIEF.md`, `FINAL-DESIGN-LOCK.md`, `CAT-JAZZ-IDENTITIES.md`, and `MVP-LAUNCH-GATES.md` completely before making edits. Use `APPROVED-VISUAL-REFERENCE.png` as the primary approved visual; preserve its clean airy LIGHT UI and distinctive jazz cats, but do not use malformed AI collage cats as production sprites. Start from the current starter suite, build a real mobile-first Vite React TypeScript app with five working screens and local repository adapter. Incorporate the 11 real structured original chord grids, 27 exercises, 14 routines, 3 paths, working local routine/exercise creation and practice timer, selected cat on Home and Profile, a large cat-free illustrated room whose sunshine/twilight/night states share the same layout, and accessible room object links. Be faithful to the five-screen composition and original selected cats. A small optional companion BELOW Practice controls may be shown, never on music notation. Keep exercise/category lists text-only and pixel icons only for navigation/quick actions. The cat's jazz instrument is a *role* and separate scene prop; do not introduce extra limbs by compositing instruments over the face. Do not connect Supabase until Phase 1 passes. Run `python validate_suite.py`, install/build/lint/typecheck and browser smoke tests at 390px + desktop; identify blockers honestly. Do not ask me to do code or purchase services. Commit finished Phase 1, give me the local preview URL, screenshots, objective test results, and stop for my UI approval.

## Authority order (when docs differ)

1. `START-HERE.md` + `CURSOR-PRIMARY-BRIEF.md` + `FINAL-DESIGN-LOCK.md`
2. `MVP-LAUNCH-GATES.md`, `CURSOR-PROMPTS-TEAM.md`, `SUNDAY-TEAM-BETA.md`
3. `CAT-COMPANIONS.md`, `CAT-JAZZ-IDENTITIES.*`, `JAZZ-CHART-STANDARD.md`, `POPULAR-STANDARDS-CHARTS.md`, `PRACTICE-CURRICULUM.md`, `AUDIO-DATA-CONTRACT.md`, `TEAM-BETA-AUTH.md`, `SUPABASE-SECURITY-TESTS.md`
4. `archive/`, `reference-only/`, legacy static HTML and previous mood-board art **historical/reference only**, never overwrite approved decisions.

**Tested here:** JSON/data links, chart bar/beat integrity, cat SVG structure and preview JavaScript syntax. **Not tested here:** a working React build, Supabase, Cloudflare, full browser journey, or real audio.

For a line-by-line cross-check against the entire conversation, see `FEATURE-COVERAGE-MATRIX.md`.
