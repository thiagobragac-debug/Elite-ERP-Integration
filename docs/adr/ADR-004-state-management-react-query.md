# ADR-004: State Management with React Query

**Status**: Accepted  
**Date**: 2024  
**Decision Makers**: Frontend Team  
**Related Requirements**: Requirement 20 (React Query Optimization), Requirement 9 (PWA Offline Sync)

## Context

Tauze ERP needed a state management solution to handle:

- **Server State**: Data fetched from Supabase (animals, payments, inventory)
- **Client State**: UI state (modals, filters, form inputs)
- **Caching**: Avoid redundant API calls for frequently accessed data
- **Optimistic Updates**: Show instant feedback for user actions
- **Offline Support**: Queue mutations when network is unavailable
- **Real-time Sync**: Invalidate cache when data changes on server

Traditional state management (Redux, Zustand, Context API) focuses on client state but doesn't address server state caching, synchronization, and error handling.

Key challenges:
- Agricultural users in rural areas have unreliable internet
- Dashboard loads 10+ data queries simultaneously
- Forms need optimistic updates for perceived performance
- Cache invalidation must be smart to avoid stale data

## Decision

We chose **React Query (TanStack Query v5)** as our primary state management solution for server state, with Context API for minimal client-only state (theme, auth session).

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Component Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Dashboard   │  │  AnimalList  │  │  PaymentForm │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            ▼                            │
│                   ┌────────────────┐                    │
│                   │  React Query   │                    │
│                   │  (useQuery,    │                    │
│                   │   useMutation) │                    │
│                   └────────┬───────┘                    │
└────────────────────────────┼────────────────────────────┘
                             ▼
                    ┌────────────────┐
                    │  Query Cache   │
                    │  (5min stale,  │
                    │   30min gc)    │
                    └────────┬───────┘
                             ▼
                    ┌────────────────┐
                    │  Supabase SDK  │
                    │  (REST API)    │
                    └────────────────┘
