# Financial Performance Indexes Guide

## Overview

This guide documents the composite and partial indexes created for the financial module to optimize query performance for accounts payable (contas_pagar) and accounts receivable (contas_receber).

**Migration File:** `004_financial_performance_indexes.sql`  
**Related Requirements:** Requirement 14.3 (Database Performance)  
**Related Task:** Task 16.2

## Created Indexes

### 1. Contas a Pagar (Accounts Payable)

#### `idx_contas_pagar_tenant_vencimento`

- **Type:** Composite Index
- **Columns:** `tenant_id, data_vencimento DESC`
- **Purpose:** Optimizes queries that filter by tenant and sort by due date
- **Optimized Queries:**
  ```sql
  SELECT * FROM contas_pagar
  WHERE tenant_id = ?
  ORDER BY data_vencimento DESC;
  ```

#### `idx_contas_pagar_pendentes`

- **Type:** Partial Index (Filtered)
- **Columns:** `tenant_id, data_vencimento`
- **Filter:** `WHERE status != 'PAGO'`
- **Purpose:** Optimizes queries for pending/overdue payments by excluding already paid records
- **Benefits:** Smaller index size, faster queries for active accounts
- **Optimized Queries:**
  ```sql
  SELECT * FROM contas_pagar
  WHERE tenant_id = ?
    AND status != 'PAGO'
  ORDER BY data_vencimento;
  ```

### 2. Contas a Receber (Accounts Receivable)

#### `idx_contas_receber_tenant_vencimento`

- **Type:** Composite Index
- **Columns:** `tenant_id, data_vencimento DESC`
- **Purpose:** Optimizes queries that filter by tenant and sort by due date
- **Optimized Queries:**
  ```sql
  SELECT * FROM contas_receber
  WHERE tenant_id = ?
  ORDER BY data_vencimento DESC;
  ```

#### `idx_contas_receber_pendentes`

- **Type:** Partial Index (Filtered)
- **Columns:** `tenant_id, data_vencimento`
- **Filter:** `WHERE status != 'PAGO'`
- **Purpose:** Optimizes queries for pending/overdue receivables by excluding already received records
- **Benefits:** Smaller index size, faster queries for active accounts
- **Optimized Queries:**
  ```sql
  SELECT * FROM contas_receber
  WHERE tenant_id = ?
    AND status != 'PAGO'
  ORDER BY data_vencimento;
  ```

## Why These Indexes?

### Composite Indexes (tenant_id + data_vencimento)

1. **Multi-tenant isolation:** Every query filters by `tenant_id` first (RLS enforcement)
2. **Chronological ordering:** Financial data is typically viewed by due date
3. **Index-only scans:** PostgreSQL can satisfy queries using only the index

### Partial Indexes (status != 'PAGO')

1. **Smaller index size:** Only indexes active records (pending/overdue)
2. **Faster queries:** Less data to scan for common operations
3. **Common use case:** Users frequently view pending/overdue accounts, not historical paid ones
4. **Index maintenance:** Updates to paid records don't update the partial index

## Performance Impact

### Before Indexes

```sql
EXPLAIN ANALYZE
SELECT * FROM contas_pagar
WHERE tenant_id = 'xxx' AND status != 'PAGO'
ORDER BY data_vencimento DESC LIMIT 50;

-- Seq Scan on contas_pagar (cost=0.00..XXX rows=XXX)
-- Planning Time: X.XX ms
-- Execution Time: XX.XX ms
```

### After Indexes

```sql
EXPLAIN ANALYZE
SELECT * FROM contas_pagar
WHERE tenant_id = 'xxx' AND status != 'PAGO'
ORDER BY data_vencimento DESC LIMIT 50;

-- Index Scan using idx_contas_pagar_pendentes (cost=0.XX..XX.XX rows=50)
-- Planning Time: X.XX ms
-- Execution Time: X.XX ms  ← Significantly reduced
```

## Installation

### Option 1: Supabase SQL Editor (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire content of `004_financial_performance_indexes.sql`
3. Paste and run
4. Verify indexes were created (see verification query below)

### Option 2: Supabase CLI

```bash
# If using local Supabase development
supabase db reset  # This will run all migrations

# Or apply just this migration
psql $DATABASE_URL -f src/database/migrations/004_financial_performance_indexes.sql
```

### Option 3: psql Command Line

```bash
psql -h your-db-host -U your-username -d your-database \
  -f src/database/migrations/004_financial_performance_indexes.sql
```

## Verification

After running the migration, verify all indexes were created:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('contas_pagar', 'contas_receber')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

Expected output:

```
 schemaname |   tablename    |            indexname
------------+----------------+----------------------------------
 public     | contas_pagar   | idx_contas_pagar_pendentes
 public     | contas_pagar   | idx_contas_pagar_tenant_vencimento
 public     | contas_receber | idx_contas_receber_pendentes
 public     | contas_receber | idx_contas_receber_tenant_vencimento
```

