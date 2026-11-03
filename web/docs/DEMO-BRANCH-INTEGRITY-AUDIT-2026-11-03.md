# Little Jazz Room — Demo Branch Integrity, Regression & Product Acceptance Audit

**Audit date:** November 3, 2026  
**Repository:** [`KSale0820/little-jazz-room`](https://github.com/KSale0820/little-jazz-room)  
**Audited branch:** `class-demo-2026-10-31`  
**Immutable audited commit:** [`1982d7c09f8fc3d31e7f17ff32a1744393f061be`](https://github.com/KSale0820/little-jazz-room/commit/1982d7c09f8fc3d31e7f17ff32a1744393f061be)  
**Audit mode:** Read-only repository/API inspection, source-level behavior tracing, exact-SHA GitHub Actions results, and inspection of real exact-SHA CI screenshots against approved UI. **No application code or production data was changed.**

> **Scope warning:** This report is for the immutable SHA above, **not** for whatever the moving branch points to when it is read. At the later branch check, GitHub reported `f6a2a59f7542de1112dcc323cd10be29f7d1fb15`, incorporating PR #27 **after** the pinned SHA. See §2. The later commit has not been treated as tested by any result for the original SHA.

## 1. Executive assessment

**Decision: NOT READY: BLOCKING ISSUES** for declaring the *complete integrated product* a trustworthy baseline. **The narrower, anonymous/local class-demo happy path is working in exact-SHA CI.** This is a distinction between **core demo operability** and **comprehensive product acceptance**, not a claim that the application fails to launch.

- **Preserved and supported by current evidence:** practice-first four-tab navigation; seeded tracks and routine library; shared Free/Guided player; manual chord selection and full-grid notation; session timer; anonymous local session save → Progress → reload; editable local routine construction; current tuner and metronome implementations; eight companion files; preserved approved H01 artwork; retained Capacitor/native-audio lab. No proof was found of wholesale deletion of a previously merged major feature.
- **Code-confirmed faults/integration gaps:** custom charts lack an actionable Practice entry in My Charts; cloud routine-saving regenerates step durations from exercise defaults; the iOS `NSMicrophoneUsageDescription` is nested under a scene configuration rather than top-level `Info.plist`; custom exercise edit initialization rejects non-seeded IDs; reuse of a routine drops repeated occurrences of the same exercise. These require repair or deliberate re-scoping.
- **Do not overclaim:** exact-SHA CI did **not** run the full six specified workflows, all required current screens, Supabase two-account isolation, iOS simulator compilation at that SHA, or physical iPhone microphone/audio verification. A passing unit suite and a passing anonymous walkthrough are not end-to-end cloud or device acceptance.
- **Pending at the pinned SHA:** automatic, beat-accurate chart transport and independent musical controls (PR #27); native iPhone tuner permission fix (PR #25); account isolation and signed-in save reliability PRs #6/#5/#4, which target **master**, not this demo branch. PR #27 has since been merged separately.

**Release gate:** Keep developing on a controlled branch, but do **not** treat the integrated demo as regression-free for account-backed saving, custom-chart practice, or native tuner use until the P1 issues and verification gaps below are resolved.

## 2. Baseline, merged history, concurrent changes

### 2.1 Fixed commit and CI

GitHub branch API initially returned `1982d7c...`, a merge of [PR #34](https://github.com/KSale0820/little-jazz-room/pull/34), at **2026-11-03 10:47:07 UTC**. GitHub's exact-SHA actions/checks included:

| Workflow on `1982d7c` | Result | Evidence and limitation |
| --- | --- | --- |
| [Verify web build](https://github.com/KSale0820/little-jazz-room/actions/runs/41622151416) | **PASS** | `npm ci`, `npm run build` (TypeScript + Vite), `npm test`: **21 files passed, 2 skipped; 117 tests passed, 2 skipped**. |
| [Class demo integrated functional QA](https://github.com/KSale0820/little-jazz-room/actions/runs/41622143026) | **PASS** | Real Playwright Chromium local walkthrough at **390×844 and 375×667**; anonymous routine build, save/play, timer, rating, session persistence/reload, track-to-seeded-chart. Does **not** cover full chart-builder flow or signed-in accounts. |
| [Class MVP Home verification](https://github.com/KSale0820/little-jazz-room/actions/runs/41622143029) | **PASS** | Root redirects to Practice, four tabs, approved legacy H01 asset still fetches, Tracks captures at both sizes. |
| [Web tuner microphone end-to-end](https://github.com/KSale0820/little-jazz-room/actions/runs/41622151384) | **PASS** | Chromium **fake 440 Hz audio input** generated measured A4/440 Hz and pitch-trail points; worklet and analyser fallback checks. **Not** a physical iPhone. |
| [Native audio foundation checks](https://github.com/KSale0820/little-jazz-room/actions/runs/41622151544) | **PASS** | TypeScript/Vite/unit tests, Android Capacitor sync, and **Android debug APK compilation** (Gradle BUILD SUCCESSFUL). **Not** Android installation or iOS physical/simulator run at this SHA. |
| Vercel commit status | **SUCCESS** | Deployment success only; no proof of all workflows, iPhone microphone permission, or visual acceptance. |

**Not executed or not established on the exact SHA:** dedicated Chart Builder browser script, dedicated routine-import browser workflow, dedicated guided-lesson mobile script, complete P02 screenshot script, the complete P04/P05 visual/WebKit scripts, live RLS and User A/B tests, iOS build/device tests. Existing tests and older PR-green checks are retained as **historical** evidence only.

### 2.2 Merged PR inventory on the pinned demo branch

These **22 PRs** were merged directly into `class-demo-2026-10-31` before or at the pinned commit: **#9, #10, #11, #12, #13, #14, #15, #18, #19, #20, #21, #22, #23, #24, #26, #28, #29, #30, #31, #32, #33, #34.** PRs #1/#3/#8 were merged into `master` and their inherited approved assets/history also survive in the demo ancestry. PR #7 (`class-demo` → `master`) remained unmerged.

Important sequence: #11 base player → #19 shared player/overlays → #23 Practice-first change → #28 searchable routines → #30 standalone chart editor → #31 structured beginner lessons → #33 three-view guided teaching → #34 sustained tuner. Chart editor, routine builder, and player work overlapped in time, explaining the explicit cross-screen contracts in `web/docs/INTERACTIVE-CHART-BUILDER.md`.

**Repeatedly edited integration hotspots** (from merged-PR changed-file inventories; not an assertion of culpability):

| File | Merged PRs touching it |
| --- | --- |
| `web/src/pages/PracticePage.tsx` | #11, #18, #19, #33 |
| `web/src/pages/TunerPage.tsx` | #15, #19, #26, #32, #34 |
| `web/src/pages/ToolsPages.css` | #15, #19, #21, #22, #29, #32 |
| `web/src/pages/PracticeHubPage.tsx` | #9, #15, #20, #23 |
| `web/src/assets/visualManifest.ts` | #9, #10, #14, #15, #20, #21 |
| `web/src/App.tsx` | #15, #23, #30 |
| `web/src/pages/CreatePage.tsx` | #12, #28 |
| `web/src/pages/RoutineLibraryPage.tsx` | #12, #28 |
| `web/src/pages/TracksPage.tsx` | #13, #30 |
| `web/src/pages/toolsAudio.ts` | #15, #26, #32, #34 |
| `web/src/types/content.ts` | #30, #31 |

**Post-baseline update, NOT part of audited implementation:** At the later branch check, head was [`f6a2a59f7542de1112dcc323cd10be29f7d1fb15`](https://github.com/KSale0820/little-jazz-room/commit/f6a2a59f7542de1112dcc323cd10be29f7d1fb15), **one commit ahead** of `1982d7c`, merging [PR #27](https://github.com/KSale0820/little-jazz-room/pull/27) at **2026-11-03 10:57:29 UTC**. The compare shows additions `practiceChartClock.ts`, its tests, `LoopPlanSettings.tsx`, two browser scripts, and edits to `PracticePage.tsx`, `ChordGrid.tsx`, and `PracticePlayerApproved.css`. **Status for the original SHA remains Pending PR; the new implementation requires its own exact-SHA end-to-end re-audit.** Do not interpret a test from `1982d7c` as testing `f6a2a59`.

## 3. Merged-feature preservation matrix

| PR | Original contribution | Present in pinned branch | Audit verdict |
| --- | --- | --- | --- |
| #9 | P01 approved Practice Hub + shared art | `PracticeHubPage.tsx`, CSS, shared artwork | **Partially Verified**; visible in exact-SHA root capture; routing verified by CI. |
| #10 | G01 Progress and goal art | `ProgressPage.tsx`, visual manifest, G01 images | **Verified** for anonymous saved-session display/reload in exact-SHA CI; historical visual references partially differ. |
| #11 | P02/P06 shared player, timer, completion | `PracticePage.tsx`, chart, completion | **Verified** anonymous core workflow in CI; signed-in save not covered. |
| #12 | R01/R03 routine library/builder | `RoutineLibraryPage.tsx`, `CreatePage.tsx` | **Verified** basic anonymous save/play; incomplete editing/cloud semantics. |
| #13 | T01 Tracks Library | `TracksPage.tsx`, stylesheet | **Verified** route and seeded track → chart in exact-SHA CI. |
| #14 | Eight sitting-cat original PNG binaries | `public/visuals/cats/approved-class-mvp/sitting/` | **Partially Verified** all eight path names present in pinned Git tree; each sprite not manually inspected in-app. |
| #15 | Functional tuner/metronome | `TunerPage.tsx`, `MetronomePage.tsx`, `toolsAudio.ts` | **Partially Verified** tuner synthetic audio and metronome source/unit tests; real speaker/device test absent. |
| #18 | Player shortcuts/chart navigation | `PracticePage.tsx`, `ExplorePage.tsx` | **Partially Verified** current routes/control handlers; dedicated full overlay test not rerun at pinned SHA. |
| #19 | P02 full-grid / same-page tuner/metronome overlays | `PracticePage.tsx`, `ChordGrid.tsx` | **Partially Verified** source-level persistence, chart grid, and overlay reachability; full dedicated browser suite not rerun. |
| #20 | Cross-screen QA, corrected chart-only copy | integration script, honest player copy, design assets | **Verified** current exact-SHA integrated anonymous CI; deprecated H01 screenshots aren't current navigation. |
| #21 | Approved metronome art/companion orientation | `p05-metronome-background.png`, CSS, page | **Partially Verified** files present; current P05 screenshot/device art alignment not captured. |
| #22 | Approved 1170×780 translucent P04 illustration | `p04-tuner-background.png`, CSS | **Partially Verified** binary present and current tuner screenshot exists; visual deviation reviewed. |
| #23 | Practice-first four-tab IA | `/` → `/practice`, AppShell NAV | **Verified** exact-SHA CI at both phone sizes. H01 unlinked intentionally; not overwritten. |
| #24 | Capacitor iOS/Android and private-audio lab | `ios/`, `android/`, `native-audio/`, `native-audio-lab.html` | **Partially Verified** files intact, Android debug build passed; lab deliberately unlinked. |
| #26 | Safari/web microphone fixes | tuner setup, analyser path, diagnostics | **Partially Verified** synthetic browser capture passed; physical Safari missing. |
| #28 | Beginner-friendly routines, searchable picker/import | `CreatePage.tsx`, `routinePickerLogic.ts`, seed JSON | **Partially Verified** UI/search code and unit tests; repeated-step import issue and cloud duration bug. |
| #29 | Larger P04 companion/not clipped | `ToolsPages.css` | **Partially Verified** tuner screenshots show companion/art placement; need comparison against individual reference. |
| #30 | Standalone chart grid/editor/repository | `ChartBuilderPage.tsx`, `ChartLibraryPage.tsx`, chart model/repo | **Integration Gap** to Practice; unit tests pass at pinned SHA; dedicated chart browser script not run at pinned SHA. |
| #31 | Structured lessons for 18 beginner exercises | `beginnerLessonContent.ts`, seed adapter, tests | **Partially Verified** lesson fields and tests present; each rendered step not reviewed in browser. |
| #32 | Chromatic/Guitar/Bass tuner and pitch trail | tuner UI / `toolsAudio.ts` | **Partially Verified** mode structure + synthetic tuner check; no iPhone sustained-voice device test. |
| #33 | Instructions/Chart/Player + cat coach | `GuidedLesson.tsx`, `PracticePage.tsx`, CSS | **Partially Verified** implemented and reachable in source; smaller-phone long-lesson acceptance not completed at pinned SHA. |
| #34 | AudioWorklet sustained capture + fallback | `/public/worklets/tuner-capture.js`, Tuner page | **Partially Verified** exact-SHA synthetic microphone check passed; iPhone hardware untested. |

**Overwriting conclusion:** No supported evidence of wholesale deletion of another merged PR's player, editor, tools, assets, or data layers. **There are real implementation defects and integration gaps**. Intentional changes such as removing H01 from navigation must not be filed as accidental regressions. Without original-PR feature-by-feature browser recordings, no narrower claim that *every* previously working behavior is preserved is supportable.

## 4. Requirements traceability matrix

**Status definitions:** Verified = implemented, reachable, and functionally tested; Partially Verified = implemented but insufficient acceptance coverage; Regression = demonstrated prior-working behavior now broken; Integration Gap = components exist but disconnected; Pending PR = outside audited SHA; Not Implemented = no relevant functional implementation; Intentionally Deferred = explicitly future scope.

| Feature / requirement | Originating PR | Current implementation / path | Evidence | Status |
| --- | --- | --- | --- | --- |
| Root launches Practice; four tabs in correct order | #23 | `App.tsx:28,37`, `AppShell.tsx:7-12` | Exact-SHA Home QA + integrated CI | **Verified** |
| No My Room route; H01 artwork preserved | #23, prior #3 | No My Room route; `HomePage.tsx` and room image retained | Route and Git tree | **Verified** |
| Practice Hub action destinations | #9, #23 | `PracticeHubPage.tsx:21-31,55-99` | Exact-SHA CI for Tracks and Routines; source for tools | **Partially Verified** |
| Seeded tracks and seeded chart → Player | #13, #20 | `TracksPage.tsx` → `/player?chart=...` | Exact-SHA integrated CI | **Verified** |
| Free and Guided shared player | #11, #19 | `/player`, `PracticePage.tsx` | Exact-SHA integrated CI (routine) + source | **Verified** |
| Timer start/pause/resume/finish and anonymous unique save | #11, #19 | `PracticePage.tsx:194-279` | Exact-SHA integrated CI/reload, 117 unit tests | **Verified** |
| Chart/Player switching preserves running clock | #19 | `panel` state separate from timer refs/state | Source + historical tests; not independently rerun | **Partially Verified** |
| Full chord grids, split beat events, tap-to-select | #19 | `ChordGrid.tsx:32-68` | Source + historical visual QA | **Partially Verified** |
| Automatic beat-accurate progression | #27 | No musical playhead clock at pinned SHA | PR #27 open at pin; later merged | **Pending PR** |
| Independent BPM, written-pitch transposition and loop controls | #27 | Existing display/reference controls at pin; independent transport pending | `PracticePage.tsx:456-463` | **Pending PR** |
| In-session tuner/metronome overlay | #19 | `PracticePage.tsx:469-512` | Source; older overlay tests | **Partially Verified** |
| Instructions/Chart/Player in Guided | #33 | `PracticePage.tsx:385-467` | Source + unit tests, no exact-SHA dedicated browser screenshot | **Partially Verified** |
| Full beginner lessons: goal, steps, listening, success, terms | #31, #33 | `beginnerLessonContent.ts`, `GuidedLesson.tsx` | 18-lesson unit tests; source | **Partially Verified** |
| Compact selected-cat coach with multiple tips | #33 | `GuidedLesson.tsx:59-76` | Source; 375×667 dedicated acceptance absent | **Partially Verified** |
| Routine presets, library search/filter | #12, #28 | `RoutineLibraryPage.tsx` | Source + basic exact-SHA routine CI, unit tests | **Partially Verified** |
| Searchable exercises and routine-step import | #28 | `CreatePage.tsx:342-438` | Source + unit tests; dedicated E2E not rerun | **Partially Verified** |
| Preserve repeated imported steps and original durations | #28 | `routinePickerLogic.ts:76-86` | Duplicate-exercise skip visible in code | **Integration Gap** |
| Reorder/remove/change duration in builder | #12, #28 | `CreatePage.tsx:137-148,322-336` | Source + local basic CI | **Partially Verified** |
| Custom exercise create/save | #12 | `CreatePage.tsx:181-217` | Source + local repository; no explicit exact-SHA create-exercise E2E | **Partially Verified** |
| Edit previously saved custom exercise | #12 / pending #4 | `CreatePage.tsx:76-87` only initializes seeded edit IDs | Source-level defect | **Integration Gap** |
| Anonymous custom routine save/reopen/play | #12 | local repository and builder | Exact-SHA integrated browser CI | **Verified** |
| Signed-in per-step duration persistence | #12, pending #4/#5 | Cloud snapshots in `AppContext.tsx:193-212` | Code-level mismatch; no account browser test | **Integration Gap** |
| Signed-in session saving and account isolation | prior auth / pending #5/#6 | Supabase repository + scoped local storage | Static review; **no User A/B or RLS run** | **Partially Verified** |
| Chart Builder page, inline chords, split/merge, meter/key | #30 | `/charts/new`, `ChartBuilderPage.tsx`, chart model | Model/repo tests on pin; UI script exists but not run on pin | **Partially Verified** |
| Save/reopen/edit/duplicate local chart and annotations | #30 | chart repo + `/my-charts` | Unit tests and source, no exact-SHA full UI script | **Partially Verified** |
| Custom chart Practice from My Charts | #30, dependent #27 | `ChartLibraryPage.tsx:51-55,78` | Source hides Practice for custom charts | **Integration Gap** |
| Display custom chart's red annotations in practice | #30, dependent player PR | `ChordGrid.tsx` renders chords/sections, not annotations | Source | **Integration Gap** |
| Attach chart to new exercise | #30 + builder | `CreatePage.tsx:456-459` selects all `useApp().charts` | Source; creation-return workflow absent | **Partially Verified** |
| Create Chart inline from Routine Builder, restore in-progress form | #30 contract | No Create Chart launch/return query handling in current builder | Source vs contract | **Integration Gap** |
| Tuner opt-in, real note/frequency/cents/modes | #15, #26, #32, #34 | `/tuner`, `toolsAudio.ts`, worklet | Exact-SHA fake A440 + fallback CI | **Partially Verified** |
| Sustained singing on real iPhone Safari | #34 | Worklet with analyser fallback | No hardware recording; synthetic check only | **Partially Verified** |
| iOS native mic permission prompt | #24; pending #25 | `ios/App/App/Info.plist:27-47` | Permission key incorrectly nested | **Pending PR** |
| Metronome audible click, BPM/meter, pause, accents | #15 | `MetronomePage.tsx` Web Audio clock | Source/unit tests; no exact-SHA manual audible device check | **Partially Verified** |
| Recorded backing tracks, finished native import and stem mixing | future | Isolated native lab only | Explicit architectural deferral | **Intentionally Deferred** |
| Android native shell builds | #24 | `android/`, Capacitor | Exact-SHA native CI Gradle debug APK | **Verified** |
| iOS native simulator + import/device tests at pin | #24 | `ios/` project files | Historical feasibility note only | **Partially Verified** |
| Progress totals, history, goal, companion | #10 | `ProgressPage.tsx` | Exact-SHA local session Progress CI; visuals | **Partially Verified** |
| All eight cats, selection persistence | #14, prior assets | `CatCompanion.tsx`, manifest, 8 art sets | File inventory + roster tests; cross-account/device not run | **Partially Verified** |
| Rich achievements/production gamification | future | Static art exists; no verified complete product behavior | Deferred product goals | **Intentionally Deferred** |

## 5. Prioritized issues: actual / expected / reproduction / fix

### P1-01 — Cloud routine save discards edited step durations

- **Type:** Implemented behavior defect / cross-screen persistence gap. **Evidence:** Source-level deterministic; **not** a live Supabase execution claim.
- **Reproduce:** Sign in; open R03; add steps; set a step to a duration different from its source exercise default; save to cloud; refresh/re-login and reopen the routine. Compare local step durations against cloud-derived `routine_steps`.
- **Expected:** Saved cloud step durations equal the builder's `step.minutes`, and ordering is retained.
- **Current code:** `CreatePage.tsx:226-239` constructs `routineSteps` using edited durations; `AppContext.tsx:193-212` builds cloud `stepSnapshots` from `ex.duration_minutes` instead of the corresponding `routine.steps[sort_order].duration_minutes`; `SupabasePracticeRepository.ts:156-201` saves those snapshots. On cloud refresh, `AppContext.tsx:164-175` prefers cloud rows for matching IDs over local rows, so the saved cloud values can supersede the edits.
- **Origin:** No responsible regression PR established. This is a **current integration defect**, not proof that PR #28 overwrote a working prior implementation.
- **Fix:** Pass complete ordered `routine.steps` (not just exercise IDs) and copy each step's edited duration and snapshot. Add two-account/cloud-roundtrip test with non-default durations. **Severity P1.**

### P1-02 — Native iOS tuner permission description placed in wrong plist dictionary

- **Type:** Native configuration defect; physical-device impact **not independently run**.
- **Reproduce:** Inspect `web/ios/App/App/Info.plist:27-47` with `plutil -p` or `plistlib`. The `NSMicrophoneUsageDescription` key is inside `UIApplicationSceneManifest` → `UISceneConfigurations` → an individual scene dictionary, **not at the root `<dict>`**. Launch packaged iOS tuner and request the microphone as a device acceptance test.
- **Expected:** Top-level `NSMicrophoneUsageDescription` string available to iOS privacy checks.
- **Actual:** Key is nested at lines **42-43**, which cannot satisfy the standard top-level permission declaration. Web/Chromium microphone success does not validate this native plist.
- **Fix:** Relocate key to top-level dictionary and run `plutil`, simulator packaging plus real iPhone microphone permission. [PR #25](https://github.com/KSale0820/little-jazz-room/pull/25) was open at the pinned SHA: **Pending PR**, not overwritten work. **Severity P1 for native iOS.**

### P1-03 — Custom chart creation cannot complete normal chart → Practice journey

- **Type:** **Integration Gap**, explicitly documented by PR #30 as follow-up work.
- **Reproduce:** `/charts/new` → create and save chart → `/my-charts` → inspect actions on the saved custom card.
- **Expected:** A Practice action starts shared player with the saved chart, including its chord events and annotations.
- **Actual at pin:** `ChartLibraryPage.tsx:51-55` renders **Edit** instead of **Practice** for `chart.is_custom`. Line **78** explicitly says custom practice playback awaits shared-player integration. `PracticePage.tsx:83-87` can resolve a custom chart already in `useApp().charts` by direct `?chart=...`, but the normal UI does not expose that path. `ChordGrid.tsx:37-68` does not render `bar.annotation`, and player does not display `style_instruction`.
- **Fix:** Add custom Practice action, clear active routine, route with stable chart ID; verify exact event durations, annotations and transposition. **PR #27 merged after the pin, so re-evaluate its player changes separately**, but its GitHub compare did not modify `ChartLibraryPage.tsx`. **Severity P1.**

### P1-04 — Editing a previously created custom exercise is disconnected

- **Type:** Functional gap; **not a proven overwrite**.
- **Reproduce:** Create a new custom exercise, then go to legacy `/explore`, select it for editing. `ExplorePage.tsx:109-116` routes to `/create` with `editExerciseId`.
- **Expected:** Existing title/instructions/duration/chart fill the edit form, and saving updates the same exercise ID.
- **Actual code:** `CreatePage.tsx:76-87` opens and initializes the edit form **only if** `exercisesById[editId]` is truthy, i.e., a seeded exercise; custom `local-ex-*` or UUID exercises fail this check. `saveExercise` *can* preserve an existing non-seeded ID if an edit form is invoked, but the normal initialization does not reach it.
- **Fix:** Resolve any authorized exercise from scoped `exercises`, distinguish seed-copy versus editable owned exercise, and add custom create → edit → reload test. Review [PR #4](https://github.com/KSale0820/little-jazz-room/pull/4) separately (target `master`; not in pinned demo). **Severity P1.**

### P1-05 — Signed-in practice save depends entirely on cloud availability

- **Type:** Availability/data-persistence acceptance gap; no observed live cloud failure claimed.
- **Reproduce:** With authenticated Supabase configured, complete practice while cloud insert fails (safely simulate network failure, **not** production DB modification).
- **Expected:** A clear recoverable state, no duplicate writes, and retained completed session until retry, preferably robust local recovery.
- **Current code:** `AppContext.tsx:142-152` writes **only to cloud** when signed in; local save happens only for anonymous sessions. `PracticePage.tsx:240-270` catches failure and allows retry but completion state is memory-resident and may be lost on page reload/exit. [PR #5](https://github.com/KSale0820/little-jazz-room/pull/5) concerns signed-in completion on `master` and is pending separate review.
- **Fix:** Reconcile idempotent cloud retries/offline local recovery without double-counting; test cloud rejection, reload and retry with distinct accounts. **Severity P1 if signed-in/offline reliability is in the accepted scope.**

### P2-01 — Importing repeated routine steps silently drops repeated occurrences

- **Type:** Routine reuse mismatch, source-confirmed.
- **Reproduce:** Select a source routine containing the **same exercise twice** at distinct positions/durations, import it via R03's Routines picker, inspect step list.
- **Expected:** Each original occurrence and duration is retained in order, unless the user explicitly chooses deduplication.
- **Actual code:** `routinePickerLogic.ts:76-86` creates a `seen` set keyed by exercise ID; second occurrence is counted as a duplicate and skipped. `CreatePage.tsx:156-179` imports only `preview.additions`. This violates unconditional *preserve all source steps* acceptance for repeated exercises. Current UI discloses that duplicates are skipped at `CreatePage.tsx:420-429`, so not a silent visual claim.
- **Fix:** Represent routine steps with unique occurrence IDs, or offer explicit include-duplicates mode; verify order and independent durations. **Severity P2** (elevate for advanced/repeated routines).

### P2-02 — Chart Builder creation-return flow not wired into Routine Builder

- **Type:** **Integration Gap**, not overwritten chart code.
- **Reproduce:** Start adding a custom exercise in `/create`, fill fields, attempt to create a chart without discarding the in-progress exercise and return with chart preselected.
- **Expected:** `/charts/new?returnTo=%2Fcreate` entry, preserved unsaved exercise fields, `createdChartId` query consumed on return, linked chart shown for the new exercise.
- **Actual:** `CreatePage.tsx:456-459` offers only a select of existing charts. There is no Create Chart action in the exercise form and no `createdChartId` parsing or exercise-form draft restoration. The required contract is explicitly documented in `web/docs/INTERACTIVE-CHART-BUILDER.md:28-33`.
- **Fix:** Add Create Chart flow with durable per-account draft state and return handling, and test custom chart → custom exercise → routine → practice. **Severity P2** (P1 if this is required for the next product demo).

### P0-risk / unverified — Cross-account account-isolation acceptance

- **Type:** **Untested high-impact scenario**, not an allegation of confirmed data leakage.
- **Risk evidence:** `AppContext.tsx:84-87` stores cloud exercises/routines/sessions in generic React state; `useEffect` at `107-138` clears the arrays when signed out but does **not** clear previous-account data immediately when switching directly between two non-null users. The view selects `cloudSessions` for any non-null `user` (`:140-142`) and merges cloud records into `routines` (`:164-175`). A direct account switch without a null-user transition, or an unexpected auth callback ordering, needs a browser test to rule out stale old-account rendering. Typical explicit sign-out can clear these values, so **exposure is not established**.
- **Reproduce safely:** Local/dev two-user Supabase, seeded private data A, sign out/in B, plus a direct auth-state-switch simulation; assert A's records never render even transiently; return A; repeat with delayed/network-failed queries. Also run configured RLS tests against nonproduction data.
- **Fix if demonstrated:** Key cloud state by owner ID, immediately reset at identity change, avoid rendering cloud records until matching owner's fetch resolves, and validate server RLS. [PR #6](https://github.com/KSale0820/little-jazz-room/pull/6) is outside this branch and must be separately evaluated. **Security priority P0 if reproduced; current status Partially Verified, not Regression.**

### P2/P3 visual and acceptance observations

- **Practice Hub:** Current exact-SHA P01 capture is simplified relative to approved P01 (missing Recent Played/decorative lower section, streamlined three practice actions). This aligns with intentional [PR #23](https://github.com/KSale0820/little-jazz-room/pull/23) Practice-first direction and is **not a regression**. Confirm product-owner acceptance of that direction, not restoration of obsolete H01.
- **Routine Builder:** Exact-SHA small-phone screenshot shows long newly authored beginner instructions inside step cards, requiring substantial vertical scroll. Content is not visibly lost in captured top viewport; test tap targets/scroll/keyboard/focus and ensure concise preview summaries, especially at 375×667. **P2 usability review, not proven clipping.**
- **Tuner:** Current capture includes pitch-trail controls not in original P04 mockup and decor is visually different in the first viewport. These stem from recent functional changes; request focused visual acceptance. There is **no** evidence the approved P04 binary was deleted.
- **Metronome and guided lessons:** Current exact-SHA independent screenshots not present in retrieved exact-SHA artifact set. **No visual pass claim** for those screens; older screenshots/tests do not fill this gap.
- **Progress:** Current view is calculated from real session data and a new four-tab IA; original approved bottom bar shows prior navigation. Compare content/styling, not obsolete tab labels. Weekly minutes may round each day independently; test totals with sub-minute sessions and timezone boundaries.

## 6. Six end-to-end journeys: verified versus missing

| Required journey | Exact-SHA evidence | Result at pin |
| --- | --- | --- |
| 1. Practice → Free → choose chart → play/pause → Finish/Save → Progress | Root/route/seeded chart and shared timer/save supported; integrated CI tests **guided custom routine** save and seeded track → Free player, not complete Free save in the same script. | **Partially Verified**, not a claimed full journey pass. |
| 2. Routines → Beginner → Instructions → Chart → Practice → next → Complete → Progress | Guided Instructions/Chart/Player and steps in code, 18 lesson unit checks; integrated CI saves a custom routine, not every lesson/view transition. | **Partially Verified**; dedicated exact-SHA Guided script not run. |
| 3. Create routine → search exercise → add/duration → save/reopen → practice | Integrated CI verifies **initial default steps** and save/reopen/play, but not searching/importing an exercise, nondefault duration, or cloud roundtrip. | **Partially Verified**; anonymous save/play slice verified. |
| 4. Create Chart → split → red annotation → save/reopen → practice | Chart editor/unit code exists; standalone Playwright script exists but did not run at pinned SHA; custom-chart Practice action missing. | **Integration Gap**. |
| 5. Create routine → search another routine → import/customize/save/practice | Search/import code and unit tests exist; source repeated-exercise dedup; no exact-SHA end-to-end run of entire journey. | **Partially Verified** with known import limitation. |
| 6. User A creates private data → B cannot access → A retains it | Scoped keys, RLS tooling and Supabase queries exist; no credentials/device simulation or real User A/B run during this audit. | **Partially Verified / security acceptance pending**. |

**Representative CI assertions** at exact SHA are in `web/scripts/check-class-demo-integration.mjs:23-91`: correct landing, route through routines, build and save local routine, start/pause/resume timer, unique local session plus feedback, Progress/reload, and seeded Tracks → chart. This is substantial **real browser** coverage, not a comprehensive acceptance test for all newer features.

## 7. Visual regression coverage and screenshot provenance

**Authoritative references consulted:** `Approved UI(1)(3).zip` screens **P01, P02 Free, P02 Guided, P04, P05, T01, R01, R03, G01** and the repo visual library/manifest. The approved images are **design references**, not proof of functionality.

**Exact-SHA CI screenshots downloaded and inspected** from:

1. [Integrated class demo artifact, run 41622143026](https://github.com/KSale0820/little-jazz-room/actions/runs/41622143026): routine builder, My Routines, completed session, Progress at both sizes.
2. [Practice/Tracks artifact, run 41622143029](https://github.com/KSale0820/little-jazz-room/actions/runs/41622143029): Practice landing and Tracks at both sizes.
3. [Tuner artifact, run 41622151384](https://github.com/KSale0820/little-jazz-room/actions/runs/41622151384): pitch-trail tuner at both sizes with synthetic A440 test input.

See the separately supplied **`DEMO-BRANCH-INTEGRITY-AUDIT-SCREENSHOTS-2026-11-03.zip`** and local audit-evidence directory for individual PNGs and approved-versus-current contact sheet. The live captures in this package are from CI **checking the audited SHA**, not from a fresh physical iPhone session.

| Screen requested | 390×844 | 375×667 | Observation |
| --- | --- | --- | --- |
| Practice Hub | Captured | Captured | Functional simplified Practice-first design; root four tabs. |
| Tracks Library | Captured | Captured | Cards/filters accessible; verified seeded chart route. |
| Routine Library | Included in CI workflow interaction, **not separately captured** | Same | Search/filter code present; visual delta not fully measured. |
| Routine Builder | Captured | Captured | Long steps vertically scroll; requires targeted small-phone interaction review. |
| Free Practice Player | CI route checked; **no current screenshot from retrieved artifacts** | Same | Prior screenshots committed in repo are historical. |
| Guided Practice (Instructions) | **Not captured at pin** | **Not captured at pin** | Teaching-card and coach layout not fully accepted. |
| Chart Builder | **Not captured at pin** | **Not captured at pin** | Dedicated script exists but was not executed on pinned SHA. |
| Tuner | Captured | Captured | Simulated A4 state; not real microphone/iPhone. |
| Metronome | **Not captured at pin** | **Not captured at pin** | Source/unit verification only. |
| Progress | Captured | Captured | Saved local session and totals present; correct four-tab shell. |

No browser screenshot was fabricated or relabeled as current. Where the supplied artifacts lacked a screen, the audit explicitly marks it **not captured**. No defensible claim can be made about all touch targets, inner scrolling, keyboard obstruction or every vertical clipping case from the small set of screenshots alone.

## 8. Other scope checks

**Tracks/audio:** `TracksPage.tsx:27-34` explicitly defines only original chart-linked track previews. Current Player says **Chart Only · No Recording**, and Mixer is disabled/Preview. This is correct disclosure. `web/native-audio-lab.html` plus `web/src/native-audio/{lab,localRecordings,stemTransport}.ts`, `ios/`, `android/`, and privacy files are present. `web/docs/native-audio-feasibility.md` says imports/stems are an unlinked feasibility prototype. **Do not claim real licensed backing tracks, phone imports, synchronized stems, production playback, or audio key/tempo effects.** The existing Android build success does not prove runtime import/storage safety.

**Tuner:** Current source uses `getUserMedia` after explicit tap, browser HTTPS checks, real `detectPitch`, YIN-based audio helpers, silence diagnostics, worklet clock and analyser fallback, and stops tracks/context when leaving. The simulated Chromium A440 check passed at pin; **iPhone Safari hardware pitch stability remains untested**. The nested iOS permission key is independent of browser microphone success.

**Metronome:** `MetronomePage.tsx:45-82` schedules Web Audio oscillator clicks using `AudioContext.currentTime`, with look-ahead timer and visual RAF; BPM/measure/accents controls have handlers. This is more than a preview, but audible speaker output and concurrent tuner/overlay behavior were not manually checked at pinned SHA.

**Progress and cats:** `ProgressPage.tsx:15-37,55-166` computes week/daily totals from persisted sessions. `CatCompanion.tsx` defines eight companion IDs and scoped selection. The Git tree shows eight PNGs per approved sitting/full-body/profile/close-up/sleeping families. An image's presence and a happy-path Progress screenshot are not a full per-cat anatomy/asset-regression examination. Legacy H01 assets retained but not a bottom tab, consistent with current product direction.

**Account/RLS:** `localRepository.ts:16-24,65-119` scopes exercises/routines/sessions/drafts by user ID or `anonymous`; chart repository uses the same scope. Supabase repository queries filter `owner_id` for private records, and list only public shared routines. These are safeguards, not a substitute for executing RLS and account-switch tests. **No production Supabase data was altered.**

## 9. Recommended repair and acceptance order

1. **P0 security acceptance gate:** Execute User A → sign out → User B → User A and simulated rapid/direct identity transitions using **nonproduction** accounts. Run safely configured RLS tests. If any private record crosses accounts, fix immediately and do not continue integration until retested.
2. **P1 preserve user data:** Fix cloud routine step duration/snapshot serialization (#P1-01); test signed-in create/reopen/edit, network failure, local/cloud reconciliation, and duplicate-save retries (#P1-05). Independently evaluate pending PRs #4/#5/#6; do not merge automatically.
3. **P1 complete chart practice:** Wire custom charts into Practice and display annotations/beat positions, then test chart → exercise → routine → Player. Review the **later** PR #27 against the *new* SHA and its exact-SHA CI rather than declaring its timing correct from this report.
4. **P1 native privacy:** Correct top-level `NSMicrophoneUsageDescription` via separate PR #25 review, validate iOS packaging, then test real iPhone mic sustained notes and interruptions.
5. **P1/P2 editor correctness:** Restore custom exercise editing, preserve repeated imported steps and custom durations, and connect Chart Builder return-to-routine flow with unsaved-form restoration.
6. **Complete browser regression matrix:** At current branch SHA run TypeScript/build/117+ unit tests, chart editor and routine-picker scripts, P02 playhead/loop, dedicated guided teaching, full tuner/metronome tool/overlay tests, and the six required real journeys at **390×844 and 375×667**; capture all ten requested screens. Include screenshots of long lessons with the cat coach expanded, on-screen keyboard, bottom nav and finish controls.
7. **Physical-device acceptance:** iPhone Safari and, if shipping Capacitor, iOS app; Android device if relevant. Mark synthetic mic, WebKit emulation, simulator, and physical hardware as separate lines. Confirm audio output, permissions, backgrounding/interruption and no microphone lifecycle leak.
8. **Re-pin and publish baseline:** Only after the above, record new SHA, verify all new CI refers to it, and update the audit status. Keep PR #7 toward `master` unmerged absent owner approval.

## 10. Final answer to the product owner

1. **Merged work still present?** **Broadly yes.** All 22 demo-branch PR contributions can be traced to current code/assets. No evidence supports a major PR being wholly overwritten. Specific code-path defects and incomplete integration remain.
2. **Does it work together?** **The anonymous class-demo core works under exact-SHA GitHub Playwright tests** at both phone sizes. The *whole* product, especially signed-in persistence, custom-chart practice, native iOS tuner permissions and six full journeys, is **not accepted**.
3. **Overwritten features?** **None conclusively established.** H01 removal from navigation is intentional PR #23. Do not label PR #27's missing timing at the pin as an overwrite: it was outside the audited commit.
4. **Implemented but disconnected?** Custom-chart Practice entry and annotations, Chart Builder → Routine Builder return flow, and custom exercise editing. Routine reuse and cloud step durations contain functional discrepancies.
5. **Pending?** At pin: #27 (subsequently merged), #25; master-targeted #4/#5/#6; security/RLS, mobile-device and native audio runtime acceptance. Real recorded tracks/stems intentionally deferred.
6. **What must happen before continuing?** Complete the priority-ordered verification/fixes above and re-audit the **new** head SHA. Preserving the code is no longer the central risk; **data fidelity and cross-screen/device integration** are.

### Assessment: **NOT READY: BLOCKING ISSUES**

**Meaning:** Not ready to certify a reliable, fully integrated product baseline or to merge into `master`. The currently tested **anonymous/local classroom walkthrough remains usable**. Continue corrective development in isolated branches with exact-SHA regression evidence; do not silently merge, overwrite artwork, or represent untested features as done.

---

**Audit limitations / provenance:** GitHub connected repository reads and action logs; exact pinned SHA and later SHA compare; inspected real CI screenshot artifacts; approved UI ZIP and repository docs. A network-isolated local environment did not permit a fresh `git clone`/`npm ci` and independently driven local browser against the full tree, so this report relies on **fresh exact-SHA GitHub-hosted execution** plus static inspection. The source-level defects above have clear reproduction paths but are not falsely described as measured outcomes from a physical phone or live cloud account. This document and image package are audit outputs only; the demo branch, PR states and production Supabase were not modified during analysis.