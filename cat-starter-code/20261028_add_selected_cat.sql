-- Apply AFTER creating public.profiles (or merge this column into its CREATE TABLE).
-- The existing profiles owner-only UPDATE/SELECT RLS policies must remain in force.
ALTER TABLE public.profiles
 ADD COLUMN IF NOT EXISTS selected_cat_id text NOT NULL DEFAULT 'luna';
ALTER TABLE public.profiles
 ADD CONSTRAINT profiles_selected_cat_id_allowed
 CHECK (selected_cat_id IN ('luna','milo','maple','mochi','pepper','patches','chai','biscuit'));
-- Before running on an already-migrated database, check whether the above constraint exists.
-- Do not give anonymous clients UPDATE rights to profile rows.