## Performance Testing

### Test Query Performance

Use `EXPLAIN ANALYZE` to measure query performance:

```sql
-- Test contas_pagar composite index
EXPLAIN ANALYZE
SELECT * FROM contas_pagar
WHERE tenant_id = 'your-tenant-id'
ORDER BY data_vencimento DESC
LIMIT 50;

-- Test contas_pagar partial index
EXPLAIN ANALYZE
SELECT * FROM contas_pagar
WHERE tenant_id = 'your-tenant-id'
  AND status != 'PAGO'
ORDER BY data_vencimento DESC
LIMIT 50;

-- Test contas_receber composite index
EXPLAIN ANALYZE
SELECT * FROM contas_receber
WHERE tenant_id = 'your-tenant-id'
ORDER BY data_vencimento DESC
LIMIT 50;

-- Test contas_receber partial index
EXPLAIN ANALYZE
SELECT * FROM contas_receber
WHERE tenant_id = 'your-tenant-id'
  AND status != 'PAGO'
ORDER BY data_vencimento DESC
LIMIT 50;
```

Look for:

- **Index Scan** instead of Seq Scan (good!)
- **Reduced execution time** compared to unindexed queries
- **Index name** in the query plan (confirms index is being used)

## Index Maintenance

### Index Size Monitoring

```sql
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE tablename IN ('contas_pagar', 'contas_receber')
  AND indexname LIKE 'idx_%';
```

### Rebuild Indexes (if needed)

```sql
-- Rebuild all financial indexes (run during low-traffic periods)
REINDEX INDEX CONCURRENTLY idx_contas_pagar_tenant_vencimento;
REINDEX INDEX CONCURRENTLY idx_contas_pagar_pendentes;
REINDEX INDEX CONCURRENTLY idx_contas_receber_tenant_vencimento;
REINDEX INDEX CONCURRENTLY idx_contas_receber_pendentes;
```

## Troubleshooting

### Index Not Being Used?

1. **Ensure statistics are up to date:**

   ```sql
   ANALYZE contas_pagar;
   ANALYZE contas_receber;
   ```

2. **Check if index exists:**

   ```sql
   \d contas_pagar
   \d contas_receber
   ```

3. **Verify query uses correct columns:**
   - Queries must include `tenant_id` in WHERE clause
   - For partial index benefits, include `status != 'PAGO'` condition

4. **Check query planner settings:**
   ```sql
   SHOW enable_indexscan;
   SHOW enable_bitmapscan;
   -- Both should be 'on'
   ```

### Slow Queries Despite Indexes?

1. **Large result sets:** Indexes help with filtering, but returning millions of rows is still slow
2. **Complex JOINs:** Consider additional indexes on foreign key columns
3. **Missing tenant_id filter:** Queries without `tenant_id` cannot use these indexes efficiently

## Additional Optimizations

If you still experience slow queries, consider:

1. **Additional indexes for specific use cases:**

   ```sql
   -- Index for filtering by status
   CREATE INDEX idx_contas_pagar_status ON contas_pagar(tenant_id, status);

   -- Index for filtering by supplier/customer
   CREATE INDEX idx_contas_pagar_fornecedor ON contas_pagar(tenant_id, fornecedor_id);
   CREATE INDEX idx_contas_receber_cliente ON contas_receber(tenant_id, cliente_id);
   ```

2. **Covering indexes** (include commonly selected columns):

   ```sql
   CREATE INDEX idx_contas_pagar_covering
   ON contas_pagar(tenant_id, data_vencimento)
   INCLUDE (descricao, valor_total, status);
   ```

3. **Query optimization:**
   - Use LIMIT for paginated results
   - Avoid SELECT \* when you only need specific columns
   - Use appropriate date ranges instead of open-ended queries

## Notes

- **Status values:** The schema uses `'PAGO'` for both contas_pagar and contas_receber (valid values: PENDENTE, PAGO, CANCELADO)
- **Date ordering:** DESC order is used to show most recent due dates first
- **RLS compatibility:** All indexes include `tenant_id` to work efficiently with Row Level Security policies
- **Index names:** Follow convention `idx_<table>_<purpose>` for clarity

## Related Documentation

- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [PostgreSQL Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- Main spec: `c:\Saas\.kiro\specs\system-improvements\requirements.md`
- RLS documentation: `c:\Saas\src\database\RLS_POLICIES_DOCUMENTATION.md`

## Completion Checklist

- [x] Created SQL migration file with all 4 indexes
- [x] Documented index purposes and benefits
- [x] Provided verification queries
- [x] Included performance testing queries
- [ ] Run migration on database
- [ ] Verify indexes created successfully
- [ ] Test query performance improvements
- [ ] Monitor index usage over time
