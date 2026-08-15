-- ============================================================================
-- Migration 006: Enable Row Level Security with role-based access control
-- ============================================================================
--
-- Context: all 9 business tables in `public` had RLS disabled, meaning anyone
-- holding the anon key (which is shipped to the browser) could read and write
-- every row. This migration closes that hole and introduces three roles.
--
--   admin      - full read/write on everything, manages users
--   technician - reads everything; creates/edits operational records
--                (work orders, schedules, QC tests, parts)
--   viewer     - read-only
--
-- Design notes:
--   * The role lives in public.user_profiles, NOT in JWT user_metadata.
--     raw_user_meta_data is user-editable and must never drive authorization.
--   * Users cannot escalate their own role: column-level privileges revoke
--     INSERT/UPDATE on user_profiles.role from the `authenticated` role, so
--     self-service writes fall back to the 'viewer' column default.
--   * Helper functions are SECURITY DEFINER with a pinned search_path. That
--     lets them read user_profiles without tripping the table's own RLS
--     policies (which would otherwise recurse).
--   * Policies call (select public.is_admin()) rather than public.is_admin().
--     Wrapping in a scalar subquery lets Postgres evaluate it once per
--     statement as an InitPlan instead of once per row.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 1: Role column on user_profiles
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'technician', 'viewer');
  END IF;
END
$$;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'viewer';

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);


-- ----------------------------------------------------------------------------
-- STEP 2: Helper functions
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.user_profiles WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.user_role() IS
  'Role of the calling user, or NULL if the user has no profile row.';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin',
    FALSE
  );
$$;

-- Staff = anyone allowed to record maintenance work (admin or technician).
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid())
      IN ('admin', 'technician'),
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;


-- ----------------------------------------------------------------------------
-- STEP 3: Prevent privilege escalation via column privileges
-- ----------------------------------------------------------------------------
-- RLS decides which ROWS a user may touch; it cannot stop a user from setting
-- a particular COLUMN to a particular value on a row they legitimately own.
-- Column-level privileges close that gap.
--
-- Gotcha: a table-level GRANT implies every column, so `REVOKE UPDATE (role)`
-- on its own is a no-op. You must revoke at table level, then grant back only
-- the columns clients may write.

REVOKE INSERT, UPDATE ON public.user_profiles FROM authenticated, anon;
REVOKE ALL ON public.user_profiles FROM anon;

GRANT INSERT (user_id, full_name, must_change_password, password_changed_at, created_at, updated_at)
  ON public.user_profiles TO authenticated;

GRANT UPDATE (full_name, must_change_password, password_changed_at, updated_at)
  ON public.user_profiles TO authenticated;

-- `role` is now unwritable by any client, including admins. Admins change
-- roles through this function, which re-checks authorization itself and
-- refuses to remove the last administrator.
CREATE OR REPLACE FUNCTION public.set_user_role(target_user UUID, new_role public.app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;

  IF new_role <> 'admin'
     AND (SELECT role FROM public.user_profiles WHERE user_id = target_user) = 'admin'
     AND (SELECT count(*) FROM public.user_profiles WHERE role = 'admin') <= 1
  THEN
    RAISE EXCEPTION 'Cannot remove the last administrator';
  END IF;

  UPDATE public.user_profiles
     SET role = new_role, updated_at = now()
   WHERE user_id = target_user;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role) TO authenticated;


-- ----------------------------------------------------------------------------
-- STEP 4: Auto-provision a profile for every new auth user
-- ----------------------------------------------------------------------------
-- Without this, a newly registered user has no profile row, user_role()
-- returns NULL, and every policy denies them - a confusing lockout.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ----------------------------------------------------------------------------
-- STEP 5: Backfill profiles for existing users
-- ----------------------------------------------------------------------------

INSERT INTO public.user_profiles (user_id, role)
SELECT id, 'viewer' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Seed initial roles. Adjust these to match your real team.
UPDATE public.user_profiles SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('padhu.lp@gmail.com', 'padmanabhan@manentia.ai')
);

UPDATE public.user_profiles SET role = 'technician'
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('padhu.lp2@gmail.com', 'rohit.lp1955@gmail.com', 'jkswamynvl@gmail.com')
);


-- ----------------------------------------------------------------------------
-- STEP 6: Enable RLS everywhere
-- ----------------------------------------------------------------------------

