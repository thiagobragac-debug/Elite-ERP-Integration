# ADR-001: Multi-tenant Architecture with Row Level Security

**Status**: Accepted  
**Date**: 2024  
**Decision Makers**: Architecture Team  
**Related Requirements**: Requirements 3.1-3.5 (Row Level Security Audit)

## Context

Tauze ERP is a SaaS application serving multiple agribusiness clients (tenants). Each tenant must have complete data isolation from other tenants to ensure:

- **Security**: One client cannot access another client's sensitive data (financial records, animal inventory, farm operations)
- **Compliance**: Meets data privacy regulations (LGPD in Brazil) requiring tenant data segregation
- **Scalability**: Single database instance serves multiple tenants, reducing infrastructure costs
- **Performance**: Efficient querying with proper indexing on tenant_id

We needed to choose between several multi-tenancy approaches:

1. **Separate Databases per Tenant**: Each tenant gets their own database
2. **Separate Schemas per Tenant**: Each tenant gets a PostgreSQL schema
3. **Shared Tables with Discriminator Column**: All tenants share tables, filtered by `tenant_id` column
4. **Row Level Security (RLS) Policies**: PostgreSQL enforces tenant isolation at the database level

## Decision

We chose **Shared Tables with Row Level Security (RLS)** powered by Supabase PostgreSQL.

### Implementation Details

Every table includes a `tenant_id` column:

```sql
CREATE TABLE animais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  brinco VARCHAR(50) NOT NULL,
  raca VARCHAR(100),
  peso_atual DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE animais ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their tenant's data
CREATE POLICY "tenant_isolation_select"
ON animais
FOR SELECT
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);

-- Policy: Users can only INSERT/UPDATE/DELETE their tenant's data
CREATE POLICY "tenant_isolation_modify"
ON animais
FOR ALL
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
)
WITH CHECK (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);
```

### Tenant Context

The `tenant_id` is extracted from the JWT token claims set by Supabase Auth. Every authenticated request automatically filters data by the user's tenant without requiring application-level filtering.

### Composite Indexes

Performance is maintained through composite indexes:

```sql
-- Performance optimization for common queries
CREATE INDEX idx_animais_tenant_status ON animais(tenant_id, status);
CREATE INDEX idx_animais_fazenda_lote ON animais(fazenda_id, lote_id);
CREATE INDEX idx_contas_pagar_tenant_vencimento ON contas_pagar(tenant_id, data_vencimento) 
  WHERE status != 'PAGO';
```

## Consequences

### Benefits

✅ **Automatic Enforcement**: Database enforces isolation; application code cannot bypass it  
✅ **Simplified Application Logic**: No need for manual `WHERE tenant_id = ?` in every query  
✅ **Cost-Effective**: Single database serves all tenants, reducing hosting costs  
✅ **Backup & Migration Simplicity**: One database backup includes all tenant data  
✅ **Schema Evolution**: Database migrations apply to all tenants simultaneously  
✅ **Audit Trail**: PostgreSQL logs provide centralized security auditing  

### Drawbacks

⚠️ **Performance at Scale**: As tenant count grows, table size increases; requires careful indexing  
⚠️ **Limited Per-Tenant Customization**: Cannot easily customize database schema per tenant  
⚠️ **Complex RLS Policies**: Policies must be carefully written and tested to prevent data leakage  
⚠️ **Testing Complexity**: Tests must simulate multiple tenant contexts correctly  

### Trade-offs

- **Security vs Performance**: RLS adds overhead (~5-10%) but ensures bullet-proof isolation
- **Flexibility vs Simplicity**: Cannot easily give large tenants dedicated resources
- **Cost vs Complexity**: Cheaper than separate databases but requires more careful design

## Alternatives Considered

### 1. Separate Databases per Tenant

**Pros**: Maximum isolation, can scale tenants independently  
**Cons**: High operational overhead (migrations, backups), expensive at scale  
**Rejected**: Too expensive for a startup SaaS product

### 2. Separate Schemas per Tenant

**Pros**: Better isolation than shared tables, can customize per tenant  
**Cons**: PostgreSQL has schema limits, connection pooling complexity  
**Rejected**: PostgreSQL performance degrades with >100 schemas

### 3. Shared Tables without RLS (Application-Level Filtering)

**Pros**: Simpler database setup, slightly better performance  
**Cons**: Risk of developer error exposing data across tenants  
**Rejected**: Too risky; one missed `WHERE` clause causes major security breach

## Validation

RLS policies are validated through:

1. **Automated Audit Script**: `npm run audit:rls` identifies tables without RLS enabled
2. **Integration Tests**: Test suite verifies tenant A cannot access tenant B's data
3. **SQL Test Harness**: Database-level tests verify policy correctness

```sql
-- Automated test for tenant isolation
DO $$
DECLARE
  test_tenant_a uuid := gen_random_uuid();
  test_tenant_b uuid := gen_random_uuid();
BEGIN
  INSERT INTO animais (tenant_id, brinco) VALUES (test_tenant_a, 'TEST-A');
  INSERT INTO animais (tenant_id, brinco) VALUES (test_tenant_b, 'TEST-B');
  
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', test_tenant_a)::text, 
    true);
  
  ASSERT (SELECT count(*) FROM animais WHERE brinco LIKE 'TEST-%') = 1,
    'RLS failed: tenant can see other tenant data';
END $$;
```

## Related Decisions

- **ADR-003**: Supabase as Backend (provides RLS implementation)
- **ADR-006**: Authentication approach (JWT tokens carry tenant_id)

## References

- [PostgreSQL Row Level Security Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- Requirement 3: Row Level Security Audit (requirements.md)
