import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToExcel, exportToPDF } from './export';

// Create mock instances that will be shared
const mockDoc = {
  setFillColor: vi.fn(),
  rect: vi.fn(),
  setTextColor: vi.fn(),
  setFontSize: vi.fn(),
  text: vi.fn(),
  setPage: vi.fn(),
  save: vi.fn(),
  internal: {
    getNumberOfPages: vi.fn().mockReturnValue(1),
    pageSize: {
      getWidth: vi.fn().mockReturnValue(297),
      getHeight: vi.fn().mockReturnValue(210),
    },
  },
};

// Mock dependencies
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function (this: any) {
    return mockDoc;
  }),
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

// Import mocked modules after mocking
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

describe('exportToCSV', () => {
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;
  let clickSpy: any;
  let createObjectURLSpy: any;
  let blobSpy: any;
  let capturedBlobContent: string = '';

  beforeEach(() => {
    // Setup DOM mocks
    clickSpy = vi.fn();
    const mockLink = {
      setAttribute: vi.fn(),
      click: clickSpy,
      style: {},
    };

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockLink as any);
    removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockLink as any);

    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    // Mock Blob constructor
    blobSpy = vi.spyOn(global, 'Blob').mockImplementation(function (
      this: any,
      content: any[],
      options?: any
    ) {
      capturedBlobContent = content[0];
      return { content, options, type: options?.type || '' };
    } as any);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export data to CSV with correct format', () => {
    const testData = [
      { name: 'John Doe', age: 30, city: 'São Paulo' },
      { name: 'Jane Smith', age: 25, city: 'Rio de Janeiro' },
    ];
    const filename = 'test-export';

    exportToCSV(testData, filename);

    expect(blobSpy).toHaveBeenCalled();
    expect(capturedBlobContent).toContain('name,age,city');
    expect(capturedBlobContent).toContain('"John Doe","30","São Paulo"');
    expect(capturedBlobContent).toContain('"Jane Smith","25","Rio de Janeiro"');
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should handle empty array by showing error toast', () => {
    exportToCSV([], 'test');
    expect(toast.error).toHaveBeenCalledWith('Não há dados para exportar.');
    expect(createElementSpy).not.toHaveBeenCalled();
  });

  it('should handle null data by showing error toast', () => {
    exportToCSV(null as any, 'test');
    expect(toast.error).toHaveBeenCalledWith('Não há dados para exportar.');
  });

  it('should handle undefined data by showing error toast', () => {
    exportToCSV(undefined as any, 'test');
    expect(toast.error).toHaveBeenCalledWith('Não há dados para exportar.');
  });

  it('should escape quotes in CSV values', () => {
    const testData = [{ description: 'Product "Premium" Edition' }];
    exportToCSV(testData, 'test');
    expect(capturedBlobContent).toContain('Product ""Premium"" Edition');
  });

  it('should handle null and undefined values in data', () => {
    const testData = [{ name: 'John', age: null, city: undefined }];
    exportToCSV(testData, 'test');
    expect(capturedBlobContent).toContain('""');
  });

  it('should include date in filename', () => {
    const testData = [{ name: 'Test' }];
    exportToCSV(testData, 'export-test');

    const linkElement = createElementSpy.mock.results[0].value;
    const setAttributeCalls = linkElement.setAttribute.mock.calls;
    const downloadCall = setAttributeCalls.find((call: any) => call[0] === 'download');
    expect(downloadCall[1]).toMatch(/export-test_\d{4}-\d{2}-\d{2}\.csv/);
  });

  it('should handle data with special characters', () => {
    const testData = [{ name: 'José, Maria & João', description: 'Special chars: @#$%' }];
    exportToCSV(testData, 'test');
    expect(capturedBlobContent).toContain('José, Maria & João');
    expect(capturedBlobContent).toContain('Special chars: @#$%');
  });

  it('should handle data with numeric values', () => {
    const testData = [{ id: 1, price: 99.99, quantity: 10 }];
    exportToCSV(testData, 'test');
    expect(capturedBlobContent).toContain('"1","99.99","10"');
  });
});

