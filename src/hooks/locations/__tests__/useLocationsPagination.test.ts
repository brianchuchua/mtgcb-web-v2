import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { useLocationsPagination } from '../useLocationsPagination';

const STORAGE_KEY = 'mtgcb-locations-pagination';
const storedPageSize = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')?.pageSize;

describe('useLocationsPagination', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts on page 1 with 9 locations per page without saving anything', () => {
    const { result } = renderHook(() => useLocationsPagination());
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(9);
    expect(storedPageSize()).toBeUndefined();
  });

  it('keeps a saved page size through a Strict Mode double mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pageSize: 2 }));
    const { result } = renderHook(() => useLocationsPagination(), { wrapper: StrictMode });
    expect(result.current.pageSize).toBe(2);
    expect(storedPageSize()).toBe(2);
  });

  it('restores the saved page size', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pageSize: 24 }));
    const { result } = renderHook(() => useLocationsPagination());
    expect(result.current.pageSize).toBe(24);
    expect(storedPageSize()).toBe(24);
  });

  it.each([
    ['corrupt JSON', 'not json{'],
    ['a zero page size', JSON.stringify({ pageSize: 0 })],
    ['a negative page size', JSON.stringify({ pageSize: -3 })],
    ['a missing page size', JSON.stringify({})],
  ])('falls back to 9 per page when storage holds %s', (_label, raw) => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, raw);
    const { result } = renderHook(() => useLocationsPagination());
    expect(result.current.pageSize).toBe(9);
    consoleError.mockRestore();
  });

  it('changes page without touching the page size', () => {
    const { result } = renderHook(() => useLocationsPagination());
    act(() => result.current.onPageChange(4));
    expect(result.current.currentPage).toBe(4);
    expect(result.current.pageSize).toBe(9);
  });

  it('goes back to page 1 and saves the new size when the page size changes', () => {
    const { result } = renderHook(() => useLocationsPagination());
    act(() => result.current.onPageChange(3));
    act(() => result.current.onPageSizeChange(18));
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(18);
    expect(storedPageSize()).toBe(18);
  });

  it('resetPagination returns to page 1 and keeps the page size', () => {
    const { result } = renderHook(() => useLocationsPagination());
    act(() => result.current.onPageSizeChange(27));
    act(() => result.current.onPageChange(5));
    act(() => result.current.resetPagination());
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(27);
  });

  it('does not share its saved size with the goals list', () => {
    localStorage.setItem('mtgcb-goals-pagination', JSON.stringify({ pageSize: 30 }));
    const { result } = renderHook(() => useLocationsPagination());
    expect(result.current.pageSize).toBe(9);
  });
});
