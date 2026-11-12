/**
 * The "Don't change finishes that aren't in the CSV" checkbox on the import
 * page: when it shows, and what it sends to the API.
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImportClient } from '../ImportClient';

const mockRunChunkedImport = jest.fn();

jest.mock('@/api/import/importApi', () => ({
  useGetImportFormatsQuery: () => ({
    data: [
      { id: 'mtgcb', name: 'MTG CB', description: 'MTG CB native import format', requiredFields: [], supportedFields: [] },
      { id: 'manabox', name: 'ManaBox', description: 'ManaBox import format', requiredFields: [], supportedFields: [] },
    ],
    isLoading: false,
    error: undefined,
  }),
  useImportCollectionMutation: () => [jest.fn(), { isLoading: false }],
}));

jest.mock('@/hooks/useChunkedImport', () => ({
  useChunkedImport: () => ({
    progress: { status: 'idle' },
    isImporting: false,
    runChunkedImport: mockRunChunkedImport,
    reset: jest.fn(),
  }),
}));

jest.mock('@/api/mtgcbApi', () => ({
  mtgcbApi: { util: { invalidateTags: jest.fn() } },
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
}));

jest.mock('../CustomCSVMapper', () => ({ CustomCSVMapper: () => null }));
jest.mock('../components/ImportProgress', () => ({ ImportProgress: () => null }));
jest.mock('@/components/ui/link', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const CHECKBOX_NAME = /Don't change finishes \(foil or non-foil\) that aren't in the CSV/;

const finishCheckbox = () => screen.queryByRole('checkbox', { name: CHECKBOX_NAME });

const selectFormat = (name: RegExp) => fireEvent.click(screen.getByRole('radio', { name }));

const selectFile = async () => {
  const file = new File(['Name,Quantity\n'], 'collection.csv', { type: 'text/csv' });
  Object.defineProperty(file, 'text', { value: () => Promise.resolve('Name,Quantity\n') });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
};

const runPreview = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Preview (Dry Run)' }));
  });
  await waitFor(() => expect(mockRunChunkedImport).toHaveBeenCalledTimes(1));
  return mockRunChunkedImport.mock.calls[0][1].query;
};

describe('ImportClient replace scope checkbox', () => {
  beforeEach(() => {
    mockRunChunkedImport.mockReset();
    mockRunChunkedImport.mockResolvedValue({
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    });
    render(<ImportClient />);
  });

  it('is hidden for the MTG CB format', () => {
    expect(finishCheckbox()).toBeNull();
  });

  it('shows for a one-finish-per-row format in Replace mode, unchecked', () => {
    selectFormat(/ManaBox/);

    expect(finishCheckbox()).not.toBeNull();
    expect(finishCheckbox()).not.toBeChecked();
  });

  it('is hidden in Add mode', () => {
    selectFormat(/ManaBox/);
    fireEvent.click(screen.getByRole('radio', { name: /^Add/ }));

    expect(finishCheckbox()).toBeNull();
  });

  it('sends no replace scope when unchecked', async () => {
    selectFormat(/ManaBox/);
    await selectFile();

    expect(await runPreview()).toEqual({
      format: 'manabox',
      updateMode: 'replace',
      replaceScope: undefined,
      dryRun: true,
    });
  });

  it('sends the finish replace scope when checked', async () => {
    selectFormat(/ManaBox/);
    fireEvent.click(finishCheckbox()!);
    await selectFile();

    expect(await runPreview()).toEqual({
      format: 'manabox',
      updateMode: 'replace',
      replaceScope: 'finish',
      dryRun: true,
    });
  });

  it('does not send the finish replace scope after switching to Add', async () => {
    selectFormat(/ManaBox/);
    fireEvent.click(finishCheckbox()!);
    fireEvent.click(screen.getByRole('radio', { name: /^Add/ }));
    await selectFile();

    expect(await runPreview()).toMatchObject({ updateMode: 'merge', replaceScope: undefined });
  });

  it('does not send the finish replace scope after switching to the MTG CB format', async () => {
    selectFormat(/ManaBox/);
    fireEvent.click(finishCheckbox()!);
    selectFormat(/MTG CB/);
    await selectFile();

    expect(await runPreview()).toMatchObject({ format: 'mtgcb', replaceScope: undefined });
  });
});
