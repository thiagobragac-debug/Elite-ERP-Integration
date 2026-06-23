-- =============================================================================
-- RLS AUDIT SCRIPT - Tauze ERP v5.0
-- =============================================================================
-- Purpose: Audit Row Level Security (RLS) policies for multi-tenant isolation
-- Requirements: 3.1, 3.5
-- Date: 2024
-- =============================================================================

-- =============================================================================
-- 1. FIND TABLES WITHOUT RLS ENABLED
-- =============================================================================
-- This query identifies all tables in the public schema that do NOT have
-- RLS enabled. These tables are security risks in a multi-tenant system.

SELECT 
  schemaname AS schema_name,
  tablename AS table_name,
  'RLS NOT ENABLED' AS status,
  'CRITICAL' AS severity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = pg_tables.tablename
      AND c.relrowsecurity = true
  )
ORDER BY tablename;

-- =============================================================================
-- 2. FIND TABLES WITH RLS BUT NO POLICIES
-- =============================================================================
-- Tables with RLS enabled but no policies defined will block all access.
-- This query identifies tables that need policies to be functional.

SELECT 
  schemaname AS schema_name,
  tablename AS table_name,
  'RLS ENABLED BUT NO POLICIES' AS status,
  'HIGH' AS severity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND EXISTS (
    SELECT 1 
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = pg_tables.tablename
      AND c.relrowsecurity = true
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = pg_tables.tablename
  )
ORDER BY tablename;

-- =============================================================================
-- 3. FIND TABLES WITHOUT TENANT_ID COLUMN
-- =============================================================================
-- Multi-tenant isolation requires a tenant_id column. This query identifies
-- tables that lack this critical column.

SELECT 
  t.table_name,
  'NO TENANT_ID COLUMN' AS status,
  'CRITICAL' AS severity
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE 'sql_%'
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = 'tenant_id'
  )
ORDER BY t.table_name;

-- =============================================================================
-- 4. LIST ALL EXISTING RLS POLICIES
-- =============================================================================
-- Comprehensive view of all RLS policies currently configured.

SELECT 
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  CASE 
    WHEN cmd = '*' THEN 'ALL'
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE cmd
  END AS command,
  CASE 
    WHEN permissive THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END AS policy_type,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- 5. VERIFY TENANT_ID POLICIES
-- =============================================================================
-- Check if policies properly filter by tenant_id for tenant isolation.

SELECT 
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  CASE 
    WHEN qual::text LIKE '%tenant_id%' THEN 'YES'
    ELSE 'NO'
  END AS filters_by_tenant_id,
  CASE 
    WHEN qual::text LIKE '%tenant_id%' THEN 'MEDIUM'
    ELSE 'HIGH'
  END AS severity,
  qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text NOT LIKE '%tenant_id%'
ORDER BY tablename, policyname;

-- =============================================================================
-- 6. AUDIT SUMMARY REPORT
-- =============================================================================
-- Executive summary of RLS security status.

