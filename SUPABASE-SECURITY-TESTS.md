**Team-beta auth policy:** Manually pre-create team accounts, disable Supabase open signups, require unique email/password per person. No OAuth or email invitation dependency. See `TEAM-BETA-AUTH.md`.

# Mandatory Supabase security tests (Phase 2/3 gate)

**No live database is configured in this starter suite. SQL/RLS has NOT been applied or penetration-tested here. Cursor must build and run these tests on a free project with an authenticated user A, authenticated user B and anonymous client.**

| Scenario | Expected result |
|---|---|
| Anonymous lists routines | Only public; never private or unlisted |
| Anonymous guesses unlisted routine UUID | No access via ordinary SELECT or relationships |
| Anonymous opens valid high-entropy unlisted token | Can read sanitized title and **published step snapshots** only |
| Anonymous opens invalid/modified token | Identical not-found behavior; no token enumeration endpoint |
| Anonymous reads private profile, exercise, recording or notes | Denied |
| User A reads/updates A's own private routine | Allowed |
| User B reads/edits/deletes A's private routine or steps | Denied |
| User B forges a step under A's routine | Denied by policy even with guessed routine UUID |
| User B publishes routine referencing A's private exercise | No direct private data access; owned step snapshots only |
| User B remixes a public or valid unlisted routine | Own independent copied steps and source attribution |
| User A edits/deletes source after B remixes | B's snapshots unchanged |
| User A changes selected cat; user B refreshes | Only A's cat changes |
| Anonymous calls all public RPC functions | Only deliberately public read operations are executable; no private data output |

Security implementation constraints:
- Enable RLS on every public table, with explicit role grants and operation-specific SELECT/INSERT/UPDATE/DELETE policies. Do not depend on client-side filters for privacy.
- Unlisted URLs are **secret tokens**, not public row IDs. Use CSPRNG/high entropy (>=128 bits), no predictable identifiers and no indexing/listing leak.
- A SECURITY DEFINER token lookup, if used, must have `SET search_path=''`, schema-qualified relations, pinned privileges/revoked defaults, sanitized output with no `share_token` exposure, and be the *only* anon path to unlisted content. Supabase flags public exposed definer functions for review; this is an intentional, high-risk exception requiring explicit test and a written justification. A carefully scoped Edge Function is an alternative.
- Publication must contain independent published step snapshots, including instructions, tempo and durations, rather than exposing private exercise rows through joins.
- Private practice sessions and personal recordings/notes never pass through public/unlisted share APIs.
- Never place `service_role`, Google OAuth client secrets, or other privileged tokens in `VITE_*` variables, browser JS, GitHub commits or assistant chats.
- Run Supabase security advisor and check RLS, function-execute grants and leaked secrets before Sunday. Correct missing/failed tests rather than silently switching off RLS.

**If this cannot pass before the launch:** public/private only; unlisted remains a clearly labeled disabled preview. Never make unlisted broadly readable for speed.
