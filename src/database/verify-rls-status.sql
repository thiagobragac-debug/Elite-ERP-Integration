-- =============================================================================
-- RLS VERIFICATION SCRIPT - Tauze ERP v5.0
-- =============================================================================
-- Purpose: Verify Row Level Security (RLS) is properly enabled on all tables
-- Requirements: 3.2, 3.3
-- Usage: Run this script in Supabase SQL Editor to verify RLS status
-- =============================================================================

-- =============================================================================
-- VERIFICATION 1: Check which tables have RLS enabled
-- =============================================================================
SELECT 
  schemaname AS schema,
  tablename AS table_name,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY 
  rowsecurity DESC,
  tablename;

-- =============================================================================
-- VERIFICATION 2: Summary statistics
-- =============================================================================
WITH stats AS (
  SELECT 
    COUNT(*) AS total_tables,
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) AS tables_with_rls,
    SUM(CASE WHEN rowsecurity THEN 0 ELSE 1 END) AS tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
)
SELECT 
  total_tables,
  tables_with_rls,
  tables_without_rls,
  ROUND((tables_with_rls::decimal / total_tables * 100), 2) || '%' AS percentage_with_rls,
  CASE 
    WHEN tables_without_rls = 0 THEN '✅ ALL TABLES SECURED'
    WHEN tables_without_rls <= 3 THEN '⚠️  MOSTLY SECURED'
    ELSE '❌ NEEDS ATTENTION'
  END AS security_status
FROM stats;

-- =============================================================================
-- VERIFICATION 3: List all RLS policies by table
-- =============================================================================
SELECT 
  tablename AS table_name,
  COUNT(*) AS policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- VERIFICATION 4: Identify tables with RLS but no policies (CRITICAL)
-- =============================================================================
SELECT 
  t.tablename AS table_name,
  '❌ HAS RLS BUT NO POLICIES' AS issue,
  'CRITICAL' AS severity
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = t.tablename
  )
ORDER BY t.tablename;

-- =============================================================================
-- VERIFICATION 5: Check policy coverage for each table
-- =============================================================================
WITH policy_coverage AS (
  SELECT 
    tablename,
    bool_or(cmd = 'r') AS has_select_policy,
    bool_or(cmd = 'a') AS has_insert_policy,
    bool_or(cmd = 'w') AS has_update_policy,
    bool_or(cmd = 'd') AS has_delete_policy,
    bool_or(cmd = '*') AS has_all_policy
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
  t.tablename AS table_name,
  CASE WHEN t.rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END AS rls_enabled,
  CASE WHEN pc.has_select_policy OR pc.has_all_policy THEN '✅' ELSE '❌' END AS select_policy,
  CASE WHEN pc.has_insert_policy OR pc.has_all_policy THEN '✅' ELSE '❌' END AS insert_policy,
  CASE WHEN pc.has_update_policy OR pc.has_all_policy THEN '✅' ELSE '❌' END AS update_policy,
  CASE WHEN pc.has_delete_policy OR pc.has_all_policy THEN '✅' ELSE '❌' END AS delete_policy,
  COALESCE(
    (SELECT COUNT(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t.tablename),
    0
  ) AS total_policies
FROM pg_tables t
LEFT JOIN policy_coverage pc ON pc.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
  AND t.rowsecurity = true
ORDER BY t.tablename;

-- =============================================================================
-- VERIFICATION 6: Verify tenant isolation in policies
-- =============================================================================
SELECT 
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
    WHEN qual::text LIKE '%tenant_id%' OR qual::text LIKE '%auth.uid()%' THEN '✅ Has isolation'
    ELSE '⚠️  No tenant_id check'
  END AS isolation_status,
  LEFT(qual::text, 100) AS policy_logic
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- VERIFICATION 7: Final security assessment
-- =============================================================================
WITH security_metrics AS (
  SELECT 
    -- Total tables
    (SELECT COUNT(*) 
     FROM pg_tables 
     WHERE schemaname = 'public' 
       AND tablename NOT LIKE 'pg_%' 
       AND tablename NOT LIKE 'sql_%') AS total_tables,
    
    -- Tables with RLS
    (SELECT COUNT(*) 
     FROM pg_tables 
     WHERE schemaname = 'public' 
       AND tablename NOT LIKE 'pg_%' 
       AND tablename NOT LIKE 'sql_%'
       AND rowsecurity = true) AS tables_with_rls,
    
    -- Tables with policies
    (SELECT COUNT(DISTINCT tablename) 
     FROM pg_policies 
     WHERE schemaname = 'public') AS tables_with_policies,
    
    -- Total policies
    (SELECT COUNT(*) 
     FROM pg_policies 
     WHERE schemaname = 'public') AS total_policies,
    
    -- Tables with RLS but no policies (CRITICAL issue)
    (SELECT COUNT(*) 
     FROM pg_tables t
     WHERE t.schemaname = 'public'
       AND t.tablename NOT LIKE 'pg_%'
       AND t.tablename NOT LIKE 'sql_%'
       AND t.rowsecurity = true
       AND NOT EXISTS (
         SELECT 1 
         FROM pg_policies p
         WHERE p.schemaname = 'public'
           AND p.tablename = t.tablename
       )) AS tables_rls_no_policies
)
SELECT 
  total_tables,
  tables_with_rls,
  tables_with_policies,
  total_policies,
  tables_rls_no_policies,
  ROUND((tables_with_rls::decimal / total_tables * 100), 1) || '%' AS rls_coverage,
  CASE 
    WHEN tables_rls_no_policies > 0 THEN '🔴 CRITICAL - Tables with RLS but no policies'
    WHEN tables_with_rls < total_tables THEN '🟡 WARNING - Not all tables have RLS'
    WHEN tables_with_rls = total_tables AND total_policies > 0 THEN '🟢 GOOD - All tables secured'
    ELSE '🔴 UNKNOWN'
  END AS security_status
FROM security_metrics;

-- =============================================================================
-- VERIFICATION COMPLETE
-- =============================================================================
-- Review the output from all queries above to ensure:
-- ✅ All tables have RLS enabled (or have documented exceptions)
-- ✅ All tables with RLS have at least one policy
-- ✅ All policies properly check tenant_id or user_id
-- ✅ Policy coverage includes SELECT, INSERT, UPDATE, DELETE operations
-- =============================================================================
