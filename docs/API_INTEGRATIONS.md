# API Integrations Guide - Tauze ERP v5.0

**Document Version:** 1.0  
**Created:** 2026-06-16  
**Last Updated:** 2026-06-16  
**Requirements:** 16.3

---

## Table of Contents

1. [Overview](#overview)
2. [Supabase Integration](#supabase-integration)
3. [Stripe Integration](#stripe-integration)
4. [Cepea Market Data Integration](#cepea-market-data-integration)
5. [Environment Configuration](#environment-configuration)
6. [Error Handling](#error-handling)
7. [Rate Limits & Quotas](#rate-limits--quotas)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Tauze ERP v5.0 integrates with three primary external services:

| Service      | Purpose                                  | Type       | Status     |
| ------------ | ---------------------------------------- | ---------- | ---------- |
| **Supabase** | Database, Auth, Storage, Realtime        | Backend    | ✅ Active  |
| **Stripe**   | Payment processing, Subscriptions        | Payments   | ⚠️ Partial |
| **Cepea**    | Agricultural market indicators (pricing) | Market Data| ✅ Active  |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  TAUZE ERP FRONTEND                         │
│                  (React + TypeScript)                       │
└───────────┬─────────────────┬─────────────────┬─────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Supabase   │  │    Stripe    │  │    Cepea     │
    │   Client     │  │    Client    │  │   Context    │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Supabase    │  │    Stripe    │  │   Cepea API  │
    │  (Cloud)     │  │  (Checkout)  │  │  (Scraped)   │
    │              │  │              │  │              │
    │ • PostgreSQL │  │ • Payments   │  │ • Boi Gordo  │
    │ • Auth       │  │ • Subs       │  │ • Milho      │
    │ • Storage    │  │ • Webhooks   │  │ • Bezerro    │
    │ • Realtime   │  │              │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Supabase Integration

### Overview

Supabase is the primary backend service providing PostgreSQL database, authentication, storage, and realtime subscriptions.

**Key Features Used:**
- PostgreSQL 14 with Row Level Security (RLS)
- JWT-based authentication with session management
- Realtime subscriptions for live data updates
- Storage API for file uploads (future use)
- Edge Functions (planned for backend logic)

### Authentication & Authorization

#### Configuration


**File:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Persist sessions in localStorage
    autoRefreshToken: true,       // Auto-refresh expired tokens
    detectSessionInUrl: true,     // Handle OAuth redirects
  },
});
```

**Required Environment Variables:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get credentials from:**
Supabase Dashboard → Settings → API → Project URL & anon public key

#### Authentication Methods

**1. Email/Password Login**

```typescript
// Implementation: src/contexts/AuthContext.tsx
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error };
};
```

**2. OAuth (Google)**

```typescript
const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { error };
};
```

**3. Multi-Factor Authentication (MFA)**

```typescript
// Check MFA level
const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
const mfaLevel = aalData.currentLevel; // 'aal1' (password) or 'aal2' (password + TOTP)
```

**4. Session Management**

```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User logged in
  } else if (event === 'SIGNED_OUT') {
    // User logged out
  }
});

