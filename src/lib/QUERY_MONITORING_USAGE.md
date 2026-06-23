# Query Performance Monitoring Usage Guide

## Overview

The `monitoredQuery()` function in `src/lib/supabase.ts` provides automatic query performance monitoring for all Supabase database operations.

## Features

✅ **Automatic Duration Tracking** - Measures execution time for every query  
✅ **Slow Query Warnings** - Logs warnings for queries taking >1s  
✅ **Analytics Integration** - Sends slow query metrics to PostHog/custom analytics  
✅ **Development Logging** - Shows query times >500ms in dev mode  
✅ **Error Tracking** - Logs failed queries with duration context  

## Usage

### Basic Example

```typescript
import { supabase, monitoredQuery } from '@/lib/supabase';

// Wrap your Supabase queries with monitoredQuery()
const fetchAnimals = async (tenantId: string) => {
  const result = await monitoredQuery(
    () => supabase
      .from('animais')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('brinco'),
    'fetch-animals' // Descriptive query name
  );
  
  return result;
};
```

### Complex Query Example

```typescript
const fetchAnimalWithDetails = async (animalId: string) => {
  const result = await monitoredQuery(
    () => supabase
      .from('animais')
      .select(`
        *,
        lote:lotes(*),
        fazenda:fazendas(*),
        pesagens(*)
      `)
      .eq('id', animalId)
      .single(),
    'fetch-animal-details'
  );
  
  return result;
};
```

### Mutation Example

```typescript
const updateAnimal = async (animalId: string, data: Partial<Animal>) => {
  const result = await monitoredQuery(
    () => supabase
      .from('animais')
      .update(data)
      .eq('id', animalId)
      .select()
      .single(),
    'update-animal'
  );
  
  return result;
};
```

### React Query Integration

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase, monitoredQuery } from '@/lib/supabase';

export function useAnimals(tenantId: string) {
  return useQuery({
    queryKey: ['animals', tenantId],
    queryFn: async () => {
      const { data, error } = await monitoredQuery(
        () => supabase
          .from('animais')
          .select('*')
          .eq('tenant_id', tenantId),
        'fetch-animals-list'
      );
      
      if (error) throw error;
      return data;
    },
  });
}
```

## Query Naming Conventions

Use descriptive, kebab-case names that identify the operation:

✅ **Good:**
- `fetch-animals-list`
- `fetch-animal-by-id`
- `update-payment-status`
- `create-purchase-order`
- `delete-inventory-item`

❌ **Avoid:**
- `query1`
- `getStuff`
- `doSomething`

## Performance Thresholds

| Threshold | Action | Environment |
|-----------|--------|-------------|
| >500ms | Console log | Development only |
| >1000ms | Console warning + Analytics | All environments |

## Analytics Events

When a slow query is detected (>1s), the following data is sent to analytics:

```typescript
{
  event: 'api_slow_response',
  endpoint: 'fetch-animals-list',
  duration: 1250, // milliseconds
  timestamp: '2024-01-15T10:30:00.000Z',
  type: 'database_query'
}
```

### PostHog Integration

If PostHog is configured, slow queries are automatically tracked:

```javascript
window.posthog.capture('api_slow_response', {
  endpoint: 'fetch-animals-list',
  duration: 1250,
  type: 'database_query'
});
```

### Custom Analytics Endpoint

Set the environment variable to send metrics to your custom endpoint:

```env
VITE_ANALYTICS_ENDPOINT=https://your-analytics-api.com/events
```

## Console Output Examples

### Development Mode (>500ms)

```
[Query Performance] fetch-animals-list: 650.23ms
```

### Slow Query Warning (>1s)

```
[Query Performance] Slow query detected: fetch-animals-with-joins took 1523.45ms
{
  query: 'fetch-animals-with-joins',
  duration: 1523,
  threshold: '1000ms',
  recommendation: 'Consider adding indexes or optimizing query'
}
```

### Query Error

```
[Query Performance] Query failed: update-payment after 234.56ms
Error: Failed to update payment: permission denied
```

## Best Practices

### 1. Always Use monitoredQuery for Database Operations

```typescript
// ✅ Good
const data = await monitoredQuery(
  () => supabase.from('table').select('*'),
  'operation-name'
);

