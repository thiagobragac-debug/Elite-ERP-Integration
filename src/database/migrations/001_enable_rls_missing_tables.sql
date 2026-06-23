-- =============================================================================
-- MIGRATION: Enable RLS on Missing Tables
-- =============================================================================
-- Description: Enable Row Level Security (RLS) on tables that were identified
--              as accessible during the RLS audit. This ensures multi-tenant
--              data isolation.
-- Date: 2026-06-16
-- Requirements: 3.3
-- Audit Reference: src/database/audit-reports/FINDINGS-SUMMARY.md
-- =============================================================================

-- =============================================================================
-- MIGRATION OVERVIEW
-- =============================================================================
-- Tables addressed in this migration:
-- 1. user_drafts - Enable RLS with user_id isolation (not tenant_id)
-- 
-- Tables intentionally left accessible:
-- - market_quotes: Shared market data (no tenant isolation needed)
-- - market_import_logs: System-wide import logs (no tenant isolation needed)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. ENABLE RLS ON user_drafts TABLE
-- =============================================================================
-- user_drafts stores draft content for users across the application.
-- This table should be isolated by user_id, not tenant_id, because drafts
-- are personal to each user.

-- Step 1.1: Verify table structure
DO $$
BEGIN
  -- Check if user_drafts table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_drafts'
  ) THEN
    RAISE NOTICE 'Table user_drafts does not exist. Skipping.';
  ELSE
    RAISE NOTICE 'Table user_drafts exists. Proceeding with RLS setup.';
  END IF;
END $$;

-- Step 1.2: Enable RLS on user_drafts
ALTER TABLE IF EXISTS public.user_drafts 
  ENABLE ROW LEVEL SECURITY;

-- Step 1.3: Create SELECT policy for user_drafts
-- Users can only see their own drafts
DROP POLICY IF EXISTS "user_drafts_select_own" ON public.user_drafts;
CREATE POLICY "user_drafts_select_own"
ON public.user_drafts
FOR SELECT
USING (
  -- Check if user_id matches authenticated user
  user_id = auth.uid()
);

-- Step 1.4: Create INSERT policy for user_drafts
-- Users can only create drafts for themselves
DROP POLICY IF EXISTS "user_drafts_insert_own" ON public.user_drafts;
CREATE POLICY "user_drafts_insert_own"
ON public.user_drafts
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- Step 1.5: Create UPDATE policy for user_drafts
-- Users can only update their own drafts
DROP POLICY IF EXISTS "user_drafts_update_own" ON public.user_drafts;
CREATE POLICY "user_drafts_update_own"
ON public.user_drafts
FOR UPDATE
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Step 1.6: Create DELETE policy for user_drafts
-- Users can only delete their own drafts
DROP POLICY IF EXISTS "user_drafts_delete_own" ON public.user_drafts;
CREATE POLICY "user_drafts_delete_own"
ON public.user_drafts
FOR DELETE
USING (
  user_id = auth.uid()
);

-- =============================================================================
-- 2. VERIFICATION QUERIES
-- =============================================================================

-- Verify RLS is enabled on user_drafts
DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT c.relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'user_drafts';
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS is enabled on user_drafts';
  ELSE
    RAISE NOTICE '❌ RLS is NOT enabled on user_drafts';
  END IF;
END $$;

-- Count policies on user_drafts
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'user_drafts';
  
  RAISE NOTICE 'user_drafts has % policies configured', policy_count;
END $$;

-- =============================================================================
-- 3. ROLLBACK INSTRUCTIONS
-- =============================================================================
/*
If you need to rollback this migration, execute the following:

BEGIN;

-- Drop policies
DROP POLICY IF EXISTS "user_drafts_select_own" ON public.user_drafts;
DROP POLICY IF EXISTS "user_drafts_insert_own" ON public.user_drafts;
DROP POLICY IF EXISTS "user_drafts_update_own" ON public.user_drafts;
DROP POLICY IF EXISTS "user_drafts_delete_own" ON public.user_drafts;

-- Disable RLS
ALTER TABLE IF EXISTS public.user_drafts DISABLE ROW LEVEL SECURITY;

COMMIT;
*/

COMMIT;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary:
-- ✅ Enabled RLS on user_drafts table
-- ✅ Created 4 policies for user isolation (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Verified RLS is enabled
-- ✅ Counted policies
--
-- Next Steps:
-- 1. Test user isolation with multiple test users
-- 2. Verify drafts are properly isolated
-- 3. Update documentation with new RLS policies
-- =============================================================================