// Sign out
await supabase.auth.signOut();
```

#### User Registration Flow

**Tenant-aware registration** creates a complete multi-tenant hierarchy:

```typescript
// Implementation: src/contexts/AuthContext.tsx
const registerTenant = async (payload: {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
}) => {
  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: { data: { full_name: payload.fullName } },
  });
  
  // 2. Create Tenant
  const { data: tenantData } = await supabase
    .from('tenants')
    .insert([{ nome: payload.companyName, status: 'ativo', plano: 'trial' }])
    .select()
    .single();
  
  // 3. Create Business Unit
  const { data: unidadeData } = await supabase
    .from('unidades')
    .insert([{ tenant_id: tenantData.id, nome: payload.companyName, tipo: 'Matriz' }])
    .select()
    .single();
  
  // 4. Create Default Farm
  const { data: fazendaData } = await supabase
    .from('fazendas')
    .insert([{ tenant_id: tenantData.id, unidade_id: unidadeData.id, nome: 'Fazenda Principal' }])
    .select()
    .single();
  
  // 5. Create User Profile
  await supabase.from('profiles').upsert([{
    id: authData.user.id,
    tenant_id: tenantData.id,
    role: 'ADMIN',
    full_name: payload.fullName,
    fazendas_permitidas: [fazendaData.id],
  }]);
};
```

### Database (PostgreSQL)

#### Data Models

**Core Tables:**
- `tenants` - Multi-tenant isolation root
- `profiles` - User profiles (extends auth.users)
- `unidades` - Business units/branches
- `fazendas` - Farms/locations
- `animais` - Livestock records
- `pesagens` - Weight measurements
- `contas_pagar` - Accounts payable
- `contas_receber` - Accounts receivable
- `pedidos_compra` - Purchase orders
- `pedidos_venda` - Sales orders
- `maquinas` - Fleet/machinery
- `abastecimentos` - Fuel records

**See:** `src/database/RLS_POLICIES_DOCUMENTATION.md` for complete table reference

#### Query Examples

**1. Simple SELECT**

```typescript
const { data, error } = await supabase
  .from('animais')
  .select('*')
  .eq('status', 'Ativo')
  .order('brinco', { ascending: true });
```

**2. SELECT with JOIN**

```typescript
const { data, error } = await supabase
  .from('animais')
  .select(`
    *,
    fazenda:fazendas(nome),
    lote:lotes(nome)
  `)
  .eq('tenant_id', tenantId);
```

**3. INSERT**

```typescript
const { data, error } = await supabase
  .from('animais')
  .insert([{
    tenant_id: tenantId,
    brinco: '123456',
    raca: 'Nelore',
    sexo: 'Macho',
    peso_atual: 350,
  }])
  .select()
  .single();
```

**4. UPDATE**

```typescript
const { error } = await supabase
  .from('animais')
  .update({ peso_atual: 380, data_ultima_pesagem: new Date() })
  .eq('id', animalId);
```

**5. DELETE**

```typescript
const { error } = await supabase
  .from('animais')
  .delete()
  .eq('id', animalId);
```

#### Row Level Security (RLS)


**All tenant-specific tables use RLS policies** to enforce data isolation:

```sql
-- Standard RLS policy pattern
CREATE POLICY "table_name_tenant"
ON public.table_name
FOR ALL
USING (tenant_id = auth_helpers.get_auth_tenant());
```

**How it works:**
1. User logs in → JWT token contains `user_id`
2. `auth_helpers.get_auth_tenant()` extracts `tenant_id` from user's profile
3. PostgreSQL automatically filters all queries: `WHERE tenant_id = {user_tenant_id}`
4. **Result:** Users can ONLY see/modify data belonging to their tenant

**Security guarantee:** RLS is enforced at the database level and **cannot be bypassed** by application code, even with direct SQL access.

**See:** `src/database/RLS_POLICIES_DOCUMENTATION.md` for detailed policy reference

#### Query Performance Monitoring

The system includes automatic slow query detection:

```typescript
// src/lib/supabase.ts - monitoredQuery wrapper
import { monitoredQuery } from '@/lib/supabase';

const animals = await monitoredQuery(
  () => supabase.from('animais').select('*').eq('tenant_id', tenantId),
  'fetch-animals'
);

