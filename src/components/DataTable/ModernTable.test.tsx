import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModernTable } from './ModernTable';

describe('ModernTable', () => {
  const mockData = [
    { id: '1', name: 'Alice', age: 30 },
    { id: '2', name: 'Bob', age: 25 },
    { id: '3', name: 'Charlie', age: 35 },
  ];

  const columns = [
    { header: 'Name', accessor: 'name' as const },
    { header: 'Age', accessor: 'age' as const },
  ];

  it('renders table headers and rows', () => {
    render(<ModernTable data={mockData} columns={columns} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('30,00')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('handles client-side search filtering', () => {
    // Note: hideHeader must be false to show the search input
    render(<ModernTable data={mockData} columns={columns} hideHeader={false} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar registros...');
    fireEvent.change(searchInput, { target: { value: 'Ali' } });
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  });

  it('handles row selection', () => {
    const onSelectionChange = vi.fn();
    render(
      <ModernTable 
        data={mockData} 
        columns={columns} 
        selectable={true} 
        selectedItems={['1']}
        onSelectionChange={onSelectionChange}
      />
    );
    
    // The "select all" checkbox and individual row checkboxes are rendered
    const checkboxes = screen.getAllByRole('checkbox');
    // 1 header + 3 rows = 4 checkboxes
    expect(checkboxes.length).toBe(4);
    
    // Click Bob's checkbox
    fireEvent.click(checkboxes[2]);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<ModernTable data={mockData} columns={columns} onRowClick={onRowClick} />);
    
    const aliceRow = screen.getByText('Alice').closest('tr');
    fireEvent.click(aliceRow!);
    
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('shows empty state when no data', () => {
    render(<ModernTable data={[]} columns={columns} />);
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
  });
});
