# V3 controller status: approved three-cat Pixel Studio (2026-11-05)

**This V3 section supersedes the older V2 and V1 cat-roster/fallback instructions preserved below as history.** The owner acceptance source is [issue #75](https://github.com/KSale0820/little-jazz-room/issues/75). PR [#59](https://github.com/KSale0820/little-jazz-room/pull/59) remains **DRAFT, not merged to class-demo/master, not deployed**.

## Integrated behavior and visual changes

- **Only Luna, Milo and Maple are visible selectable companions**, with new 160px pixel sitting/sleeping artwork across Profile avatar/chooser, legacy Home, Tuner, Metronome and Progress. The original eight IDs/asset binaries remain archived for backwards compatibility; five retired identities are no longer selectable and do **not** render their October illustrations.
- Retired saved IDs are **non-destructively resolved to Luna**, with the previous ID saved in the account-scoped `little-jazz-room:selected-cat:v1[:account]:retired-cat-id:v1` backup. New explicit supported choices persist normally. Existing sessions, achievements, unlocks, audio, charts, routines and cloud history are not cleared; a retired remote ID is resolved locally without altering its remote record or overriding a newer supported local choice.
- Progress companion **always visible**: Cat Mode OFF uses a new **sleeping** PNG and ON uses a new **sitting** PNG for the same selected cat. Existing footprint and Change button remain. Optional Tuner/Metronome/legacy Home cats are ON-only and preserve their hidden footprints. New pixel artwork is used for Profile/chooser/rewards regardless of mode. Historical art is preserved in files but not used in active rendering.
- The original Practice/Player layout, charts, navigation, control positions, recorded backing track architecture and audio behavior are locked. Midnight Jazz/Sunny Studio themes, AA chord contrast, loop/playhead distinctions and active-tab pixels remain. [PR #74](https://github.com/KSale0820/little-jazz-room/pull/74) delivered the 19 owner-approved color PNG motifs; [#76](https://github.com/KSale0820/little-jazz-room/pull/76) placed small full-color motifs on Tracks/Charts/Routines; [#77](https://github.com/KSale0820/little-jazz-room/pull/77) rebased Agent 2's stage motifs on the new roster with no geometry changes. The stale source PR #73 was closed after its one CSS file was verified byte-identical to the merged #77.
- Live tests now assert the **three-choice roster**, no old cat asset URLs on active screens, both modes for each current companion, unchanged positioning, and offline legacy ID migration for Mochi/Pepper/Patches/Chai/Biscuit with saved-session retention. A new unit test checks account-scoped backup and unrelated stored achievements/sessions preservation.

## QA and final gate

PRs #76 and #77 each passed build/unit, Clean Pixel Light/Dark × Cat Mode 390×844 and 375×667 mobile appearance matrix, and native scaffold workflows **before** integration. Latest all-screens integrated CI is monitored separately at the exact integration head. [PR #77 full screenshot artifact](https://github.com/KSale0820/little-jazz-room/actions/runs/41986811339/artifacts/13396292275) visually confirms no Practice/Player chart control displacement and new subtle full-color motifs.

**Owner approval still blocked by Luna art**: the new Luna pixel sitting/sleeping files need revised black/orange/white calico patch fidelity and individual dark/light sprite review. Agent 3 owns only this new raster correction. Superseded all-eight expansion issues #70/#71/#72 were closed not-planned per owner decision; no additional five-cat art is authorized. Physical-device/iPhone microphone-latency validation and exhaustive manual modal review remain unclaimed. No demo/master merge or deployment without owner approval.

---

## V2 QA checkpoint: November 5, 2026

- **Current validated integration SHA:** `a99e1c3691d84911ea5eddd23e462391159f5e09`; [all 11 GitHub workflows passed](https://github.com/KSale0820/little-jazz-room/actions/runs/41982272750) (appearance matrix) and [cross-screen integration passed](https://github.com/KSale0820/little-jazz-room/actions/runs/41982281041). Build, unit tests, recording/audio, mobile chart/routine workflows, tuner, metronome and Android/native scaffold checks passed.
- **Root cause resolved:** old `check-class-demo-progress.mjs` originally forced decorative Cat Mode ON at every navigation/reload. Its ON→OFF identity test therefore timed out. The fixture now sets Cat Mode ON only when absent, permitting the saved OFF preference to persist across reload. It exercises **all eight cats** in both modes, including 160px pixel sprite replacements for Luna, Milo and Maple and 128px approved fallback artwork for the remaining five. Cat identity, visibility and screen footprint are preserved in both modes.
- **Visual QA:** inspected [latest combined screenshot artifacts](https://github.com/KSale0820/little-jazz-room/actions/runs/41982272750/artifacts/13394556466) at 390×844 (both palettes, Practice, Player, Progress, Tuner, Metronome, Profile). Current UI is usable and cohesive; Practice/Player still read more like standard rounded controls than full pixel-art mood-board designs. A deliberately limited pixel-corner/motif finishing pass remains an **aesthetic recommendation**, not a functional defect.
- **Recent PRs:** [#68](https://github.com/KSale0820/little-jazz-room/pull/68) adds verified 3-cat pixel sprites plus refined botanical/music motifs; [#69](https://github.com/KSale0820/little-jazz-room/pull/69) corrects Midnight Tuner gauge colors and Metronome slider styling. Main [#59](https://github.com/KSale0820/little-jazz-room/pull/59) remains **draft and not merged/deployed**.
- **Open art-quality decision:** Luna's new sleeping/sitting sprites are visually less faithful to her strongly black/orange/white approved calico design than desired; report filed on #68. Other five cat identities still lack individually verified pixel PNGs, and Cat Mode ON intentionally falls back to original approved artwork. Full eight-cat pixel parity is not claimed.
- No physical-device signoff, exhaustive all-dialog focus/disabled visual review or on-device microphone timing validation has been performed.

# V2 live status: Cozy Pixel refinement (2026-11-05)

This section **supersedes the original V1 implementation report below**, which is retained for provenance. See `CLEAN-PIXEL-THEMES.md` for current palette and Cat Mode API. All changes are on `integration/clean-pixel-themes`, review PR [#59](https://github.com/KSale0820/little-jazz-room/pull/59) remains **draft; no visual refresh changes merged to demo/master or deployed**.

**Implemented on integration**
- Midnight Jazz dark palette (deep plum, lavender, muted pink), Sunny Studio light palette (warm ivory, sage), semantic notation and pixel accent tokens; system-first preference and explicit Light/Dark persistence unchanged.
- Progress shows selected companion in both Cat Modes, **OFF original approved sleeping** and **ON verified pixel sprite** where available. Change-companion button, speech bubble, avatars and rewards remain visible. Tuner/Metronome optional cats are hidden OFF but retain their footprint.
- Shared Player free-grid/full-sheet selected, looped and active-playhead contrast safeguards; real-browser AA chord contrast checks.
- [#62](https://github.com/KSale0820/little-jazz-room/pull/62): clean semantic cascade for remaining Charts/Routines/legacy views.
- [#63](https://github.com/KSale0820/little-jazz-room/pull/63): screen-only Practice/Player cozy pixel and notation highlights.
- [#64](https://github.com/KSale0820/little-jazz-room/pull/64): screen-only Chart/Tracks/Routine accents; stale controller duplicate #66 closed unmerged.
- [#65](https://github.com/KSale0820/little-jazz-room/pull/65): Tuner/Metronome/Progress stage accents; stale controller duplicate #67 closed unmerged.
- [#68](https://github.com/KSale0820/little-jazz-room/pull/68): strict-validated 160×160 transparent pixel **sleeping and sitting variants for Luna, Milo and Maple**, and small botanical/music SVG motifs. Approved original images remain untouched.

**Automated validation**
- Build/unit, class-demo saved session paths, routine/chart builder, recorded audio regression, native scaffold and tuner browser checks ran on each batch. The [combined mobile appearance matrix](https://github.com/KSale0820/little-jazz-room/actions/runs/41979058900) passed after #63; [pixel sprite batch CI](https://github.com/KSale0820/little-jazz-room/pull/68) passed build, full matrix and native scaffold prior to merge.
- Matrix explicitly checks Light/Dark × Cat Mode ON/OFF at 390×844 and 375×667, Progress cat visibility and footprint, scene-cat OFF/ON behavior, chart chord contrast ≥4.5:1 including selected state, distinct loop/playhead cues, palette-appropriate Tuner reference contrast and no horizontal overflow.
- Final post-#68 sprite-source assertion and combined-code CI run at current head remain to be confirmed; do not claim final user signoff until their results are green and screenshots reviewed.

**Known remaining scope**
- Pixel sleeping/sitting variants for **Mochi, Pepper, Patches, Chai, Biscuit** have not been provided or verified. ON falls back to the approved original for those identities. This is safe but **not complete eight-cat visual parity**.
- Mood boards are color/pixel-art direction references, not permission to recreate full illustrated rooms, alter chart grid or move buttons.
- No physical-device/iPhone microphone-latency validation and not every dialog/focus state manually inspected. Do not merge PR #59 or deploy without explicit final approval.

---

# Clean Pixel Themes: final integration ledger

Integration branch: `integration/clean-pixel-themes`, based on `class-demo-2026-10-31` at `35beaad`. **The controller has not merged theme changes into demo or master and has not deployed.** Demo independently advanced to `dc9ec97` when PR #49 was merged by a separate workflow during this update. The final integration-to-demo PR requires explicit owner approval before merge.

## Implemented

| Owner | Scope | Merged batch |
| --- | --- | --- |
| Controller | Contract, root AGENTS.md, palettes/semantic aliases, system-first/no-flash preference bootstrap and persistence, Settings/Appearance Light/Dark + Cat Mode, CSS focus/disabled/contrast, QA workflow | Direct commits |
| Agent 2 | Practice Hub, shared Player, Completion and chart notation, no logic changes | [#53](https://github.com/KSale0820/little-jazz-room/pull/53) |
| Agent 2 | Tracks and chart library/editor, no logic changes | [#54](https://github.com/KSale0820/little-jazz-room/pull/54) |
| Agent 2 | Routine Library, Routine Builder, picker/draft UI | [#55](https://github.com/KSale0820/little-jazz-room/pull/55) |
| Agent 2 | Tuner, Metronome and Progress presentation | [#56](https://github.com/KSale0820/little-jazz-room/pull/56) |
| Agent 2 | Legacy Home/Explore/sign-in visuals, preserves existing routes/control geometry | [#57](https://github.com/KSale0820/little-jazz-room/pull/57) |
| Agent 3 | Pixel plant/leaves/music-note SVGs, central asset mapping and tests, reusable `DecorativeCat`, individual cat light/dark QA contact sheet | [#52](https://github.com/KSale0820/little-jazz-room/pull/52) |
| Agent 2 | Wire existing decorative Home/Progress/Tuner/Metronome placements, sparse motifs on existing backgrounds, notation contrast refinements | [#58](https://github.com/KSale0820/little-jazz-room/pull/58) |

Cat Mode defaults OFF, hides **only decorative cat placements**, retains their geometry and does not alter profile avatars, selection, completion rewards, achievements, unlocks or stored sessions. Approved sleeping 128px pixel sprites are reused with crisp rendering; existing approved sitting art retained. No new unverified pixel-cat raster poses were generated.

The active demo navigation remains Practice-first and retains its four current tabs. Legacy Home stays a legacy component: its illustrated room is hidden, original clickable footprints remain, and sparse pixel motifs are used instead. No unused October handoff navigation has been reinstated.

## Validated

Script `web/scripts/check-clean-pixel-themes.mjs` captures Practice, Player, Profile, Progress, Tuner and Metronome at both 390×844 and 375×667, across Light/Dark × Cat Mode ON/OFF, and checks first-load appearance, explicit preference reload, four-tab layout, overflow, selected chart cells, cat visibility, stable cat bounding rectangles, and avatar visibility. Additional existing browser scripts validate session save/reload, Chart → Practice → Finish → Progress, and Chart → Exercise → Routine → Practice. All run with `npm run build` and `npm test`.

- [Foundation CI PASS](https://github.com/KSale0820/little-jazz-room/actions/runs/41971787973): `32f9f367`.
- [P01/P02 combined CI PASS](https://github.com/KSale0820/little-jazz-room/actions/runs/41972117478): `2f59641c`.
- [Tracks/Charts CI PASS](https://github.com/KSale0820/little-jazz-room/actions/runs/41972344142): `09a2817d`.
- [Routines CI PASS](https://github.com/KSale0820/little-jazz-room/actions/runs/41972426116): `f3d8cd08`.
- [Home/legacy CI PASS](https://github.com/KSale0820/little-jazz-room/actions/runs/41972862635): `8d04bba4`.
- [Strict Cat Mode footprint/persistence CI PASS](https://github.com/KSale0820/little-jazz-room/actions/runs/41973187348): `975ed3c2`.
- [Merged asset component CI PASS](https://github.com/KSale0820/little-jazz-room/actions/runs/41973107873): `342197d8`.
- [Final decorative placements PR #58 CI PASS](https://github.com/KSale0820/little-jazz-room/pull/58): web build, full browser theme matrix and tuner microphone E2E on PR head `800a0fd7`; web build, theme matrix, tuner microphone and native-audio checks all passed on final PR #58 head `800a0fd7`.
- [Final merged integration CI](https://github.com/KSale0820/little-jazz-room/actions/runs/41973927172): `d619cbe3` full run launched after merging the final placement batch; check run conclusion for last combined result. Representative PNG screenshot and JSON result artifact is attached under **Artifacts → clean-pixel-mobile-qa**.

## Remaining risks and nonclaims

- Browser/mobile emulation and CI do **not** establish physical iPhone/Android visual quality, on-device microphone latency, real recorded-track playback quality or native audio behavior. Existing audio/tuner/metronome/routine implementation was preserved; no new feature implementation is claimed.
- All reachable layouts were given semantic paint and browser structural checks, but not every dialog/disabled/focus combination was manually reviewed from screenshots. Physical-device QA and aesthetic signoff remain recommended before merging to demo.
- Legacy Home lighting preference remains stored; illustrated lighting background is intentionally suppressed in clean themes, so that legacy visual effect is not visible.
- No new cat poses/animations or new raster replacements; original verified pixel sleeping sprites were judged usable as-is. Art-style review may request future refinements.
- PR #49 (player control redesign) was merged **independently by another workflow** into the demo branch at `dc9ec97`. Theme integration incorporates the updated demo contents; no unrelated PR was merged by the visual-update controller. The theme final PR compares only the theme changes against this new demo baseline.
