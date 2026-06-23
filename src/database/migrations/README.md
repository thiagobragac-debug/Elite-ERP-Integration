# Database Migrations - RLS Implementation

This directory contains SQL migration scripts for enabling and managing Row Level Security (RLS) in the Tauze ERP v5.0 database.

## Overview

Row Level Security (RLS) is a critical security feature in PostgreSQL that ensures multi-tenant data isolation. Each table with tenant-specific data must have:

1. **RLS enabled** on the table
2. **Policies defined** that filter rows based on JWT claims
3. **tenant_id column** (or appropriate isolation column)

## Migration Files

### `001_enable_rls_missing_tables.sql`

**Purpose**: Enable RLS on tables identified during the RLS audit that are accessible but should be restricted.

**Tables Addressed**:

- `user_drafts` - Isolated by `user_id` (not `tenant_id`)

**Tables Intentionally Left Accessible**:

- `market_quotes` - Shared market data (no tenant isolation needed)
- `market_import_logs` - System-wide logs (no tenant isolation needed)

**How to Run**:

```sql
-- In Supabase SQL Editor
-- Copy and paste the contents of 001_enable_rls_missing_tables.sql
-- Execute the script
```

**Expected Output**:

- RLS enabled on `user_drafts`
- 4 policies created (SELECT, INSERT, UPDATE, DELETE)
- Verification messages confirming success

---

### `002_enable_rls_template.sql`

**Purpose**: Template for enabling RLS on any new table that requires tenant isolation.

**How to Use**:

1. Copy this template file
2. Rename with sequential number (e.g., `005_enable_rls_new_table.sql`)
3. Replace `your_table_name` with actual table name
4. Review policy logic
5. Test in development
6. Execute in production

---

### `003_tenant_isolation_policies_complete.sql`

**Purpose**: Complete tenant isolation policies for all existing tables in the system.

**Tables Covered**: All tables with `tenant_id` column across all modules (financial, livestock, inventory, etc.)

**Status**: ✅ Applied

---

### `004_financial_performance_indexes.sql`

**Purpose**: Add composite and partial indexes to optimize financial module query performance.

**Tables Optimized**:

- `contas_pagar` (Accounts Payable)
- `contas_receber` (Accounts Receivable)

**Indexes Created**:

- `idx_contas_pagar_tenant_vencimento` - Composite index for tenant + date queries
- `idx_contas_pagar_pendentes` - Partial index for pending payments only
- `idx_contas_receber_tenant_vencimento` - Composite index for tenant + date queries
- `idx_contas_receber_pendentes` - Partial index for pending receivables only

**How to Run**:

```bash
# Option 1: Supabase SQL Editor (Recommended)
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy and paste the contents of 004_financial_performance_indexes.sql
# 3. Execute the script
# 4. Run verify-financial-indexes.sql to confirm

# Option 2: psql Command Line
psql $DATABASE_URL -f src/database/migrations/004_financial_performance_indexes.sql
psql $DATABASE_URL -f src/database/migrations/verify-financial-indexes.sql
```

**Performance Impact**:

- 10-100x faster query execution for financial dashboards
- Reduced database CPU and I/O load
- Smaller partial indexes (only non-paid records)
- Compatible with existing RLS policies

**Documentation**:

- See `FINANCIAL_INDEXES_GUIDE.md` for complete documentation
- See `TASK_16.2_COMPLETION_SUMMARY.md` for implementation details
- Run `verify-financial-indexes.sql` for verification

**Related**: Task 16.2, Requirement 14.3 (Database Performance)

**How to Use**:

1. Copy this template file
2. Rename with sequential number (e.g., `005_enable_rls_new_table.sql`)
3. Replace `your_table_name` with actual table name
4. Review policy logic
5. Test in development
6. Execute in production

**Example**:

```sql
-- Replace 'your_table_name' with 'new_module_data'
ALTER TABLE public.new_module_data
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select"
ON public.new_module_data
FOR SELECT
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);
```

---

## Verification

After running migrations, verify RLS status using:

```bash
# In Supabase SQL Editor, run:
c:\Saas\src\database\verify-rls-status.sql
```

This script will:

- List all tables and their RLS status
- Show policy coverage for each table
- Identify any security gaps
- Provide an overall security assessment

---

## Migration Best Practices

### 1. Pre-Migration Checklist

- [ ] Read the migration script completely
- [ ] Understand what tables will be affected
- [ ] Backup database (if applicable)
- [ ] Test in development environment first
- [ ] Review rollback instructions

### 2. Running Migrations

- Always use transactions (`BEGIN` ... `COMMIT`)
- Review verification output
- Test table access after migration
- Document any issues encountered

### 3. Post-Migration Verification

- [ ] Run `verify-rls-status.sql`
- [ ] Test with multiple tenant accounts
- [ ] Verify data isolation is working
- [ ] Update RLS documentation