describe('exportToExcel', () => {
  let mockWorksheet: any;
  let mockWorkbook: any;

  beforeEach(() => {
    mockWorksheet = { name: 'mock-worksheet' };
    mockWorkbook = { SheetNames: [], Sheets: {} };

    vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue(mockWorksheet);
    vi.mocked(XLSX.utils.book_new).mockReturnValue(mockWorkbook);
    vi.clearAllMocks();
  });

  it('should export data to Excel with sample data', () => {
    const testData = [
      { animal_id: 'A001', breed: 'Nelore', weight: 450 },
      { animal_id: 'A002', breed: 'Angus', weight: 480 },
    ];

    exportToExcel(testData, 'animals-export');

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(testData);
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(mockWorkbook, mockWorksheet, 'Dados');
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('should handle empty array by showing error toast', () => {
    exportToExcel([], 'test');
    expect(toast.error).toHaveBeenCalledWith('Não há dados para exportar.');
    expect(XLSX.utils.json_to_sheet).not.toHaveBeenCalled();
  });

  it('should handle null data by showing error toast', () => {
    exportToExcel(null as any, 'test');
    expect(toast.error).toHaveBeenCalledWith('Não há dados para exportar.');
  });

  it('should handle undefined data by showing error toast', () => {
    exportToExcel(undefined as any, 'test');
    expect(toast.error).toHaveBeenCalledWith('Não há dados para exportar.');
  });

  it('should export data with various data types', () => {
    const testData = [{ name: 'Test', id: 123, active: true, weight: 456.78, notes: null }];
    exportToExcel(testData, 'mixed-data');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(testData);
  });

  it('should include date in filename', () => {
    const testData = [{ name: 'Test' }];
    exportToExcel(testData, 'test-export');
    const writeFileArgs = vi.mocked(XLSX.writeFile).mock.calls[0];
    expect(writeFileArgs[1]).toMatch(/test-export_\d{4}-\d{2}-\d{2}\.xlsx/);
  });

  it('should create worksheet with correct sheet name', () => {
    const testData = [{ id: 1, name: 'Test' }];
    exportToExcel(testData, 'test');
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(mockWorkbook, mockWorksheet, 'Dados');
  });

  it('should handle large dataset', () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random() * 1000,
    }));

    exportToExcel(largeData, 'large-export');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(largeData);
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('should handle data with nested objects', () => {
    const testData = [{ id: 1, details: { color: 'red', size: 'large' } }];
    exportToExcel(testData, 'nested-data');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(testData);
  });
});

