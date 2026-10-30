# Reliable practice completion

Branch: `feature/practice-completion`, independently based on master after PR #3.

Seed routines previously sent text IDs such as `daily-warm-up` into the UUID `practice_sessions.routine_id` foreign key. Signed-in Finish failed, leaving no history entry.

This change stores the original reference in `routine_ref` and the completion-time label in `routine_title`. Actual cloud UUIDs still populate the foreign key. Legacy history falls back to its existing `routine_id`. Text references and titles survive source changes/deletion.

Finish captures a UUID, elapsed duration, timestamp and routine reference once. While saving, repeated clicks are ignored. After a failure the timer and step navigation stay paused; Finish retries the same record. Cloud writes use `ON CONFLICT (id) DO NOTHING`; device storage also deduplicates by ID and reports quota failures. A confirmed cloud completion updates profile state without waiting for all other cloud queries. Completion callbacks cannot navigate after leaving Practice or switching accounts.

## Deployment

Apply `supabase/migrations/20261029000004_session_routine_reference.sql` **before deploying this client**. It adds two nullable text columns and leaves existing rows, grants and RLS policies intact. A project without the migration will reject new saves; the UI retains the pending completion and shows the retry error.

No live migration was applied as part of this PR. Verify with dedicated team accounts after applying the migration: finish a seed routine, refresh Profile, finish an owned cloud routine, and confirm another account/anonymous client cannot read either session. The existing owner-only session RLS remains required.

## Validation

- `cd web; npm run test`: 45 tests passed, including eight new persistence cases using the real Supabase client with mocked fetch.
- `npm run build`: TypeScript and Vite production build passed.
- `npm run lint`: exit 0; pre-existing warnings remain.
- Start `npm run dev -- --host 127.0.0.1 --port 5175`, then run `node scripts/test-practice-completion.mjs`.
- Browser regression passed: elapsed time across steps, local quota failure/retry, profile reload, synchronous duplicate Finish clicks, commit followed by lost response, frozen-record retry, immediate history during an unrelated sync failure, seed/cloud/device-local routine references, and leaving Practice while a save is in flight.
- Browser cloud tests intercept Supabase auth and REST requests. No real credentials or cloud writes. A configured URL/publishable-key build and installed Edge are needed; `APP_URL` and `PW_CHANNEL` override defaults.

## Scope and limits

Layouts, approved art and recording-first audio behavior are preserved. No dependencies or sharing features were added. PR #4's exercise changes are independent.

Retry state lasts while the current Practice page remains mounted. Navigating away or reloading before acknowledgement discards pending retry state; durable offline retry queues remain a separate task. Existing interval timer drift, 200-session history cap, general account-isolation issues and grouped cloud-sync failures remain in the audit backlog.
