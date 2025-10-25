import { TableColumn } from '@/components/common/VirtualizedTable';

interface UseTableCsvExportOptions<T> {
  items: T[];
  columns: TableColumn<T>[];
  fileName?: string;
  extractCellValue: (item: T, columnId: string) => string | number | null | undefined;
}

export const useTableCsvExport = <T,>({
  items,
  columns,
  fileName = 'export.csv',
  extractCellValue,
}: UseTableCsvExportOptions<T>) => {
  // Helper function to properly escape CSV values
  // This matches the escaping logic from ImportClient.tsx
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);

    // Check if value needs escaping (contains comma, double quote, or newline)
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      // Escape double quotes by doubling them
      const escaped = stringValue.replace(/"/g, '""');
      // Wrap in double quotes
      return `"${escaped}"`;
    }

    return stringValue;
  };

  const generateCsv = (): string => {
    // Build header row from column labels
    const headers = columns.map((col) => escapeCSV(col.label));
    const rows = [headers.join(',')];

    // Build data rows
    items.forEach((item) => {
      const rowData = columns.map((col) => {
        const value = extractCellValue(item, col.id);
        return escapeCSV(value);
      });
      rows.push(rowData.join(','));
    });

    return rows.join('\n');
  };

  const downloadCsv = () => {
    const csvContent = generateCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyCsvToClipboard = async (): Promise<boolean> => {
    // Check if clipboard API is available
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return false;
    }

    try {
      const csvContent = generateCsv();
      await navigator.clipboard.writeText(csvContent);
      return true;
    } catch (err) {
      return false;
    }
  };

  return {
    downloadCsv,
    copyCsvToClipboard,
    generateCsv,
  };
};