describe('exportToPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementation for page count
    mockDoc.internal.getNumberOfPages.mockReturnValue(1);
  });

  it('should export data to PDF with correct table structure', () => {
    const testData = [
      { name: 'John', age: 30, city: 'São Paulo' },
      { name: 'Jane', age: 25, city: 'Rio' },
    ];

    exportToPDF(testData, 'test-report', 'User Report');

    expect(jsPDF).toHaveBeenCalledWith({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    expect(autoTable).toHaveBeenCalled();
    const autoTableArgs = vi.mocked(autoTable).mock.calls[0];
    expect(autoTableArgs[1].head).toEqual([['name', 'age', 'city']]);
    expect(autoTableArgs[1].body).toEqual([
      ['John', 30, 'São Paulo'],
      ['Jane', 25, 'Rio'],
    ]);
  });

  it('should handle empty array by showing error toast', () => {
    exportToPDF([], 'test', 'Test Report');
    expect(toast.error).toHaveBeenCalledWith('Não há dados para exportar.');
    expect(jsPDF).not.toHaveBeenCalled();
  });

  it('should handle null data by showing error toast', () => {
    exportToPDF(null as any, 'test', 'Test Report');
    expect(toast.error).toHaveBeenCalledWith('Não há dados para exportar.');
  });

  it('should handle undefined data by showing error toast', () => {
    exportToPDF(undefined as any, 'test', 'Test Report');
    expect(toast.error).toHaveBeenCalledWith('Não há dados para exportar.');
  });

  it('should create PDF with header design', () => {
    const testData = [{ name: 'Test' }];
    exportToPDF(testData, 'test', 'Test Report');

    expect(mockDoc.setFillColor).toHaveBeenCalledWith(15, 23, 42);
    expect(mockDoc.rect).toHaveBeenCalledWith(0, 0, 297, 40, 'F');
    expect(mockDoc.setTextColor).toHaveBeenCalledWith(255, 255, 255);
    expect(mockDoc.setFontSize).toHaveBeenCalledWith(22);
    expect(mockDoc.text).toHaveBeenCalledWith('TAUZE ERP v5.0', 14, 18);
  });

  it('should include report title and timestamp in header', () => {
    const testData = [{ id: 1 }];
    exportToPDF(testData, 'finance', 'Financial Report');

    const textCalls = mockDoc.text.mock.calls;
    const titleCall = textCalls.find((call: any) => call[0].includes('FINANCIAL REPORT'));
    const timestampCall = textCalls.find((call: any) => call[0].includes('GERADO EM:'));

    expect(titleCall).toBeDefined();
    expect(timestampCall).toBeDefined();
  });

  it('should configure autoTable with correct styling', () => {
    const testData = [{ col1: 'value1', col2: 'value2' }];
    exportToPDF(testData, 'test', 'Test');

    const autoTableArgs = vi.mocked(autoTable).mock.calls[0];
    const config = autoTableArgs[1];

    expect(config.startY).toBe(45);
    expect(config.theme).toBe('striped');
    expect(config.headStyles.fillColor).toEqual([15, 23, 42]);
    expect(config.headStyles.textColor).toEqual([255, 255, 255]);
    expect(config.headStyles.fontSize).toBe(10);
    expect(config.headStyles.fontStyle).toBe('bold');
    expect(config.headStyles.halign).toBe('center');
  });

  it('should add footer with page numbers', () => {
    mockDoc.internal.getNumberOfPages.mockReturnValue(3);
    const testData = [{ id: 1 }];

    exportToPDF(testData, 'test', 'Test');

    expect(mockDoc.setPage).toHaveBeenCalledTimes(3);
    expect(mockDoc.setPage).toHaveBeenCalledWith(1);
    expect(mockDoc.setPage).toHaveBeenCalledWith(2);
    expect(mockDoc.setPage).toHaveBeenCalledWith(3);

    const footerTextCalls = mockDoc.text.mock.calls.filter((call: any) =>
      call[0].includes('Página')
    );
    expect(footerTextCalls.length).toBeGreaterThan(0);
  });

  it('should handle different table structures', () => {
    const testData1 = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    exportToPDF(testData1, 'simple', 'Simple Table');

    const autoTableArgs1 = vi.mocked(autoTable).mock.calls[0];
    expect(autoTableArgs1[1].head).toEqual([['a', 'b']]);
    expect(autoTableArgs1[1].body).toEqual([
      [1, 2],
      [3, 4],
    ]);

    vi.clearAllMocks();

    const testData2 = [{ name: 'John', age: 30, city: 'SP', country: 'BR' }];
    exportToPDF(testData2, 'complex', 'Complex Table');

    const autoTableArgs2 = vi.mocked(autoTable).mock.calls[0];
    expect(autoTableArgs2[1].head).toEqual([['name', 'age', 'city', 'country']]);
    expect(autoTableArgs2[1].body).toEqual([['John', 30, 'SP', 'BR']]);
  });

  it('should format data with null and undefined values', () => {
    const testData = [{ name: 'Test', value: null, status: undefined }];
    exportToPDF(testData, 'test', 'Test');

    const autoTableArgs = vi.mocked(autoTable).mock.calls[0];
    expect(autoTableArgs[1].body).toEqual([['Test', null, undefined]]);
  });

  it('should handle single row data', () => {
    const testData = [{ id: 1, name: 'Single Row' }];
    exportToPDF(testData, 'single', 'Single Row Report');

    expect(autoTable).toHaveBeenCalled();
    expect(mockDoc.save).toHaveBeenCalled();
  });

  it('should handle data with many columns', () => {
    const testData = [
      {
        col1: 'A',
        col2: 'B',
        col3: 'C',
        col4: 'D',
        col5: 'E',
        col6: 'F',
        col7: 'G',
        col8: 'H',
        col9: 'I',
        col10: 'J',
      },
    ];

    exportToPDF(testData, 'wide', 'Wide Table');

    const autoTableArgs = vi.mocked(autoTable).mock.calls[0];
    expect(autoTableArgs[1].head[0].length).toBe(10);
  });

  it('should include date in filename', () => {
    const testData = [{ name: 'Test' }];
    exportToPDF(testData, 'report', 'Report');

    const saveArgs = mockDoc.save.mock.calls[0];
    expect(saveArgs[0]).toMatch(/report_\d{4}-\d{2}-\d{2}\.pdf/);
  });

  it('should use landscape orientation for wide tables', () => {
    const testData = [{ a: 1 }];
    exportToPDF(testData, 'test', 'Test');

    expect(jsPDF).toHaveBeenCalledWith(expect.objectContaining({ orientation: 'landscape' }));
  });
});
