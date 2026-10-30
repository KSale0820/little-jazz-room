# Authentication and account isolation

Branch `feature/auth-account-isolation`, independently based on master after PR #3.

The account provider and its page descendants now remount when the authenticated user ID changes. Cloud state, account drafts, companion state, unsaved exercise fields, active routine and timers therefore reset before the next identity renders. Token refreshes for the same user preserve state. Initial session restoration completes before account UI mounts.

Each content query now applies its own successful result; a delayed/failed exercise request or missing profile no longer prevents routines or practice history from loading. Old provider requests are cancelled for state updates after unmount. The existing account-scoped local storage keys remain unchanged.

Session restoration subscribes to auth events before reading the initial session; newer events take precedence over stale read results. Returned and thrown authentication errors are handled. Restore errors use the existing status/error locations; sign-out failures use the existing toast and leave the action retryable.

Companion writes initialize the profile using conflict-ignore insertion, then require an updated row to be returned. Missing-row updates can no longer silently succeed. Profile reads initialize only missing rows. Initialization does not overwrite an existing companion choice.

## Deployment and live verification

Apply `supabase/migrations/20261029000005_profile_insert_grant.sql` before relying on profile fallback creation. The original schema provides an owner-only INSERT policy but omits the authenticated INSERT table privilege. The migration supplies this privilege and leaves that RLS policy intact. No migration was applied to the live project in this change.

Live A/B/anonymous RLS tests could not run: `TEAM_USER_A_EMAIL`, `TEAM_USER_A_PASSWORD`, `TEAM_USER_B_EMAIL`, and `TEAM_USER_B_PASSWORD` are missing from the local test environment. Secret values were not printed or committed. With dedicated test accounts configured, run the repository RLS suite and verify profile insertion/conflict-ignore writes, denied cross-account profile access, session refresh, and account switching against the deployed project. Confirm disabled public signup in Supabase settings as a separate deployment requirement.

## Validation

- `npm run test`: 47 tests across 12 files pass (10 new auth/profile cases).
- `npm run build`: TypeScript and production build pass.
- `npm run lint`: exit 0, existing warnings remain.
- Start `npm run dev -- --host 127.0.0.1 --port 5176`, then run `node scripts/test-account-isolation.mjs`.
- Browser regression covers invalid credentials/retry, A → B on an active form without reloading, delayed A data after B signs in, B history loading despite failed exercises/delayed routines, companion selection, session restoration after reload, sign-out failure/retry, anonymous state, preserved per-account drafts and no page errors.
- Cloud auth/REST responses are mocked; no real account or database writes occur. Requires a configured development Supabase URL/publishable key and installed Edge. Override `APP_URL` or `PW_CHANNEL` as needed.

Layouts, approved assets, recording-first audio and deferred unlisted sharing are unchanged. No dependencies were added. PRs #4 and #5 are separate changes; their AppContext edits should be reconciled when integrating, then the combined suite rerun. Anonymous public discovery and profile settings fields remain subsequent tasks.
