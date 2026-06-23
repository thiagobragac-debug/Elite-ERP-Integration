-- ══════════════════════════════════════════════════════════════════════════════
-- Verification Script: Inventory & Purchasing Indexes
-- ══════════════════════════════════════════════════════════════════════════════
-- Purpose: Verify that all inventory and purchasing indexes are properly created
-- Related: Task 16.3, Migration 005_inventory_purchasing_indexes.sql
-- ══════════════════════════════════════════════════════════════════════════════

\echo '══════════════════════════════════════════════════════════════════════════════'
\echo 'Inventory & Purchasing Indexes Verification Report'
\echo '══════════════════════════════════════════════════════════════════════════════'
\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Check Index Existence
-- ──────────────────────────────────────────────────────────────────────────────

\echo '1. Verifying index existence...'
\echo ''

SELECT 
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ SUCCESS: All 3 indexes exist'
    ELSE '❌ FAILURE: Expected 3 indexes, found ' || COUNT(*)::text
  END AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_movimentacoes_produto_data',
    'idx_pedidos_compra_tenant_status',
    'idx_vendas_tenant_cliente_data'
  );

\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. List All Created Indexes
-- ──────────────────────────────────────────────────────────────────────────────

\echo '2. Index details:'
\echo ''

SELECT 
  tablename AS "Table",
  indexname AS "Index Name",
  pg_size_pretty(pg_relation_size(indexrelid)) AS "Size"
FROM pg_indexes
JOIN pg_stat_user_indexes USING (schemaname, tablename, indexname)
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_movimentacoes_produto_data',
    'idx_pedidos_compra_tenant_status',
    'idx_vendas_tenant_cliente_data'
  )
ORDER BY tablename, indexname;

\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Show Index Definitions
-- ──────────────────────────────────────────────────────────────────────────────

\echo '3. Index definitions:'
\echo ''

SELECT 
  indexname AS "Index",
  indexdef AS "Definition"
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_movimentacoes_produto_data',
    'idx_pedidos_compra_tenant_status',
    'idx_vendas_tenant_cliente_data'
  )
ORDER BY indexname;

\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Check Index Health
-- ──────────────────────────────────────────────────────────────────────────────

\echo '4. Index health and usage statistics:'
\echo ''

SELECT 
  schemaname AS "Schema",
  tablename AS "Table",
  indexname AS "Index",
  idx_scan AS "Times Used",
  idx_tup_read AS "Rows Read",
  idx_tup_fetch AS "Rows Fetched",
  pg_size_pretty(pg_relation_size(indexrelid)) AS "Size"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_movimentacoes_produto_data',
    'idx_pedidos_compra_tenant_status',
    'idx_vendas_tenant_cliente_data'
  )
ORDER BY idx_scan DESC;

\echo ''
\echo 'Note: Low "Times Used" values are normal for newly created indexes.'
\echo 'Run this query again after production usage to monitor effectiveness.'
\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Verify Table Statistics Are Updated
-- ──────────────────────────────────────────────────────────────────────────────

\echo '5. Checking if ANALYZE has been run on tables:'
\echo ''

SELECT 
  schemaname AS "Schema",
  tablename AS "Table",
  last_analyze AS "Last Analyzed",
  last_autoanalyze AS "Last Auto-Analyzed",
  CASE 
    WHEN last_analyze IS NOT NULL OR last_autoanalyze IS NOT NULL 
    THEN '✅ Statistics updated'
    ELSE '⚠️ Consider running ANALYZE'
  END AS "Status"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN ('movimentacoes_estoque', 'pedidos_compra', 'vendas')
ORDER BY tablename;

\echo ''

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. Summary
-- ──────────────────────────────────────────────────────────────────────────────

\echo '══════════════════════════════════════════════════════════════════════════════'
\echo 'Verification Summary'
\echo '══════════════════════════════════════════════════════════════════════════════'
\echo ''
\echo 'Expected indexes:'
\echo '  • idx_movimentacoes_produto_data (inventory movements by product/date)'
\echo '  • idx_pedidos_compra_tenant_status (purchase orders by tenant/status/date)'
\echo '  • idx_vendas_tenant_cliente_data (sales by tenant/customer/date)'
\echo ''
\echo 'Next steps:'
\echo '  1. Run EXPLAIN ANALYZE on queries to verify index usage'
\echo '  2. Monitor index usage over time with pg_stat_user_indexes'
\echo '  3. Remove any unused indexes to reduce storage overhead'
\echo ''
\echo '══════════════════════════════════════════════════════════════════════════════'