```

### Configuration

```typescript
// src/contexts/QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes (Requirement 20.1)
      gcTime: 30 * 60 * 1000,         // 30 minutes (Requirement 20.2)
      retry: 1,                        // 1 retry instead of 3 (Requirement 20.4)
      refetchOnWindowFocus: import.meta.env.DEV, // Disabled in prod (Requirement 20.3)
      networkMode: 'offlineFirst',     // Support offline scenarios
    },
    mutations: {
      retry: 0,                        // No automatic retries for mutations
      networkMode: 'offlineFirst',
    },
  },
});
```

### Usage Patterns

**1. Data Fetching**

```typescript
// src/hooks/useAnimals.ts
export function useAnimals(filters: AnimalFilters) {
  return useQuery({
    queryKey: ['animals', filters],
    queryFn: () => fetchAnimals(filters),
    staleTime: 5 * 60 * 1000, // Use default
  });
}
```

**2. Mutations with Optimistic Updates**

```typescript
// src/hooks/useUpdateAnimalWeight.ts
export function useUpdateAnimalWeight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; weight: number }) => 
      supabase.from('animais').update({ peso_atual: data.weight }).eq('id', data.id),
    
    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['animals'] });
      const previous = queryClient.getQueryData(['animals']);
      
      queryClient.setQueryData(['animals'], (old: Animal[]) =>
        old.map(animal => 
          animal.id === newData.id 
            ? { ...animal, peso_atual: newData.weight }
            : animal
        )
      );
      
      return { previous };
    },
    
    // Rollback on error
    onError: (err, newData, context) => {
      queryClient.setQueryData(['animals'], context?.previous);
    },
    
    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });
}
```

**3. Market Data (Longer Stale Time)**

```typescript
// src/hooks/useCepeaIndicators.ts
export function useCepeaIndicators(indicator: string) {
  return useQuery({
    queryKey: ['market', 'cepea', indicator],
    queryFn: () => fetchCepeaData(indicator),
    staleTime: 60 * 60 * 1000, // 1 hour (Requirement 20.5)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}
```

## Consequences

### Benefits

✅ **Automatic Caching**: Eliminates redundant API calls; 5-minute stale time prevents over-fetching  
✅ **Offline Support**: `networkMode: 'offlineFirst'` + IndexedDB for offline queue  
✅ **Optimistic Updates**: Instant UI feedback before server confirms  
✅ **Background Sync**: Auto-refetches stale data when user returns  
✅ **DevTools**: React Query DevTools for debugging cache state  
✅ **TypeScript Support**: Excellent type inference for queries and mutations  
✅ **Loading & Error States**: Built-in `isLoading`, `isError`, `error` handling  
✅ **Parallel Queries**: Dashboard can fire 10+ queries without blocking  

### Drawbacks

⚠️ **Learning Curve**: Query keys and cache invalidation require understanding  
⚠️ **Bundle Size**: React Query adds ~15KB gzipped (acceptable trade-off)  
⚠️ **Cache Complexity**: Invalidation logic can become complex for nested data  
⚠️ **DevTools Overhead**: React Query DevTools must be disabled in production  

### Trade-offs

- **Simplicity vs Power**: More complex than Context API but handles server state elegantly
- **Cache Size vs Performance**: 30-minute cache can grow large; must set gcTime appropriately
- **Refetch Frequency vs Freshness**: 5-minute stale time is a balance; adjust per use case

## Alternatives Considered

### 1. Redux + RTK Query

**Pros**: Industry standard, powerful DevTools, Redux ecosystem  
**Cons**: Boilerplate-heavy, steeper learning curve, overkill for our use case  
**Rejected**: React Query is simpler for server state; Redux best for complex client state

### 2. SWR (Vercel)

**Pros**: Lightweight, similar API to React Query, good TypeScript support  
**Cons**: Less feature-rich (no mutation helpers), smaller ecosystem  
**Rejected**: React Query has better offline support and mutation handling

### 3. Apollo Client (GraphQL)

**Pros**: Powerful caching, normalized store, GraphQL-first  
**Cons**: Supabase uses REST; GraphQL adds complexity and bundle size  
**Rejected**: REST APIs are simpler; don't need GraphQL benefits

### 4. Context API + useEffect

**Pros**: No extra dependencies, simple for small apps  
**Cons**: Manual cache management, no optimistic updates, re-renders entire tree  
**Rejected**: Doesn't scale; causes performance issues with many data sources

## Performance Impact

### Bundle Size
- React Query core: ~15KB gzipped
- DevTools (dev only): ~40KB gzipped
- Total impact: Minimal for the value provided

### API Calls Reduction
Before React Query (naive implementation):
- Dashboard: 10 API calls per visit (no caching)
- Navigating away and back: Another 10 calls

After React Query:
- First visit: 10 API calls
- Subsequent visits within 5min: 0 API calls (served from cache)
- **Result**: ~70% reduction in API calls for typical user session

### User Experience
- **Instant navigation**: Cached data loads in <50ms
- **Optimistic updates**: Forms feel instant (no spinner)
- **Offline tolerance**: Queue mutations, sync when online

## Client State Management

React Query handles **server state only**. For client-only state:

```typescript
// src/contexts/ThemeContext.tsx - Simple client state with Context API
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

Avoid using React Query for pure client state (theme, modal open/closed, form drafts).

## Cache Invalidation Strategy

### Automatic Invalidation
React Query automatically invalidates queries after mutations:

```typescript
useMutation({
  mutationFn: createAnimal,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['animals'] });
  },
});
```

### Manual Invalidation
For related data:

```typescript
// After creating a payment, invalidate accounts summary
queryClient.invalidateQueries({ queryKey: ['accounts', 'summary'] });
queryClient.invalidateQueries({ queryKey: ['accounts', 'payable'] });
```

### Partial Updates
For fine-grained control:

```typescript
queryClient.setQueryData(['animal', id], (old: Animal) => ({
  ...old,
  peso_atual: newWeight,
}));
```

## Testing Strategy

React Query integrates seamlessly with React Testing Library:

```typescript
// test-utils/render.tsx
const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderWithQuery(ui: ReactElement) {
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

## Related Decisions

- **ADR-003**: Supabase Backend (React Query fetches from Supabase APIs)
- **ADR-007**: Offline-First PWA (React Query's networkMode supports offline)
- **ADR-002**: React + TypeScript (React Query has excellent TS support)

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- Requirement 20: React Query Optimization (requirements.md)
- Configuration: `src/contexts/QueryProvider.tsx`
