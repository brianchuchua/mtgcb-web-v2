import { act, renderHook, waitFor } from '@testing-library/react';
import type { ImportError, ImportResult } from '@/api/import/types';
import { useChunkedImport } from '@/hooks/useChunkedImport';

const HEADER = 'MTG CB ID,Quantity,Foil';

const csvOf = (rows: string[]) => [HEADER, ...rows].join('\n');
const distinctRows = (count: number, startId = 1) =>
  Array.from({ length: count }, (_, i) => `${startId + i},1,false`);

const importParams = (overrides: Partial<{ format: string; dryRun: boolean; updateMode: 'replace' | 'merge' }> = {}) => ({
  filename: 'collection.csv',
  query: { format: 'mtgcb', updateMode: 'replace' as const, dryRun: false, ...overrides },
});

const result = (overrides: Partial<ImportResult> = {}): ImportResult => ({
  totalRows: 0,
  successfulRows: 0,
  failedRows: 0,
  created: 0,
  updated: 0,
  deleted: 0,
  partialSuccess: false,
  errors: [],
  ...overrides,
});

const resolved = (data: ImportResult) => ({ unwrap: () => Promise.resolve({ success: true, data }) });
const rejected = (error: unknown) => ({ unwrap: () => Promise.reject(error) });

const rowsInCsv = (csvData: string) => csvData.split('\n').length - 1;

