# Phase 2 status — Supabase team beta

**Stopped before Phase 3** (unlisted token sharing, remix UX, share URLs).

## Implemented in repo

- Versioned migrations: `supabase/migrations/20251029000001_initial_schema.sql`, `20251029000002_rls_policies.sql`
- RLS on all app tables; anonymous **SELECT** only on **public** routines + their step snapshots
- Team email/password sign-in UI (`/signin`), `/signup` → sign-in redirect, sign-out
- Supabase adapter: profiles (cat), exercises, routines + snapshots, practice sessions, audio metadata table
- **Local-first fallback** when `VITE_SUPABASE_*` is unset (Phase 1 unchanged)
- Scripts: `web/scripts/provision-team-user.mjs`, `web/scripts/supabase-rls-test.mjs`
- Setup guide: `PHASE2-SUPABASE-SETUP.md`
- Env template: `web/.env.example`

## Regression (local, no Supabase)

| Check | Result |
|-------|--------|
| `python validate_suite.py` | Run after pull |
| `npm run typecheck` | Run after pull |
| `npm run lint` | Run after pull |
| `npm run test` (vitest) | Run after pull |
| `npm run build` | Run after pull |

## Live Supabase tests — blocker

**RLS two-account tests were not executed in this environment** because no project credentials were available.

**Owner action required:**

1. Complete `PHASE2-SUPABASE-SETUP.md`
2. Run `npm run test:rls` from `web/` with User A/B credentials
3. Manually verify cat isolation and session persistence across logout/login

Report any failures before Phase 3.

## Known gaps (intentional for Phase 3)

- Unlisted share tokens + SECURITY DEFINER lookup RPC
- Remix flow with attribution and independent snapshot copies in UI
- Cloudflare deploy env vars
- Password change flow (document as post-demo if needed)
- Full `SUPABASE-SECURITY-TESTS.md` matrix (forged steps, unlisted token positive/negative) — partial coverage in `test:rls` only

## Files touched (Phase 2)

- `supabase/migrations/*`
- `web/src/context/AuthContext.tsx`, `AppContext.tsx`
- `web/src/lib/supabase/*`, `web/src/repository/supabase*.ts`
- `web/src/pages/SignInPage.tsx`, `App.tsx`, `AppShell.tsx`, `CreatePage.tsx`
- `web/.env.example`, `PHASE2-SUPABASE-SETUP.md`