ALTER TABLE public.manufacturers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_tests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.activity_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.cybersecurity_alerts ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------
-- STEP 7: Master data - all staff read, admins write
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['manufacturers', 'locations', 'customers', 'inventory', 'technicians']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((select public.user_role()) IS NOT NULL)',
      t || '_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()))',
      t || '_insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()))',
      t || '_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((select public.is_admin()))',
      t || '_delete', t);
  END LOOP;
END
$$;


-- ----------------------------------------------------------------------------
-- STEP 8: Operational data - staff write, admins delete
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['work_orders', 'schedules', 'qc_tests', 'parts_inventory']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((select public.user_role()) IS NOT NULL)',
      t || '_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((select public.is_staff()))',
      t || '_insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((select public.is_staff())) WITH CHECK ((select public.is_staff()))',
      t || '_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((select public.is_admin()))',
      t || '_delete', t);
  END LOOP;
END
$$;


-- ----------------------------------------------------------------------------
-- STEP 9: user_profiles
-- ----------------------------------------------------------------------------
-- The previous "Allow profile creation" policy granted INSERT to the `public`
-- role with WITH CHECK (true) - i.e. anonymous callers could create arbitrary
-- profile rows. Replaced below.

DROP POLICY IF EXISTS "Allow profile creation"        ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile"  ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile"    ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_delete ON public.user_profiles;

CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR (select public.is_admin()));

CREATE POLICY user_profiles_insert ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR (select public.is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select public.is_admin()));

CREATE POLICY user_profiles_delete ON public.user_profiles
  FOR DELETE TO authenticated
  USING ((select public.is_admin()));


-- ----------------------------------------------------------------------------
-- STEP 10: Audit tables - append-only
-- ----------------------------------------------------------------------------
-- No UPDATE or DELETE policy is created, so those operations are denied for
-- every client role. This is deliberate: 21 CFR Part 11 expects audit records
-- to be immutable. Corrections go in as new rows.

DROP POLICY IF EXISTS "Users can only view their own audit logs" ON audit.activity_log;
DROP POLICY IF EXISTS activity_log_select ON audit.activity_log;
DROP POLICY IF EXISTS activity_log_insert ON audit.activity_log;

-- Note: the dropped policy tested (auth.jwt() ->> 'role') = 'admin'. That claim
-- holds the Postgres role ('authenticated'), never 'admin', so the admin branch
-- was dead code. Uses the profile role instead.
CREATE POLICY activity_log_select ON audit.activity_log
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR (select public.is_admin()));

CREATE POLICY activity_log_insert ON audit.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS cybersecurity_alerts_select ON audit.cybersecurity_alerts;
DROP POLICY IF EXISTS cybersecurity_alerts_insert ON audit.cybersecurity_alerts;
DROP POLICY IF EXISTS cybersecurity_alerts_update ON audit.cybersecurity_alerts;

CREATE POLICY cybersecurity_alerts_select ON audit.cybersecurity_alerts
  FOR SELECT TO authenticated
  USING ((select public.user_role()) IS NOT NULL);

CREATE POLICY cybersecurity_alerts_insert ON audit.cybersecurity_alerts
  FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY cybersecurity_alerts_update ON audit.cybersecurity_alerts
  FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));


-- ----------------------------------------------------------------------------
-- STEP 11: Pin search_path on pre-existing functions
-- ----------------------------------------------------------------------------
-- Flagged by the Supabase linter: a mutable search_path lets a caller shadow
-- referenced objects and hijack execution.

ALTER FUNCTION public.update_parts_stock()        SET search_path = public, pg_temp;
ALTER FUNCTION public.update_modified_timestamp() SET search_path = public, pg_temp;


-- ----------------------------------------------------------------------------
-- STEP 12: Keep SECURITY DEFINER functions off the public REST surface
-- ----------------------------------------------------------------------------
-- Anything in `public` is reachable at /rest/v1/rpc/<name>. A trigger function
-- has no business being callable there, and the role helpers are meaningless
-- for an anonymous caller.

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin()  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff()  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff()  TO authenticated;


-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT c.relname, c.relrowsecurity,
--        (SELECT count(*) FROM pg_policies p
--          WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
--   FROM pg_class c
--  WHERE c.relkind = 'r' AND c.relnamespace = 'public'::regnamespace
--  ORDER BY 1;
--
-- SELECT u.email, p.role
--   FROM public.user_profiles p JOIN auth.users u ON u.id = p.user_id
--  ORDER BY p.role, u.email;