// Automatically:
// - Tracks query duration
// - Logs warnings for queries >1s
// - Sends metrics to analytics (production)
```

**Performance thresholds:**
- ⚠️ Warning: >500ms (development)
- 🚨 Alert: >1000ms (production)

### Realtime Subscriptions

Subscribe to database changes in realtime:

```typescript
// Implementation: src/contexts/CepeaContext.tsx
const channel = supabase
  .channel('market-quotes-changes')
  .on(
    'postgres_changes',
    {
      event: '*',                          // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'market_quotes',
      filter: `indicator=eq.boi_gordo_cepea`,
    },
    (payload) => {
      console.log('Market quote updated:', payload.new);
      // Update local state
    }
  )
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```


**Use cases:**
- Live market price updates
- Real-time inventory changes
- Multi-user collaboration

### Storage (Future Use)

Supabase Storage is configured but not yet actively used in the codebase.

**Planned use cases:**
- Animal photos
- Invoice PDFs
- Digital certificates

**Example implementation:**

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('animal-photos')
  .upload(`${tenantId}/${animalId}/photo.jpg`, file, {
    cacheControl: '3600',
    upsert: false,
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('animal-photos')
  .getPublicUrl(`${tenantId}/${animalId}/photo.jpg`);

// Download file
const { data, error } = await supabase.storage
  .from('animal-photos')
  .download(`${tenantId}/${animalId}/photo.jpg`);
```

### Error Handling

**Common Supabase errors:**


```typescript
// PGRST116 - No rows found (not an error in some cases)
if (error && error.code !== 'PGRST116') {
  console.error('Database error:', error);
}

// Authentication errors
if (error?.message.includes('refresh_token_not_found')) {
  await supabase.auth.signOut(); // Force re-login
}

// RLS policy violation (403)
if (error?.message.includes('new row violates row-level security')) {
  console.error('Tenant isolation violation');
}
```

**Best practices:**
1. Always check for `error` in responses
2. Log errors to Sentry (see `src/lib/sentry.ts`)
3. Show user-friendly messages
4. Don't expose internal error details to users

---

## Stripe Integration

### Overview

Stripe handles subscription billing and payment processing for the SaaS platform.

**Status:** ⚠️ Partially implemented (mock functions)

**Planned features:**
- Subscription checkout
- Metered billing (per user/animal)
- Webhook processing
- Invoice management


### Configuration

**File:** `src/lib/stripe.ts`

**Required Environment Variables:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Test mode
# or
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Production mode

# Backend only (not in frontend .env):
VITE_STRIPE_SECRET_KEY=sk_test_...       # For server-side operations
```

**Get credentials from:**
Stripe Dashboard → Developers → API keys

⚠️ **Security Note:** Secret keys should NEVER be exposed in frontend code. Use Supabase Edge Functions or a backend API.

### Checkout Session (Subscription)

**Current implementation (mock):**

```typescript
import { stripe } from '@/lib/stripe';

const { url } = await stripe.createCheckoutSession({
  tenantId: user.tenantId,
  planId: 'price_1234567890',  // Stripe Price ID
  email: user.email,
});

// Redirect to Stripe Checkout
window.location.href = url;
```


**Production implementation (requires backend):**

```typescript
// Frontend calls Supabase Edge Function
const { data, error } = await supabase.functions.invoke('create-checkout', {
  body: {
    tenantId: user.tenantId,
    planId: 'price_1234567890',
    email: user.email,
  },
});

// Edge Function calls Stripe API with secret key
// Returns checkout session URL
window.location.href = data.url;
```

**Checkout flow:**
1. User selects subscription plan
2. Frontend calls Edge Function
3. Edge Function creates Stripe Checkout Session
4. User redirected to Stripe hosted checkout
5. After payment, user redirected back to app
6. Webhook confirms payment → activate subscription

### Metered Billing (Usage Reporting)

For plans with per-user or per-animal pricing:

```typescript
// Report usage (e.g., when new animal is added)
await stripe.reportUsage(subscriptionItemId, quantity);

