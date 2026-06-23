# Analytics Event Tracking - Developer Guide

## Quick Reference

This guide helps developers add new business event tracking to the Tauze ERP system.

## Overview

The system uses PostHog for business analytics with three types of events already implemented:
- `animal_registered` - When a new animal is registered
- `sale_completed` - When a new sales invoice is created
- `payment_received` - When a payment is processed

## How to Add a New Event

### Step 1: Define the Event Function (if not already in analytics.ts)

**Location**: `src/lib/analytics.ts`

```typescript
export const analytics = {
  // Existing events...
  
  // Add your new event:
  myNewEvent: (data: { field1: string; field2: number }) => {
    if (!posthog.__loaded || localStorage.getItem('analytics_opted_out') === 'true') {
      return;
    }
    
    posthog.capture('my_new_event', {
      field1: data.field1,
      field2: data.field2,
    });
  },
};
```

### Step 2: Integrate the Event in Your Component

**Pattern**: Call the event in the `onSuccess` callback or after the operation completes

```typescript
import { useMutation } from '@tanstack/react-query';

const myMutation = useMutation({
  mutationFn: async (data: any) => {
    // Your database operation
    const { error } = await supabase
      .from('my_table')
      .insert([data]);
    
    if (error) throw error;
    
    return { data };
  },
  onSuccess: (result) => {
    // Update UI, invalidate queries, etc.
    toast.success('Success!');
    
    // Track the event with dynamic import
    import('../../lib/analytics').then(({ analytics }) => {
      analytics.myNewEvent({
        field1: result.data.field1,
        field2: result.data.field2,
      });
    });
  },
});
```

## Best Practices

### ✅ DO:

1. **Use Dynamic Imports** - Never block the main thread
   ```typescript
   import('../../lib/analytics').then(({ analytics }) => { ... });
   ```

2. **Track Only New Records** - Don't track updates unless specifically needed
   ```typescript
   if (!isUpdate && payload) {
     // Track event
   }
   ```

3. **Handle Missing Data** - Provide defaults
   ```typescript
   valor: Number(record.valor) || 0,
   metodo: record.metodo || 'N/A',
   ```

4. **Enrich with Context** - Fetch additional data for better insights
   ```typescript
   // Get customer name instead of just ID
   const { data } = await supabase
     .from('customers')
     .select('name')
     .eq('id', customerId)
     .single();
   
   analytics.myEvent({
     customer: data?.name || 'Unknown'
   });
   ```

5. **Track After Success** - Only track completed operations
   ```typescript
   onSuccess: (result) => {
     // Track here
   }
   ```

### ❌ DON'T:

1. **Don't Block the Main Thread**
   ```typescript
   // ❌ BAD
   import { analytics } from '../../lib/analytics';
   analytics.myEvent({ ... }); // Synchronous
   
   // ✅ GOOD
   import('../../lib/analytics').then(({ analytics }) => {
     analytics.myEvent({ ... }); // Async
   });
   ```

2. **Don't Track Sensitive Data**
   ```typescript
   // ❌ BAD
   analytics.myEvent({
     password: user.password,
     token: user.authToken,
   });
   
   // ✅ GOOD
   analytics.myEvent({
     userId: user.id,
     role: user.role,
   });
   ```

3. **Don't Track Failed Operations**
   ```typescript
   // ❌ BAD
   try {
     await saveData();
     analytics.myEvent({ ... }); // What if it fails?
   } catch (err) {
     // Error
   }
   
   // ✅ GOOD
   onSuccess: () => {
     analytics.myEvent({ ... }); // Only on success
   }
   ```

4. **Don't Call Analytics Synchronously in Loops**
   ```typescript
   // ❌ BAD
   items.forEach(item => {
     analytics.myEvent({ item: item.id }); // Multiple dynamic imports
   });
   
   // ✅ GOOD
   import('../../lib/analytics').then(({ analytics }) => {
     items.forEach(item => {
       analytics.myEvent({ item: item.id }); // Single dynamic import
     });
   });
   ```

## Real Examples from Codebase

### Example 1: Animal Registration (Simple Case)

**File**: `src/pages/Pecuaria/AnimalManagement.tsx`

```typescript
const saveAnimalMutation = useMutation({
  mutationFn: async (payload: any) => {
    // ... save logic
    return { isUpdate: false, payload };
  },
  onSuccess: (result) => {
    toast.success('Animal cadastrado!');
    
    // Track only new animals
    if (!result.isUpdate && result.payload) {
      import('../../lib/analytics').then(({ analytics }) => {
        analytics.animalRegistered({
          raca: result.payload.raca,
          peso: result.payload.peso_inicial || 0,
          sexo: result.payload.sexo,
        });
      });
    }
  },
});
```

### Example 2: Payment Processing (Batch with Metadata Fetch)

**File**: `src/components/Modals/BatchLiquidationModal.tsx`

```typescript
const handleBatchLiquidation = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Fetch metadata BEFORE updating (important!)
  const { data: records } = await supabase
    .from('contas_receber')
    .select('valor, metodo_pagamento')
    .in('id', selectedIds);
  
  // Perform the update
  const { error } = await supabase
    .from('contas_receber')
    .update({ status: 'RECEBIDO' })
    .in('id', selectedIds);
  
  if (error) throw error;
  
  // Track events for each payment
  if (records && records.length > 0) {
    import('../../lib/analytics').then(({ analytics }) => {
      records.forEach((record) => {
        analytics.paymentReceived({
          valor: Number(record.valor) || 0,
          metodo: record.metodo_pagamento || 'N/A',
          tipo: 'recebimento',
        });
      });
    });
  }
};
```

