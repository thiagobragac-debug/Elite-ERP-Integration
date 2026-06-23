# Query Monitoring Migration Example

## Overview

This document provides examples for migrating existing Supabase queries to use the `monitoredQuery()` wrapper for performance monitoring.

## Current Implementation Status

✅ **Core Infrastructure:** `monitoredQuery()` function is implemented and tested in `src/lib/supabase.ts`
⏳ **Migration:** Existing queries throughout the codebase can be gradually migrated

## Migration Priority

### High Priority (Critical Paths)
These queries should be migrated first as they're frequently used:

1. Animal queries (`animais` table)
2. Financial queries (`contas_pagar`, `contas_receber`)
3. Sales orders (`pedidos_venda`)
4. Inventory queries (`estoque`)

### Medium Priority
5. Audit logging
6. User preferences
7. Record locks

### Low Priority (Already Optimized)
8. Test/cleanup scripts
9. Background jobs

## Example Migrations

### Example 1: Delete Mutation (Sales Orders)

**Before:**
```typescript
// src/pages/Sales/SalesOrders/useSalesMutations.ts
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase.from('pedidos_venda').delete().eq('id', id);
    if (error) throw error;
  },
  // ...
});
```

**After:**
```typescript
// src/pages/Sales/SalesOrders/useSalesMutations.ts
import { supabase, monitoredQuery } from '@/lib/supabase';

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await monitoredQuery(
      () => supabase.from('pedidos_venda').delete().eq('id', id),
      'delete-sales-order'
    );
    if (error) throw error;
  },
  // ...
});
```

### Example 2: Delete Mutation (Accounts Payable)

**Before:**
```typescript
// src/pages/Finance/AccountsPayable/usePaymentMutation.ts
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase.from('contas_pagar').delete().eq('id', id);
    if (error) throw error;
  },
  // ...
});
```

**After:**
```typescript
// src/pages/Finance/AccountsPayable/usePaymentMutation.ts
import { supabase, monitoredQuery } from '@/lib/supabase';

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await monitoredQuery(
      () => supabase.from('contas_pagar').delete().eq('id', id),
      'delete-accounts-payable'
    );
    if (error) throw error;
  },
  // ...
});
```

### Example 3: Audit Logging

**Before:**
```typescript
// src/utils/audit.ts
export const logAudit = async (options: AuditLogOptions) => {
  try {
    const { error } = await supabase.from('audit_logs').insert([
      {
        tenant_id: options.tenant_id,
        // ... other fields
      }
    ]);
    // ...
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};
```

**After:**
```typescript
// src/utils/audit.ts
import { supabase, monitoredQuery } from '@/lib/supabase';

export const logAudit = async (options: AuditLogOptions) => {
  try {
    const { error } = await monitoredQuery(
      () => supabase.from('audit_logs').insert([
        {
          tenant_id: options.tenant_id,
          // ... other fields
        }
      ]),
      'insert-audit-log'
    );
    // ...
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};
```

### Example 4: Record Lock (useRecordLock hook)

**Before:**
```typescript
// src/hooks/useRecordLock.ts
const expiresAt = new Date(now.getTime() + 2 * 60000).toISOString();
await supabase.from('record_locks').upsert({
  table_name: tableName,
  record_id: recordId,
  // ...
});
```

**After:**
```typescript
// src/hooks/useRecordLock.ts
import { supabase, monitoredQuery } from '@/lib/supabase';

const expiresAt = new Date(now.getTime() + 2 * 60000).toISOString();
await monitoredQuery(
  () => supabase.from('record_locks').upsert({
    table_name: tableName,
    record_id: recordId,
    // ...
  }),
  'upsert-record-lock'
);
```

### Example 5: User Drafts (usePersistentState)

**Before:**
```typescript
// src/hooks/usePersistentState.ts
await supabase.from('user_drafts').upsert({
  user_id: userData.user.id,
  // ...
});
```