// Example: Report 50 animals
await stripe.reportUsage('si_1234567890', 50);
```


**Usage is aggregated monthly and billed automatically.**

### Webhooks

Stripe sends webhook events for payment confirmations, failures, etc.

**Mock webhook handler:**

```typescript
// src/lib/stripe.ts
stripe.handleWebhook(event);
```

**Production webhook handler (Edge Function):**

```typescript
// Endpoint: https://your-project.supabase.co/functions/v1/stripe-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  
  switch (event.type) {
    case 'invoice.paid':
      // Update tenant status to 'ACTIVE'
      await updateTenantStatus(event.data.object.customer, 'ACTIVE');
      break;
      
    case 'invoice.payment_failed':
      // Lock tenant or send warning
      await updateTenantStatus(event.data.object.customer, 'OVERDUE');
      break;
      
    case 'customer.subscription.deleted':
      // Revoke access
      await updateTenantStatus(event.data.object.customer, 'SUSPENDED');
      break;
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

**Configure webhook endpoint:**
Stripe Dashboard → Developers → Webhooks → Add endpoint

**Required events:**
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Error Handling

```typescript
try {
  const { url } = await stripe.createCheckoutSession({ ... });
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card declined
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters
  } else {
    // Generic error
  }
}
```

---

## Cepea Market Data Integration

### Overview

Cepea (Centro de Estudos Avançados em Economia Aplicada) provides daily agricultural market indicators for Brazilian commodities.

**Data source:** Market quotes are scraped/imported into the `market_quotes` table

**Indicators tracked:**
- `boi_gordo_cepea` - Cattle (live weight)
- `milho_cepea` - Corn
- `bezerro_ms_cepea` - Calf (Mato Grosso do Sul)
- `bezerro_sp_cepea` - Calf (São Paulo)

### Configuration

**No external API keys required** - data is pre-imported into Supabase

**File:** `src/contexts/CepeaContext.tsx`

### Data Models

**Table:** `market_quotes`

```typescript
interface MarketQuote {
  id: uuid;
  indicator: string;      // e.g., 'boi_gordo_cepea'
  value: number;          // e.g., 348.30
  date: string;           // ISO date: '2026-05-27'
  created_at: timestamp;
}
```

**Context API:** `CepeaLiveData`

```typescript
interface CepeaLiveData {
  valor: string;       // Formatted: "348,30"
  valorNum: number;    // Numeric: 348.30
  data: string;        // Formatted: "27/05/2026"
  isoDate: string;     // ISO: "2026-05-27"
  capturedAt: Date;
}
```

### Usage Examples

**1. Using Context (Realtime Updates)**

```typescript
import { useCepea } from '@/contexts/CepeaContext';

function MarketDashboard() {
  const { live, loading } = useCepea();
  
  if (loading) return <LoadingSkeleton />;
  
  return (
    <div>
      <h2>Boi Gordo Cepea</h2>
      <p>R$ {live?.valor} / @</p>
      <p>Última atualização: {live?.data}</p>
    </div>
  );
}
```


**2. Using React Query Hooks**

```typescript
import { useBoiGordoCepea, useMilhoCepea } from '@/hooks/useMarketData';

function PriceComparison() {
  const { data: boiGordo } = useBoiGordoCepea();
  const { data: milho } = useMilhoCepea();
  
  return (
    <div>
      <p>Boi Gordo: R$ {boiGordo?.value}</p>
      <p>Milho: R$ {milho?.value}</p>
    </div>
  );
}
```

**3. Historical Data**

```typescript
import { useHistoricalMarketQuotes } from '@/hooks/useMarketData';

function PriceChart() {
  const { data: history } = useHistoricalMarketQuotes(
    'boi_gordo_cepea',
    '2026-01-01',  // Start date
    '2026-06-01',  // End date
    true           // Ascending order
  );
  
  return <LineChart data={history} />;
}
```

**4. Direct Query**

```typescript
const { data, error } = await supabase
  .from('market_quotes')
  .select('*')
  .eq('indicator', 'boi_gordo_cepea')
  .order('date', { ascending: false })
  .limit(30);  // Last 30 days
```

### Realtime Updates

The `CepeaProvider` subscribes to database changes:

```typescript
// src/contexts/CepeaContext.tsx
useEffect(() => {
  const channel = supabase
    .channel('market-quotes-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'market_quotes',
      filter: `indicator=eq.boi_gordo_cepea`,
    }, (payload) => {
      // Update live state with new value
      setLive(/* ... */);
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);
```

**When a new market quote is inserted, all connected clients update automatically.**

### Caching Strategy

Market data changes infrequently (daily), so React Query uses extended cache times:

```typescript
// src/hooks/useMarketData.ts
useQuery({
  queryKey: ['market', 'latest', indicator],
  queryFn: () => fetchLatestQuote(indicator),
  staleTime: 1000 * 60 * 60, // 1 hour (Requirement 20.5)
});
```

**Benefits:**
- Reduces database load
- Faster page loads (cached data)
- Lower Supabase API usage

### Data Import

Market quotes are imported via backend scripts or Edge Functions:

```typescript
// Example import script
const newQuote = {
  indicator: 'boi_gordo_cepea',
  value: 348.30,
  date: '2026-05-27',
};

const { error } = await supabase
  .from('market_quotes')
  .insert([newQuote]);
```

**Import frequency:** Daily (automated via cron job or Edge Function)

---

## Environment Configuration

### Required Variables

```env
# REQUIRED - Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OPTIONAL - Stripe (for billing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OPTIONAL - Monitoring
VITE_SENTRY_DSN=https://...
VITE_POSTHOG_KEY=phc_...
```

### Validation

Environment variables are validated at startup:

```typescript
// src/lib/validateEnv.ts
export function validateEnv(): void {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables:\n${missing.join('\n')}`);
  }
  
  // URL validation
  try {
    new URL(import.meta.env.VITE_SUPABASE_URL);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid URL');
  }
}
```

**Called in:** `src/main.tsx` before app initialization

### Security Best Practices

1. **Never commit `.env` to Git** - already in `.gitignore`
2. **Use `.env.example` as template** - safe to commit
3. **Rotate keys if exposed** - see `CREDENTIAL_ROTATION_CHECKLIST.md`
4. **Use separate keys per environment** - test vs production
5. **Store secrets in CI/CD securely** - GitHub Secrets, Vercel Environment Variables

---

## Error Handling

### General Pattern

All API integrations should follow this error handling pattern:

```typescript
try {
  const { data, error } = await apiCall();
  
  if (error) {
    // Log to Sentry
    import { captureException } from '@/lib/sentry';
    captureException(error, {
      tags: { integration: 'supabase' },
      extra: { context: 'fetch-animals' },
    });
    
    // Show user-friendly message
    toast.error('Não foi possível carregar os dados. Tente novamente.');
    return;
  }
  
  // Success
  return data;
} catch (error) {
  console.error('Unexpected error:', error);
  toast.error('Erro inesperado. Entre em contato com o suporte.');
}
```

### Network Errors

```typescript
// Detect network errors
if (error?.message?.includes('Failed to fetch')) {
  toast.error('Sem conexão com a internet. Verifique sua rede.');
  // Queue operation for offline sync
}
```

### Retry Logic

For transient failures:

```typescript
import { retry } from '@/utils/resilience';

const data = await retry(
  () => supabase.from('animais').select('*'),
  {
    maxAttempts: 3,
    delay: 1000,        // 1s initial delay
    backoff: 2,         // Exponential backoff: 1s, 2s, 4s
  }
);
```

---

## Rate Limits & Quotas

### Supabase

**Free Plan:**
- Database: 500 MB storage
- Auth: Unlimited users
- Storage: 1 GB
- API requests: 500,000 / month
- Realtime connections: 200 concurrent

**Pro Plan ($25/month):**
- Database: 8 GB storage
- API requests: 5,000,000 / month
- Realtime connections: 500 concurrent

**Rate limits:**
- Auth: 30 requests/second per IP
- Database: No hard limit (scales with plan)
