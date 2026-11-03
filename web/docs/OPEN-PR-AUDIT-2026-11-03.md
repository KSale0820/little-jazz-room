# Open PR Audit and Demo Branch Merge Review

**Repository:** KSale0820/little-jazz-room  
**Target:** class-demo-2026-10-31  
**Audit date:** 2026-11-03 (GitHub inventory and head references observed approximately 10:43–10:45 UTC)  
**Baseline demo SHA:** b0a0e2dda3a89fae6db229e1d09a7dbcbf188f3e  
**Method:** GitHub PR metadata and actual patches, comparison against current demo source, GitHub Actions jobs and failure logs, downloaded QA screenshot/test artifacts, and inspection of approved mobile UI references. **Read-only assessment of existing PRs.**  
**Scope:** The ten PRs open at the inventory snapshot. This documentation-only audit PR, if created after the snapshot, is not an application-change candidate.

## Executive decision

**Ready for unconditional product-owner approval into the demo branch: NONE.**

**First fix to clear for approval: #25 (native microphone permission).** It corrects an objectively misplaced iOS Info.plist permission, and its dedicated macOS native CI, web build, unit suite, and cross-screen CI passed. However, it is a draft and GitHub currently reports mergeable=false against an advanced base; synchronize and check the resulting diff, then validate a fresh native build on a physical iPhone or explicitly accept configuration-only scope before authorizing it.

**Highest-value feature after #25: #27 (visual chord transport and separate controls).** The implementation is substantial, but a clean integration into the current demo, browser execution, approved screenshot comparison, and an explicit decision about one-pass versus automatically repeated full-chart playback remain outstanding.

**Retain #34 as a draft.** AudioWorklet sustained capture and analyser fallback have code-level and Chromium evidence. There is no physical iPhone retest of the reported sustained-vocal-note failure; two unrelated broader CI suites currently report failures. Investigate them before approval. Do not confuse the Vercel free-plan deployment quota failure with an application build failure.

**Do not merge #2/#4/#5/#6/#16 wholesale** or advance #7 into master. Some specific fixes from #4/#5/#6 are demonstrably still missing from the current demo, so selective forward-porting is warranted instead of dismissing all older work as redundant.

## 1. Live open PR inventory and recommendation matrix

All ten items below were returned by GitHub's open-PR search. No additional feature PR was open at the stated snapshot. Branch heads can move after this audit.