describe('useChunkedImport', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts idle', () => {
    const { result: hook } = renderHook(() => useChunkedImport(jest.fn()));
    expect(hook.current.progress.status).toBe('idle');
    expect(hook.current.isImporting).toBe(false);
  });

  it('throws "No data to import" for a header-only file and never calls the API', async () => {
    const mutation = jest.fn();
    const { result: hook } = renderHook(() => useChunkedImport(mutation));

    await expect(hook.current.runChunkedImport(`${HEADER}\n`, importParams())).rejects.toThrow('No data to import');
    await expect(hook.current.runChunkedImport('', importParams())).rejects.toThrow('No data to import');
    expect(mutation).not.toHaveBeenCalled();
  });

  it('sends each chunk with the header, filename, field mappings and query', async () => {
    const mutation = jest.fn(() => resolved(result({ successfulRows: 2 })));
    const { result: hook } = renderHook(() => useChunkedImport(mutation));
    const fieldMappings = [{ csvHeader: 'Id', mtgcbField: 'mtgcbId' }];

    await act(() =>
      hook.current.runChunkedImport(csvOf(['1,1,false', '2,1,false']), {
        filename: 'mine.csv',
        fieldMappings,
        query: { format: 'mtgcb', updateMode: 'merge', dryRun: true },
      }),
    );

    expect(mutation).toHaveBeenCalledTimes(1);
    expect(mutation).toHaveBeenCalledWith({
      csvData: csvOf(['1,1,false', '2,1,false']),
      filename: 'mine.csv',
      fieldMappings,
      query: { format: 'mtgcb', updateMode: 'merge', dryRun: true },
    });
  });

  it('splits large files into 500-row chunks and sums the results across chunks', async () => {
    const mutation = jest.fn(({ csvData }: { csvData: string }) => {
      const rows = rowsInCsv(csvData);
      return resolved(result({ successfulRows: rows - 1, failedRows: 1, created: rows - 2, updated: 1, deleted: 0 }));
    });
    const { result: hook } = renderHook(() => useChunkedImport(mutation));

    let final: Awaited<ReturnType<typeof hook.current.runChunkedImport>> | undefined;
    await act(async () => {
      final = await hook.current.runChunkedImport(csvOf(distinctRows(1200)), importParams());
    });

    expect(mutation.mock.calls.map(([args]) => rowsInCsv(args.csvData))).toEqual([500, 500, 200]);
    expect(mutation.mock.calls.every(([args]) => args.csvData.startsWith(`${HEADER}\n`))).toBe(true);
    expect(final).toMatchObject({
      status: 'completed',
      currentChunk: 3,
      totalChunks: 3,
      totalRows: 1200,
      processedRows: 1200,
      successfulRows: 1197,
      failedRows: 3,
      created: 1194,
      updated: 3,
      deleted: 0,
    });
    expect(hook.current.progress).toEqual(final);
    expect(hook.current.isImporting).toBe(false);
  });

  it('maps chunk-relative error rows back to the row numbers in the original file', async () => {
    // Rows 1 and 3 are the same card, so the chunker sends them together: [1, 3, 2].
    const csv = csvOf(['100,1,false', '200,1,false', '100,2,true']);
    const errors: ImportError[] = [
      { row: 2, field: 'quantity', value: '2', message: 'bad foil row' },
      { row: 3, field: 'id', value: '200', message: 'unknown card' },
    ];
    const mutation = jest.fn((_args: { csvData: string }) =>
      resolved(result({ successfulRows: 1, failedRows: 2, errors })),
    );
    const { result: hook } = renderHook(() => useChunkedImport(mutation));

    let final: Awaited<ReturnType<typeof hook.current.runChunkedImport>> | undefined;
    await act(async () => {
      final = await hook.current.runChunkedImport(csv, importParams());
    });

    expect(mutation.mock.calls[0][0].csvData).toBe(csvOf(['100,1,false', '100,2,true', '200,1,false']));
    expect(final?.errors).toEqual([
      { row: 3, field: 'quantity', value: '2', message: 'bad foil row' },
      { row: 2, field: 'id', value: '200', message: 'unknown card' },
    ]);
  });

  it('keeps the server row number when it falls outside the chunk', async () => {
    const mutation = jest.fn(() =>
      resolved(result({ failedRows: 1, errors: [{ row: 99, field: 'x', value: 'y', message: 'odd' }] })),
    );
    const { result: hook } = renderHook(() => useChunkedImport(mutation));

    let final: Awaited<ReturnType<typeof hook.current.runChunkedImport>> | undefined;
    await act(async () => {
      final = await hook.current.runChunkedImport(csvOf(['1,1,false']), importParams());
    });

    expect(final?.errors[0].row).toBe(99);
  });

  it('marks every row of a rejected chunk as failed and carries on with the next chunk', async () => {
    const mutation = jest
      .fn()
      .mockImplementationOnce(() => resolved(result({ successfulRows: 500, created: 500 })))
      .mockImplementationOnce(() => rejected(new Error('Gateway timeout')))
      .mockImplementationOnce(() => resolved(result({ successfulRows: 200, updated: 200 })));
    const { result: hook } = renderHook(() => useChunkedImport(mutation));

    let final: Awaited<ReturnType<typeof hook.current.runChunkedImport>> | undefined;
    await act(async () => {
      final = await hook.current.runChunkedImport(csvOf(distinctRows(1200)), importParams());
    });

    expect(mutation).toHaveBeenCalledTimes(3);
    expect(final).toMatchObject({
      status: 'completed',
      processedRows: 1200,
      successfulRows: 700,
      failedRows: 500,
      created: 500,
      updated: 200,
    });
    expect(final?.errors).toEqual([
      { row: 501, field: 'chunk', value: 'Chunk 2', message: 'Chunk failed: Gateway timeout' },
    ]);
  });

  it('describes a non-Error rejection as an unknown error', async () => {
    const mutation = jest.fn(() => rejected({ status: 500, data: 'oops' }));
    const { result: hook } = renderHook(() => useChunkedImport(mutation));

    let final: Awaited<ReturnType<typeof hook.current.runChunkedImport>> | undefined;
    await act(async () => {
      final = await hook.current.runChunkedImport(csvOf(['1,1,false', '2,1,false']), importParams());
    });

    expect(final?.errors).toEqual([{ row: 1, field: 'chunk', value: 'Chunk 1', message: 'Chunk failed: Unknown error' }]);
    expect(final?.failedRows).toBe(2);
  });

  it('reports failed only when no row succeeded', async () => {
    const allRejected = jest.fn(() => rejected(new Error('down')));
    const { result: rejectedHook } = renderHook(() => useChunkedImport(allRejected));
    let rejectedFinal: Awaited<ReturnType<typeof rejectedHook.current.runChunkedImport>> | undefined;
    await act(async () => {
      rejectedFinal = await rejectedHook.current.runChunkedImport(csvOf(distinctRows(600)), importParams());
    });
    expect(rejectedFinal?.status).toBe('failed');
    expect(rejectedFinal?.failedRows).toBe(600);

    const allRowsInvalid = jest.fn(() => resolved(result({ successfulRows: 0, failedRows: 3 })));
    const { result: invalidHook } = renderHook(() => useChunkedImport(allRowsInvalid));
    let invalidFinal: Awaited<ReturnType<typeof invalidHook.current.runChunkedImport>> | undefined;
    await act(async () => {
      invalidFinal = await invalidHook.current.runChunkedImport(csvOf(distinctRows(3)), importParams());
    });
    expect(invalidFinal?.status).toBe('failed');

    const oneGoodRow = jest.fn(() => resolved(result({ successfulRows: 1, failedRows: 2 })));
    const { result: partialHook } = renderHook(() => useChunkedImport(oneGoodRow));
    let partialFinal: Awaited<ReturnType<typeof partialHook.current.runChunkedImport>> | undefined;
    await act(async () => {
      partialFinal = await partialHook.current.runChunkedImport(csvOf(distinctRows(3)), importParams());
    });
    expect(partialFinal?.status).toBe('completed');
  });

  it('reports which chunk is in flight while the import runs', async () => {
    const pending: Array<(value: unknown) => void> = [];
    const mutation = jest.fn(() => ({
      unwrap: () => new Promise((resolve) => pending.push(resolve)),
    }));
    const { result: hook } = renderHook(() => useChunkedImport(mutation));

    let run: Promise<unknown> | undefined;
    act(() => {
      run = hook.current.runChunkedImport(csvOf(distinctRows(700)), importParams());
    });

    await waitFor(() => expect(pending).toHaveLength(1));
    expect(hook.current.isImporting).toBe(true);
    expect(hook.current.progress).toMatchObject({
      status: 'processing',
      currentChunk: 1,
      totalChunks: 2,
      totalRows: 700,
      processedRows: 0,
    });

    await act(async () => {
      pending[0]({ success: true, data: result({ successfulRows: 500 }) });
    });
    await waitFor(() => expect(pending).toHaveLength(2));
    expect(hook.current.progress).toMatchObject({ currentChunk: 2, processedRows: 500, successfulRows: 500 });

    await act(async () => {
      pending[1]({ success: true, data: result({ successfulRows: 200 }) });
      await run;
    });
    expect(hook.current.progress).toMatchObject({ status: 'completed', processedRows: 700, successfulRows: 700 });
    expect(hook.current.isImporting).toBe(false);
  });

  it('reset returns to the idle state', async () => {
    const mutation = jest.fn(() => resolved(result({ successfulRows: 1 })));
    const { result: hook } = renderHook(() => useChunkedImport(mutation));

    await act(() => hook.current.runChunkedImport(csvOf(['1,1,false']), importParams()));
    expect(hook.current.progress.status).toBe('completed');

    act(() => hook.current.reset());
    expect(hook.current.progress).toEqual({
      status: 'idle',
      currentChunk: 0,
      totalChunks: 0,
      totalRows: 0,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [],
      created: 0,
      updated: 0,
      deleted: 0,
    });
    expect(hook.current.isImporting).toBe(false);
  });
});
