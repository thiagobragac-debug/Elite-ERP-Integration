-- ============================================================================
-- Performance Indexes for Tauze ERP v5.0
-- ============================================================================
-- Purpose: Composite indexes to optimize common query patterns
-- Requirements: 14.2 (Database Performance)
-- Created: 2024
--
-- Usage:
--   1. Review existing indexes before executing: SELECT * FROM pg_indexes WHERE schemaname = 'public';
--   2. Execute this script: psql -d your_database -f performance-indexes.sql
--   3. Verify with EXPLAIN ANALYZE on slow queries
--
-- Maintenance:
--   - Run ANALYZE after creating indexes to update query planner statistics
--   - Monitor index usage with pg_stat_user_indexes
--   - Remove unused indexes to save storage and write overhead
-- ============================================================================

-- ============================================================================
-- ANIMAIS (Animals) - Core Livestock Management
-- ============================================================================

-- Index: Tenant + Status filtering
-- Common query: List all active animals for a tenant
-- Example: SELECT * FROM animais WHERE tenant_id = ? AND status = 'Ativo'
CREATE INDEX IF NOT EXISTS idx_animais_tenant_status 
ON animais(tenant_id, status);

COMMENT ON INDEX idx_animais_tenant_status IS 
'Optimizes queries filtering animals by tenant and status. Common in dashboard and listing pages.';


-- Index: Farm + Lot hierarchy
-- Common query: Get all animals in a specific lot within a farm
-- Example: SELECT * FROM animais WHERE fazenda_id = ? AND lote_id = ?
CREATE INDEX IF NOT EXISTS idx_animais_fazenda_lote 
ON animais(fazenda_id, lote_id);

COMMENT ON INDEX idx_animais_fazenda_lote IS 
'Optimizes queries filtering animals by farm and lot. Used in lot management and farm reports.';


-- ============================================================================
-- ABASTECIMENTOS (Fuel/Feed Supplies) - Fleet & Operations
-- ============================================================================

-- Index: Tenant + Date (descending for recent-first queries)
-- Common query: Get latest supplies for a tenant, ordered by date
-- Example: SELECT * FROM abastecimentos WHERE tenant_id = ? ORDER BY data DESC LIMIT 50
CREATE INDEX IF NOT EXISTS idx_abastecimentos_tenant_data 
ON abastecimentos(tenant_id, data DESC);

COMMENT ON INDEX idx_abastecimentos_tenant_data IS 
'Optimizes recent supply queries for dashboard and reports. DESC order matches typical query patterns.';


-- ============================================================================
-- PESAGENS (Weighings) - Animal Performance Tracking
-- ============================================================================

-- Index: Animal + Date (descending for weight history)
-- Common query: Get weight history for an animal, most recent first
-- Example: SELECT * FROM pesagens WHERE animal_id = ? ORDER BY data DESC
CREATE INDEX IF NOT EXISTS idx_pesagens_animal_data 
ON pesagens(animal_id, data DESC);

COMMENT ON INDEX idx_pesagens_animal_data IS 
'Optimizes weight history queries for individual animals. Critical for performance tracking and gain calculations.';


-- ============================================================================
-- POST-CREATION MAINTENANCE
-- ============================================================================

-- Update query planner statistics
ANALYZE animais;
ANALYZE abastecimentos;
ANALYZE pesagens;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all indexes were created successfully
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_animais_tenant_status',
      'idx_animais_fazenda_lote',
      'idx_abastecimentos_tenant_data',
      'idx_pesagens_animal_data'
    );
  
  IF index_count = 4 THEN
    RAISE NOTICE '✅ All 4 performance indexes created successfully';
  ELSE
    RAISE WARNING '⚠️ Expected 4 indexes, found %', index_count;
  END IF;
END $$;

-- Display index information
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_animais_tenant_status',
    'idx_animais_fazenda_lote',
    'idx_abastecimentos_tenant_data',
    'idx_pesagens_animal_data'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- USAGE MONITORING (Run after indexes are in use)
-- ============================================================================

-- Query to check index usage statistics (run after some production usage)
-- Uncomment and run periodically to verify indexes are being used:
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
  'idx_animais_tenant_status',
  'idx_animais_fazenda_lote',
  'idx_abastecimentos_tenant_data',
  'idx_pesagens_animal_data'
)
ORDER BY idx_scan DESC;
*/

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Performance Considerations:
-- - These indexes will slow down INSERT/UPDATE/DELETE operations slightly
-- - Storage overhead: ~10-20% of table size per index
-- - Benefits: 10-100x faster SELECT queries on indexed columns
--
-- When to Review:
-- - If write performance becomes a bottleneck
-- - If any index shows zero usage in pg_stat_user_indexes
-- - When table data patterns change significantly
--
-- Additional Optimizations (Future):
-- - Consider partial indexes for frequently filtered subsets
--   Example: CREATE INDEX ON animais(tenant_id) WHERE status = 'Ativo'
-- - Consider covering indexes if specific columns are always selected together
-- - Monitor query plans with EXPLAIN ANALYZE to identify other slow queries
--
-- ============================================================================
