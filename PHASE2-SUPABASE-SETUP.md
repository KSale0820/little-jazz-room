# Phase 2 — Supabase manual setup (team beta)

Follow these steps in order. **Do not paste service_role keys or teammate passwords into chat or git.**

## 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a **free** project.
2. Wait until the database is ready.

## 2. Disable public signup

1. Open **Authentication → Providers → Email**.
2. Enable **Email** provider (password sign-in).
3. Turn **OFF** “Allow new users to sign up” / enable sign-ups (wording varies).
4. Save.

Confirm: attempting sign-up in the app or via `auth.signUp` should fail after this.

## 3. Apply SQL migrations

**Option A — SQL Editor (simplest)**

1. Open **SQL Editor**.
2. Paste and run the full contents of:
   - `supabase/migrations/20251029000001_initial_schema.sql`
   - then `supabase/migrations/20251029000002_rls_policies.sql`

**Option B — Supabase CLI**

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 4. Create team accounts (dashboard)

For each teammate (minimum two for RLS tests):

1. **Authentication → Users → Add user → Create new user**
2. Enter unique email + strong temporary password.
3. Enable **Auto Confirm User** if shown.
4. Repeat for User B.

Optional CLI recovery (local only, service role in shell env — never in Vite):

```bash
cd web
set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npm run provision:user -- teammate-a@example.com "TempPassword123!"
```

## 5. Configure the web app

```bash
cd web
copy .env.example .env.local
```

Edit `web/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Keys are under **Project Settings → API** (use the **anon/public** key only).

Restart dev server:

```bash
npm run dev
```

## 6. Verify in the app

1. Open the app → **Team sign-in** (sidebar desktop / top-right mobile).
2. Sign in as User A → choose a cat → create/save a **private** routine.
3. Sign out → sign in as User B → confirm User A’s private routine is **not** visible.
4. Publish a **public** routine as User A → sign out → confirm it appears in Explore for anonymous/local visitors.
5. `/signup` redirects to `/signin` (no public registration UI).

## 7. Run automated RLS tests

**Recommended (hidden password prompts, credentials not saved to disk):**

```powershell
cd web
npm run test:rls:secure
```

Or run the script directly:

```powershell
cd web
.\scripts\Invoke-RlsTest.ps1
```

The script reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `web/.env.local`, prompts for User A/B email and password (passwords hidden), runs the tests, then clears `TEAM_USER_*` from the process environment.

**Manual env (only if you already use a secrets manager in your shell):**

```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
$env:SUPABASE_ANON_KEY="your-anon-key"
# set TEAM_USER_* in your shell — never commit or paste passwords into chat
cd web
npm run test:rls
```

Also run regression:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
python ../validate_suite.py
```

## 8. Security advisor (recommended)

In Supabase Dashboard: **Database → Security Advisor** (or Advisors). Fix any RLS gaps before demo.

---

## What Phase 2 includes

| Feature | Status |
|--------|--------|
| Profiles (cat, milestone settings) | Cloud when signed in |
| User exercises & routines + step snapshots | Cloud save |
| Practice sessions | Cloud when signed in |
| Public routine reads | Anonymous + any user |
| Unlisted token links | **Not enabled** (Phase 3) |
| Local-only mode without `.env.local` | Unchanged Phase 1 behavior |

## What stays local without sign-in

Seed charts, seed routines, local drafts, and device-only sessions continue to work with no Supabase config.

See `PHASE2-STATUS.md` for implementation notes and blockers.
