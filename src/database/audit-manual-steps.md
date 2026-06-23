# RLS Audit - Manual Steps

## Overview

This guide walks you through manually auditing Row Level Security (RLS) in your Supabase database.

**Requirements:** 3.1, 3.5  
**Estimated Time:** 15-20 minutes

---

## Prerequisites

- Access to Supabase Dashboard
- Project: https://nmirpozhgcoabcjwgvqk.supabase.co
- SQL Editor permissions

---

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `nmirpozhgcoabcjwgvqk`
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query

---

## Step 2: Find Tables Without RLS Enabled

**Copy and run this query:**

```sql
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  'RLS NOT ENABLED' AS status,
  'CRITICAL' AS severity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = pg_tables.tablename
      AND c.relrowsecurity = true
  )
ORDER BY tablename;
```

**Document the results:**

- Number of tables: \_\_\_
- Table names: \_\_\_

---

## Step 3: Find Tables With RLS But No Policies

**Copy and run this query:**

```sql
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  'RLS ENABLED BUT NO POLICIES' AS status,
  'HIGH' AS severity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = pg_tables.tablename
      AND c.relrowsecurity = true
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = pg_tables.tablename
  )
ORDER BY tablename;
```

**Document the results:**

- Number of tables: \_\_\_
- Table names: \_\_\_

---

## Step 4: Find Tables Without tenant_id Column

**Copy and run this query:**

```sql
SELECT
  t.table_name,
  'NO TENANT_ID COLUMN' AS status,
  'CRITICAL' AS severity
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE 'sql_%'
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = 'tenant_id'
  )
ORDER BY t.table_name;
```

**Document the results:**

- Number of tables: \_\_\_
- Table names: \_\_\_
- Note: Some tables may be reference/shared tables that don't need tenant isolation

---

## Step 5: List All Existing RLS Policies

**Copy and run this query:**

```sql
SELECT
  schemaname AS schema_name,
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
    WHEN permissive THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END AS policy_type,
  roles,
  qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Document the results:**

- Total number of policies: \_\_\_
- Export results as CSV or screenshot

---

## Step 6: Verify Tenant Isolation in Policies

**Copy and run this query:**

```sql
SELECT
  tablename AS table_name,
  policyname AS policy_name,
  CASE
    WHEN qual::text LIKE '%tenant_id%' THEN '✅ YES'
    ELSE '❌ NO'
  END AS filters_by_tenant_id,
  CASE
    WHEN qual::text LIKE '%tenant_id%' THEN 'OK'
    ELSE 'HIGH RISK'
  END AS risk_level,
  qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY
  CASE WHEN qual::text LIKE '%tenant_id%' THEN 1 ELSE 0 END,
  tablename;
```

**Document the results:**

- Policies with tenant isolation: \_\_\_
- Policies WITHOUT tenant isolation: \_\_\_

---

## Step 7: Get Audit Summary

**Copy and run this query:**

```sql
WITH
tables_without_rls AS (
  SELECT COUNT(*) as count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = pg_tables.tablename
        AND c.relrowsecurity = true
    )
),
tables_without_policies AS (
  SELECT COUNT(*) as count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = pg_tables.tablename
        AND c.relrowsecurity = true
    )
    AND NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = pg_tables.tablename
    )
),
tables_without_tenant_id AS (
  SELECT COUNT(*) as count
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'sql_%'
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = t.table_name
        AND c.column_name = 'tenant_id'
    )
),
total_tables AS (
  SELECT COUNT(*) as count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
),
total_policies AS (
  SELECT COUNT(*) as count
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT
  tt.count AS total_tables,
  twor.count AS tables_without_rls,
  twop.count AS tables_without_policies,
  twtid.count AS tables_without_tenant_id,
  tp.count AS total_policies,
  CASE
    WHEN twor.count = 0 AND twop.count = 0 AND twtid.count = 0 THEN '✅ SECURE'
    WHEN twor.count > 0 OR twtid.count > 0 THEN '🚨 CRITICAL'
    WHEN twop.count > 0 THEN '⚠️ WARNING'
    ELSE '❓ UNKNOWN'
  END AS security_status
FROM total_tables tt, tables_without_rls twor, tables_without_policies twop,
     tables_without_tenant_id twtid, total_policies tp;
```

**Document the results:**

| Metric                   | Count  |
| ------------------------ | ------ |
| Total Tables             | \_\_\_ |
| Tables Without RLS       | \_\_\_ |
| Tables Without Policies  | \_\_\_ |
| Tables Without tenant_id | \_\_\_ |
| Total Policies           | \_\_\_ |
| **Security Status**      | \_\_\_ |

---

## Step 8: Create Audit Report

Create a new file: `src/database/audit-reports/rls-audit-[DATE].md`

**Template:**

```markdown
# RLS Audit Report

**Date:** [DATE]
**Auditor:** [YOUR NAME]
**Database:** nmirpozhgcoabcjwgvqk.supabase.co

## Summary

[Paste results from Step 7]

## Findings

### 1. Tables Without RLS

[Paste results from Step 2]

### 2. Tables Without Policies

[Paste results from Step 3]

### 3. Tables Without tenant_id

[Paste results from Step 4]

### 4. Existing Policies

[Paste results from Step 5]

### 5. Tenant Isolation Check

[Paste results from Step 6]

## Recommendations

- [ ] Enable RLS on X tables
- [ ] Create policies for Y tables
- [ ] Add tenant_id to Z tables
- [ ] Review and fix policies without tenant isolation

## Action Items

1. [Specific action 1]
2. [Specific action 2]
3. [Specific action 3]

## Next Audit Date

[Recommended: 1 month from now]
```

---

## Troubleshooting

### Error: "permission denied for table pg_tables"

- You need elevated privileges
- Contact Supabase project owner
- Use Supabase dashboard instead of SQL editor

### Error: "relation does not exist"

- Table may have been deleted
- Check schema name is 'public'
- Verify you're connected to correct database

---

## Reference

- SQL Script: `src/database/audit-rls.sql`
- Design Doc: `.kiro/specs/system-improvements/design.md`
- Requirements: `.kiro/specs/system-improvements/requirements.md`

---

## Security Best Practices

✅ **DO:**

- Run audits regularly (weekly/monthly)
- Document all findings
- Test tenant isolation after schema changes
- Enable RLS on all tenant-specific tables

❌ **DON'T:**

- Disable RLS to "fix" permission issues
- Skip testing after applying policies
- Forget to add WITH CHECK clauses
- Use service role in client-side code

---

**Next Steps:** After completing this audit, proceed to Task 3.2 to implement fixes.