// ❌ Avoid direct queries (missing performance monitoring)
const { data } = await supabase.from('table').select('*');
```

### 2. Use Descriptive Query Names

```typescript
// ✅ Good - clear what the query does
await monitoredQuery(
  () => supabase.from('contas_pagar').select('*').eq('status', 'VENCIDA'),
  'fetch-overdue-accounts-payable'
);

// ❌ Bad - unclear purpose
await monitoredQuery(
  () => supabase.from('contas_pagar').select('*').eq('status', 'VENCIDA'),
  'query'
);
```

### 3. Investigate Slow Queries

When you see slow query warnings:

1. Check if indexes exist on filtered/joined columns
2. Use `EXPLAIN ANALYZE` in Supabase SQL editor
3. Consider query optimization:
   - Reduce selected columns
   - Remove unnecessary joins
   - Add composite indexes
   - Use pagination

### 4. Type Safety

Use TypeScript generics for type-safe results:

```typescript
interface Animal {
  id: string;
  brinco: string;
  raca: string;
}

const animals = await monitoredQuery<Animal[]>(
  () => supabase.from('animais').select('id, brinco, raca'),
  'fetch-animals-basic'
);

// animals is strongly typed as Animal[]
```

## Troubleshooting

### Query Always Shows as Slow

If a query consistently takes >1s:

1. **Check Database Indexes:**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'your_table';
   ```

2. **Analyze Query Performance:**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM animais WHERE tenant_id = 'xxx';
   ```

3. **Consider Optimization:**
   - Add composite indexes
   - Reduce data volume with pagination
   - Cache results in React Query
   - Use database views for complex joins

### Analytics Not Receiving Events

1. Verify PostHog is initialized:
   ```javascript
   console.log(window.posthog); // Should not be undefined
   ```

2. Check custom analytics endpoint:
   ```bash
   echo $VITE_ANALYTICS_ENDPOINT
   ```

3. Check browser network tab for failed requests

### No Console Output in Production

This is expected! Console logs are suppressed in production to:
- Reduce bundle size
- Prevent information leakage
- Improve performance

Use analytics dashboards to monitor production query performance.

## Related Files

- **Implementation:** `src/lib/supabase.ts`
- **Tests:** `src/lib/supabase.test.ts`
- **Requirements:** `.kiro/specs/system-improvements/requirements.md` (Requirement 14)
- **Design:** `.kiro/specs/system-improvements/design.md` (Database Performance section)

## Related Documentation

- [Database Performance Indexes](../../database/PERFORMANCE_INDEXES_README.md)
- [Supabase RLS Policies](../../database/RLS_POLICIES_DOCUMENTATION.md)
- [React Query Optimization](../../docs/REACT_QUERY_OPTIMIZATION.md)

## Migration Guide

### Updating Existing Queries

To add monitoring to existing queries, wrap them with `monitoredQuery`:

```typescript
// Before
const { data, error } = await supabase
  .from('animais')
  .select('*')
  .eq('tenant_id', tenantId);

// After
const { data, error } = await monitoredQuery(
  () => supabase
    .from('animais')
    .select('*')
    .eq('tenant_id', tenantId),
  'fetch-animals'
);
```

### Bulk Migration Script

For quick migration of multiple queries, use this pattern:

```typescript
// Create a wrapper function
const fetchWithMonitoring = <T>(
  queryFn: () => Promise<T>,
  name: string
) => monitoredQuery(queryFn, name);

// Use throughout your codebase
const animals = await fetchWithMonitoring(
  () => supabase.from('animais').select('*'),
  'fetch-animals'
);
```

## Performance Metrics Dashboard

Track these metrics in your analytics dashboard:

- **Slow Query Count:** Number of queries >1s
- **Average Query Duration:** Mean duration across all queries
- **P95 Query Duration:** 95th percentile duration
- **Slowest Endpoints:** Top 10 slowest query names
- **Error Rate:** Failed queries / total queries

## Support

For issues or questions:
1. Check test file for usage examples: `src/lib/supabase.test.ts`
2. Review requirement 14.5 in spec documentation
3. Consult database performance documentation

---

**Last Updated:** Task 16.5 - System Improvements Spec  
**Validates:** Requirement 14.5 (Database Performance Monitoring)