### 4. Rollback Procedure

Each migration includes a rollback script in the comments. To rollback:

1. Copy the rollback script
2. Execute in SQL Editor
3. Verify RLS is disabled
4. Test application functionality

---

## Common RLS Patterns

### Pattern 1: Tenant Isolation (Most Common)

Use when data should be isolated by `tenant_id`:

```sql
-- SELECT Policy
CREATE POLICY "tenant_isolation_select"
ON public.table_name
FOR SELECT
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);

-- Modify Policy (INSERT, UPDATE, DELETE)
CREATE POLICY "tenant_isolation_modify"
ON public.table_name
FOR ALL
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
)
WITH CHECK (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);
```

### Pattern 2: User Isolation

Use when data should be isolated by `user_id` (e.g., drafts, preferences):

```sql
CREATE POLICY "user_isolation_select"
ON public.user_drafts
FOR SELECT
USING (
  user_id = auth.uid()
);
```

### Pattern 3: Shared Data (No RLS)

Use for reference data that's shared across all tenants:

```sql
-- Do NOT enable RLS on shared tables like:
-- - market_quotes (market data)
-- - payment_methods (reference data)
-- - currencies (reference data)

-- Document why RLS is not enabled:
COMMENT ON TABLE public.market_quotes IS
  'Shared market data - No RLS required. Data is public and not tenant-specific.';
```

### Pattern 4: Role-Based Access

Use when access depends on user role:

```sql
CREATE POLICY "admin_full_access"
ON public.table_name
FOR ALL
USING (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
);

CREATE POLICY "user_readonly_access"
ON public.table_name
FOR SELECT
USING (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'user'
  AND tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);
```

---

## Troubleshooting

### Issue: "No rows returned after enabling RLS"

**Cause**: RLS enabled but no policies created, blocking all access.

**Solution**:

```sql
-- Check for policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- If no policies exist, create them using the template
```

### Issue: "JWT claims not found"

**Cause**: Supabase client not sending JWT token with requests.

**Solution**:

- Verify user is authenticated
- Check Supabase client configuration
- Test with `SELECT current_setting('request.jwt.claims', true);`

### Issue: "Can see data from other tenants"

**Cause**: Policy not properly checking `tenant_id`.

**Solution**:

```sql
-- Review policy logic
SELECT qual, with_check
FROM pg_policies
WHERE tablename = 'your_table';

-- Policy must include tenant_id check
-- Example: tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
```

---

## Testing RLS

### Manual Test Script

```sql
-- Test tenant isolation
DO $$
DECLARE
  test_tenant_a uuid := gen_random_uuid();
  test_tenant_b uuid := gen_random_uuid();
  visible_rows integer;
BEGIN
  -- Insert test data
  INSERT INTO your_table (tenant_id, name)
  VALUES (test_tenant_a, 'TEST-A'), (test_tenant_b, 'TEST-B');

  -- Set JWT claims to tenant A
  PERFORM set_config('request.jwt.claims',
    json_build_object('tenant_id', test_tenant_a)::text,
    true);

  -- Should only see 1 row
  SELECT count(*) INTO visible_rows
  FROM your_table
  WHERE name LIKE 'TEST-%';

  IF visible_rows != 1 THEN
    RAISE EXCEPTION 'FAILED: Can see % rows (expected 1)', visible_rows;
  END IF;

  RAISE NOTICE 'PASSED: Tenant isolation working';
END $$;
```

---

## Resources

- **Audit Script**: `../audit-rls.sql`
- **Verification Script**: `../verify-rls-status.sql`
- **Manual Steps Guide**: `../audit-manual-steps.md`
- **Audit Reports**: `../audit-reports/`
- **Requirements**: `.kiro/specs/system-improvements/requirements.md` (Requirement 3)
- **Design**: `.kiro/specs/system-improvements/design.md`

---

## Migration History

| Migration | Date       | Description                        | Status            |
| --------- | ---------- | ---------------------------------- | ----------------- |
| 001       | 2026-06-16 | Enable RLS on user_drafts          | ✅ Applied        |
| 002       | 2026-06-16 | Template for future migrations     | 📝 Template       |
| 003       | 2026-06-16 | Complete tenant isolation policies | ✅ Applied        |
| 004       | 2026-06-16 | Financial performance indexes      | ✅ Ready to apply |

---

## Next Steps

After completing the current migrations:

1. **Run verification script** to confirm RLS status
2. **Test tenant isolation** with multiple accounts
3. **Update documentation** with new policies
4. **Schedule regular audits** (monthly)
5. **Monitor for access issues** in production

---

## Contact

For questions or issues with RLS migrations:

- Review audit reports in `../audit-reports/`
- Check troubleshooting section above
- Consult PostgreSQL RLS documentation
- Review Supabase RLS best practices

---

**Last Updated**: 2026-06-16  
**Next Review**: 2026-07-16
