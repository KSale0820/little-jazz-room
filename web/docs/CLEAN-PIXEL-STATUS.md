# Clean Pixel Integration: rolling status and defects

Controller branch: `integration/clean-pixel-themes` (base `class-demo-2026-10-31` @ `35beaad`). Never merge into demo/master or deploy without owner signoff.

## Integrated
- Theme contract, root agent instructions, global semantic palettes, no-flash bootstrap, persisted Light/Dark and Cat Mode, existing Profile/Settings appearance controls.
- PR [#53](https://github.com/KSale0820/little-jazz-room/pull/53): screen semantic styling for Practice hub, shared Player, Finish. No runtime behavior edits.
- PR [#54](https://github.com/KSale0820/little-jazz-room/pull/54): Tracks, chart library/editor semantic styling. No runtime behavior edits.
- PR [#55](https://github.com/KSale0820/little-jazz-room/pull/55): Routine Library and Builder styling. No runtime behavior edits.
- Controller Profile color/contrast corrections.

## Validation, by exact integration SHA
- `32f9f367`: **PASS** `npm run build`, unit tests, Light/Dark x Cat Mode x (390x844, 375x667) mobile screenshot matrix, first-use system theme and reload persistence, current class-demo integration, and chart > practice > finish > progress and chart > exercise > routine > practice/reload. [GitHub Actions](https://github.com/KSale0820/little-jazz-room/actions/runs/41971787973). This was foundation-only.
- `2f59641c` (P01/P02 merged): **PASS** entire above suite. [GitHub Actions](https://github.com/KSale0820/little-jazz-room/actions/runs/41972117478).
- `09a2817d` (Tracks/Charts merged): pending final GitHub Actions result at time of entry. [Run](https://github.com/KSale0820/little-jazz-room/actions/runs/41972344142).
- `f3d8cd08` (Routines/Builder merged): pending final GitHub Actions result at time of entry. [Run](https://github.com/KSale0820/little-jazz-room/actions/runs/41972426116).

## Remaining or not yet tested
- Agent 2: Home, Progress, Tuner, Metronome, other reachable/legacy screens, removal of illustrated large backgrounds, preserving existing control geometry; PR #56 incoming.
- Agent 3: pixel plant/music-note motifs, reusable DecorativeCat, original-art audit and placement mapping; PR #52 incoming, temporarily blocked by exact approved asset library manifest test until its new 3 SVGs are properly registered.
- Cat Mode needs to cover all existing **decorative** slots including tuner/metronome; independent avatars, rewards, progress remain visible in either mode. Current controller CSS temporarily gates Home and Progress.
- No independently reviewed side-by-side screenshots for every screen yet. No claim of actual-device AAC looping, microphone acquisition, recording or native audio verification from browser-only tests.
- Separate PR #49 player controls redesign and all unrelated PRs are deliberately unmerged.

This file is an execution ledger, not product sign-off. All checks after new batches must be rerun at that exact SHA; known failures must be isolated from regressions.
