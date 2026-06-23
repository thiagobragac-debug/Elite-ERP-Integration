-- ══════════════════════════════════════════════════════════════════════════════
-- Financial Performance Indexes Migration
-- ══════════════════════════════════════════════════════════════════════════════
-- Purpose: Add composite and partial indexes to optimize financial module queries
-- Tables: contas_pagar, contas_receber
-- Related: Task 16.2, Requirement 14.3
-- ══════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- CONTAS A PAGAR (Accounts Payable) Indexes
-- ──────────────────────────────────────────────────────────────────────────────

-- Composite index for tenant-based queries with date sorting (DESC for recent first)
-- Optimizes: SELECT * FROM contas_pagar WHERE tenant_id = ? ORDER BY data_vencimento DESC
CREATE INDEX IF NOT EXISTS idx_contas_pagar_tenant_vencimento 
ON public.contas_pagar(tenant_id, data_vencimento DESC);

-- Partial index for pending/overdue payments (excludes already paid)
-- Optimizes: SELECT * FROM contas_pagar WHERE tenant_id = ? AND status != 'PAGO'
-- This index is smaller and faster as it only indexes non-paid records
CREATE INDEX IF NOT EXISTS idx_contas_pagar_pendentes 
ON public.contas_pagar(tenant_id, data_vencimento) 
WHERE status != 'PAGO';

-- ──────────────────────────────────────────────────────────────────────────────
-- CONTAS A RECEBER (Accounts Receivable) Indexes
-- ──────────────────────────────────────────────────────────────────────────────

-- Composite index for tenant-based queries with date sorting (DESC for recent first)
-- Optimizes: SELECT * FROM contas_receber WHERE tenant_id = ? ORDER BY data_vencimento DESC
CREATE INDEX IF NOT EXISTS idx_contas_receber_tenant_vencimento 
ON public.contas_receber(tenant_id, data_vencimento DESC);

-- Partial index for pending/overdue receivables (excludes already received)
-- Optimizes: SELECT * FROM contas_receber WHERE tenant_id = ? AND status != 'PAGO'
-- Note: Schema uses 'PAGO' status for both payables and receivables (PENDENTE/PAGO/CANCELADO)
CREATE INDEX IF NOT EXISTS idx_contas_receber_pendentes 
ON public.contas_receber(tenant_id, data_vencimento) 
WHERE status != 'PAGO';

-- ──────────────────────────────────────────────────────────────────────────────
-- Index Verification Query
-- ──────────────────────────────────────────────────────────────────────────────
-- Run this to verify all indexes were created successfully:
--
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('contas_pagar', 'contas_receber')
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- ──────────────────────────────────────────────────────────────────────────────
-- Performance Impact Analysis
-- ──────────────────────────────────────────────────────────────────────────────
-- To analyze query performance improvements, use EXPLAIN ANALYZE before and after:
--
-- EXPLAIN ANALYZE
-- SELECT * FROM contas_pagar 
-- WHERE tenant_id = 'your-tenant-id' 
--   AND status != 'PAGO'
-- ORDER BY data_vencimento DESC 
-- LIMIT 50;

-- ══════════════════════════════════════════════════════════════════════════════
-- Migration Complete
-- ══════════════════════════════════════════════════════════════════════════════
