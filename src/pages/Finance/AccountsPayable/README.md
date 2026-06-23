# AccountsPayable Module

Refactored modular structure for improved maintainability and testability.

## Directory Structure

```
AccountsPayable/
├── index.tsx              # Main orchestrator component
├── types.ts              # Shared TypeScript interfaces
├── AccountsTable.tsx     # Table display component
├── FilterPanel.tsx       # Tab navigation & filters
├── PaymentModal.tsx      # Payment & history modals
├── AccountForm.tsx       # Create/edit form wrapper
├── useAccountsData.ts    # Data fetching hook
├── usePaymentMutation.ts # CRUD operations hook
├── useFilters.ts         # Filter state management hook
├── __tests__/            # Component tests
│   └── AccountsPayable.test.tsx
└── README.md             # This file
```

## Components

### Main Module (`index.tsx`)

- Orchestrates all child components
- Manages modal states and URL deep linking
- Handles export functionality
- Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

### AccountsTable

- Displays accounts payable in a data table
- Handles row selection and actions
- Shows due date status badges
- Responsive column layout

### FilterPanel

- Tab navigation (Todas/Pendente/Pago)
- Search input with debouncing
- Export dropdown (CSV/Excel/PDF)
- Advanced filter modal toggle

### PaymentModal

- Batch liquidation modal
- History/dossier modal
- Floating batch action bar with selection count

### AccountForm

- Wraps TransactionForm for consistent UX
- Handles create/edit operations
- Form validation and submission

## Custom Hooks

### useAccountsData

- Fetches and manages accounts data
- Implements pagination
- Debounced search
- Filter integration

### usePaymentMutation

- Create/update/delete mutations
- Error handling with toast notifications
- Approval queue integration
- Query cache invalidation

### useFilters

- Filter state management
- Persistent state for advanced filters
- Tab switching with page reset

## Types

All shared interfaces are defined in `types.ts`:

- `Account` - Account payable data structure
- `AccountFormData` - Form submission data
- `FilterValues` - Filter state shape
- `HistoryItem` - History modal items
- `TabType` - Tab options

## Backward Compatibility

The parent `AccountsPayable.tsx` file now re-exports from this module,
ensuring existing imports continue to work.

## Testing

Integration tests verify:

- Component rendering
- Tab filtering
- Search functionality
- Advanced filters modal
- Modular exports

Run tests:

```bash
npm test -- AccountsPayable
```

## Benefits

✅ **Maintainability**: Components <150 lines each  
✅ **Testability**: Isolated hooks and components  
✅ **Reusability**: Extracted hooks can be shared  
✅ **Type Safety**: Centralized type definitions  
✅ **Performance**: Lazy-loadable components
