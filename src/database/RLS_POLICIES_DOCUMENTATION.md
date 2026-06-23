# RLS Policies Documentation - Tauze ERP v5.0

**Document Version:** 1.0  
**Created:** 2026-06-16  
**Last Updated:** 2026-06-16  
**Requirements:** 3.2, 3.3, 3.5

---

## Table of Contents

1. [Overview](#overview)
2. [Tenant Isolation Pattern](#tenant-isolation-pattern)
3. [RLS Policy Index](#rls-policy-index)
4. [Policy Details by Table](#policy-details-by-table)
5. [Security Architecture](#security-architecture)
6. [Testing & Verification](#testing--verification)
7. [Maintenance Guidelines](#maintenance-guidelines)

---

## Overview

This document provides centralized documentation of all Row Level Security (RLS) policies implemented in the Tauze ERP v5.0 multi-tenant system. RLS ensures complete data isolation between tenants at the database level, preventing unauthorized access even if application-level security is compromised.

### Security Principles

- **Defense in Depth**: RLS provides database-level security independent of application code
- **Tenant Isolation**: Every query automatically filters by authenticated user's tenant_id
- **Principle of Least Privilege**: Users can only access data belonging to their tenant
- **Automatic Enforcement**: PostgreSQL enforces policies transparently on all queries

### Coverage Summary

| Category                    | Count | Status |
| --------------------------- | ----- | ------ |
| Tables with RLS Enabled     | 22+   | ✅     |
| Tables with Tenant Policies | 22+   | ✅     |
| Shared Tables (No RLS)      | 2     | ✅     |
| User-Specific Tables        | 1     | ✅     |

---

## Tenant Isolation Pattern

### Standard Pattern

All tenant-specific tables use a consistent RLS policy pattern:

```sql
-- Policy Name Format: {table_name}_tenant
-- Policy Type: FOR ALL (covers SELECT, INSERT, UPDATE, DELETE)
-- Isolation Mechanism: tenant_id = auth_helpers.get_auth_tenant()

CREATE POLICY "{table_name}_tenant"
ON public.{table_name}
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

### How It Works

1. **User Authentication**: User logs in via Supabase Auth, receives JWT token
2. **Tenant Resolution**: `auth_helpers.get_auth_tenant()` extracts tenant_id from user's profile
3. **Automatic Filtering**: PostgreSQL applies `WHERE tenant_id = {user_tenant_id}` to all queries
4. **Write Validation**: INSERT/UPDATE operations automatically validate tenant_id matches user's tenant

### Helper Function

```sql
CREATE OR REPLACE FUNCTION auth_helpers.get_auth_tenant()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth_helpers, public, auth
AS $$
  SELECT t.id
  FROM public.tenants t
  INNER JOIN public.profiles p ON p.tenant_id = t.id
  WHERE p.id = (SELECT auth.uid())
  LIMIT 1;
$$;
```

**Function Details:**

- Returns the tenant_id associated with the authenticated user
- Uses SECURITY DEFINER to access auth schema
- STABLE: Result doesn't change within a transaction
- Returns NULL if user is not authenticated or has no tenant

---

## RLS Policy Index

Quick reference table for all RLS policies:

| Table Name            | Policy Name                  | Type    | Isolation Method                           | Status    |
| --------------------- | ---------------------------- | ------- | ------------------------------------------ | --------- |
| tenants               | tenants_isolation            | FOR ALL | id = auth_helpers.get_auth_tenant()        | ✅ Active |
| profiles              | profiles_self                | FOR ALL | id = auth.uid()                            | ✅ Active |
| unidades              | unidades_tenant              | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| fazendas              | fazendas_tenant              | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| lotes                 | lotes_tenant                 | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| animais               | animais_tenant               | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| pesagens              | pesagens_tenant              | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| sanidade              | sanidade_tenant              | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| pastos                | pastos_tenant                | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| confinamento          | confinamento_tenant          | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| eventos_reprodutivos  | eventos_reprodutivos_tenant  | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| fornecedores          | fornecedores_tenant          | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| clientes              | clientes_tenant              | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| contas_pagar          | contas_pagar_tenant          | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| contas_receber        | contas_receber_tenant        | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| contas_bancarias      | contas_bancarias_tenant      | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| maquinas              | maquinas_tenant              | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| abastecimentos        | abastecimentos_tenant        | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| manutencao_frota      | manutencao_frota_tenant      | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| produtos              | produtos_tenant              | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| pedidos_compra        | pedidos_compra_tenant        | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| pedidos_venda         | pedidos_venda_tenant         | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| parceiros             | parceiros_tenant             | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| audit_logs            | audit_logs_tenant            | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |
| certificados_digitais | certificados_digitais_tenant | FOR ALL | tenant_id = auth_helpers.get_auth_tenant() | ✅ Active |

### Shared/Reference Tables (No Tenant Isolation)

| Table Name         | Purpose                                             | RLS Status                     | Access Pattern                            |
| ------------------ | --------------------------------------------------- | ------------------------------ | ----------------------------------------- |
| market_quotes      | Market price data (CEPEA) shared across all tenants | Enabled with public read       | SELECT: Public, INSERT: Service role only |
| market_import_logs | System-wide market data import logs                 | Enabled with service role only | Service role only                         |

### User-Specific Tables (User Isolation)

| Table Name  | Policy Type | Isolation Method     | Status    |
| ----------- | ----------- | -------------------- | --------- |
| user_drafts | FOR ALL     | user_id = auth.uid() | ✅ Active |

---

## Policy Details by Table

### 1. Core System Tables

#### tenants

- **Policy Name**: `tenants_isolation`
- **Purpose**: Tenant metadata and configuration
- **Isolation**: Users can only see their own tenant record
- **Policy SQL**:

```sql
CREATE POLICY "tenants_isolation"
ON public.tenants
FOR ALL
USING (id = auth_helpers.get_auth_tenant());
```

#### profiles

- **Policy Name**: `profiles_self`
- **Purpose**: User profiles and settings
- **Isolation**: Users can only access their own profile
- **Policy SQL**:

```sql
CREATE POLICY "profiles_self"
ON public.profiles
FOR ALL
USING (id = auth.uid());
```

---

### 2. Organization Hierarchy

#### unidades (Business Units)

- **Policy Name**: `unidades_tenant`
- **Purpose**: Organizational units within a tenant
- **Tenant Column**: `tenant_id`
- **Policy SQL**:

```sql
CREATE POLICY "unidades_tenant"
ON public.unidades
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### fazendas (Farms)

- **Policy Name**: `fazendas_tenant`
- **Purpose**: Farm locations and properties
- **Tenant Column**: `tenant_id`
- **Related Tables**: unidades (parent), lotes, animais, pesagens (children)
- **Policy SQL**:

```sql
CREATE POLICY "fazendas_tenant"
ON public.fazendas
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### lotes (Lots)

- **Policy Name**: `lotes_tenant`
- **Purpose**: Animal lots/groups within farms
- **Tenant Column**: `tenant_id`
- **Related Tables**: fazendas (parent), animais (children)
- **Policy SQL**:

```sql
CREATE POLICY "lotes_tenant"
ON public.lotes
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

---

### 3. Livestock Management

#### animais (Animals)

- **Policy Name**: `animais_tenant`
- **Purpose**: Individual animal records
- **Tenant Column**: `tenant_id`
- **Related Tables**: fazendas, lotes, pesagens, sanidade, eventos_reprodutivos
- **Policy SQL**:

```sql
CREATE POLICY "animais_tenant"
ON public.animais
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### pesagens (Weighings)

- **Policy Name**: `pesagens_tenant`
- **Purpose**: Animal weight measurements
- **Tenant Column**: `tenant_id`
- **Related Tables**: animais, fazendas
- **Policy SQL**:

```sql
CREATE POLICY "pesagens_tenant"
ON public.pesagens
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### sanidade (Health Records)

- **Policy Name**: `sanidade_tenant`
- **Purpose**: Vaccination and health interventions
- **Tenant Column**: `tenant_id`
- **Related Tables**: fazendas, lotes
- **Policy SQL**:

```sql
CREATE POLICY "sanidade_tenant"
ON public.sanidade
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### eventos_reprodutivos (Reproductive Events)

- **Policy Name**: `eventos_reprodutivos_tenant`
- **Purpose**: Breeding, calving, and reproductive events
- **Tenant Column**: `tenant_id`
- **Related Tables**: animais, fazendas
- **Policy SQL**:

```sql
CREATE POLICY "eventos_reprodutivos_tenant"
ON public.eventos_reprodutivos
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

---

### 4. Pasture & Feedlot Management

#### pastos (Pastures)

- **Policy Name**: `pastos_tenant`
- **Purpose**: Pasture areas and grass management
- **Tenant Column**: `tenant_id`
- **Related Tables**: fazendas
- **Policy SQL**:

```sql
CREATE POLICY "pastos_tenant"
ON public.pastos
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### confinamento (Feedlot)

- **Policy Name**: `confinamento_tenant`
- **Purpose**: Feedlot/confinement operations
- **Tenant Column**: `tenant_id`
- **Related Tables**: fazendas, lotes
- **Policy SQL**:

```sql
CREATE POLICY "confinamento_tenant"
ON public.confinamento
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

---

### 5. Financial Management

#### contas_pagar (Accounts Payable)

- **Policy Name**: `contas_pagar_tenant`
- **Purpose**: Bills and payments owed
- **Tenant Column**: `tenant_id`
- **Related Tables**: fornecedores, fazendas
- **Policy SQL**:

```sql
CREATE POLICY "contas_pagar_tenant"
ON public.contas_pagar
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### contas_receber (Accounts Receivable)

- **Policy Name**: `contas_receber_tenant`
- **Purpose**: Invoices and payments to be received
- **Tenant Column**: `tenant_id`
- **Related Tables**: clientes, fazendas
- **Policy SQL**:

```sql
CREATE POLICY "contas_receber_tenant"
ON public.contas_receber
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### contas_bancarias (Bank Accounts)

- **Policy Name**: `contas_bancarias_tenant`
- **Purpose**: Bank account information and balances
- **Tenant Column**: `tenant_id`
- **Related Tables**: fazendas
- **Policy SQL**:

```sql
CREATE POLICY "contas_bancarias_tenant"
ON public.contas_bancarias
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

---

### 6. Partners & Relationships

#### fornecedores (Suppliers)

- **Policy Name**: `fornecedores_tenant`
- **Purpose**: Supplier/vendor records
- **Tenant Column**: `tenant_id`
- **Related Tables**: pedidos_compra, contas_pagar
- **Policy SQL**:

```sql
CREATE POLICY "fornecedores_tenant"
ON public.fornecedores
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### clientes (Customers)

- **Policy Name**: `clientes_tenant`
- **Purpose**: Customer records
- **Tenant Column**: `tenant_id`
- **Related Tables**: pedidos_venda, contas_receber
- **Policy SQL**:

```sql
CREATE POLICY "clientes_tenant"
ON public.clientes
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### parceiros (Partners - Unified)

- **Policy Name**: `parceiros_tenant`
- **Purpose**: Unified partner records (suppliers + customers)
- **Tenant Column**: `tenant_id`
- **Related Tables**: Replaces/unifies fornecedores and clientes
- **Policy SQL**:

```sql
CREATE POLICY "parceiros_tenant"
ON public.parceiros
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

---

### 7. Fleet Management

#### maquinas (Machinery/Vehicles)

- **Policy Name**: `maquinas_tenant`
- **Purpose**: Farm equipment and vehicles
- **Tenant Column**: `tenant_id`
- **Related Tables**: fazendas, abastecimentos, manutencao_frota
- **Policy SQL**:

```sql
CREATE POLICY "maquinas_tenant"
ON public.maquinas
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### abastecimentos (Fuel Records)

- **Policy Name**: `abastecimentos_tenant`
- **Purpose**: Fuel/refueling records
- **Tenant Column**: `tenant_id`
- **Related Tables**: maquinas, fazendas
- **Policy SQL**:

```sql
CREATE POLICY "abastecimentos_tenant"
ON public.abastecimentos
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### manutencao_frota (Fleet Maintenance)

- **Policy Name**: `manutencao_frota_tenant`
- **Purpose**: Maintenance records and schedules
- **Tenant Column**: `tenant_id`
- **Related Tables**: maquinas, fazendas
- **Policy SQL**:

```sql
CREATE POLICY "manutencao_frota_tenant"
ON public.manutencao_frota
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

---

### 8. Inventory & Purchasing

#### produtos (Products/Inventory)

- **Policy Name**: `produtos_tenant`
- **Purpose**: Inventory items and stock levels
- **Tenant Column**: `tenant_id`
- **Related Tables**: fazendas, pedidos_compra
- **Policy SQL**:

```sql
CREATE POLICY "produtos_tenant"
ON public.produtos
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### pedidos_compra (Purchase Orders)

- **Policy Name**: `pedidos_compra_tenant`
- **Purpose**: Purchase orders and procurement
- **Tenant Column**: `tenant_id`
- **Related Tables**: fornecedores, fazendas, produtos
- **Policy SQL**:

```sql
CREATE POLICY "pedidos_compra_tenant"
ON public.pedidos_compra
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### pedidos_venda (Sales Orders)

- **Policy Name**: `pedidos_venda_tenant`
- **Purpose**: Sales orders and customer orders
- **Tenant Column**: `tenant_id`
- **Related Tables**: clientes, fazendas
- **Policy SQL**:

```sql
CREATE POLICY "pedidos_venda_tenant"
ON public.pedidos_venda
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

---

### 9. Audit & Security

#### audit_logs

- **Policy Name**: `audit_logs_tenant`
- **Purpose**: System audit trail
- **Tenant Column**: `tenant_id`
- **Policy SQL**:

```sql
CREATE POLICY "audit_logs_tenant"
ON public.audit_logs
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

#### certificados_digitais (Digital Certificates)

- **Policy Name**: `certificados_digitais_tenant`
- **Purpose**: Digital certificates for fiscal compliance
- **Tenant Column**: `tenant_id`
- **Policy SQL**:

```sql
CREATE POLICY "certificados_digitais_tenant"
ON public.certificados_digitais
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

---

## Security Architecture

### Multi-Layered Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                       │
│  • Authentication (Supabase Auth)                           │
│  • Authorization (Role-based checks)                        │
│  • Input validation                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
│  • Supabase Client (with JWT token)                         │
│  • Automatic tenant_id injection                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (RLS)                      │
│  • PostgreSQL Row Level Security                            │
│  • Automatic filtering on ALL queries                       │
│  • Cannot be bypassed by application code                   │
│  • Enforced even with direct SQL access                     │
└─────────────────────────────────────────────────────────────┘
```

### Policy Enforcement Flow

```
User Request
    │
    ├─ Authentication → JWT Token (contains user_id)
    │
    ├─ Database Query → SELECT * FROM animais
    │
    ├─ RLS Policy Applied →
    │   WHERE tenant_id = auth_helpers.get_auth_tenant()
    │                          │
    │                          ├─ Lookup: auth.uid() → user_id
    │                          ├─ Join: profiles WHERE id = user_id
    │                          └─ Return: tenant_id from profile
    │
    └─ Result → Only rows matching user's tenant_id
```

### SAAS Admin Bypass

Some policies include a SAAS_ADMIN bypass for platform administration:

```sql
-- Example with admin bypass (from migration 20260526110000)
CREATE POLICY "table_name_tenant"
ON public.table_name
FOR ALL
USING (
  tenant_id = auth_helpers.get_auth_tenant()
  OR auth_helpers.is_saas_admin()
);
```

**Security Note**: The `is_saas_admin()` function should be tightly controlled and used only for platform administration tasks.

---

## Testing & Verification

### Manual Testing Procedure

```sql
-- 1. Create test tenants and data
DO $$
DECLARE
  tenant_a_id uuid := gen_random_uuid();
  tenant_b_id uuid := gen_random_uuid();
  user_a_id uuid := gen_random_uuid();
  user_b_id uuid := gen_random_uuid();
BEGIN
  -- Insert test tenants
  INSERT INTO public.tenants (id, nome) VALUES
    (tenant_a_id, 'Test Tenant A'),
    (tenant_b_id, 'Test Tenant B');

  -- Insert test users/profiles
  INSERT INTO public.profiles (id, tenant_id, full_name) VALUES
    (user_a_id, tenant_a_id, 'User A'),
    (user_b_id, tenant_b_id, 'User B');

  -- Insert test data for tenant A
  INSERT INTO public.animais (tenant_id, brinco, raca) VALUES
    (tenant_a_id, 'TEST-A-001', 'Nelore');

  -- Insert test data for tenant B
  INSERT INTO public.animais (tenant_id, brinco, raca) VALUES
    (tenant_b_id, 'TEST-B-001', 'Angus');

  RAISE NOTICE 'Test data created: Tenant A: %, Tenant B: %',
    tenant_a_id, tenant_b_id;
END $$;

-- 2. Test isolation (run as authenticated user A)
-- Should only return TEST-A-001, not TEST-B-001
SELECT brinco, raca FROM public.animais WHERE brinco LIKE 'TEST-%';

-- 3. Verify policy exists
SELECT
  schemaname,
  tablename,
  policyname,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'animais'
  AND schemaname = 'public';

-- 4. Cleanup test data
DELETE FROM public.animais WHERE brinco LIKE 'TEST-%';
DELETE FROM public.profiles WHERE full_name LIKE 'User %';
DELETE FROM public.tenants WHERE nome LIKE 'Test Tenant %';
```

### Automated Verification Script

Use the verification script to check RLS status:

```bash
# Location: src/database/verify-rls-status.sql
# Run in Supabase SQL Editor
```

Expected results:

- All tenant-specific tables show RLS enabled
- All tables have at least one policy
- All policies reference tenant_id or user_id

---

## Maintenance Guidelines

### Adding a New Table with Tenant Isolation

When creating a new tenant-specific table, follow these steps:

```sql
-- Step 1: Create table with tenant_id column
CREATE TABLE IF NOT EXISTS public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
  -- ... other columns ...
  created_at timestamptz DEFAULT now()
);

-- Step 2: Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Step 3: Create tenant isolation policy
CREATE POLICY "new_table_tenant"
ON public.new_table
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());

-- Step 4: Verify policy
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'new_table';

-- Step 5: Test isolation
-- Create test data and verify users can only see their tenant's data
```

### Updating This Documentation

When RLS policies change:

1. **Update the Policy Index**: Add/modify entries in the policy index table
2. **Update Policy Details**: Add detailed section for new tables
3. **Update Version**: Increment document version and update "Last Updated" date
4. **Document Changes**: Add entry to change log at bottom of document
5. **Run Verification**: Execute verification scripts to ensure accuracy
6. **Commit Changes**: Commit documentation with descriptive message

### Regular Audit Schedule

- **Weekly**: Automated verification script
- **Monthly**: Manual policy review and testing
- **Quarterly**: Security assessment with penetration testing
- **Annually**: Complete RLS policy documentation review

### Policy Modification Checklist

Before modifying an RLS policy:

- [ ] Document the reason for the change
- [ ] Review impact on all related tables
- [ ] Test in staging environment first
- [ ] Verify tenant isolation still works
- [ ] Update this documentation
- [ ] Notify team of security changes
- [ ] Schedule post-deployment verification

---

## Quick Reference Commands

### Check if RLS is enabled on a table

```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'table_name';
```

### List all policies on a table

```sql
SELECT * FROM pg_policies
WHERE tablename = 'table_name';
```

### Disable RLS (DANGEROUS - for testing only)

```sql
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;
```

### Drop a policy

```sql
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
```

### Check current user's tenant

```sql
SELECT auth_helpers.get_auth_tenant();
```

---

## Change Log

### Version 1.0 (2026-06-16)

- Initial documentation created
- Documented 22+ tables with tenant isolation policies
- Documented 2 shared tables (market_quotes, market_import_logs)
- Documented 1 user-specific table (user_drafts)
- Added security architecture diagrams
- Added testing and verification procedures
- Added maintenance guidelines

---

## References

- **Migration Files**:
  - `supabase/migrations/001_elite_erp_full_schema.sql` - Table definitions
  - `supabase/migrations/002_elite_erp_rls_and_functions.sql` - RLS policies
  - `src/database/migrations/001_enable_rls_missing_tables.sql` - Additional RLS
  - `src/database/migrations/002_enable_rls_template.sql` - Policy template

- **Audit Scripts**:
  - `src/database/audit-rls.sql` - Comprehensive RLS audit
  - `src/database/verify-rls-status.sql` - Status verification
  - `src/database/audit-reports/` - Audit history

- **Requirements**:
  - `.kiro/specs/system-improvements/requirements.md` - Requirement 3.2, 3.3, 3.5
  - `.kiro/specs/system-improvements/design.md` - RLS design patterns

- **PostgreSQL Documentation**:
  - [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
  - [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)

- **Supabase Documentation**:
  - [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
  - [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

**Document Maintained By:** Security Team  
**Review Frequency:** Monthly  
**Next Review Date:** 2026-07-16  
**Security Classification:** Internal Use Only
