# Performance Indexes Documentation

## Overview

This document describes the composite indexes created to optimize database query performance in Tauze ERP v5.0.

**Related Requirements:** 14.2 (Database Performance)  
**SQL File:** `performance-indexes.sql`

## Created Indexes

### 1. `idx_animais_tenant_status`

- **Table:** `animais` (Animals)
- **Columns:** `(tenant_id, status)`
- **Purpose:** Optimizes queries that filter animals by tenant and status
- **Common Use Cases:**
  - Dashboard animal counts by status
  - Listing active animals for a tenant
  - Filtering animals by status (Ativo, Vendido, Morto, etc.)

**Example Query:**

```sql
SELECT * FROM animais
WHERE tenant_id = '...' AND status = 'Ativo'
ORDER BY data_nascimento DESC;
```

---

### 2. `idx_animais_fazenda_lote`

- **Table:** `animais` (Animals)
- **Columns:** `(fazenda_id, lote_id)`
- **Purpose:** Optimizes queries that retrieve animals by farm and lot hierarchy
- **Common Use Cases:**
  - Lot management screens
  - Farm reports showing animals per lot
  - Bulk operations on specific lots

**Example Query:**

```sql
SELECT a.*, l.nome as lote_nome
FROM animais a
JOIN lotes l ON a.lote_id = l.id
WHERE a.fazenda_id = '...' AND a.lote_id = '...';
```

---

### 3. `idx_abastecimentos_tenant_data`

- **Table:** `abastecimentos` (Fuel/Feed Supplies)
- **Columns:** `(tenant_id, data DESC)`
- **Purpose:** Optimizes queries for recent supply records, ordered by date descending
- **Common Use Cases:**
  - Dashboard showing recent fuel/feed supplies
  - Fleet management reports
  - Monthly supply summaries

**Example Query:**

```sql
SELECT * FROM abastecimentos
WHERE tenant_id = '...'
ORDER BY data DESC
LIMIT 50;
```

---

### 4. `idx_pesagens_animal_data`

- **Table:** `pesagens` (Weighings)
- **Columns:** `(animal_id, data DESC)`
- **Purpose:** Optimizes queries for animal weight history, most recent first
- **Common Use Cases:**
  - Weight gain tracking for individual animals
  - Performance reports showing weight progression
  - Growth rate calculations

**Example Query:**

```sql
SELECT * FROM pesagens
WHERE animal_id = '...'
ORDER BY data DESC;
```

---

## Installation

### Prerequisites

- PostgreSQL database access
- Sufficient privileges to create indexes
- Recommended: Run during low-traffic period (indexes are created with `IF NOT EXISTS`)

### Steps

1. **Review existing indexes:**

   ```sql
   SELECT * FROM pg_indexes
   WHERE schemaname = 'public'
   AND tablename IN ('animais', 'abastecimentos', 'pesagens');
   ```

2. **Execute the script:**

   **Option A: Via psql command line**

   ```bash
   psql -d your_database -f src/database/performance-indexes.sql
   ```

   **Option B: Via Supabase SQL Editor**
   - Open Supabase Dashboard → SQL Editor
   - Copy content from `performance-indexes.sql`
   - Click "Run"

3. **Verify creation:**
   The script includes built-in verification. Look for:

   ```
   ✅ All 4 performance indexes created successfully
   ```

4. **Monitor performance:**
   After deployment, monitor query performance improvements:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM animais WHERE tenant_id = '...' AND status = 'Ativo';
   ```

---

## Performance Impact

### Benefits

- **Query Speed:** 10-100x faster for filtered SELECT queries
- **Dashboard Load:** Significant improvement in listing pages
- **Report Generation:** Faster aggregation queries

### Costs

- **Storage:** ~10-20% additional storage per index
- **Write Operations:** Slight overhead on INSERT/UPDATE/DELETE (typically < 5%)
- **Maintenance:** Indexes need periodic ANALYZE/REINDEX

---

## Monitoring

### Check Index Usage

Run this query after the indexes have been in production for a few days:

```sql
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
```

**What to look for:**

- `scans > 0`: Index is being used
- `scans = 0`: Index might be unused (consider removing)
- High `index_size` with low `scans`: Review if index is necessary

---

## Troubleshooting

### Index Not Being Used

If EXPLAIN ANALYZE still shows sequential scans:

1. **Update statistics:**

   ```sql
   ANALYZE animais;
   ANALYZE abastecimentos;
   ANALYZE pesagens;
   ```

2. **Check query pattern:**
   - Ensure WHERE clause uses indexed columns in correct order
   - Avoid functions on indexed columns (e.g., `LOWER(status)`)

3. **Review table size:**
   - Small tables (<1000 rows) might use seq scan by design
   - Postgres optimizer may prefer seq scan for small datasets

### High Storage Usage

```sql
-- Check index sizes
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Slow Writes After Index Creation

If INSERT/UPDATE performance degrades significantly:

- Review if all 4 indexes are necessary
- Consider dropping unused indexes
- Check for additional indexes on the same tables

---

## Future Optimizations

Based on query patterns, consider these additional indexes:

1. **Partial Index for Active Animals:**

   ```sql
   CREATE INDEX idx_animais_tenant_active
   ON animais(tenant_id)
   WHERE status = 'Ativo';
   ```

2. **Covering Index for Common Selections:**

   ```sql
   CREATE INDEX idx_animais_tenant_status_cover
   ON animais(tenant_id, status)
   INCLUDE (brinco, raca, sexo);
   ```

3. **Date Range Queries:**
   ```sql
   CREATE INDEX idx_pesagens_tenant_date
   ON pesagens(tenant_id, data DESC);
   ```

---

## Maintenance Schedule

- **Weekly:** Review slow query logs
- **Monthly:** Check index usage statistics
- **Quarterly:** Run REINDEX if needed (typically not necessary)
- **Annually:** Review and optimize based on evolved query patterns

---

## Related Documentation

- [Database README](./README.md)
- [RLS Policies Documentation](./RLS_POLICIES_DOCUMENTATION.md)
- [Requirement 14: Database Performance](../../.kiro/specs/system-improvements/requirements.md)

---

## Support

If you encounter issues with these indexes:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review PostgreSQL logs for errors
3. Use EXPLAIN ANALYZE to diagnose query plans
4. Contact the development team with specific query examples
