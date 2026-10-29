# Sunday team-only authentication (approved)

**Scope:** Only the user and their teammates need working accounts by Sunday, November 1. A public, anonymous viewer may explore sample charts and access genuinely public routines or a valid unlisted link. Only provisioned users may edit, save, remix, or publish. There is NO open registration in this beta.

## Simplest free implementation: pre-created email/password accounts

1. Create a free Supabase project. In **Authentication → Sign In / Providers**, enable Email/password and **disable “Allow new users to sign up”**. Do not disable the ability for existing users to sign in.
2. In **Authentication → Users → Add user → Create new user**, create **one distinct account per teammate**, each with a strong unique temporary password. If offered, choose **Auto Confirm User**, so no email confirmation is necessary. Verify the exact dashboard wording, since Supabase UI can change. Never use a single shared account. Do not bulk-insert directly into `auth.users` with SQL.
3. Privately give each person only *their* email and temporary password, and advise changing it after first login using a verified change-password option. Do not send passwords through the app's shared routine links, commit them, or paste any authentication secrets into AI chats. If a password-change flow is not yet implemented, explicitly document it as a post-demo task and do not reuse temporary passwords elsewhere.
4. Cursor implements **email + password sign-in and sign-out**, a visible 'Team beta: account provided by the project owner' note, and a nonfunctional /signup URL redirect to sign in (not a fake sign-up). Do not add Google OAuth unless separately requested later.
5. The frontend uses only Supabase URL and **publishable/anon** key. Admin account creation, secret key, service_role key, or privileged functions must never run from browser code.
6. Keep Supabase RLS enforcing owners and public reads. **Disabling signup alone is not an access-control policy.** Secure unlisted reads by a scoped token API, otherwise disable their external link for Sunday.
7. Email invitation, magic-link and reset-password workflows are **not required**. Supabase's default SMTP is restricted to authorized project team addresses and low rates; don't depend on email delivery for the beta.

### If dashboard password-account creation is blocked

Ask the project owner to verify the Supabase Dashboard user-creation options. Cursor may propose an **administrator-only, locally executed one-time provisioning script** (not a web endpoint) calling `supabase.auth.admin.createUser({email,password,email_confirm:true})`; the secret is read only from an untracked local environment variable, never printed or committed. This script is an optional recovery path, not an additional infrastructure requirement. Never disable email confirmation while allowing open signup as a workaround.

## Team-beta acceptance gate

- Team user A and B can each log in from different browsers/devices using their own credentials, log out, and log in again after refresh.
- Public registration cannot create another user (including via the underlying auth API).
- Logged-out visitor can read PUBLIC routine; private and unlisted are not browsable. A valid unlisted capability URL may read sanitized published snapshots only if security tests pass.
- User A cannot edit or read user B's private exercises/routines; B can independently remix permitted content; original stays unchanged.
- Supabase and Cloudflare cost remain $0 incremental; no Google Cloud project or OAuth consent configuration is required.

Docs: https://supabase.com/docs/guides/auth/general-configuration ; https://supabase.com/docs/guides/auth/users ; https://supabase.com/docs/reference/javascript/auth-admin-createuser ; https://supabase.com/docs/guides/auth/auth-smtp
