# MVP functionality audit — October 29, 2026

Baseline: `origin/master` at `2eec9d0` (merged PR #3). This is a source audit with targeted browser verification, not certification of the deployed Supabase project. No layout, approved assets, or recording-first architecture changes are proposed. Unlisted sharing remains deferred.

Working means the implemented baseline works within the stated scope; Partial means only part of the workflow exists; Missing means no usable implementation; Broken means an existing interaction fails.

| Feature | Baseline status | Evidence / gap |
|---|---|---|
| Team email/password sign-in and sign-out | Partial | AuthContext and SignInPage use Supabase; session restoration exists. Live accounts, disabled API signup, expired-session and error recovery not verified. Sign-out ignores errors. |
| Profile and companion | Partial | Cat preference uses profiles; profile trigger exists. Motion and focus are device preferences; profile motion/milestone columns are not wired. No editable identity/profile fields. |
| Exercise discovery | Working | Seed and own exercise text/category/instrument filters exist. No level filter or public-exercise query. |
| Custom exercise creation | Partial | Local storage and Supabase upsert exist. Invalid durations accepted by UI; failed cloud save adds a ghost step before persistence. Fixed in first PR. Instrument/BPM/repetitions editing absent. |
| Custom exercise editing | Broken | Explore sends custom IDs, but Create only populates seed IDs. Fixed in first PR; existing metadata retained and custom ID reused. |
| Routine creation and reorder | Partial | Local persistence and atomic cloud routine/steps RPC exist. Default seed steps and new custom exercises can be reordered. No existing-exercise picker or step removal. |
| Routine editing and drafts | Missing | Draft fields persist locally, but no edit route/action or persisted routine ID; repeated Save creates another routine. Account-change draft effect needs regression coverage. |
| Public publishing and discovery | Broken | Publish writes public routines, but public reads run only inside signed-in cloud synchronization. Anonymous users see seed/local data only despite public-read RLS. |
| Remix and attribution | Missing | Schema has remix ancestry columns; client model, RPC, attribution and independent-copy interaction do not implement them. |
| Private ownership and isolation | Partial | Account-scoped local repository and owner RLS exist. Cloud state is not synchronously cleared when switching users; grouped sync makes one failure block all results. Live A/B/anonymous checks required. |
| Routine practice and timers | Partial | Ordered steps, pause/resume, accumulated elapsed time and snapshot playback exist. Interval tick counting can drift in background tabs; Finish lacks an in-flight/idempotency guard. |
| Finish seed routine while signed in | Broken | addSession sends `daily-warm-up` and other seed IDs to `practice_sessions.routine_id`, a UUID foreign key. Local routine IDs have the same incompatibility. |
| Chord charts | Working | Structured charts, chart selection, transposition, written pitch, measure selection and notation loop highlights are implemented. These are notation controls, without audio synchronization. |
| History and progress | Partial | Local/cloud records drive calendar, totals, home streak and plant growth. Both repositories cap history at 200; rounding each session distorts totals. No detailed history or weekly view. |
| Learning paths | Partial | Seed sequence summaries render; sessions are not navigable as a path. |
| Achievements, friends, challenges | Missing | Explicitly labeled previews; no backend behavior. |
| Recordings, stems, metronome, audio processing | Missing | Honest disabled/preview states; audio metadata schema only. No audio assets/player pipeline. Preserve recording-first contract; no synthesized backing substitute. |
| Unlisted sharing | Missing (deferred) | Preview only; token capability reader is absent. Do not implement in these tasks. Ordinary Save with Unlisted selected can fail its schema constraint; show the existing deferred explanation before submission. |

## Prioritized independent tasks

Each task gets its own branch and focused PR based on master. Agents can work in parallel on non-overlapping files; do not merge failing checks. Where UI controls are absent, implement/test the service layer first and coordinate the eventual action wiring with Stitch.

1. **P0 — Custom exercise create/edit reliability** (`feature/custom-exercise-editing`, first PR). Own CreatePage and browser regression script. Load custom exercise records, keep identity/metadata, reject invalid durations, append the persisted ID only after success. Acceptance: local reload/routine playback and mocked-cloud failure/retry/edit regression. Implemented here.
2. **P0 — Reliable practice completion** (`feature/practice-completion`). Own PracticePage, session repository methods and a new migration. Preserve a text routine reference/title for seed/local routines while only writing actual cloud UUIDs to the FK; use stable session UUIDs and retry-safe writes. Update history immediately after successful save. Acceptance: seed/custom cloud/local finish, retry and double-click, then reload history. Independent of task 1.
3. **P0 — Authentication and account isolation** (`feature/auth-isolation`). Own AuthContext, AppContext cloud-loading lifecycle and profile repository. Clear/account-key cloud data, reject stale async results, handle restore/sign-out failures, isolate query errors, avoid concurrent profile initialization races. Acceptance: A → B → logout with delayed responses; no prior account data visible. Run existing live A/B/anonymous RLS suite with dedicated test accounts. Independent of tasks 1–2; coordinate AppContext session-update lines with task 2.
4. **P1 — Anonymous public discovery** (`feature/public-routine-discovery`). Own a public read repository/provider and Explore data wiring. Read public routines without requiring a user, retain owner metadata, distinguish community routines from "yours". Acceptance: anonymous sees public snapshots, cannot see private rows; signed-in results deduplicate. Integrates after task 3's provider changes.
5. **P1 — Routine editing/persistence** (`feature/routine-editing`). Own routine draft/service model and repository tests; integrate CreatePage after task 1. Persist editing identity, preserve snapshots/durations, validate nonempty steps, ensure repeated save updates one record. Add existing-exercise/step-removal behavior only through approved controls. Reject deferred Unlisted before saving. Acceptance: create → reopen → reorder/edit → save → reload with one ID; RPC failure leaves prior steps intact.
6. **P1 — Public remix service** (`feature/routine-remix`). Own remix migration, repository service and tests. Copy snapshot content into a new owner-controlled private routine, preserve creator credit independently of source deletion, enforce ownership. Acceptance: B remixes A public routine, A edits/deletes source, B copy remains playable/editable; private source denied. Can develop alongside task 5; coordinate shared RPC changes. No unlisted access.
7. **P2 — Accurate progress** (`feature/practice-progress`). Own practiceStats and history pagination/aggregation. Aggregate seconds before rounding, fetch complete history or server aggregates, specify local-day/streak semantics. Acceptance: midnight/DST boundaries, yesterday-only streak, fractional minutes, >200 sessions. Integrates after task 2's session reference model.
8. **P2 — Profile settings and path navigation** (separate branches/PRs). Wire existing profile preferences to cloud with isolated-account tests; expose path navigation only through approved controls. Audio delivery and preview gamification remain a separate scope.

## First PR verification

- `cd web; npm run test`: 10 files, 37 tests passed.
- `npm run build`: TypeScript and Vite production build passed.
- `npm run lint`: exit 0; existing React hook/render warnings remain.
- Start `npm run dev -- --host 127.0.0.1 --port 5174`, then run `node scripts/test-exercise-workflow.mjs`.
- Browser test passed local create/discover/edit/invalid-duration/reload/routine/playback and mocked Supabase failure/retry/server-ID/edit scenarios. Uses installed Edge via Playwright; `PW_CHANNEL` and `APP_URL` are configurable. Cloud scenario explicitly skips on unconfigured builds.
- Live Supabase migrations, RLS, cross-account access and production/mobile deployment were not tested. No secrets were read or committed. No new dependencies.
