# React Query Cache Optimization

## Overview

This document describes the React Query cache optimization strategy implemented for the Tauze ERP system, specifically focusing on configuring longer staleTime for infrequent data (Requirement 20, AC5).

## Configuration

### Default Settings (All Queries)

Located in: `src/contexts/QueryProvider.tsx`

- **staleTime**: 5 minutes (300,000 ms) - prevents unnecessary refetches for most queries
- **gcTime** (cacheTime): 30 minutes (1,800,000 ms) - keeps data in memory for quick access
- **retry**: 1 attempt - faster error feedback instead of default 3 retries
- **refetchOnWindowFocus**: disabled in production, enabled in development

### Market Data (Cepea) Settings

Market indicators from Cepea update infrequently (typically daily), so they use longer cache times:

- **staleTime**: 1 hour (3,600,000 ms)
- This prevents unnecessary refetches of data that doesn't change frequently

## Implementation

### Market Data Hooks

Custom hooks have been created in `src/hooks/useMarketData.ts` to handle Cepea market data queries with optimized caching:

#### Available Hooks

1. **`useLatestMarketQuote(indicator, enabled?)`**
   - Fetches the latest quote for a specific market indicator
   - Returns a single market quote object
   - Example: `useLatestMarketQuote('boi_gordo_cepea')`

2. **`useLatestMarketQuotes(limit?, enabled?)`**
   - Fetches multiple latest market quotes
   - Returns an array of market quotes
   - Example: `useLatestMarketQuotes(20)`

3. **`useHistoricalMarketQuotes(indicator, startDate?, endDate?, ascending?, enabled?)`**
   - Fetches historical market data with pagination
   - Returns an array of historical quotes
   - Example: `useHistoricalMarketQuotes('boi_gordo_cepea', '2024-01-01', '2024-12-31')`

4. **`useBoiGordoCepea(enabled?)`**
   - Specialized hook for Boi Gordo Cepea indicator
   - Shorthand for `useLatestMarketQuote('boi_gordo_cepea')`

5. **`useMilhoCepea(enabled?)`**
   - Specialized hook for Milho Cepea indicator
   - Shorthand for `useLatestMarketQuote('milho_cepea')`

6. **`useBezerroMSCepea(enabled?)`**
   - Specialized hook for Bezerro MS Cepea indicator

7. **`useBezerroSPCepea(enabled?)`**
   - Specialized hook for Bezerro SP Cepea indicator

### Usage Examples

#### Basic Usage

```typescript
import { useBoiGordoCepea } from '@/hooks/useMarketData';

function MyComponent() {
  const { data, isLoading, error } = useBoiGordoCepea();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading market data</div>;

  return <div>Boi Gordo: R$ {data?.value}</div>;
}
```

#### Multiple Indicators

```typescript
import { useLatestMarketQuotes } from '@/hooks/useMarketData';

function MarketDashboard() {
  const { data: quotes } = useLatestMarketQuotes(20);

  return (
    <div>
      {quotes?.map((quote) => (
        <div key={quote.indicator}>
          {quote.indicator}: R$ {quote.value}
        </div>
      ))}
    </div>
  );
}
```

#### Historical Data

```typescript
import { useHistoricalMarketQuotes } from '@/hooks/useMarketData';

function MarketChart() {
  const { data: history } = useHistoricalMarketQuotes(
    'boi_gordo_cepea',
    '2024-01-01',
    '2024-12-31'
  );

  return <Chart data={history} />;
}
```

## Updated Components

The following components have been updated to use the new market data hooks:

1. **`src/pages/Sales/SalesDashboard.tsx`**
   - Separated Cepea data fetching from sales data
   - Now uses `useLatestMarketQuotes(20)` for market data
   - Market data has 1 hour staleTime, sales data has 5 minute staleTime

2. **`src/pages/Market/MarketB3Calculator.tsx`**
   - Now uses `useBoiGordoCepea()` for physical price data
   - Boi Gordo data has 1 hour staleTime

## Benefits

1. **Reduced Network Traffic**: Market data that changes infrequently isn't refetched unnecessarily
2. **Improved Performance**: Less frequent API calls mean faster page loads
3. **Better UX**: Users don't see loading states as often for unchanged data
4. **Maintainability**: Centralized market data queries with consistent configuration
5. **Type Safety**: All hooks are fully typed with TypeScript

## Testing

Unit tests for the market data hooks are located in `src/hooks/useMarketData.test.ts`.

Run tests with:
```bash
npm test -- useMarketData.test.ts --run
```

## React Query DevTools

In development mode, the React Query DevTools are available to inspect query states:

- Press the React Query DevTools button (bottom-right corner)
- Search for queries with key prefix: `['market', ...]`
- Check `staleTime` values to verify 1 hour configuration

## Future Improvements

Consider implementing:

1. **Background refresh**: Use `refetchInterval` for automatic updates during business hours
2. **Optimistic updates**: When data changes are predictable
3. **Query prefetching**: Preload market data on navigation to market pages
4. **Infinite queries**: For very large historical datasets

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- Requirements Document: `specs/system-improvements/requirements.md` (R20 AC5)
- Design Document: `specs/system-improvements/design.md`
