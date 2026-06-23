-- =============================================================================
-- MIGRATION TEMPLATE: Enable RLS with Tenant Isolation
-- =============================================================================
-- Description: Template for enabling Row Level Security (RLS) on new tables
--              that require multi-tenant isolation based on tenant_id.
-- Usage: Replace 'your_table_name' with the actual table name
-- Requirements: 3.3
-- =============================================================================

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================
-- 1. Copy this template file and rename it with a sequential number
-- 2. Replace all instances of 'your_table_name' with your actual table name
-- 3. Review the policy logic to ensure it matches your requirements
-- 4. Test in development environment first
-- 5. Execute in production during maintenance window
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. PRE-FLIGHT CHECKS
-- =============================================================================

-- Check if table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'your_table_name'
  ) THEN
    RAISE EXCEPTION 'Table your_table_name does not exist. Please create it first.';
  END IF;
  
  RAISE NOTICE '✅ Table your_table_name exists';
END $$;

-- Check if tenant_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'your_table_name'
    AND column_name = 'tenant_id'
  ) THEN
    RAISE EXCEPTION 'Table your_table_name does not have a tenant_id column. Please add it first.';
  END IF;
  
  RAISE NOTICE '✅ tenant_id column exists on your_table_name';
END $$;

-- =============================================================================
-- 2. ENABLE RLS
-- =============================================================================

ALTER TABLE public.your_table_name 
  ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ RLS enabled on your_table_name';

-- =============================================================================
-- 3. CREATE TENANT ISOLATION POLICIES
-- =============================================================================

-- Policy for SELECT operations
-- Users can only see rows belonging to their tenant
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.your_table_name;
CREATE POLICY "tenant_isolation_select"
ON public.your_table_name
FOR SELECT
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);

RAISE NOTICE '✅ Created SELECT policy for your_table_name';

-- Policy for INSERT operations
-- Users can only insert rows with their tenant_id
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.your_table_name;
CREATE POLICY "tenant_isolation_insert"
ON public.your_table_name
FOR INSERT
WITH CHECK (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);

RAISE NOTICE '✅ Created INSERT policy for your_table_name';

-- Policy for UPDATE operations
-- Users can only update rows belonging to their tenant
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.your_table_name;
CREATE POLICY "tenant_isolation_update"
ON public.your_table_name
FOR UPDATE
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
)
WITH CHECK (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);

RAISE NOTICE '✅ Created UPDATE policy for your_table_name';

-- Policy for DELETE operations
-- Users can only delete rows belonging to their tenant
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.your_table_name;
CREATE POLICY "tenant_isolation_delete"
ON public.your_table_name
FOR DELETE
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);

RAISE NOTICE '✅ Created DELETE policy for your_table_name';

-- =============================================================================
-- 4. VERIFICATION
-- =============================================================================

-- Verify RLS is enabled
DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT c.relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'your_table_name';
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS is enabled on your_table_name';
  ELSE
    RAISE EXCEPTION '❌ RLS is NOT enabled on your_table_name';
  END IF;
END $$;

-- Count and display policies
DO $$
DECLARE
  policy_count integer;
  policy_record record;
BEGIN
  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'your_table_name';
  
  RAISE NOTICE '✅ your_table_name has % policies configured', policy_count;
  
  -- List all policies
  FOR policy_record IN 
    SELECT policyname, cmd 
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'your_table_name'
  LOOP
    RAISE NOTICE '  - Policy: % (Command: %)', policy_record.policyname, policy_record.cmd;
  END LOOP;
END $$;

-- =============================================================================
-- 5. TESTING (Optional - Uncomment to test)
-- =============================================================================
/*
-- Test tenant isolation
DO $$
DECLARE
  test_tenant_a uuid := gen_random_uuid();
  test_tenant_b uuid := gen_random_uuid();
  visible_rows integer;
BEGIN
  -- Insert test data for tenant A
  INSERT INTO your_table_name (tenant_id, name) 
  VALUES (test_tenant_a, 'TEST-DATA-TENANT-A');
  
  -- Insert test data for tenant B
  INSERT INTO your_table_name (tenant_id, name) 
  VALUES (test_tenant_b, 'TEST-DATA-TENANT-B');
  
  -- Set JWT claims to tenant A
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', test_tenant_a)::text, 
    true);
  
  -- Query should only return tenant A's data
  SELECT count(*) INTO visible_rows
  FROM your_table_name 
  WHERE name LIKE 'TEST-DATA-TENANT-%';
  
  IF visible_rows != 1 THEN
    RAISE EXCEPTION 'RLS test FAILED: tenant can see % rows (expected 1)', visible_rows;
  END IF;
  
  -- Cleanup test data (needs service role)
  DELETE FROM your_table_name WHERE name LIKE 'TEST-DATA-TENANT-%';
  
  RAISE NOTICE '✅ RLS test PASSED: tenant isolation working correctly';
END $$;
*/

COMMIT;

-- =============================================================================
-- 6. ROLLBACK SCRIPT
-- =============================================================================
/*
-- If you need to rollback this migration, execute:

BEGIN;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.your_table_name;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.your_table_name;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.your_table_name;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.your_table_name;

ALTER TABLE public.your_table_name DISABLE ROW LEVEL SECURITY;

COMMIT;
*/

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- ✅ RLS enabled on your_table_name
-- ✅ Created 4 tenant isolation policies
-- ✅ Verified configuration
-- 
-- Next Steps:
-- 1. Test in development environment with multiple tenants
-- 2. Verify data isolation is working correctly
-- 3. Monitor for any access issues in production
-- 4. Document in centralized RLS policy documentation
-- =============================================================================