| PR | Purpose | Technical status | Conflicts / risks | Recommendation | Priority |
|---|---|---|---|---|---|
| [#25](https://github.com/KSale0820/little-jazz-room/pull/25) | Fix top-level iOS microphone permission and native sync | Draft; 5 changed files; iOS macOS, native, web and integration Actions successful; 41 commits behind demo, GitHub mergeable=false | Native permission still needs installed-iPhone validation; sync conflict possible; Safari website unaffected by plist | **Changes required**: synchronize and verify resulting diff; native device permission smoke test or explicit configuration-only sign-off | **P0** |
| [#27](https://github.com/KSale0820/little-jazz-room/pull/27) | Monotonic beat-aware P02 chart playhead and independent Key/BPM/Instrument/Loop | Draft; 9 changed files; real timing code and unit/browser test sources exist, but no Actions runs found for this head; 41 behind, mergeable=false | Overlaps current P02; changes full chart from wrap to one-pass stop; mobile control sizes; no reviewed new screenshots | **Changes required**: rebase, resolve behavior decision, run new full tests and compare approved P02 at both phones | **P0** |
| [#34](https://github.com/KSale0820/little-jazz-room/pull/34) | Sustained iPhone tuner worklet capture with analyser fallback | Draft; 7 files; web build, microphone E2E, native foundation and chart CI successful; 20 behind demo | Physical iPhone Safari untested; tools visual QA and cross-screen QA failed; Vercel preview quota exceeded | **Changes required**: actual device retest, reconcile later demo changes and investigate both failing suites | **P1** |
| [#4](https://github.com/KSale0820/little-jazz-room/pull/4) | Edit custom exercises; save step only after persistence | Older master-based PR; 3 files; 345 behind demo; local build/tests claimed, current Actions absent | Current custom edit bug persists, but the modern searchable builder is not in this old branch | **Changes required**: extract only missing custom-edit/metadata fix and regression test, never wholesale merge | **P1** |
| [#5](https://github.com/KSale0820/little-jazz-room/pull/5) | Signed-in completion, UUID-safe references and idempotent retry | Older master-based PR; 9 files; 345 behind; live migration unverified | Current cloud insert still sends seed text IDs to a UUID FK; old PracticePage would overwrite new completion UI | **Changes required**: selectively port schema, repository and idempotent-save fixes onto current P02 | **P1** |
| [#6](https://github.com/KSale0820/little-jazz-room/pull/6) | Account isolation, auth restoration and partial cloud-sync recovery | Older master-based PR; 11 files; 345 behind; browser tests mocked; live two-account RLS unverified | Changes AppContext and AppShell, overlapping #5 and modern navigation; untested migration | **Changes required**: selectively port after/with #5 and verify real A/B isolation and RLS | **P1 for cloud; P2 for local-only demo** |
| [#17](https://github.com/KSale0820/little-jazz-room/pull/17) | Exhaustive Chromium/WebKit mobile QA scripts and screenshot generation | Draft QA-only; 3 files; Actions green; 52/52 Chromium and 32/32 WebKit reported; 153 behind demo | Tests/screenshots represent an earlier UI and route contract; this QA branch is not a product fix | **Defer**: update or selectively copy test scripts after current features settle | **P2** |
| [#16](https://github.com/KSale0820/little-jazz-room/pull/16) | Old combined tuner/metronome integration staging | Draft staging PR; 12 files; old CI successful; 206 behind demo | Includes older P04/P05 production code now integrated through later PRs; risks overwriting it | **Superseded**: preserve evidence but do not integrate the staging branch | **P3** |
| [#2](https://github.com/KSale0820/little-jazz-room/pull/2) | Cat-art audit and contact sheets | Master-based; 5 documentation/binary files; no production art; 348 behind demo | Art references precede final approved assets, and large review ZIP is not a desired production addition | **Superseded**: archive findings as needed; seek permission before closing | **P3** |
| [#7](https://github.com/KSale0820/little-jazz-room/pull/7) | Existing demo-to-master release PR | Base **master**, head **class-demo-2026-10-31**; 347 changed files; demo comparison identical | Not a PR *into* demo; merging would promote all demo changes to master without requested authorization | **Do not merge**: leave open and untouched until separate master-release approval | **P0 guardrail** |

**Recommendation semantics:** Each PR has exactly one primary label. “Changes required” means the change is worth retaining but its current branch is not yet approved to merge. “Superseded” is not authorization to close anything. “Do not merge” for #7 applies to this demo audit and expressly prohibits a master merge without further consent.

### Branch and currency evidence

| PR | Source branch | Target branch | Head at audit | Ahead / behind current demo |
|---|---|---|---|---|
| #34 | fix/safari-sustained-pitch-capture | class-demo-2026-10-31 | fad29c4 | 5 / 20 |
| #27 | fix/practice-player-timing-controls | class-demo-2026-10-31 | f011906 | 25 / 41 |
| #25 | fix/ios-tuner-microphone-permission | class-demo-2026-10-31 | 11bc3c5 | 3 / 41 |
| #17 | class-demo-exhaustive-qa-2026-11-01 | class-demo-2026-10-31 | 1ec2e8b | 5 / 153 |
| #16 | class-demo-functional-qa | class-demo-2026-10-31 | 9883c48 | 5 / 206 |
| #7 | class-demo-2026-10-31 | master | b0a0e2d | 0 / 0 (compared with demo itself) |
| #6 | feature/auth-account-isolation | master | 00f5cbe | 1 / 345 |
| #5 | feature/practice-completion | master | cb07fb1 | 1 / 345 |
| #4 | feature/custom-exercise-editing | master | ff93829 | 1 / 345 |
| #2 | feature/character-art-standardization | master | 7b9433d | 1 / 348 |

These are commit graph comparisons, **not simulated merge or conflict-resolution tests**. GitHub reported mergeable=false for #25, #27, #17, #16, #4, #5 and #6 against their configured bases at the metadata snapshot; #34, #7, #2 reported mergeable=true. Always refresh the status after any rebase; do not interpret compare status alone as proof that a cherry-pick will be clean.

## 2. Code-level findings by PR

### #25 — Actual native microphone permission configuration defect

**Observed in current demo:** [Info.plist](https://github.com/KSale0820/little-jazz-room/blob/b0a0e2dda3a89fae6db229e1d09a7dbcbf188f3e/web/ios/App/App/Info.plist) places NSMicrophoneUsageDescription inside the nested UIApplicationSceneManifest/UISceneConfigurations dictionary, not the root plist dictionary. [configure-native-privacy.mjs](https://github.com/KSale0820/little-jazz-room/blob/b0a0e2dda3a89fae6db229e1d09a7dbcbf188f3e/web/scripts/configure-native-privacy.mjs) inserts before the *first* closing dictionary, reproducing the same bad nesting. This is not a hypothetical flaw.

**PR implementation:** Moves the key to root; removes misplaced/duplicate copies when configuring native privacy; uses the root closing tag; adds a Vitest depth-and-uniqueness assertion; and adds a macOS workflow validating plutil, Capacitor sync, idempotence and an unsigned iOS Simulator Xcode build. This is narrow, native-specific and directionally correct. [Inspect diff](https://github.com/KSale0820/little-jazz-room/pull/25/files).

**Evidence:** [iOS permission CI, success](https://github.com/KSale0820/little-jazz-room/actions/runs/41609484734), plus [web/cross-screen success](https://github.com/KSale0820/little-jazz-room/actions/runs/41609484869). No evidence of a newly built and installed physical iPhone app with the permission granted and real note capture. Safari's browser-origin permissions are a separate mechanism.

**Approval gate:** synchronize onto a fresh demo-derived review branch; review the post-integration diff limited to these five files; rerun macOS checks, lint/build/unit and two mobile sizes; rebuild and reinstall on a physical iPhone to demonstrate permission grant and an actual note, or clearly record product-owner acceptance of the narrower native-plist-only change. Do not conflate real-device acceptance with CI.

### #27 — Valuable player implementation, unresolved transport semantics

**Code:** [practiceChartClock.ts](https://github.com/KSale0820/little-jazz-room/blob/f011906c54c45b764ea0d1507a8c8a99762fc1b0/web/src/lib/practiceChartClock.ts) uses performance.now via a stored musical-beat anchor. This avoids accumulating setInterval drift. It maps active events using beat and duration within each measure, and its test suite explicitly covers 4/4 and 3/4, pause/resume, a within-measure change, tempo reanchoring, seek, transposing keys, and repeated ordered sections. [PracticePage patch](https://github.com/KSale0820/little-jazz-room/pull/27/files) adds actual start/pause transport, a highlighted current measure and chord, independent Key/BPM/Instrument controls, and a Loop setup sheet; timer/storage and P02 utility overlays are retained in source.

**Behavior decision:** Its sequence model says full chart with “No looping” plays once and *stops on the last measure*. The earlier full-chart transport wraps indefinitely. The requested demo needs predictable automatic advancement; the product owner must choose whether “Loop off” means one full pass or whether starting full-chart practice repeats until paused. Align copy, tests and end-of-chart behavior with that decision. This is a changed contract, not evidence that the mathematical timer is invalid.

**Risks:** The loop UI creates multi-section plans and play counts, increasing complexity and vertical space at 375×667; some new +/- controls specify 39×42 px, smaller than the preferred 44 px hit area. Non-4 denominator meters (such as 6/8) have not been demonstrated with a defined BPM beat-unit convention: the clock currently derives beats per bar from the numerator only. The branch is behind the newest chart/routine changes. No Actions workflow runs were returned for its current head, and the PR's own browser test checklist remains unchecked. Vercel could not deploy the latest preview because of quota.

**Approval gate:** update against latest demo; independently run TypeScript/Vite build and unit tests; run check-p02-playhead-controls, chart-scale, in-session-tools and class-demo-integration; confirm 390×844 and 375×667 screenshots against approved P02 free/guided/paused references; test 4/4, 3/4, multiple chord events, tempo edit mid-beat, pause/resume, first/last measure wrap or stop per approved contract, chart switch, repeated loop sections, guided step switch, finish/rating/Progress, and both in-session tools. Keep the single shared player.

### #34 — Continuous capture implementation, iPhone hypothesis unproven

**Code:** [new worklet](https://github.com/KSale0820/little-jazz-room/blob/fad29c4c4ed2d6d7f955873aaca85d67bf3f8e43/web/public/worklets/tuner-capture.js) maintains an 8,192-sample PCM ring buffer, posts about 12 frames per second, and does not upload/record input. TunerPage keeps analyser+requestAnimationFrame fallback when the worklet fails or sends no frames for 750 ms. [toolsAudio patch](https://github.com/KSale0820/little-jazz-room/pull/34/files) lowers the RMS threshold from 0.003 to 0.0012 while increasing quiet-signal YIN strictness. Unit tests include fading signals, silence and noise. A Chromium mic E2E repeats A440 readings over more than seven seconds and explicitly exercises a disabled AudioWorkletNode fallback.

**Evidence:** [web tuner microphone E2E, success](https://github.com/KSale0820/little-jazz-room/actions/runs/41621421077), plus web build and native foundation success on the same head. However, [tools QA failure](https://github.com/KSale0820/little-jazz-room/actions/runs/41621420935) terminates with “Room illustration is not aligned with the intended floor offset” in check-class-demo-tools.mjs. This PR changes no background CSS; the failure reveals a current integration/visual test issue, **not proof the worklet broke artwork**. [cross-screen integration failure](https://github.com/KSale0820/little-jazz-room/actions/runs/41621421022) reports “Legacy instruction details were lost” in guided teaching. Again, do not attribute that unrelated failure to microphone code without reproduction. Vercel's 100-deployments/24h Hobby-plan limit prevented a new preview and produced a Vercel failure status, not a code assertion.

**Approval gate:** address/triage the two broader failures; compare them to an identical demo-head control run; confirm Safari/WebKit fallback and both microphone-denied and stopped-track states; run real physical iPhone Safari with a note held for more than seven seconds, decay to quiet and silence with no false notes, and repeat on the installed Capacitor app separately when applicable. Preserve the existing tuner UI and approved room background.

### #4 — Old branch is stale, but custom exercise editing still fails

**PR change:** The old CreatePage previously loaded editing fields only when an ID matched a seeded exercise. PR #4 instead reads from the combined exercises collection, preserves the old exercise's saved metadata and ID, and adds the routine step only after successful persistence. See [PR #4 patch](https://github.com/KSale0820/little-jazz-room/pull/4/files).

**Current code comparison:** [current CreatePage](https://github.com/KSale0820/little-jazz-room/blob/b0a0e2dda3a89fae6db229e1d09a7dbcbf188f3e/web/src/pages/CreatePage.tsx) still has the condition “editId && exercisesById[editId]”; this excludes custom IDs. Therefore **the custom edit bug is not superseded**. The new builder already validates whole-positive-minute durations and appends saved custom exercises into routine steps, including local-first fallback if team cloud save fails. Replacing modern CreatePage with the October 29 branch would remove the newer searchable exercise/routine picker and beginner-facing UI.

**Extract:** load editable nonseed exercises from exercises.find; preserve existing metadata and ID, avoid overwriting protected seed data; retain current local-first failure behavior; add create→edit→reload→append→save regression at both mobile sizes. The old Playwright script is tied to legacy buttons and requires adaptation. PR description reports 37 unit tests and a local Playwright pass, but there are no commit-associated Actions runs for this old head.

### #5 — Old completion UI obsolete; signed-in persistence defect remains

**Current demo:** [current shared PracticePage](https://github.com/KSale0820/little-jazz-room/blob/b0a0e2dda3a89fae6db229e1d09a7dbcbf188f3e/web/src/pages/PracticePage.tsx) now has an actual completion view, stable in-memory completion record, savePromiseRef reuse, rating/notes, and success-first navigation. Do not overwrite it with PR #5's older Finish→Profile page.

**Remaining cloud defect:** [current SupabasePracticeRepository](https://github.com/KSale0820/little-jazz-room/blob/b0a0e2dda3a89fae6db229e1d09a7dbcbf188f3e/web/src/repository/supabasePracticeRepository.ts) inserts session.routineId directly into a UUID foreign-key routine_id column. Seed “daily-warm-up” is a string and can be rejected by Postgres. It also substitutes an autogenerated ID when a completion ID starts with “sess-”; an ambiguous failed response followed by retry can create duplicates. This is direct source evidence independent of the PR's claims.

**Extract:** proposed additive [migration 20261029000004](https://github.com/KSale0820/little-jazz-room/blob/cb07fb1cefbd7079a328b45650d6b0dcc682d7e9/supabase/migrations/20261029000004_session_routine_reference.sql) adds routine_ref and routine_title, keeps UUID FK only for UUID routine IDs, and supports ignore-duplicate UUID-keyed inserts. Preserve stable session ID across retries and account-scoped presentation, ensure schema is applied before client rollout, verify partial cloud failures. The older branch reports mocked-supabase unit/browser tests but no Actions run at current head and **no live migration/RLS evidence**.

### #6 — Account isolation and restoration fixes are not present

**Current comparison:** [current AppProvider](https://github.com/KSale0820/little-jazz-room/blob/b0a0e2dda3a89fae6db229e1d09a7dbcbf188f3e/web/src/context/AppContext.tsx) is not keyed by account identity; it changes repo scope but does not synchronously remount descendant page form/timer state, and its Promise.all cloud load waits for ensureProfileRow and every query before applying any result. A failed profile or one content query can prevent other data from showing. [current AuthContext](https://github.com/KSale0820/little-jazz-room/blob/b0a0e2dda3a89fae6db229e1d09a7dbcbf188f3e/web/src/context/AuthContext.tsx) does an unguarded initial getSession before/alongside auth events and has no controlled error result for failed sign-out.

**PR code:** Re-keys provider descendants by authenticated user ID, changes query sync to independent settled loads, prioritizes auth events over late session restoration and handles sign-out errors. Includes a profiles INSERT grant migration (20261029000005) and profile upsert conflict behavior. These address genuine gaps. But the old AppShell and AppContext shapes predate the four-tab Practice-first design and current completion; direct merge risks regressions and overlaps #5 in AppContext. PR claimed mocked A→B regression results and 47 unit tests, **not** live RLS or device tests.

**Extract/validate:** retain current navigation and app architecture while adding account-change remount/invalidations, stale-response guards, partial content loading, error-aware sign-in/out, and profile bootstrap if required. Test account A→B in one tab with unsaved builder fields, active timer, companion selection, cloud history and pending network responses; verify B never sees A's data; apply and test migrations with real authenticated A/B accounts and Supabase RLS policies. Sequencing: coordinate #5's confirmed-session cache so it is keyed by the same scope.

### #17 — Useful historical evidence, not current acceptance

Adds two QA scripts and workflow; no production-screen changes. [CI run 41372363701](https://github.com/KSale0820/little-jazz-room/actions/runs/41372363701) is green. Downloaded the exhaustive-QA artifact and checked qa-report.json plus 390×844 and 375×667 screenshots and button inventories. The artifact lists 52 passing Chromium QA assertions; PR discussion reports 32 passing WebKit checks. These are meaningful **historical** browser signals, but snapshots include the previous Home-first shell and precede practice-first navigation, newest player work and chart work. The two scripts are absent from the current demo branch. Refresh and re-run against an updated demo head before using them as a release gate; leave this PR deferred in the meantime.

### #16 — Functional staging, not the integration vehicle

Old combined P04/P05 staging branch includes actual TunerPage, MetronomePage, ToolsPages.css, audio utility sources, App.tsx and PracticeHub changes, plus QA. The current demo already has both routes and functional tool pages through later integrated changes. Its source is **206 commits behind** demo and overlaps active #34 tuner work. Its authored PR description explicitly says “QA only” and “Do not merge this test PR.” Historical Actions succeeded. **Superseded**; do not revive its older UI or functional implementations. After owner approval, close the staging PR while retaining its relevant test evidence.

### #2 — Historic cat art audit, no app implementation

Only documentation and image/ZIP review evidence; no change to production cat binaries. It flags several pre-approved sprite inconsistencies, but the current demo uses subsequent approved companion asset mapping and newer final cat work. Its old review ZIP would add an unnecessary bulky artifact and should not be treated as production art authority. **Superseded**, though the old report may be retained separately for reference; close only with owner permission.

### #7 — Master release PR, not eligible for demo integration

The branch head is **the demo branch itself** (ahead/behind 0/0 compared with demo). It targets master, not class-demo-2026-10-31. The PR's original Home-first description is stale; source now has Practice as index route and Practice/Tracks/Routines/Progress tabs. Head CI includes [web build success](https://github.com/KSale0820/little-jazz-room/actions/runs/41621600793), web tuner success, and native foundation success; Vercel status is quota failure. Metadata says draft=false despite an old body sentence saying “Draft; do not merge.” **Leave open, do not retarget, and never merge into master without separate explicit approval.**

## 3. Shared baseline: product requirements checked against current demo

| Product requirement | Source or test evidence | Assessment |
|---|---|---|
| Practice landing page | App.tsx redirects index to /practice; AppShell NAV is Practice, Tracks, Routines, Progress | **Present in current source** |
| Exactly four bottom tabs | AppShell NAV array contains four correct labels, no Home/My Room tab | **Present** |
| One shared player | /player routes to PracticePage; Tracks and guided routines reach it | **Present** |
| Automatic chart chord timing | Current PracticePage still only tracks selectedBar and timer, independent of BPM; #27 adds musical clock | **Gap pending #27** |
| Independent key, BPM, instrument, loop | Current P02 has combined tempo/key dialog and loop highlight; #27 adds separate controls | **Gap pending #27** |
| Beginner-friendly searchable routines | Current CreatePage has picker search for exercises and routines; current lesson work and screenshots exist | **Present in part; custom edit bug remains** |
| Session completion and Progress | [run 41621421022](https://github.com/KSale0820/little-jazz-room/actions/runs/41621421022) logged passing local demo flows at both sizes, including rating, single save and Progress after reload | **Local flow evidenced; signed-in cloud has #5 defect** |
| Tuner and metronome | Web tuner mic CI and tools browser tests run; native plist bug persists | **Browser evidence; native device not certified** |
| Interactive Chart Builder | Demo App.tsx routes /charts/new and /charts/:chartId/edit; current chart editor and model/tests exist | **Future-facing implementation present; not a scope blocker for other PRs** |
| Native phone foundation | Capacitor iOS/Android scaffold present; native Actions successful on some heads | **Scaffold and compilation, not real-device validation** |
| Local-first personal recording, curated backing tracks, private recording-safe sharing | Not demonstrated or fully verified by the reviewed PRs; #27 expressly does not implement recorded audio | **Product roadmap; do not penalize scoped fixes for missing unrelated future features** |
| My Room deferred | No My Room bottom tab or required My Room route in current App.tsx | **Consistent with deferral** |
| Approved UI/artwork | Approved P02/P01 mobile reference screenshots; current CI screenshot artifacts at both sizes; G01 background and leaves checked by browser | **Partial visual evidence; new #27 screens still require review** |

**No claim of iPhone-native microphone verification is made.** All reported hardware/permission evidence is limited to config, simulator compilation or browser simulation unless explicitly described otherwise.

## 4. CI, tests, and visual evidence

### Evidence table

| Branch/PR | GitHub Actions state at head | What it establishes | What it does not establish |
|---|---|---|---|
| #25 | iOS microphone regression success 41609484734; web and cross-screen success 41609484869; native foundation successful | XML root configuration, idempotent native sync, unsigned simulator compilation, JS tests | Physical iPhone prompt or WKWebView capture |
| #34 | Web build, tuner microphone E2E, native foundation, chart CI success; tools QA failure 41621420935; integration failure 41621421022 | Worklet and fallback Chromium synthetic audio behavior; other broad tests have active failures | Fix of the real iPhone sustained-note drop |
| #27 | No commit-associated Actions runs returned; Vercel quota failure | Diff includes dedicated unit and browser script code | That new tests/screenshots were actually executed on latest head |
| #17 | Build and tools QA success, run 41372363701; 52/52 Chromium and 32/32 WebKit reported | Earlier mobile shell and controls were navigable and had screenshot coverage | Current Practice-first UI, newer P02 or real devices |
| #16 | Web build and P01 Actions success | Historical P04/P05 staging validation | Current tuner/metronome or safe re-merge |
| #2/#4/#5/#6 | No Actions runs returned for their current heads | PR bodies describe historical local builds/tests; code patches can be inspected | Fresh CI, rebased compatibility, real live Supabase RLS |
| #7 / current demo | Web build success 41621600793; tuner and native foundation success; separate cross-screen run 41621421022 has a failure | App builds and local practice workflow smoke tests passed at 390×844 and 375×667 in the cited run | All cross-screen checks are green; current native devices work |

**Specific failing log findings:**

1. [Run 41621420935](https://github.com/KSale0820/little-jazz-room/actions/runs/41621420935): browser test fails on decorative P04 tuner art/floor offset. Logged at width390: 1170×780 asset scaled to width390 with artwork bottom 801.39, while nav starts y771. Requires verification against *approved P04*, then fix **asset CSS or test expectation on an authorized integration branch** as appropriate, not as part of the unrelated worklet patch by default.
2. [Run 41621421022](https://github.com/KSale0820/little-jazz-room/actions/runs/41621421022): majority of current mobile integration stages log PASS, including 390×844 and 375×667 seeded routine→builder→player→rating→Progress/reload, track search/favorites, P02 chart scale, tools shortcuts and approved G01 assets. Later guided-teaching stage fails “Legacy instruction details were lost.” Investigate whether current beginner rewrite intentionally changes instructional copy or actually drops detail; update test or code based on requirements. Overall workflow **FAILED**, despite earlier PASS stages.
3. Vercel [quota error](https://github.com/KSale0820/little-jazz-room/pull/34): api-deployments-young-hobby-team-24h (>100 deployments/24 h). Not a TypeScript or build failure; prevents preview-based visual/device validation until a deployment is available.

### Screen and artifact checks

- [Historical exhaustive QA artifacts, run 41372363701](https://github.com/KSale0820/little-jazz-room/actions/runs/41372363701): inspected the downloaded ZIP. It contains 24 named screen captures spanning 390×844 and 375×667, machine-readable button inventories and qa-report.json (52 PASS entries), plus separate WebKit artifact in that run.
- [Current broader workflow artifacts, run 41621421022](https://github.com/KSale0820/little-jazz-room/actions/runs/41621421022): inspected the downloaded ~22 MB artifact containing 83 files, including free/guided P02, 12-/32-bar chart scales, in-session tools, Practice Hub, G01 progress, routine builder and flow captures at both reference phone sizes. The screenshots provide actual *current-demo* UI evidence but do not approve the unmerged #27 layout.
- Approved UI references from the project source pack were used as design authority, particularly P01 and P02. Historical #17 visuals reflect now-superseded Home-first navigation. Any change to P02 controls needs a side-by-side mobile visual check, avoiding chart clipping and overlay overlap.
- Browser audio tests use injected or synthetic microphone data. No real physical speaker, microphone hardware, OS privacy prompt or native bridge was exercised by this audit.

**Environment and independent execution limits:** Repository source/patches were fetched through the authenticated GitHub connector. A local clone and temporary worktree could **not** be established in this execution environment because direct github.com network/DNS access is unavailable. As a result, this audit did not independently execute npm ci, npm run build, npm test, Playwright, native Xcode/Gradle, or a temporary combined integration branch. Actions results and downloaded screenshots are cited as CI evidence, not represented as independent test runs. No merged integration simulation was performed. A clean trial worktree remains a required pre-merge step, not a completed result.

## 5. Overlap, duplication and merge dependencies

| Related work | Overlap | Safe resolution |
|---|---|---|
| #25 ↔ #34 | Both address tuner experience but different layers: native Info.plist permission versus web audio stream/worklet | #25 native configuration first; #34 after physical sustained-tone test; do not bundle unverified audio changes with permission |
| #16 ↔ #34/current demo | Both contain TunerPage, toolsAudio, tools UI; #16 predates P04/P05 merges and newer tuner work | Discard staging production code; keep current demo + targeted #34 |
| #27 ↔ current P02/#5 | PracticePage timer, progress, completion, guided steps and CSS | Port #27 onto *current* P02; never reintroduce #5's old full player |
| #4 ↔ current R03 builder | CreatePage full-screen rewrite versus targeted custom exercise bug; searchable picker already present | Patch only editable exercise lookup, preserved metadata and appropriate tests |
| #5 ↔ #6 | AppContext account scope and cloud session hydration | Integrate idempotent cloud save plus identity-keyed confirmed sessions together; migration then account A/B/RLS tests |
| #17 ↔ current mobile QA | Obsolete navigation assumptions and overlapping existing QA scripts | Rebase/copy only test improvements; do not treat old screenshots as latest approvals |
| #2 ↔ newer approved cat library | Reference asset mismatch and obsolete contact sheets | Current approved art remains authoritative |
| #7 ↔ every demo PR | #7 head follows the full demo branch, targeting master | No demo merge dependency; never promote master inadvertently |

### Safest conditional sequence after approval

1. **Create a temporary integration worktree from the latest demo commit** (outside the official branch), record SHAs, execute baseline build/unit/browser suite, and resolve the two known current CI failures or formally establish they predate candidate changes. Preserve master and demo refs.
2. **Integrate #25's five-file native permission fix into the temporary branch**, run plutil, privacy sync idempotence, unsigned iOS simulator compile, web/TypeScript/unit tests and native physical-device smoke test. Check final GitHub mergeability. Request owner approval *for #25 only* before touching the official demo branch.
3. **Integrate #27 after refreshing it to the newest P02**, choose the full-chart one-pass/loop contract, run musical clock unit tests and 390×844/375×667 Playwright + screenshots, plus guided session completion and in-session tuner/metronome. Approve only after behavior and visual sign-off.
4. **Integrate the narrowly scoped custom-exercise fix extracted from #4**, not its old page, and validate searchable builder, save/reload/edit, and local/cloud fallback.
5. **If signed-in demo/cloud functionality is required**, first stage migration and targeted #5 repository/session idempotency fixes, then #6 auth isolation/async cloud-state fixes (or integrate together if AppContext overlaps), with real two-user Supabase RLS tests. No production migration without separate authorization.
6. **Stage #34 last among these overlapping runtime changes** after its iPhone Safari/Cappacitor retest (as applicable) and after the P04 background and cross-screen failures are understood. Re-run the combined suite before asking for approval.
7. **Rebase or extract the worthwhile #17 browser QA scripts**, update the route assumptions and reference screenshots, and run them on the final proposed integration.
8. **Leave #7 untouched.** Seek separate approval to close obsolete #2 and #16 only after preserving any documentation the owner wants; leave #17 deferred until test refresh. No original master-based PR is recommended for direct merge.

### Required final integration acceptance checklist

- TypeScript/Vite production build, Vitest, lint/type checks when configured, and all relevant current GitHub Actions.
- Both 390×844 and 375×667: Practice-first four-tab navigation; no My Room; approved P01/P02 P04/P05 G01 layout; no clipped chart or controls, and at least 44 px interactive targets where feasible.
- Free and guided Practice→shared Player→Start/Pause/Resume→Finish/rate→Progress/reload; no duplicate session on rapid clicks or lost response.
- Beat-aware progression: 4/4, 3/4, split measures, mid-beat tempo/key/instrument change, seek, multi-section loops and chosen full-chart end behavior; timer remains independent of reference BPM.
- Routine and custom exercise create/edit/search/import/save/reopen and guided step navigation with actionable instructions retained.
- Real microphone pitch tracking after native permission, A440, sustained fading tones, silence/noise rejection; WebKit fallback; functional audible metronome with tempo/meter changes. Label any synthetic tests clearly.
- If cloud is used: migration order, true two-account RLS privacy, sign-out failure, delayed restoration, failed query isolation, stable UUID retry and no cross-account stale content.
- Native build/sync compatibility; no assertion of real-device success from simulator-only CI.
- Visual screenshots compared to the approved screenshots, with focused deviations acknowledged rather than blindly accepted.

## 6. Decisions required from the product owner

1. **Full chart at end:** repeat automatically while Play is active, or finish after one pass unless Loop is configured? #27 currently implements the latter.
2. **Native device acceptance:** is #25 allowed as a narrowly scoped configuration correction based on macOS CI, or must an installed iPhone microphone capture succeed before approval? The latter is recommended for a native app demonstration.
3. **Cloud scope:** do signed-in account switching and cloud practice completion have to work in the upcoming demo? If yes, prioritize the #5/#6 extracted fixes and live A/B RLS testing; if no, keep them out of the minimal local demo integration.
4. **QA discrepancy:** if beginner-friendly guided lesson text intentionally supersedes older copy, update the failing “Legacy instruction details” assertion after ensuring equivalent instructions remain understandable.
5. **Obsolete PR closure:** authorization to close #2 and #16 only after auditing or saving useful documents; authorization has not been granted in this review.
6. **Master release:** #7 is unrelated to the request to prepare the demo. Master release requires its own explicit decision.

## 7. Explicit approval and disposition list

**Ready to approve for demo now:** **None.**

**First candidate to approve after its gate:** **#25** (narrow iOS plist fix).  
**Next essential feature after fixes and validation:** **#27**.  
**Next audio reliability candidate after physical iPhone evidence:** **#34**.  
**Selective missing fixes worth commissioning:** **#4 custom edit; #5 cloud completion; #6 account isolation**.  
**Eligible for owner-authorized closure after evidence preservation:** **#2 and #16**.  
**Remain open/deferred for QA modernization:** **#17**.  
**Must remain untouched:** **#7**, existing master-directed release PR.

**No GitHub approvals, merges, closes, base-branch edits, or existing PR mutations were performed during this audit.** The only permitted repository change, if this report is submitted via a new PR, is this markdown file on a separate documentation branch.
