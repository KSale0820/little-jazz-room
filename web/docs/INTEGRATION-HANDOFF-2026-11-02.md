# Little Jazz Room — Class-Demo Integration Handoff

**Snapshot:** November 2, 2026, after P02 PR #19 merged. **Source of truth:** `KSale0820/little-jazz-room`, branch `class-demo-2026-10-31`, merge commit `a8c08918b6ac625489075217866183e3969d68a7` (before this documentation commit).

> This handoff supersedes older first-build/task descriptions that said P02, P04/P05, approved art binaries, and certain browser checks were still missing. Read the live code before changing it. The class demo is *not* yet merged into `master`.

## 1. Current branches and decisions

| Item | Status | Action |
| --- | --- | --- |
| [PR #7](https://github.com/KSale0820/little-jazz-room/pull/7), `class-demo-2026-10-31` → `master` | **Open, mergeable; NOT merged** | This is the umbrella integration PR. Complete visual/signoff review before merging. Its existing description is stale and should be refreshed. |
| [PR #19](https://github.com/KSale0820/little-jazz-room/pull/19), P02 enhancements | **Merged** November 2 into class-demo | Do not redo this work or attempt to merge its branch again. |
| PRs [#9](https://github.com/KSale0820/little-jazz-room/pull/9), [#10](https://github.com/KSale0820/little-jazz-room/pull/10), [#11](https://github.com/KSale0820/little-jazz-room/pull/11), [#12](https://github.com/KSale0820/little-jazz-room/pull/12), [#13](https://github.com/KSale0820/little-jazz-room/pull/13), [#14](https://github.com/KSale0820/little-jazz-room/pull/14), [#15](https://github.com/KSale0820/little-jazz-room/pull/15), [#18](https://github.com/KSale0820/little-jazz-room/pull/18) | **Merged** into class-demo | P01, G01, P02/P06 base, R01/R03, T01, cat binaries, standalone P04/P05, and navigation corrections are already integrated. |
| [PR #16](https://github.com/KSale0820/little-jazz-room/pull/16) | **Draft QA/staging PR, open** | Obsolete staged integration after #15 merged. Review and close rather than merging duplicate implementation. |
| [PR #17](https://github.com/KSale0820/little-jazz-room/pull/17) | **Draft exhaustive QA PR, open** | Its testing branch predates #19. Triage any useful additional tests/findings; do not merge product screens or stale assumptions. |
| PRs #2/#4/#5/#6 | **Open feature PRs to `master`, not incorporated into class-demo** | Avoid indiscriminate merging. Review each separately after class-demo signoff. |

**Latest verified class-demo CI:** [Build](https://github.com/KSale0820/little-jazz-room/actions/runs/41410608618), [integrated functional walkthrough](https://github.com/KSale0820/little-jazz-room/actions/runs/41410600758), and [Home verification](https://github.com/KSale0820/little-jazz-room/actions/runs/41410600742), all successful on `a8c08918`. [Integrated mobile screenshots](https://github.com/KSale0820/little-jazz-room/actions/runs/41410600758/artifacts/13125133494). PR #19's [P02/mobile/WebKit QA](https://github.com/KSale0820/little-jazz-room/actions/runs/41409421431) also passed.

## 2. What is actually integrated

| Route / screen | Current source | Verified role |
| --- | --- | --- |
| `/` H01 Home | `web/src/pages/HomePage.tsx`, `HomePage.css` | Interactive illustrated room; hotspots to Practice, Routines, Charts and Tracks; selected cat; daily activity and Resume controls. |
| `/tracks`, `/charts` T01/chart browser | `TracksPage.tsx`, `TracksPage.css` | Search/filter/favorite local chart-linked track studies; navigate into shared player; `/charts` is an alias using same page. |
| `/practice` P01 | `PracticeHubPage.tsx`, `PracticeHubPage.css` | Free Practice, Guided (Routine Library), recent session, links to standalone Tuner and Metronome. |
| `/routines` R01 | `RoutineLibraryPage.tsx`, `RoutineLibraryPage.css` | Presets, My Routines, Shared preview, search/filters/bookmarks; seeded `Daily Jazz Warm-Up` is available. |
| `/create` R03 | `CreatePage.tsx`, `CreatePage.css` | Create/edit local exercises and multi-step routines; local saved routines appear in My Routines. Public sharing is explicitly Preview in the local demo. |
| `/player` P02 + P06 | `PracticePage.tsx`, `PracticePlayerApproved.css`, `PracticePage.css`, `components/ChordGrid.tsx` | One Free/Guided shared player; Chart/Player view; real session timer and completion; rating/notes saved locally; same-page in-session tools. |
| `/tuner` P04 | `TunerPage.tsx`, `ToolsPages.css`, `toolsAudio.ts` | Mic opt-in and browser audio pitch detection; Chromatic/Guitar/Bass, note/cents and reference tone. Requires browser/mic support and secure context (`localhost` or HTTPS). |
| `/metronome` P05 | `MetronomePage.tsx`, `ToolsPages.css`, `toolsAudio.ts` | Real Web Audio click; tempo/meter/accents, tap tempo, Start/Stop, count-in as implemented. |
| `/progress` G01 | `ProgressPage.tsx`, `ProgressPage.css` | Real local session totals, streak, week chart, daily goal, history, cat, Practice Again. Zero/empty states are derived from actual records. |
| Legacy `/explore`, `/profile`; `/signin`, `/signup` | Existing pages in `web/src/pages` | Preserved routes; they are not new navigation tabs. Account-dependent features require separate review. |

**Locked navigation:** Home | Tracks | Practice | Progress, exactly four bottom tabs (`web/src/components/AppShell.tsx`). Routines and Charts are secondary destinations, not extra tabs.

### P02 details that must not regress

- A **12-bar blues** displays all 12 measures as **3 rows × 4**; a **32-bar AABA** displays all 32 as **8 rows × 4**, with source-derived A/A/B/A labels and stronger eight-bar dividers. The entire chart and five-tool dock remain on-screen at 390×844 and 375×667. **No pagination and no internal score scrolling.**
- Every measure has continuous horizontal/vertical grid lines. Selected measures are highlighted; chord symbols are correctly transposed by chart key/instrument.
- Where a 4/4 measure contains two chord events (for example, `Cm7` on beat 1 and `F7` on beat 3), render the two chord symbols **side by side** in separate halves of the same cell with a subtle internal divider. **Never stack or duplicate them.** Timing comes from each `ChordEvent.beat`/`duration_beats`.
- Guided mode keeps the current exercise, step progress/navigation, a functional timer, and the same Chart/Player switch and dock. Timer/persistence survive opening and closing in-session Tuner or Metronome overlays.
- Five tools: **Mixer (Preview/disabled)**, **Tempo/Key (chart transposition/reference BPM)**, **Loop (highlight/select bar range, not audio looping)**, **Tuner (real)**, **Metronome (real)**. The Player view explicitly says **Chart Only · No Recording**. Never imply a backing track, stem mixer, or DSP is actually playing.
- Session completion saves duration, routine/exercise identity to existing session storage; rating and notes save separately in localStorage. Guard against duplicate saves. A successful walkthrough appears on Progress after reload.

## 3. Approved visuals/assets

- Visual authority: the **latest explicitly approved** screenshots in project sources, particularly `Approved UI/H`, `T`, `P`, `R`, `G`, plus `web/docs/design/APPROVED-VISUAL-REFERENCE.png`. The screenshot is a specification, not a replacement for working controls. Match the approved mobile look without redesigning screens or generating more art.
- Central runtime paths: `web/src/assets/visualManifest.ts`; actual binaries are already committed in `web/public/visuals/`. Verified: eight sitting poses under `visuals/cats/approved-class-mvp/sitting/`, eight sleeping poses under `visuals/cats/sleeping/`, approved full-body/profiles/closeups, shared MVP vignettes/botanicals/practice/covers, G01 art, and P04/P05 illustrated bottoms.
- Eight companions: **Luna, Milo, Maple, Mochi, Pepper, Patches, Chai, Biscuit**. Use existing approved PNGs; no regenerations or new anatomy. Primarily show companions on Home and Progress, not over chord charts.
- H01 actual runtime (`HomePage.tsx`) initially loads `VISUAL_ASSETS.room.h01` and uses the approved lighting asset as fallback. `visualManifest.ts` still has older comments implying the 941×1672 portrait room is not live. **Inspect actual H01 behavior and hotspot coordinates rather than trusting those comments or replacing artwork blindly.**
- Styling: warm ivory, deep evergreen, restrained brass, readable serif headings and subtle botanical/pixel detail. No desktop redesign. Visually verify both 390×844 and 375×667; do not stretch room art or cause hotspot drift.

## 4. Known limitations and review candidates

1. **Class-demo → master:** PR #7 remains open and its description predates several merged agents and binaries. Update its summary/status only after final QA, then ask the owner before merging into `master`.
2. **Stale Preview copy in P01:** `PracticeHubPage.tsx` retains a conditional `p01-preview` banner saying microphone/beat functionality is coming soon, although the dedicated Tuner and Metronome routes are functional. Check whether that state is reachable; remove/correct misleading copy if necessary. Also check H01's 'backing track' language against the real chart-only MVP.
3. **No recorded backing tracks or stems:** the intended future architecture is recorded/synchronized audio, not MIDI synth as the core track engine. Do not claim Mixer/Tempo-Key are audio playback or pitch-shift features. Avoid implementing new audio infrastructure during visual integration.
4. **Community publishing is not implemented locally:** custom routines are genuinely saved locally, but `Public (Preview)` is not a real publish/discover/remix action. Completion rating/notes are local feedback, not community submissions.
5. **Draft QA PRs #16 and #17:** outdated staging and exhaustive QA branches; assess for useful tests, not for automatic merger.
6. **Older source notes are stale:** `FIRST_BUILD_TASK.md`, `NEW_PROJECT_CONTEXT.md`, and PR #7's original description still list completed features as missing. Runtime code and this handoff take precedence for post-#19 integration.
7. **Optional Supabase/auth/security PRs #2/#4/#5/#6:** intentionally not part of the class-demo integration. Do not treat their existence as permission to merge into this branch.

## 5. Next integration agent: exact work order

**P0, no redesign:**

1. `git fetch origin`; branch from **latest** `origin/class-demo-2026-10-31` (NOT master, NOT the former P02 feature branch). Keep ownership limited to cross-screen QA, copy, route glue and approved visual alignment; do not replace existing state architecture.
2. Re-run the class walkthrough: H01 → R01 → seeded Daily Jazz Warm-Up → P02 Guided → Start/Pause/Resume → steps → Finish → rate/notes → Save → G01 → reload and confirm the same session; then R03 Create → save → My Routines → play created routine. Separately test T01 → linked chart → P02 Free and `/tuner`, `/metronome`.
3. Compare actual phone screenshots to authoritative approved screenshots for H01, T01, P01, P02 Free/Guided, R01/R03, G01, P04/P05. Use both 390×844 and 375×667. Focus on invisible/cropped controls, text contrast, grids/paired chords, cat switching, hotspots, overlays and scrollbars.
4. Fix demonstrable integration defects and stale functional copy only. Keep 'Preview' labels where applicable. Do not change product behavior to match a mockup that depicts unsupported audio/cloud functionality.
5. Update PR #7 description and/or final demo checklist after verification. Reconcile/close obsolete QA-only PRs #16/#17 after checking whether any useful tests need porting.
6. Open a small **separate PR targeting `class-demo-2026-10-31`** with changes, screen captures and test results. **No automatic merge into master or PR #7 without the owner's explicit approval.**

### Run / QA

```bash
git fetch origin
git switch -c class-demo-integration-next origin/class-demo-2026-10-31
cd web
npm ci
npm run build
npm test
node scripts/verify-approved-cats.mjs
npm run dev -- --host 127.0.0.1 --port 5174
# In a second terminal, from web/:
APP_URL=http://127.0.0.1:5174 node scripts/check-class-demo-integration.mjs
APP_URL=http://127.0.0.1:5174 node scripts/check-class-demo-navigation.mjs
APP_URL=http://127.0.0.1:5174 node scripts/check-class-demo-tracks.mjs
APP_URL=http://127.0.0.1:5174 node scripts/check-class-demo-p01.mjs
APP_URL=http://127.0.0.1:5174 node scripts/check-class-demo-progress.mjs
APP_URL=http://127.0.0.1:5174 node scripts/check-class-demo-tools.mjs
APP_URL=http://127.0.0.1:5174 node scripts/check-p02-chart-scale.mjs
APP_URL=http://127.0.0.1:5174 node scripts/check-p02-in-session-tools.mjs
```

The script commands above require an app running on port 5174 and Playwright browsers installed (`npx playwright install chromium webkit` as supported by your OS). GitHub Actions workflows are the authoritative hosted test record; browser permission/sound should also be checked on a real device where possible.

## 6. Handoff completion criteria

- Four-tab navigation and every advertised class-demo route work without dead ends.
- Free/Guided player keeps complete full-grid charts, accurate split-measure chords, timer, step controls and tool dock visible at both phone sizes.
- Saved sessions and custom local routines persist after refresh and appear in Progress/My Routines, respectively.
- Tuner and metronome work where browser permissions and audio allow; unavailable features are clearly labeled Preview.
- Selected cat and approved artwork are consistent without missing binaries, duplicated characters or misplaced Home hotspots.
- Build, unit tests, relevant browser scripts and integrated Actions workflows are green; include actual updated screenshots, PR link and any remaining known limitations.

## 7. Copy-ready next-agent instruction

> Continue integration of `KSale0820/little-jazz-room` using the **latest** `class-demo-2026-10-31` branch. Read `web/docs/INTEGRATION-HANDOFF-2026-11-02.md` first, then inspect actual code. PR #19 is already merged; preserve P02's full-screen 4-column grid, side-by-side beat-1/beat-3 chords, Free/Guided functionality, timer and in-session tools. Do a cross-screen mobile QA/visual integration pass at 390×844 and 375×667 against the latest approved UI. Fix only demonstrable navigation, copy, layout, assets, and workflow issues, without rebuilding or inventing audio/cloud features. Run build, tests, integrated walkthrough and screenshot checks. Open a separate PR into `class-demo-2026-10-31`, include before/after screenshots and explicit PASS/Preview/known-issue notes. Do not merge PR #7 into master without approval.

---

**References:** [Repository](https://github.com/KSale0820/little-jazz-room) · [Class-demo branch](https://github.com/KSale0820/little-jazz-room/tree/class-demo-2026-10-31) · [Umbrella PR #7](https://github.com/KSale0820/little-jazz-room/pull/7) · [Merged P02 PR #19](https://github.com/KSale0820/little-jazz-room/pull/19) · [Approved asset docs](APPROVED-ASSET-LIBRARY.md) · [Root noncoder README](../../README.md).