### Example 3: Sales Completion (With Data Enrichment)

**File**: `src/pages/Sales/Invoices.tsx`

```typescript
const saveMutation = useMutation({
  mutationFn: async (data: any) => {
    // Get customer name for analytics
    let clientName = 'N/A';
    if (data.cliente_id) {
      const { data: clientData } = await supabase
        .from('parceiros')
        .select('nome')
        .eq('id', data.cliente_id)
        .single();
      
      if (clientData) {
        clientName = clientData.nome;
      }
    }
    
    // Save invoice
    const { error } = await supabase
      .from('notas_saida')
      .insert([data]);
    
    if (error) throw error;
    
    return { isUpdate: false, data, clientName };
  },
  onSuccess: (result) => {
    if (!result.isUpdate) {
      import('../../lib/analytics').then(({ analytics }) => {
        analytics.saleCompleted({
          valor: result.data.valor_total,
          cliente: result.clientName,
          tipo: result.data.tipo || 'Venda',
        });
      });
    }
  },
});
```

## Testing Your Events

### Local Testing (Development Mode)

PostHog only initializes in production by default. To test locally:

1. **Temporary Enable in Dev** (for testing only):
   ```typescript
   // In src/lib/analytics.ts
   const isProduction = true; // Temporary - REVERT AFTER TESTING
   ```

2. **Test the Flow**:
   - Trigger your action (create animal, complete sale, etc.)
   - Open browser console
   - Look for PostHog network requests to `app.posthog.com`
   - Verify event payload

3. **Check PostHog Dashboard**:
   - Go to PostHog → Events
   - Filter by your event name
   - Verify properties are correct

4. **IMPORTANT**: Revert the change before committing!
   ```typescript
   const isProduction = import.meta.env.PROD; // Restore
   ```

### Production Testing

1. Deploy with `VITE_POSTHOG_KEY` set
2. Perform the action
3. Check PostHog dashboard (events appear within seconds)

## Event Naming Conventions

Follow these conventions for consistency:

- Use **snake_case** for event names: `animal_registered`, `sale_completed`
- Use **descriptive names**: `payment_received` (not just `payment`)
- Use **past tense**: `animal_registered` (not `register_animal`)
- Keep it **concise**: `sale_completed` (not `sale_invoice_creation_completed`)

## Property Naming Conventions

- Use **Portuguese** for property names (matches DB columns): `raca`, `peso`, `valor`
- Use **descriptive keys**: `metodo` (not just `m`)
- Keep **types consistent**: Numbers for amounts, strings for names
- Provide **defaults**: `|| 0`, `|| 'N/A'`

## Common Pitfalls

### 1. Tracking Before Save Completes
```typescript
// ❌ BAD
const handleSave = async () => {
  analytics.myEvent({ ... }); // Event fires even if save fails!
  await supabase.from('table').insert(data);
};

// ✅ GOOD
const saveMutation = useMutation({
  mutationFn: async (data) => {
    await supabase.from('table').insert(data);
  },
  onSuccess: () => {
    analytics.myEvent({ ... }); // Event only fires after success
  },
});
```

### 2. Blocking Import
```typescript
// ❌ BAD - Blocks main thread
import { analytics } from '@/lib/analytics';
analytics.myEvent({ ... });

// ✅ GOOD - Async, non-blocking
import('@/lib/analytics').then(({ analytics }) => {
  analytics.myEvent({ ... });
});
```

### 3. Missing Error Handling
```typescript
// ❌ BAD - What if data is undefined?
analytics.myEvent({
  value: data.value, // Could throw if data is null
});

// ✅ GOOD - Defensive
analytics.myEvent({
  value: data?.value || 0,
});
```

### 4. Tracking PII
```typescript
// ❌ BAD - Sensitive data
analytics.userLogin({
  email: user.email,      // PII
  password: user.password, // NEVER!
  cpf: user.cpf,          // PII
});

// ✅ GOOD - Non-sensitive
analytics.userLogin({
  userId: user.id,
  role: user.role,
  tenantId: user.tenantId,
});
```

## Questions?

- Check `src/lib/analytics.ts` for available events
- See `docs/TASK_24.1_POSTHOG_SETUP_SUMMARY.md` for setup details
- See `docs/TASK_24.2_BUSINESS_EVENT_TRACKING_COMPLETION.md` for implementation examples
- PostHog Docs: https://posthog.com/docs

## Quick Checklist

Before committing your event tracking code:

- [ ] Event defined in `analytics.ts` (or using existing event)
- [ ] Using dynamic import: `import('../../lib/analytics').then(...)`
- [ ] Tracking only on success
- [ ] Providing default values for missing data
- [ ] Not tracking sensitive/PII data
- [ ] Tested in production mode (or with temporary dev enable)
- [ ] Verified event appears in PostHog dashboard
- [ ] Reverted any temporary testing changes
- [ ] Added JSDoc comment to new analytics function

---

**Last Updated**: 2024-06-17  
**Related**: Task 24.2 - Business Event Tracking Implementation
