import { act, renderHook } from '@testing-library/react';
import type { Location } from '@/api/locations/types';
import { useDeleteLocation } from '../useDeleteLocation';

const mockDelete = jest.fn();
jest.mock('@/api/locations/locationsApi', () => ({
  useDeleteLocationMutation: () => [mockDelete, { isLoading: false }],
}));

const mockSnackbar = jest.fn();
jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockSnackbar }),
}));

const location = (id: number): Location => ({
  id,
  name: `Binder ${id}`,
  description: null,
  parentId: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

const succeed = () => mockDelete.mockReturnValue({ unwrap: () => Promise.resolve({ success: true }) });
const fail = (error: unknown) => mockDelete.mockReturnValue({ unwrap: () => Promise.reject(error) });

describe('useDeleteLocation', () => {
  beforeEach(() => {
    mockDelete.mockReset();
    mockSnackbar.mockReset();
  });

  it('opens the confirm dialog for the clicked location without deleting it', () => {
    const { result } = renderHook(() => useDeleteLocation());
    act(() => result.current.handleDeleteClick(location(3)));
    expect(result.current.deleteDialogOpen).toBe(true);
    expect(result.current.locationToDelete?.id).toBe(3);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('cancel closes the dialog and forgets the location', () => {
    const { result } = renderHook(() => useDeleteLocation());
    act(() => result.current.handleDeleteClick(location(3)));
    act(() => result.current.handleCancelDelete());
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.locationToDelete).toBeNull();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('confirm deletes by id, shows a success toast and calls onSuccess', async () => {
    succeed();
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() => useDeleteLocation({ onSuccess, onError }));

    act(() => result.current.handleDeleteClick(location(7)));
    await act(() => result.current.handleConfirmDelete());

    expect(mockDelete).toHaveBeenCalledWith(7);
    expect(mockSnackbar).toHaveBeenCalledWith('Location deleted', { variant: 'success' });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.locationToDelete).toBeNull();
  });

  it('a failed delete shows an error toast, passes the error on and still closes the dialog', async () => {
    const apiError = { status: 500, data: { success: false } };
    fail(apiError);
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() => useDeleteLocation({ onSuccess, onError }));

    act(() => result.current.handleDeleteClick(location(7)));
    await act(() => result.current.handleConfirmDelete());

    expect(mockSnackbar).toHaveBeenCalledWith('Failed to delete location', { variant: 'error' });
    expect(onError).toHaveBeenCalledWith(apiError);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.locationToDelete).toBeNull();
  });

  it('confirm does nothing when no location was picked', async () => {
    const { result } = renderHook(() => useDeleteLocation());
    await act(() => result.current.handleConfirmDelete());
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockSnackbar).not.toHaveBeenCalled();
  });

  it('works without options', async () => {
    succeed();
    const { result } = renderHook(() => useDeleteLocation());
    act(() => result.current.handleDeleteClick(location(1)));
    await act(() => result.current.handleConfirmDelete());
    expect(mockSnackbar).toHaveBeenCalledWith('Location deleted', { variant: 'success' });
  });
});
