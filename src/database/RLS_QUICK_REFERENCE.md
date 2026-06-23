# RLS Quick Reference Guide

**Quick access guide for Row Level Security policies in Tauze ERP v5.0**

---

## Policy Pattern

All tenant-specific tables use this standard pattern:

```sql
CREATE POLICY "{table_name}_tenant"
ON public.{table_name}
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

---

## Key Concepts

### What is RLS?

Row Level Security automatically filters database queries to show only data belonging to the authenticated user's tenant. It works at the PostgreSQL level, independent of application code.

### How It Works

1. User logs in → Gets JWT token
2. Query executes → `auth_helpers.get_auth_tenant()` gets user's tenant_id
3. PostgreSQL applies → `WHERE tenant_id = {user_tenant_id}` to all queries
4. User sees → Only their tenant's data

### Policy Types

- **FOR ALL**: Covers SELECT, INSERT, UPDATE, DELETE (most common)
- **FOR SELECT**: Read operations only
- **FOR INSERT**: Create operations only
- **FOR UPDATE**: Modify operations only
- **FOR DELETE**: Delete operations only

---

## Quick Commands

### Check if RLS is enabled

```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'your_table_name';
```

### List policies on a table

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'your_table_name';
```

### Get current user's tenant

```sql
SELECT auth_helpers.get_auth_tenant();
```

### Enable RLS on a table

```sql
ALTER TABLE public.your_table_name ENABLE ROW LEVEL SECURITY;
```

### Create tenant isolation policy

```sql
CREATE POLICY "your_table_name_tenant"
ON public.your_table_name
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

### Drop a policy

```sql
DROP POLICY IF EXISTS "policy_name" ON public.your_table_name;
```

---

## Policy Index (22+ Tables)

### Core System

- `tenants` → `tenants_isolation` (special: uses id, not tenant_id)
- `profiles` → `profiles_self` (special: uses auth.uid())

### Organization

- `unidades` → `unidades_tenant`
- `fazendas` → `fazendas_tenant`
- `lotes` → `lotes_tenant`

### Livestock

- `animais` → `animais_tenant`
- `pesagens` → `pesagens_tenant`
- `sanidade` → `sanidade_tenant`
- `eventos_reprodutivos` → `eventos_reprodutivos_tenant`

### Pasture & Feedlot

- `pastos` → `pastos_tenant`
- `confinamento` → `confinamento_tenant`

### Financial

- `contas_pagar` → `contas_pagar_tenant`
- `contas_receber` → `contas_receber_tenant`
- `contas_bancarias` → `contas_bancarias_tenant`

### Partners

- `fornecedores` → `fornecedores_tenant`
- `clientes` → `clientes_tenant`
- `parceiros` → `parceiros_tenant`

### Fleet

- `maquinas` → `maquinas_tenant`
- `abastecimentos` → `abastecimentos_tenant`
- `manutencao_frota` → `manutencao_frota_tenant`

### Inventory

- `produtos` → `produtos_tenant`
- `pedidos_compra` → `pedidos_compra_tenant`
- `pedidos_venda` → `pedidos_venda_tenant`

### Security

- `audit_logs` → `audit_logs_tenant`
- `certificados_digitais` → `certificados_digitais_tenant`

---

## Testing Tenant Isolation

```sql
-- 1. Insert test data for two tenants
INSERT INTO animais (tenant_id, brinco) VALUES
  ('tenant-a-uuid', 'TEST-A'),
  ('tenant-b-uuid', 'TEST-B');

-- 2. Set context to tenant A (simulates user A login)
SET request.jwt.claims = '{"tenant_id": "tenant-a-uuid"}';

-- 3. Query should only show TEST-A
SELECT brinco FROM animais WHERE brinco LIKE 'TEST-%';
-- Expected: Only 'TEST-A' returned

-- 4. Cleanup
DELETE FROM animais WHERE brinco LIKE 'TEST-%';
```

---

## Common Issues

### Issue: Can't access any data after enabling RLS

**Cause:** RLS enabled but no policies created  
**Fix:** Create a tenant isolation policy (see "Create tenant isolation policy" above)

### Issue: Getting "permission denied" errors

**Cause:** Policies exist but don't match user's context  
**Fix:** Verify `auth_helpers.get_auth_tenant()` returns correct tenant_id

### Issue: Service role can't access data

**Cause:** RLS affects all roles by default  
**Fix:** Service role should bypass RLS automatically in Supabase. Check role configuration.

---

## Files & Documentation

### Main Documentation

- **Complete Reference**: `src/database/RLS_POLICIES_DOCUMENTATION.md`
- **Quick Start**: `src/database/QUICK_START_RLS.md`
- **This Guide**: `src/database/RLS_QUICK_REFERENCE.md`

### Scripts

- **Audit Script**: `src/database/audit-rls.sql`
- **Verification**: `src/database/verify-rls-status.sql`
- **Migration 002**: `supabase/migrations/002_elite_erp_rls_and_functions.sql`
- **Migration 003**: `src/database/migrations/003_tenant_isolation_policies_complete.sql`

### Audit Reports

- **Latest Report**: `src/database/audit-reports/rls-audit-2026-06-16T23-49-07.md`
- **Summary**: `src/database/audit-reports/FINDINGS-SUMMARY.md`

---

## Adding RLS to a New Table

**4-Step Process:**

```sql
-- Step 1: Create table with tenant_id
CREATE TABLE public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
  -- other columns
  created_at timestamptz DEFAULT now()
);

-- Step 2: Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policy
CREATE POLICY "new_table_tenant"
ON public.new_table
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());

-- Step 4: Test it
INSERT INTO public.new_table (tenant_id, data)
VALUES (auth_helpers.get_auth_tenant(), 'test');

SELECT * FROM public.new_table; -- Should see your data
```

---

## Security Reminders

✅ **DO:**

- Always enable RLS on new tenant-specific tables
- Test tenant isolation after schema changes
- Use `auth_helpers.get_auth_tenant()` for consistency
- Document policy changes

❌ **DON'T:**

- Disable RLS in production
- Use raw SQL to bypass RLS in application code
- Grant direct database access to users
- Forget to add WITH CHECK clauses when needed

---

## Support

- **Questions?** Check `RLS_POLICIES_DOCUMENTATION.md` for detailed explanations
- **Issues?** Run `audit-rls.sql` to diagnose problems
- **Testing?** Use `verify-rls-status.sql` to check status

---

**Last Updated:** 2026-06-16  
**Version:** 1.0  
**Maintained By:** Security Team