WITH 
tables_without_rls AS (
  SELECT COUNT(*) as count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND NOT EXISTS (
      SELECT 1 
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = pg_tables.tablename
        AND c.relrowsecurity = true
    )
),
tables_without_policies AS (
  SELECT COUNT(*) as count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND EXISTS (
      SELECT 1 
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = pg_tables.tablename
        AND c.relrowsecurity = true
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE schemaname = 'public'
        AND tablename = pg_tables.tablename
    )
),
tables_without_tenant_id AS (
  SELECT COUNT(*) as count
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'sql_%'
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = t.table_name
        AND c.column_name = 'tenant_id'
    )
),
total_tables AS (
  SELECT COUNT(*) as count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
),
total_policies AS (
  SELECT COUNT(*) as count
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT 
  tt.count AS total_tables,
  twor.count AS tables_without_rls,
  twop.count AS tables_without_policies,
  twtid.count AS tables_without_tenant_id,
  tp.count AS total_policies,
  CASE 
    WHEN twor.count = 0 AND twop.count = 0 AND twtid.count = 0 THEN 'SECURE'
    WHEN twor.count > 0 OR twtid.count > 0 THEN 'CRITICAL'
    WHEN twop.count > 0 THEN 'WARNING'
    ELSE 'UNKNOWN'
  END AS security_status
FROM total_tables tt, tables_without_rls twor, tables_without_policies twop, 
     tables_without_tenant_id twtid, total_policies tp;

-- =============================================================================
-- 7. ENABLE RLS TEMPLATE
-- =============================================================================
-- Use this template to enable RLS on tables identified in query #1.
-- Replace 'your_table' with the actual table name.

/*
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
*/

-- =============================================================================
-- 8. CREATE TENANT ISOLATION POLICY (SELECT) TEMPLATE
-- =============================================================================
-- Template for creating SELECT policies that enforce tenant isolation.
-- Filters rows based on JWT token's tenant_id claim.

/*
CREATE POLICY "tenant_isolation_select"
ON public.your_table
FOR SELECT
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);
*/

-- =============================================================================
-- 9. CREATE TENANT ISOLATION POLICY (INSERT/UPDATE/DELETE) TEMPLATE
-- =============================================================================
-- Template for creating modification policies.
-- USING: Check if user can see the row
-- WITH CHECK: Validate that new/updated data has correct tenant_id

/*
CREATE POLICY "tenant_isolation_modify"
ON public.your_table
FOR ALL
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
)
WITH CHECK (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);
*/

-- =============================================================================
-- 10. TEST TENANT ISOLATION
-- =============================================================================
-- Test script to verify tenant isolation works correctly.
-- Creates test data for two tenants and verifies data cannot leak between them.

/*
DO $$
DECLARE
  test_tenant_a uuid := gen_random_uuid();
  test_tenant_b uuid := gen_random_uuid();
  test_table_name text := 'your_table'; -- Replace with actual table
  visible_rows integer;
BEGIN
  -- Insert test data for tenant A
  EXECUTE format('INSERT INTO %I (tenant_id, name) VALUES ($1, $2)', test_table_name)
  USING test_tenant_a, 'TEST-DATA-A';
  
  -- Insert test data for tenant B
  EXECUTE format('INSERT INTO %I (tenant_id, name) VALUES ($1, $2)', test_table_name)
  USING test_tenant_b, 'TEST-DATA-B';
  
  -- Set JWT claims to tenant A
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', test_tenant_a)::text, 
    true);
  
  -- Query should only return tenant A's data
  EXECUTE format('SELECT count(*) FROM %I WHERE name LIKE ''TEST-DATA-%%''', test_table_name)
  INTO visible_rows;
  
  IF visible_rows != 1 THEN
    RAISE EXCEPTION 'RLS test FAILED for %: tenant can see % rows (expected 1)', 
      test_table_name, visible_rows;
  END IF;
  
  -- Cleanup test data
  EXECUTE format('DELETE FROM %I WHERE name LIKE ''TEST-DATA-%%''', test_table_name);
  
  RAISE NOTICE 'RLS test PASSED for %: tenant isolation working correctly', test_table_name;
END $$;
*/

-- =============================================================================
-- 11. SECURITY BEST PRACTICES CHECKLIST
-- =============================================================================
/*
RLS Security Checklist:
[ ] All tables in public schema have RLS enabled
[ ] All tables have tenant_id column (or equivalent isolation mechanism)
[ ] All tables have at least one policy defined
[ ] All policies filter by tenant_id using JWT claims
[ ] Policies use WITH CHECK to prevent cross-tenant data insertion
[ ] Service role operations bypass RLS (use carefully)
[ ] Audit logs capture all policy changes
[ ] Regular audits scheduled (weekly/monthly)
[ ] Test tenant isolation after any schema changes
[ ] Document exceptions to RLS (shared/reference tables)
*/

-- =============================================================================
-- END OF RLS AUDIT SCRIPT
-- =============================================================================
