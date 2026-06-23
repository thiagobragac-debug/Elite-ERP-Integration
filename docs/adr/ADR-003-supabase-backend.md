# ADR-003: Supabase as Backend Platform

**Status**: Accepted  
**Date**: 2024  
**Decision Makers**: Architecture Team, Backend Team  
**Related Requirements**: Requirement 1 (Credential Security), Requirement 3 (RLS Audit), Requirement 2 (Key Rotation)

## Context

Tauze ERP required a backend solution that provides:

- **Database**: PostgreSQL for complex queries, transactions, and relationships
- **Authentication**: Multi-factor authentication (MFA), JWT tokens, session management
- **Storage**: File uploads for animal photos, documents, reports
- **Real-time**: Optional live updates for multi-user scenarios
- **Security**: Row Level Security (RLS) for multi-tenant isolation
- **APIs**: RESTful and/or GraphQL APIs without writing backend code
- **Scalability**: Ability to handle growing user base and data volume

As a SaaS startup, we needed to move fast without managing infrastructure while maintaining enterprise-grade security and performance.

## Decision

We chose **Supabase** as our Backend-as-a-Service (BaaS) platform, providing PostgreSQL, Authentication, Storage, and APIs in a single managed service.

### Core Components

**1. PostgreSQL 14 Database**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
```

**2. Auto-Generated REST APIs**
- Every table automatically gets CRUD endpoints
- Queries filtered by RLS policies automatically
- Type-safe with generated TypeScript types

```typescript
// Automatic tenant filtering via RLS
const { data: animals } = await supabase
  .from('animais')
  .select('*')
  .eq('status', 'Ativo')
  .order('created_at', { ascending: false });
// RLS automatically adds: WHERE tenant_id = current_user_tenant_id
```

**3. Authentication & Authorization**
- JWT-based authentication with automatic token refresh
- Built-in support for email/password, magic links, OAuth
- MFA support via TOTP (Time-based One-Time Password)
- Row Level Security enforces data access policies

**4. Storage**
- S3-compatible object storage for files
- RLS policies control file access per tenant
- Automatic image optimization and CDN delivery

**5. Real-time (Optional)**
- WebSocket subscriptions for live data updates
- Used sparingly to avoid performance overhead

## Consequences

### Benefits

✅ **No Backend Code**: Focus on frontend; Supabase handles API layer  
✅ **PostgreSQL Power**: Full SQL capabilities (JOINs, CTEs, indexes, triggers)  
✅ **Built-in RLS**: Multi-tenant isolation enforced at database level  
✅ **Type Safety**: Generate TypeScript types from database schema  
✅ **Instant APIs**: RESTful endpoints auto-generated from schema  
✅ **Managed Infrastructure**: No server maintenance, automatic backups, scaling  
✅ **Developer Experience**: Dashboard UI for database management, logs, auth  
✅ **Cost-Effective**: Free tier for development, predictable pricing  

### Drawbacks

⚠️ **Vendor Lock-in**: Tightly coupled to Supabase ecosystem  
⚠️ **Limited Backend Logic**: Complex business logic must run client-side or in Edge Functions  
⚠️ **RLS Performance**: Complex policies can slow queries; requires careful optimization  
⚠️ **Cold Starts**: Edge Functions may have latency on first invocation  
⚠️ **Query Flexibility**: Some complex queries are harder without custom backend endpoints  

### Trade-offs

- **Speed vs Control**: Faster development but less control over infrastructure
- **Simplicity vs Flexibility**: Simple for CRUD operations, complex for custom business logic
- **Cost vs Customization**: Cheaper than managing servers but less customizable

## Alternatives Considered

### 1. Custom Node.js + Express + PostgreSQL Backend

**Pros**: Full control, unlimited customization, no vendor lock-in  
**Cons**: Must write and maintain all API endpoints, auth logic, file uploads  
**Rejected**: Too slow for MVP; team size cannot support full backend maintenance

### 2. Firebase (Google)

**Pros**: Similar BaaS offering, real-time by default, Google ecosystem  
**Cons**: NoSQL (Firestore) is less suitable for complex relational data  
**Rejected**: ERP systems need PostgreSQL for reports, JOINs, transactions

### 3. AWS Amplify

**Pros**: AWS ecosystem, DynamoDB, AppSync GraphQL  
**Cons**: Steeper learning curve, more complex setup, GraphQL overhead  
**Rejected**: Supabase is simpler and PostgreSQL is better for ERP use cases

### 4. PocketBase

**Pros**: Open-source, self-hosted, SQLite backend  
**Cons**: Less mature, smaller ecosystem, SQLite not ideal for multi-tenant SaaS  
**Rejected**: Supabase has better scalability and managed hosting

## Security Considerations

### Credential Management

Environment variables store only public keys:

```bash
# .env (gitignored)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (public anon key)

# Server-side secrets (not exposed to frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (admin key, never client-side)
```

### Row Level Security

All tables have RLS policies that automatically filter by tenant:

```sql
CREATE POLICY "tenant_isolation"
ON public.animais
FOR ALL
USING (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid);
```

### Key Rotation

Supabase supports zero-downtime key rotation:
1. Generate new anon key in dashboard
2. Update environment variables
3. Old key remains valid during grace period
4. Revoke old key after all clients updated

## Performance Optimizations

### Connection Pooling
Supabase uses PgBouncer for efficient connection management.

### Query Monitoring
We wrap queries with performance tracking:

```typescript
export async function monitoredQuery<T>(queryFn: () => Promise<T>, queryName: string) {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;
  
  if (duration > 1000) {
    console.warn(`Slow query: ${queryName} took ${duration}ms`);
  }
  return result;
}
```

### Indexing Strategy
Composite indexes on `tenant_id + frequently_queried_column`:

```sql
CREATE INDEX idx_animais_tenant_status ON animais(tenant_id, status);
CREATE INDEX idx_contas_pagar_tenant_vencimento ON contas_pagar(tenant_id, data_vencimento);
```

## Migration Path (If Needed)

If we outgrow Supabase or need to self-host:

1. **Database**: PostgreSQL schema is portable; export via pg_dump
2. **Auth**: Migrate to Auth.js (formerly NextAuth) or Clerk
3. **Storage**: Move to AWS S3 or Cloudflare R2
4. **APIs**: Generate REST APIs using PostgREST (open-source Supabase core)

The decision to use Supabase does not create insurmountable lock-in because the underlying technologies (PostgreSQL, JWT, S3-compatible storage) are industry standards.

## Related Decisions

- **ADR-001**: Multi-tenant RLS (implemented via Supabase RLS)
- **ADR-006**: Authentication approach (Supabase Auth)
- **ADR-004**: State management (React Query integrates with Supabase)

## References

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Architecture](https://supabase.com/docs/guides/getting-started/architecture)
- Requirement 1: Credential Security (requirements.md)
- Requirement 3: RLS Audit (requirements.md)
