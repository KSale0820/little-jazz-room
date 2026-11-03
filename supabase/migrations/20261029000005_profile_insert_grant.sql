-- Profile fallback creation already has an owner-only INSERT RLS policy.
-- Supply the table privilege missing from the original grants.
grant insert on public.profiles to authenticated;
