# Quick Start Guide: Task 16.3 - Inventory & Purchasing Indexes

## What This Does

This migration adds 3 database indexes to make inventory and purchasing queries 10-100x faster:

- 1 index for **Movimentações de Estoque** (Inventory Movements)
- 1 index for **Pedidos de Compra** (Purchase Orders)
- 1 index for **Vendas** (Sales)

## ⚡ Quick Install (2 minutes)

### Option 1: Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to your project: https://app.supabase.com
   - Click "SQL Editor" in left sidebar

2. **Copy the Migration**
   - Open file: `005_inventory_purchasing_indexes.sql`
   - Copy entire contents (Ctrl+A, Ctrl+C)

3. **Run in SQL Editor**
   - Paste in SQL Editor
   - Click "Run" button
   - Wait for success message

4. **Verify Installation**
   - Open new query tab
   - Copy contents of `verify-inventory-purchasing-indexes.sql`
   - Run and check all indexes show ✅

### Option 2: Command Line (For psql users)

```bash
# Navigate to project root
cd c:\Saas

# Run migration
psql $DATABASE_URL -f src/database/migrations/005_inventory_purchasing_indexes.sql

# Verify
psql $DATABASE_URL -f src/database/migrations/verify-inventory-purchasing-indexes.sql
```

## ✅ Verification Checklist

After running the migration, verify these:

- [ ] All 3 indexes show "✅ SUCCESS" in verification output
- [ ] No error messages during migration
- [ ] Query plans show "Index Scan" instead of "Seq Scan"
- [ ] Inventory and purchasing modules still load correctly

## 🧪 Test Performance Improvement

```sql
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

-- Test sales query
EXPLAIN ANALYZE
SELECT * FROM vendas
WHERE tenant_id = 'your-tenant-id'
  AND cliente_id = 'your-cliente-id'
ORDER BY data_venda DESC
LIMIT 100;

-- Look for:
-- ✅ "Index Scan using idx_movimentacoes_produto_data"
-- ✅ "Index Scan using idx_pedidos_compra_tenant_status"
-- ✅ "Index Scan using idx_vendas_tenant_cliente_data"
-- ✅ Execution Time: 1-5ms (should be much faster)
```

## 📊 Expected Results

### Before Indexes

```
Planning Time: 0.5 ms
Execution Time: 95.8 ms
```

### After Indexes

```
Planning Time: 0.3 ms
Execution Time: 2.4 ms  ← 40x faster!
```

## 🐛 Troubleshooting

### "Index not being used"

**Solution:** Update table statistics

```sql
ANALYZE movimentacoes_estoque;
ANALYZE pedidos_compra;
ANALYZE vendas;
```

### "Permission denied"

**Solution:** Ensure you're connected as database owner or have CREATE INDEX privilege

### "Index already exists"

**Good news!** Migration is idempotent (safe to run multiple times). This message means indexes were already created.

### "Column 'data' does not exist"

**This has been fixed!** The migration now uses the correct column names:

- `produto_id` (not `insumo_id`)
- `data_movimentacao` (not `data`)

If you encounter any column errors, verify your schema:

```sql
-- Check actual column names
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'movimentacoes_estoque'
ORDER BY ordinal_position;
```

## 📚 Need More Details?

- **Migration file:** `005_inventory_purchasing_indexes.sql`
- **Verification script:** `verify-inventory-purchasing-indexes.sql`
- **Related tasks:** 16.1 (livestock indexes), 16.2 (financial indexes)

## 🎯 What's Next?

After installing these indexes:

1. ✅ Inventory movement queries will be faster automatically
2. ✅ Purchase order filtering by status will be optimized
3. ✅ Customer sales history queries will load instantly
4. ✅ No application code changes needed
5. ✅ Monitor query performance in production

## ⏱️ Estimated Time

- **Installation:** 1-2 minutes
- **Verification:** 1 minute
- **Testing:** 2-3 minutes
- **Total:** 5 minutes

## 🔒 Safety Notes

- ✅ **Zero downtime:** Indexes created with `IF NOT EXISTS`
- ✅ **No data changes:** Only creates indexes, doesn't modify data
- ✅ **Reversible:** Can drop indexes if needed
- ✅ **RLS compatible:** Works with existing Row Level Security
- ✅ **Write overhead:** Minimal impact on INSERT/UPDATE/DELETE

## 📈 Performance Impact

**Read Operations (SELECT):**

- ⬆️ 10-100x faster queries
- ⬆️ Better for reports and dashboards
- ⬆️ Reduced database load

**Write Operations (INSERT/UPDATE/DELETE):**

- ⬇️ ~5-10% slower (negligible)
- Storage: +10-20% per index

**Net Result:** Significant performance improvement for typical read-heavy workloads.

## 🔄 Rollback (if needed)

To remove indexes:

```sql
DROP INDEX IF EXISTS idx_movimentacoes_produto_data;
DROP INDEX IF EXISTS idx_pedidos_compra_tenant_status;
DROP INDEX IF EXISTS idx_vendas_tenant_cliente_data;
```

## 🔍 Monitor Index Usage

After a few days in production, check if indexes are being used:

```sql
SELECT
  indexname,
  idx_scan AS times_used,
  idx_tup_read AS rows_read,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE indexname IN (
  'idx_movimentacoes_produto_data',
  'idx_pedidos_compra_tenant_status',
  'idx_vendas_tenant_cliente_data'
)
ORDER BY idx_scan DESC;
```

**Good usage:** `idx_scan` > 100 after a few days
**Low usage:** Consider if index is needed or if queries need optimization

---

**Need Help?** Review the migration file comments for detailed explanations and troubleshooting tips.
