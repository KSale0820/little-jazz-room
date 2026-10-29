# Phase 1 correction — test results (Oct 29, 2026)

## Automated

| Command | Result |
|---------|--------|
| `npm run typecheck` | **Pass** |
| `npm run lint` | **Pass** (oxlint warnings only; no errors) |
| `npm run build` | **Pass** |
| `python ../validate_suite.py` | **Pass** |

## Browser interactions (manual, http://localhost:5174)

| Test | Result |
|------|--------|
| Home → Start Practicing | **Pass** → `/practice` |
| Home hotspots (Piano / stand / notebook) | **Pass** → Practice / Explore / Profile |
| Practice Next/Previous exercise | **Pass** — step 1 → 2, title/instructions update |
| Explore Drums filter | **Pass** — routines list empty + message (filter active) |
| Recorded stems control | **Pass** — disabled with Preview label |
| Profile calendar month controls | **Present** — prev/next month buttons |
| Desktop ≥1280px Home | **Pass** — sidebar visible, bottom nav hidden (see `home-desktop.png`) |

**Failed tests:** none observed in this pass.

**Not run here:** session Finish → Home stats increment (requires timed interaction + navigation); recommend one manual Finish to confirm live streak update (logic uses `addSession` + context `sessions`).

## Screenshots (`web/phase1-screenshots/`)

- `home-mobile.png` (390×844 emulation)
- `explore-mobile.png`
- `create-mobile.png`
- `practice-mobile.png`
- `profile-mobile.png`
- `home-desktop.png` (1280×900)

## Known gaps (Phase 1)

- Seed exercises have no dedicated `instruments[]` field; Explore filtering uses keyword metadata on title/instructions/material (honest but imperfect).
- Home room uses cat-free `home-room-base.png` crops (design lock); not a pixel-perfect export of every collage detail in `APPROVED-VISUAL-REFERENCE.png`.
- Practice **Scales** tab still omitted until scale content is wired.
- Oxlint React hook/style warnings remain (non-blocking).
- Supabase / Phase 2 not started (per stop instruction).
