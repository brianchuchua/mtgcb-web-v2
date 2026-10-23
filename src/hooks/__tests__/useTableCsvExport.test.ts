import { renderHook } from '@testing-library/react';
import { TableColumn } from '@/components/common/VirtualizedTable';
import { useTableCsvExport } from '@/hooks/useTableCsvExport';

interface Row {
  name: string | null | undefined;
  count: number | null;
}

const columns = [
  { id: 'name', label: 'Name' },
  { id: 'count', label: 'Count' },
] as TableColumn<Row>[];

const extractCellValue = (row: Row, columnId: string) => (columnId === 'name' ? row.name : row.count);

const csvFor = (items: Row[], cols: TableColumn<Row>[] = columns) =>
  renderHook(() => useTableCsvExport({ items, columns: cols, extractCellValue })).result.current.generateCsv();

describe('useTableCsvExport — generateCsv', () => {
  it('writes a header row and one line per item', () => {
    expect(
      csvFor([
        { name: 'Alpha', count: 295 },
        { name: 'Beta', count: 302 },
      ]),
    ).toBe('Name,Count\nAlpha,295\nBeta,302');
  });

  it('writes only the header for no items', () => {
    expect(csvFor([])).toBe('Name,Count');
  });

  it('quotes values containing a comma', () => {
    expect(csvFor([{ name: 'Urza, Lord High Artificer', count: 1 }])).toBe(
      'Name,Count\n"Urza, Lord High Artificer",1',
    );
  });

  it('doubles embedded quotes and wraps the value', () => {
    expect(csvFor([{ name: 'Kongming, "Sleeping Dragon"', count: 1 }])).toBe(
      'Name,Count\n"Kongming, ""Sleeping Dragon""",1',
    );
    expect(csvFor([{ name: 'Say "hi"', count: 1 }])).toBe('Name,Count\n"Say ""hi""",1');
  });

  it('quotes values containing newlines or carriage returns', () => {
    expect(csvFor([{ name: 'line one\nline two', count: 1 }])).toBe('Name,Count\n"line one\nline two",1');
    expect(csvFor([{ name: 'a\rb', count: 1 }])).toBe('Name,Count\n"a\rb",1');
  });

  it('writes null and undefined as empty cells but keeps zero', () => {
    expect(csvFor([{ name: null, count: 0 }])).toBe('Name,Count\n,0');
    expect(csvFor([{ name: undefined, count: null }])).toBe('Name,Count\n,');
  });

  it('escapes header labels too', () => {
    const cols = [{ id: 'name', label: 'Name, full' }] as TableColumn<Row>[];
    expect(csvFor([{ name: 'x', count: 1 }], cols)).toBe('"Name, full"\nx');
  });

  it('follows the column order', () => {
    const reversed = [...columns].reverse();
    expect(csvFor([{ name: 'Alpha', count: 1 }], reversed)).toBe('Count,Name\n1,Alpha');
  });
});

describe('useTableCsvExport — copyCsvToClipboard', () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });

  const copy = () =>
    renderHook(() =>
      useTableCsvExport({ items: [{ name: 'Alpha', count: 1 }], columns, extractCellValue }),
    ).result.current.copyCsvToClipboard();

  it('writes the CSV to the clipboard and reports success', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await expect(copy()).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('Name,Count\nAlpha,1');
  });

  it('reports failure when the clipboard rejects', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    await expect(copy()).resolves.toBe(false);
  });

  it('reports failure when there is no clipboard API', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    await expect(copy()).resolves.toBe(false);
  });
});

const readBlob = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });

describe('useTableCsvExport — downloadCsv', () => {
  it('downloads a CSV blob under the given file name', async () => {
    const createObjectURL = jest.fn().mockReturnValue('blob:csv');
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const clicked: HTMLAnchorElement[] = [];
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push(this);
      });

    const { result } = renderHook(() =>
      useTableCsvExport({ items: [{ name: 'Alpha', count: 1 }], columns, extractCellValue, fileName: 'sets.csv' }),
    );
    result.current.downloadCsv();

    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe('sets.csv');
    expect(clicked[0].href).toBe('blob:csv');
    expect(clicked[0].isConnected).toBe(false);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/csv;charset=utf-8;');
    expect(await readBlob(blob)).toBe('Name,Count\nAlpha,1');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv');

    clickSpy.mockRestore();
  });

  it('defaults the file name to export.csv', () => {
    Object.assign(URL, { createObjectURL: jest.fn().mockReturnValue('blob:x'), revokeObjectURL: jest.fn() });
    const names: string[] = [];
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        names.push(this.download);
      });

    renderHook(() => useTableCsvExport({ items: [], columns, extractCellValue })).result.current.downloadCsv();

    expect(names).toEqual(['export.csv']);
    clickSpy.mockRestore();
  });
});
