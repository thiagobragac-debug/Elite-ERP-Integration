-- ══════════════════════════════════════════════════════════════════════════════
-- Inventory & Purchasing Performance Indexes Migration
-- ══════════════════════════════════════════════════════════════════════════════
-- Purpose: Add composite indexes to optimize inventory movement and purchasing queries
-- Tables: movimentacoes_estoque, pedidos_compra, vendas
-- Related: Task 16.3, Requirement 14.2
-- ══════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- MOVIMENTACOES_ESTOQUE (Inventory Movements) Indexes
-- ──────────────────────────────────────────────────────────────────────────────

-- Composite index for inventory movement queries by product with date sorting (DESC for recent first)
-- Optimizes: SELECT * FROM movimentacoes_estoque WHERE produto_id = ? ORDER BY data_movimentacao DESC
-- Common use case: Track movement history for a specific product/input
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_data 
ON public.movimentacoes_estoque(produto_id, data_movimentacao DESC);

COMMENT ON INDEX idx_movimentacoes_produto_data IS 
'Optimizes inventory movement queries for specific products ordered by recent date. Used in inventory history and stock tracking.';


-- ──────────────────────────────────────────────────────────────────────────────
-- PEDIDOS_COMPRA (Purchase Orders) Indexes
-- ──────────────────────────────────────────────────────────────────────────────

-- Composite index for purchase orders filtered by tenant, status, and date
-- Optimizes: SELECT * FROM pedidos_compra WHERE tenant_id = ? AND status = ? ORDER BY data_pedido DESC
-- Common use case: List purchase orders by status (PENDENTE, APROVADO, CANCELADO) for a tenant
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_tenant_status 
ON public.pedidos_compra(tenant_id, status, data_pedido DESC);

COMMENT ON INDEX idx_pedidos_compra_tenant_status IS 
'Optimizes purchase order queries filtered by tenant and status with date ordering. Critical for purchase order management and reporting.';


-- ──────────────────────────────────────────────────────────────────────────────
-- VENDAS (Sales) Indexes
-- ──────────────────────────────────────────────────────────────────────────────

-- Composite index for sales queries by tenant, customer, and date
-- Optimizes: SELECT * FROM vendas WHERE tenant_id = ? AND cliente_id = ? ORDER BY data_venda DESC
-- Common use case: Customer sales history, revenue tracking by customer
CREATE INDEX IF NOT EXISTS idx_vendas_tenant_cliente_data 
ON public.vendas(tenant_id, cliente_id, data_venda DESC);

COMMENT ON INDEX idx_vendas_tenant_cliente_data IS 
'Optimizes sales queries filtered by tenant and customer with date ordering. Used in customer history, sales reports, and revenue analysis.';


-- ──────────────────────────────────────────────────────────────────────────────
-- Post-Creation Maintenance
-- ──────────────────────────────────────────────────────────────────────────────

-- Update query planner statistics for optimal index usage
ANALYZE movimentacoes_estoque;
ANALYZE pedidos_compra;
ANALYZE vendas;


-- ──────────────────────────────────────────────────────────────────────────────
-- Index Verification
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_movimentacoes_produto_data',
      'idx_pedidos_compra_tenant_status',
      'idx_vendas_tenant_cliente_data'
    );
  
  IF index_count = 3 THEN
    RAISE NOTICE '✅ All 3 inventory & purchasing indexes created successfully';
  ELSE
    RAISE WARNING '⚠️ Expected 3 indexes, found %', index_count;
  END IF;
END $$;

-- Display created index information
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_movimentacoes_produto_data',
    'idx_pedidos_compra_tenant_status',
    'idx_vendas_tenant_cliente_data'
  )
ORDER BY tablename, indexname;


-- ──────────────────────────────────────────────────────────────────────────────
-- Performance Testing Queries
-- ──────────────────────────────────────────────────────────────────────────────
-- Use EXPLAIN ANALYZE to verify index usage and performance improvements:

/*
-- Test inventory movement query
EXPLAIN ANALYZE
SELECT * FROM movimentacoes_estoque 
WHERE produto_id = 'your-produto-id' 
ORDER BY data_movimentacao DESC 
LIMIT 100;

-- Test purchase order query
EXPLAIN ANALYZE
SELECT * FROM pedidos_compra 
WHERE tenant_id = 'your-tenant-id' 
  AND status = 'PENDENTE'
ORDER BY data_pedido DESC 
LIMIT 50;

-- Test sales query by customer
EXPLAIN ANALYZE
SELECT * FROM vendas 
WHERE tenant_id = 'your-tenant-id' 
  AND cliente_id = 'your-cliente-id'
ORDER BY data_venda DESC 
LIMIT 100;
*/


-- ──────────────────────────────────────────────────────────────────────────────
-- Usage Monitoring (Run after indexes are in production)
-- ──────────────────────────────────────────────────────────────────────────────
-- Check index usage statistics to verify indexes are being utilized:

/*
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE indexname IN (
  'idx_movimentacoes_produto_data',
  'idx_pedidos_compra_tenant_status',
  'idx_vendas_tenant_cliente_data'
)
ORDER BY idx_scan DESC;
*/


-- ══════════════════════════════════════════════════════════════════════════════
-- Implementation Notes
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Index Benefits:
-- - Inventory movements: Faster product history lookups and stock tracking
-- - Purchase orders: Efficient filtering by status for procurement workflows
-- - Sales: Quick customer purchase history and revenue analysis
--
-- Performance Considerations:
-- - Minor write overhead on INSERT/UPDATE/DELETE operations
-- - Storage cost: ~10-20% of table size per index
-- - Expected gains: 10-100x faster queries on indexed column combinations
--
-- Maintenance:
-- - Monitor index usage with pg_stat_user_indexes periodically
-- - Review and remove unused indexes to reduce storage and write costs
-- - Run ANALYZE after bulk data changes to update query planner statistics
--
-- Related Indexes:
-- - See 004_financial_performance_indexes.sql for financial module indexes
-- - See ../performance-indexes.sql for livestock management indexes
--
-- ══════════════════════════════════════════════════════════════════════════════

