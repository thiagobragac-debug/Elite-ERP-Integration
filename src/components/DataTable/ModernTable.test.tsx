import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ModernTable } from './ModernTable';
import { Download, Edit, Trash } from 'lucide-react';

describe('ModernTable Integration Tests', () => {
  const mockData = [
    { id: '1', name: 'Alice', age: 30, status: 'Active', email: 'alice@example.com' },
    { id: '2', name: 'Bob', age: 25, status: 'Inactive', email: 'bob@example.com' },
    { id: '3', name: 'Charlie', age: 35, status: 'Active', email: 'charlie@example.com' },
    { id: '4', name: 'Diana', age: 28, status: 'Active', email: 'diana@example.com' },
    { id: '5', name: 'Eve', age: 32, status: 'Inactive', email: 'eve@example.com' },
  ];

  const columns = [
    { header: 'Name', accessor: 'name' as const, width: '150px' },
    { header: 'Age', accessor: 'age' as const, align: 'center' as const },
    { header: 'Status', accessor: 'status' as const },
    { header: 'Email', accessor: 'email' as const },
  ];

  describe('Data Rendering', () => {
    it('renders table headers and rows correctly', () => {
      render(<ModernTable data={mockData} columns={columns} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('30,00')).toBeInTheDocument(); // Numbers are formatted
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('renders data with various types correctly', () => {
      const mixedData = [
        { id: '1', name: 'Test', count: 100, price: 1234.56, active: true },
        { id: '2', name: 'Test2', count: 0, price: 0, active: false },
      ];

      const mixedColumns = [
        { header: 'Name', accessor: 'name' as const },
        { header: 'Count', accessor: 'count' as const },
        { header: 'Price', accessor: 'price' as const },
        { header: 'Active', accessor: 'active' as const },
      ];

      render(<ModernTable data={mixedData} columns={mixedColumns} />);

      // Numbers are formatted with pt-BR locale
      expect(screen.getByText('100,00')).toBeInTheDocument();
      expect(screen.getByText('1.234,56')).toBeInTheDocument();
      // Use getAllByText for values that appear multiple times
      const zeroValues = screen.getAllByText('0,00');
      expect(zeroValues.length).toBe(2); // count and price columns
    });

    it('handles custom accessor functions', () => {
      const customColumns = [
        { header: 'Name', accessor: 'name' as const },
        {
          header: 'Full Info',
          accessor: (item: (typeof mockData)[0]) => `${item.name} (${item.age})`,
        },
      ];

      render(<ModernTable data={mockData} columns={customColumns} />);

      expect(screen.getByText('Alice (30)')).toBeInTheDocument();
      expect(screen.getByText('Bob (25)')).toBeInTheDocument();
    });

    it('renders with custom column alignment', () => {
      render(<ModernTable data={mockData} columns={columns} />);

      const ageHeader = screen.getByText('Age').closest('th');
      expect(ageHeader).toHaveClass('align-center');
    });
  });

  describe('Search and Filtering', () => {
    it('filters data based on search term', async () => {
      const user = userEvent.setup();
      render(<ModernTable data={mockData} columns={columns} hideHeader={false} />);

      const searchInput = screen.getByPlaceholderText('Buscar registros...');
      await user.type(searchInput, 'Alice');

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    });

    it('filters data case-insensitively', async () => {
      const user = userEvent.setup();
      render(<ModernTable data={mockData} columns={columns} hideHeader={false} />);

      const searchInput = screen.getByPlaceholderText('Buscar registros...');
      await user.type(searchInput, 'alice');

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('searches across all columns', async () => {
      const user = userEvent.setup();
      render(<ModernTable data={mockData} columns={columns} hideHeader={false} />);

      const searchInput = screen.getByPlaceholderText('Buscar registros...');

      // Search by email
      await user.clear(searchInput);
      await user.type(searchInput, 'bob@');
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();

      // Search by status
      await user.clear(searchInput);
      await user.type(searchInput, 'Inactive');
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Eve')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('resets to page 1 when search term changes', async () => {
      const user = userEvent.setup();
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: String(i + 1),
        name: `Person ${i + 1}`,
        age: 20 + i,
        status: 'Active',
        email: `person${i + 1}@example.com`,
      }));

      render(
        <ModernTable data={largeData} columns={columns} hideHeader={false} itemsPerPage={10} />
      );

      // Navigate to page 2
      const pageButton = screen.getByRole('button', { name: '2' });
      await user.click(pageButton);

      await waitFor(() => {
        expect(screen.getByText('Person 11')).toBeInTheDocument();
      });

      // Now search - should reset to page 1
      const searchInput = screen.getByPlaceholderText('Buscar registros...');
      await user.type(searchInput, 'Person 1');

      // Should show results from page 1
      await waitFor(() => {
        expect(screen.getByText('Person 1')).toBeInTheDocument();
        const paginationInfo = document.querySelector('.pagination-info');
        expect(paginationInfo).toHaveTextContent('1');
        expect(paginationInfo).toHaveTextContent('10');
      });
    });

    it('shows empty state when search returns no results', async () => {
      const user = userEvent.setup();
      render(<ModernTable data={mockData} columns={columns} hideHeader={false} />);

      const searchInput = screen.getByPlaceholderText('Buscar registros...');
      await user.type(searchInput, 'NonexistentName');

      expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
      expect(screen.getByText(/Tente ajustar seus filtros de busca/)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    const paginatedData = Array.from({ length: 35 }, (_, i) => ({
      id: String(i + 1),
      name: `Person ${i + 1}`,
      age: 20 + (i % 30),
      status: i % 2 === 0 ? 'Active' : 'Inactive',
      email: `person${i + 1}@example.com`,
    }));

    it('displays correct number of items per page', () => {
      render(<ModernTable data={paginatedData} columns={columns} itemsPerPage={10} />);

      const rows = screen.getAllByRole('row');
      // 1 header row + 10 data rows
      expect(rows.length).toBe(11);
    });

    it('shows correct pagination info', () => {
      render(<ModernTable data={paginatedData} columns={columns} itemsPerPage={10} />);

      expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
      // Check for pagination info - query by class name instead
      const paginationInfo = document.querySelector('.pagination-info');
      expect(paginationInfo).toHaveTextContent('1');
      expect(paginationInfo).toHaveTextContent('10');
      expect(paginationInfo).toHaveTextContent('35');
    });

    it('navigates to next page', async () => {
      const user = userEvent.setup();
      render(<ModernTable data={paginatedData} columns={columns} itemsPerPage={10} />);

      // Find the next button (ChevronRight icon) - last button in pagination controls
      const paginationControls = screen.getByText(/Mostrando/).nextElementSibling;
      const allButtons = paginationControls?.querySelectorAll('button');
      const nextButton = allButtons?.[allButtons.length - 1];

      expect(screen.getByText('Person 1')).toBeInTheDocument();

      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Person 11')).toBeInTheDocument();
      });

      // Check pagination info updated
      const paginationInfo = document.querySelector('.pagination-info');
      expect(paginationInfo).toHaveTextContent('11');
      expect(paginationInfo).toHaveTextContent('20');

      expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
    });

    it('navigates to previous page', async () => {
      const user = userEvent.setup();
      render(<ModernTable data={paginatedData} columns={columns} itemsPerPage={10} />);

      const paginationControls = screen.getByText(/Mostrando/).nextElementSibling;
      const allButtons = paginationControls?.querySelectorAll('button');
      const nextButton = allButtons?.[allButtons.length - 1];
      const prevButton = allButtons?.[0];

      // Go to page 2
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Person 11')).toBeInTheDocument();
      });

      // Go back to page 1
      if (prevButton) {
        await user.click(prevButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Person 1')).toBeInTheDocument();
      });

      expect(screen.queryByText('Person 11')).not.toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      render(<ModernTable data={paginatedData} columns={columns} itemsPerPage={10} />);

      const paginationControls = screen.getByText(/Mostrando/).nextElementSibling;
      const allButtons = paginationControls?.querySelectorAll('button');
      const prevButton = allButtons?.[0];

      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', async () => {
      const user = userEvent.setup();
      const smallData = mockData.slice(0, 3);

      render(<ModernTable data={smallData} columns={columns} itemsPerPage={10} />);

      const paginationControls = screen.getByText(/Mostrando/).nextElementSibling;
      const allButtons = paginationControls?.querySelectorAll('button');
      // Last button is the next (ChevronRight) button
      const nextButton = allButtons?.[allButtons.length - 1];

      expect(nextButton).toBeDisabled();
    });

    it('handles clicking on specific page number', async () => {
      const user = userEvent.setup();
      render(<ModernTable data={paginatedData} columns={columns} itemsPerPage={10} />);

      const pageButton = screen.getByRole('button', { name: '2' });
      await user.click(pageButton);

      await waitFor(() => {
        expect(screen.getByText('Person 11')).toBeInTheDocument();
      });
    });

    it('supports server-side pagination', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();

      render(
        <ModernTable
          data={mockData.slice(0, 10)}
          columns={columns}
          totalCount={35}
          currentPage={1}
          onPageChange={onPageChange}
          itemsPerPage={10}
        />
      );

      // Check for pagination info - query by class name instead
      const paginationInfo = document.querySelector('.pagination-info');
      expect(paginationInfo).toHaveTextContent('Mostrando');
      expect(paginationInfo).toHaveTextContent('1');
      expect(paginationInfo).toHaveTextContent('10');
      expect(paginationInfo).toHaveTextContent('35');

      const paginationControls = screen.getByText(/Mostrando/).nextElementSibling;
      const allButtons = paginationControls?.querySelectorAll('button');
      const nextButton = allButtons?.[allButtons.length - 1];

      if (nextButton) {
        await user.click(nextButton);
      }

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Row Selection', () => {
    it('renders checkboxes when selectable is true', () => {
      render(
        <ModernTable
          data={mockData}
          columns={columns}
          selectable={true}
          selectedItems={[]}
          onSelectionChange={vi.fn()}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // 1 header checkbox + 5 row checkboxes
      expect(checkboxes.length).toBe(6);
    });

    it('selects individual row', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <ModernTable
          data={mockData}
          columns={columns}
          selectable={true}
          selectedItems={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // Click second row checkbox (index 1, since 0 is header)
      await user.click(checkboxes[1]);

      expect(onSelectionChange).toHaveBeenCalledWith(['1']);
    });

    it('deselects individual row', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <ModernTable
          data={mockData}
          columns={columns}
          selectable={true}
          selectedItems={['1', '2']}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Deselect first row

      expect(onSelectionChange).toHaveBeenCalledWith(['2']);
    });

    it('selects all rows with header checkbox', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <ModernTable
          data={mockData}
          columns={columns}
          selectable={true}
          selectedItems={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Header checkbox

      expect(onSelectionChange).toHaveBeenCalledWith(['1', '2', '3', '4', '5']);
    });

    it('deselects all rows when all are selected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <ModernTable
          data={mockData}
          columns={columns}
          selectable={true}
          selectedItems={['1', '2', '3', '4', '5']}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Header checkbox

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('respects isSelectable function', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const isSelectable = (item: (typeof mockData)[0]) => item.status === 'Active';

      render(
        <ModernTable
          data={mockData}
          columns={columns}
          selectable={true}
          selectedItems={[]}
          isSelectable={isSelectable}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // Select all - should only select Active items
      await user.click(checkboxes[0]);

      expect(onSelectionChange).toHaveBeenCalledWith(['1', '3', '4']);
    });

    it('highlights selected rows', () => {
      render(
        <ModernTable
          data={mockData}
          columns={columns}
          selectable={true}
          selectedItems={['1', '3']}
          onSelectionChange={vi.fn()}
        />
      );

      const aliceRow = screen.getByText('Alice').closest('tr');
      const bobRow = screen.getByText('Bob').closest('tr');
      const charlieRow = screen.getByText('Charlie').closest('tr');

      expect(aliceRow).toHaveClass('selected');
      expect(bobRow).not.toHaveClass('selected');
      expect(charlieRow).toHaveClass('selected');
    });
  });

  describe('Row Actions and Callbacks', () => {
    it('calls onRowClick when row is clicked', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();

      render(<ModernTable data={mockData} columns={columns} onRowClick={onRowClick} />);

      const aliceRow = screen.getByText('Alice').closest('tr');
      if (aliceRow) {
        await user.click(aliceRow);
      }

      expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('adds clickable class when onRowClick is provided', () => {
      render(<ModernTable data={mockData} columns={columns} onRowClick={vi.fn()} />);

      const aliceRow = screen.getByText('Alice').closest('tr');
      expect(aliceRow).toHaveClass('clickable');
    });

    it('renders action buttons for each row', () => {
      const actions = (item: (typeof mockData)[0]) => (
        <>
          <button aria-label={`Edit ${item.name}`}>Edit</button>
          <button aria-label={`Delete ${item.name}`}>Delete</button>
        </>
      );

      render(<ModernTable data={mockData} columns={columns} actions={actions} />);

      expect(screen.getByLabelText('Edit Alice')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Alice')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit Bob')).toBeInTheDocument();
    });

    it('stops propagation on action button clicks', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      const onEditClick = vi.fn();

      const actions = (item: (typeof mockData)[0]) => (
        <button
          aria-label={`Edit ${item.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(item);
          }}
        >
          Edit
        </button>
      );

      render(
        <ModernTable data={mockData} columns={columns} onRowClick={onRowClick} actions={actions} />
      );

      const editButton = screen.getByLabelText('Edit Alice');
      await user.click(editButton);

      expect(onEditClick).toHaveBeenCalledWith(mockData[0]);
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it('calls onExport when export button is clicked', async () => {
      const user = userEvent.setup();
      const onExport = vi.fn();

      render(
        <ModernTable data={mockData} columns={columns} onExport={onExport} hideHeader={false} />
      );

      const exportButton = screen.getByTitle('Exportar para Excel');
      await user.click(exportButton);

      expect(onExport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('displays skeleton rows when loading', () => {
      render(<ModernTable data={[]} columns={columns} loading={true} itemsPerPage={5} />);

      const skeletonRows = screen
        .getAllByRole('row')
        .filter((row) => row.classList.contains('skeleton-row'));

      expect(skeletonRows.length).toBe(5);
    });

    it('displays correct number of skeleton rows based on itemsPerPage', () => {
      render(<ModernTable data={[]} columns={columns} loading={true} itemsPerPage={10} />);

      const skeletonRows = screen
        .getAllByRole('row')
        .filter((row) => row.classList.contains('skeleton-row'));

      expect(skeletonRows.length).toBe(10);
    });

    it('disables pagination buttons when loading', () => {
      render(<ModernTable data={mockData} columns={columns} loading={true} />);

      const paginationControls = screen.getByText(/Mostrando/).nextElementSibling;
      const prevButton = paginationControls?.querySelector('button:first-child');
      const nextButton = paginationControls?.querySelector('button:last-child');

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no data', () => {
      render(<ModernTable data={[]} columns={columns} />);

      expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
      expect(screen.getByText(/Ainda não há dados disponíveis/)).toBeInTheDocument();
    });

    it('shows custom empty state', () => {
      const customEmptyState = <div>Custom empty message</div>;

      render(<ModernTable data={[]} columns={columns} emptyState={customEmptyState} />);

      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });

    it('does not show empty state when loading', () => {
      render(<ModernTable data={[]} columns={columns} loading={true} />);

      expect(screen.queryByText('Nenhum registro encontrado')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles null or undefined data gracefully', () => {
      render(<ModernTable data={null as any} columns={columns} />);
      expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
    });

    it('handles empty columns array', () => {
      render(<ModernTable data={mockData} columns={[]} />);
      // Should render without crashing
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('handles items with null values', () => {
      const dataWithNulls = [{ id: '1', name: null, age: null, status: null, email: null }];

      render(<ModernTable data={dataWithNulls} columns={columns} />);
      // Should render without crashing
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('handles onlyPagination mode', () => {
      render(<ModernTable data={mockData} columns={columns} onlyPagination={true} />);

      // Should only show pagination controls, not the table
      expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
      expect(screen.queryByText('Name')).not.toBeInTheDocument();
    });

    it('calculates pagination correctly with zero items', () => {
      render(<ModernTable data={[]} columns={columns} />);

      // Check for pagination info - query by class name instead
      const paginationInfo = document.querySelector('.pagination-info');
      expect(paginationInfo).toHaveTextContent('Mostrando');
      expect(paginationInfo).toHaveTextContent('0');
    });
  });
});
