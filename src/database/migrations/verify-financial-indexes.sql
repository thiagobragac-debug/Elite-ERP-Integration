-- ══════════════════════════════════════════════════════════════════════════════
-- Financial Indexes Verification Script
-- ══════════════════════════════════════════════════════════════════════════════
-- Purpose: Verify that financial performance indexes were created successfully
-- Related: Task 16.2, Migration 004_financial_performance_indexes.sql
-- ══════════════════════════════════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════════════════════════'
\echo 'Financial Indexes Verification Report'
\echo '═══════════════════════════════════════════════════════════════════════'
\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. List All Financial Module Indexes
-- ──────────────────────────────────────────────────────────────────────────────
\echo '1. INSTALLED INDEXES'
\echo '───────────────────────────────────────────────────────────────────────'

SELECT 
  schemaname,
  tablename,
  indexname,
  CASE 
    WHEN indexdef LIKE '%WHERE%' THEN 'Partial'
    ELSE 'Full'
  END as index_type,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE tablename IN ('contas_pagar', 'contas_receber')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Expected Indexes Checklist
-- ──────────────────────────────────────────────────────────────────────────────
\echo '2. EXPECTED INDEXES CHECKLIST'
\echo '───────────────────────────────────────────────────────────────────────'

SELECT 
  expected_index,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = expected_index
    ) 
    THEN '✓ Exists' 
    ELSE '✗ Missing' 
  END as status
FROM (
  VALUES 
    ('idx_contas_pagar_tenant_vencimento'),
    ('idx_contas_pagar_pendentes'),
    ('idx_contas_receber_tenant_vencimento'),
    ('idx_contas_receber_pendentes')
) AS expected(expected_index)
ORDER BY expected_index;

\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Index Definitions (Full Details)
-- ──────────────────────────────────────────────────────────────────────────────
\echo '3. INDEX DEFINITIONS'
\echo '───────────────────────────────────────────────────────────────────────'

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('contas_pagar', 'contas_receber')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Table Statistics
-- ──────────────────────────────────────────────────────────────────────────────
\echo '4. TABLE STATISTICS'
\echo '───────────────────────────────────────────────────────────────────────'

SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('contas_pagar', 'contas_receber')
ORDER BY tablename;

\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Index Usage Statistics (if data exists)
-- ──────────────────────────────────────────────────────────────────────────────
\echo '5. INDEX USAGE STATISTICS'
\echo '───────────────────────────────────────────────────────────────────────'
\echo '(Note: Statistics accumulate over time. Newly created indexes show 0 scans)'
\echo ''

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('contas_pagar', 'contas_receber')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. Test Query Plans (Sample Queries)
-- ──────────────────────────────────────────────────────────────────────────────
\echo '6. SAMPLE QUERY PLANS'
\echo '───────────────────────────────────────────────────────────────────────'
\echo 'Testing if indexes are being used in query execution...'
\echo ''

-- Test 1: Contas Pagar with tenant filter and date sort
\echo 'Test 1: Contas Pagar (tenant + date sort)'
\echo '   Expected: Index Scan using idx_contas_pagar_tenant_vencimento'
EXPLAIN (COSTS OFF)
SELECT id, descricao, valor_total, data_vencimento, status
FROM contas_pagar 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY data_vencimento DESC 
LIMIT 50;

\echo ''

-- Test 2: Contas Pagar with pending filter
\echo 'Test 2: Contas Pagar (pending only)'
\echo '   Expected: Index Scan using idx_contas_pagar_pendentes'
EXPLAIN (COSTS OFF)
SELECT id, descricao, valor_total, data_vencimento, status
FROM contas_pagar 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND status != 'PAGO'
ORDER BY data_vencimento DESC 
LIMIT 50;

\echo ''

-- Test 3: Contas Receber with tenant filter and date sort
\echo 'Test 3: Contas Receber (tenant + date sort)'
\echo '   Expected: Index Scan using idx_contas_receber_tenant_vencimento'
EXPLAIN (COSTS OFF)
SELECT id, descricao, valor_total, data_vencimento, status
FROM contas_receber 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY data_vencimento DESC 
LIMIT 50;

\echo ''

-- Test 4: Contas Receber with pending filter
\echo 'Test 4: Contas Receber (pending only)'
\echo '   Expected: Index Scan using idx_contas_receber_pendentes'
EXPLAIN (COSTS OFF)
SELECT id, descricao, valor_total, data_vencimento, status
FROM contas_receber 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND status != 'PAGO'
ORDER BY data_vencimento DESC 
LIMIT 50;

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════'
\echo 'Verification Complete'
\echo '═══════════════════════════════════════════════════════════════════════'
\echo ''
\echo 'NEXT STEPS:'
\echo '1. Verify all 4 indexes show ✓ Exists in section 2'
\echo '2. Check that query plans in section 6 use Index Scan (not Seq Scan)'
\echo '3. If indexes are not being used, run: ANALYZE contas_pagar; ANALYZE contas_receber;'
\echo '4. Monitor index usage over time using section 5 statistics'
\echo ''