**After:**
```typescript
// src/hooks/usePersistentState.ts
import { supabase, monitoredQuery } from '@/lib/supabase';

await monitoredQuery(
  () => supabase.from('user_drafts').upsert({
    user_id: userData.user.id,
    // ...
  }),
  'upsert-user-draft'
);
```

## Query Naming Convention

Use this pattern for naming queries:

```
{action}-{table}-{optional-context}
```

### Examples:

**CRUD Operations:**
- `fetch-animals-list`
- `fetch-animal-by-id`
- `create-sales-order`
- `update-payment-status`
- `delete-accounts-receivable`

**Complex Operations:**
- `fetch-animals-with-details` (includes joins)
- `update-payment-with-validation`
- `bulk-insert-inventory-items`

**Utility Operations:**
- `upsert-user-draft`
- `upsert-record-lock`
- `insert-audit-log`

## Files to Migrate (Prioritized)

### Phase 1: Critical Business Operations (High Impact)
```
src/pages/Sales/SalesOrders/useSalesMutations.ts
src/pages/Finance/AccountsPayable/usePaymentMutation.ts
src/pages/Finance/AccountsReceivable/useReceivableMutation.ts
src/pages/Pecuaria/AnimalManagement/* (query hooks)
src/pages/Inventory/* (query hooks)
```

### Phase 2: Supporting Operations (Medium Impact)
```
src/utils/audit.ts
src/hooks/useRecordLock.ts
src/hooks/usePersistentState.ts
src/hooks/useApprovalQueue.ts
```

### Phase 3: Background/Admin Operations (Low Impact)
```
src/database/test-tenant-isolation.ts (test only)
supabase/functions/* (edge functions)
```

## Automated Migration Script

For bulk migration, you can use this find-and-replace pattern:

**Find:**
```regex
await supabase\.from\('([^']+)'\)\.(.*?)(?=;|\n)
```

**Replace:**
```typescript
await monitoredQuery(
  () => supabase.from('$1').$2,
  'QUERY_NAME_HERE' // TODO: Add descriptive name
)
```

**Note:** This is a starting point. You'll need to:
1. Add proper query names
2. Ensure imports are correct
3. Test each migration

## Testing Migrated Queries

After migration, verify:

1. **Functionality:** Query still works as expected
2. **Type Safety:** TypeScript types are preserved
3. **Performance Logging:** Check console for query duration logs
4. **Error Handling:** Errors are properly caught and logged

### Test Checklist

```bash
# 1. Run unit tests
npm test

# 2. Check for TypeScript errors
npm run type-check

# 3. Run the app in dev mode and check console
npm run dev

# 4. Trigger the migrated query and verify:
#    - Query executes successfully
#    - Console shows performance log (if >500ms in dev)
#    - No errors in console
```

## Rollback Strategy

If a migration causes issues:

1. **Immediate Rollback:**
   ```typescript
   // Revert to direct query
   const { error } = await supabase.from('table').select('*');
   ```

2. **Debug:**
   - Check browser console for errors
   - Verify query name is correct
   - Ensure monitoredQuery is imported

3. **Re-attempt:**
   - Fix the issue
   - Test thoroughly before committing

## Benefits of Migration

Once migrated, you'll get:

✅ Automatic performance tracking for all queries
✅ Slow query warnings (>1s) in console
✅ Analytics data for production monitoring
✅ Better visibility into database performance
✅ Easier identification of optimization opportunities

## Questions?

- **Implementation:** See `src/lib/supabase.ts`
- **Tests:** See `src/lib/supabase.test.ts`
- **Usage Guide:** See `src/lib/QUERY_MONITORING_USAGE.md`
- **Requirements:** See `.kiro/specs/system-improvements/requirements.md` (Requirement 14.5)

---

**Note:** Migration is **optional** and can be done gradually. The monitoring infrastructure is ready to use whenever needed.

**Task:** 16.5 - Add query performance monitoring
**Status:** ✅ Core implementation complete, migration examples provided
