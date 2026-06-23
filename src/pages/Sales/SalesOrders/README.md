# SalesOrders Module - Refactored

## Overview

This module manages sales orders (pedidos de venda) with complete CRUD operations, kanban board view, and advanced filtering capabilities.

## Structure

```
SalesOrders/
├── index.tsx              # Main orchestrator component
├── types.ts               # TypeScript type definitions
├── useSalesData.ts        # Data fetching hook
├── useSalesMutations.ts   # CRUD operations hook
├── useFilters.ts          # Filter and search state management
├── OrdersTable.tsx        # Table view component
├── OrdersKanban.tsx       # Kanban board view component
├── FilterControls.tsx     # Search, tabs, and filter controls
└── README.md              # This file
```

## Components

### Main Component (index.tsx)

Orchestrates all child components and manages:

- Modal states (form, history, filters)
- View mode (list/kanban)
- Logistics audit toggle
- Event handlers for CRUD operations

### OrdersTable.tsx

Renders sales orders in a table format with:

- Sortable columns
- Action buttons (view, edit, delete)
- Risk indicators
- Missing documents warnings

### OrdersKanban.tsx

Renders sales orders in a kanban board with columns for:

- Pending orders
- Delivered orders
- Canceled orders
- Drag-and-drop status updates

### FilterControls.tsx

Provides UI controls for:

- Tab switching (Active/Closed)
- Search input
- View mode toggle (list/kanban)
- Advanced filters toggle
- Export dropdown (CSV, Excel, PDF)

## Custom Hooks

### useSalesData

Fetches and processes sales orders data including:

- Filtering by tab, search term, and advanced filters
- Computing margin, risk indicators
- Loading partner names
- Generating statistics and sparklines

**Returns:**

- `orders`: Filtered and processed sales orders
- `stats`: KPI statistics array
- `loading`: Loading state
- `error`: Error object if query fails

### useSalesMutations

Handles all mutation operations:

- `saveMutation`: Create or update sales orders
- `deleteMutation`: Delete sales orders
- `updateStatusMutation`: Change order status

**Parameters:**

- `selectedOrder`: Current order being edited (null for create)
- `onSaveSuccess`: Callback after successful save

### useFilters

Manages filter and search state:

- URL-synced active tab
- Search term state
- Advanced filters visibility
- Filter values (status, dates, margin, risk)

**Returns:**

- `activeTab`: Current tab ('OPEN' | 'CLOSED')
- `searchTerm`: Current search value
- `filterValues`: Advanced filter values
- `handleTabChange`: Tab change handler

## Types

### SalesOrder

Main data type for sales orders with computed fields:

- `margin`: Calculated profit margin
- `isHighRisk`: Flag for high-value orders
- `clientRating`: Partner risk rating

### SalesOrderFormData

Form submission data structure

### SalesFilterValues

Advanced filter configuration

## Usage Example

```tsx
import { SalesOrders } from './pages/Sales/SalesOrders';

function App() {
  return <SalesOrders />;
}
```

## Key Features

1. **Dual View Modes**: Switch between table and kanban views
2. **Real-time Search**: Debounced search across order numbers and partners
3. **Advanced Filters**: Filter by status, dates, margin, risk
4. **Status Management**: Quick status updates (pending → delivered → canceled)
5. **Export**: Export filtered data to CSV, Excel, or PDF
6. **History Tracking**: View order change history
7. **Logistics Audit**: Toggle audit mode for missing documents

## Performance Optimizations

- Debounced search (500ms)
- React Query caching
- Memoized statistics calculations
- Lazy loading of partner names
- Optimistic UI updates for status changes

## Related Components

- `SalesOrderForm` (src/components/Forms/SalesOrderForm.tsx)
- `SalesFilterModal` (src/pages/Sales/components/SalesFilterModal.tsx)
- `HistoryModal` (src/components/Modals/HistoryModal.tsx)
- `ModernTable` (src/components/DataTable/ModernTable.tsx)

## Requirements

This refactoring addresses:

- **Requirement 6.1**: Extract order table component ✓
- **Requirement 6.2**: Extract order form and modal components ✓
- **Requirement 6.3**: Extract hooks for CRUD operations ✓
- **Requirement 6.4**: Create types for sales orders ✓
- **Requirement 6.5**: Improve component testability ✓
