# Phase 1 test results — October 28, 2026

## Commands run

| Check | Result |
|--------|--------|
| `python validate_suite.py` (repo root) | **PASS** (8 cats, 27 exercises, 14 routines, 11 charts, 3 paths) |
| `npm install` (`web/`) | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** (Vite production bundle) |
| `npm run lint` (oxlint) | **PASS** (warnings only, no errors) |

## Local preview

- **Dev URL:** http://localhost:5173/
- **Production preview:** `cd web && npm run preview` (after `npm run build`)

## Browser smoke (automated)

Viewport **390×844** (mobile) and **1280×900** (desktop):

| Journey | Result |
|---------|--------|
| Home loads: room hotspots, fallback buttons, daily goal, streak, Start, Today's Practice, Quick Access, long-term goal | **PASS** |
| Room lighting Auto / manual override | **PASS** (palette shifts; app chrome stays light) |
| Nav: all five tabs | **PASS** |
| Explore: 27 exercises + 14 routines + 3 paths visible; text-only rows; category tiles without icons | **PASS** |
| Practice: 11-chart picker; measure grid 2 cols; B♭/E♭ written pitch controls; timer start; focus mode; companion below controls | **PASS** |
| Create: reorder steps, save local exercise/routine, publish labeled Preview | **PASS** (manual form) |
| Profile: 8-cat chooser with instrument labels; selection persists (localStorage) | **PASS** |
| Horizontal overflow at 390px (`scrollWidth === clientWidth`) | **PASS** (390 === 390 on Practice) |

Screenshots: `web/phase1-screenshots/` (`home-mobile-390.png`, `practice-mobile-390.png`).

## MVP-LAUNCH-GATES Phase 1 — honest status

| Gate item | Status |
|-----------|--------|
| Vite React TS five screens | **PASS** |
| Resembles approved light UI | **PARTIAL** — layout/tokens match brief; Home room is new **cat-free SVG** (not final pixel-art parity with collage) |
| Cat-free room same layout, three light modes | **PASS** (SVG + CSS variables) |
| Eight SVG cats, chooser roles, Practice companion optional | **PASS** |
| Eleven charts, bar integrity, chart_id on exercises | **PASS** (data + UI) |
| Local create/reorder + timer | **PASS** |
| Supabase | **Not started** (by design until Phase 1 approval) |

## Known blockers / follow-ups (not Phase 1 stop-the-line)

1. **Room illustration fidelity** — functional cat-free scene; artist pass needed to match `APPROVED-VISUAL-REFERENCE.png` pixel richness.
2. **Desktop layout** — centered phone frame; no full-width sidebar nav yet (acceptable for mobile-first Phase 1).
3. **Metronome, audio, publish/share** — correctly **Preview/disabled**; no backend.
4. **Routine step engine** — timer + first-step chart link; full multi-step routine runner deferred to Phase 4 polish.
5. **`validate_suite.py` on Windows** — fixed UTF-8 write for preview JS check (Unicode arrows in HTML).

## Stop line

**Awaiting your UI approval** before Phase 2 (Supabase + RLS).
