# AccountsReceivable Module

## Overview

This module manages accounts receivable functionality with a clean, modular architecture. Components are extracted into smaller, focused modules for better maintainability and testability.

## Structure

```
AccountsReceivable/
├── index.tsx                      # Main orchestrator component
├── types.ts                       # Shared TypeScript types
├── useReceivablesData.ts         # Data fetching hook
├── useReceivableMutation.ts      # Mutation hook (create, update, delete)
├── useFilters.ts                 # Filter state management hook
├── ReceivablesTable.tsx          # Table display component
├── FilterPanel.tsx               # Search and filter UI
├── LiquidationModal.tsx          # Batch liquidation and history modals
├── ReceivableForm.tsx            # Form wrapper component
└── README.md                     # This file
```

## Components

### index.tsx

Main orchestrator component that:

- Manages overall state and modal visibility
- Coordinates all sub-components
- Handles export logic
- Manages URL deep linking

### ReceivablesTable.tsx

Displays the receivables data in a table format with:

- Custom column rendering
- Action buttons (mark as received, view details, edit, delete)
- Selection management
- Empty state handling

### FilterPanel.tsx

Provides filtering and search capabilities:

- Tab navigation (All, Pending, Received)
- Search input
- Advanced filters toggle
- Export dropdown

### LiquidationModal.tsx

Handles receivable liquidation:

- Batch liquidation modal
- History/details modal
- Floating action bar for batch operations

### ReceivableForm.tsx

Wraps the TransactionForm for receivable-specific operations

## Custom Hooks

### useReceivablesData

Fetches and manages receivable data:

- Pagination
- Filtering
- Search with debouncing
- Server-side data management

### useReceivableMutation

Handles all mutations:

- Create new receivable
- Update existing receivable
- Delete receivable
- Success/error handling with toast notifications

### useFilters

Manages filter state:

- URL synchronization for tabs
- Search term state
- Advanced filter values
- Filter visibility toggle

## Types

All TypeScript types are centralized in `types.ts`:

- `Receivable`: Main receivable entity
- `ReceivableFormData`: Form submission data
- `FilterValues`: Filter state
- `HistoryItem`: History modal items
- `TabType`: Tab navigation types

## Usage

```typescript
import { AccountsReceivable } from './pages/Finance/AccountsReceivable';

// Use in router
<Route path="/financeiro/contas-receber" element={<AccountsReceivable />} />
```

## Key Features

1. **Modular Architecture**: Each concern is separated into its own file
2. **Custom Hooks**: Business logic extracted into reusable hooks
3. **Type Safety**: Full TypeScript coverage with shared types
4. **Persistent State**: Modal states persist across page refreshes
5. **URL Deep Linking**: Direct navigation to specific receivables via URL params
6. **Export Functionality**: CSV, Excel, and PDF export support
7. **Batch Operations**: Select and liquidate multiple receivables at once
8. **Advanced Filtering**: Multiple filter criteria with date ranges
9. **Real-time Stats**: KPI cards with trends and sparklines

## Dependencies

- React Query for data fetching
- React Router for navigation
- Framer Motion for animations
- Lucide React for icons
- React Hot Toast for notifications

## Related Files

- `../AccountsReceivable.css`: Styling (shared with original component)
- `../components/ReceivableFilterModal.tsx`: Advanced filter modal
- `../../components/Forms/TransactionForm.tsx`: Reusable transaction form
- `../../components/Modals/BatchLiquidationModal.tsx`: Batch liquidation UI
- `../../components/Modals/HistoryModal.tsx`: Transaction history display
