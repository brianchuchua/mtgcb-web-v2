import { act, renderHook } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the initial value and is ready when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('prefs', { size: 20 }));
    expect(result.current[0]).toEqual({ size: 20 });
    expect(result.current[2]).toBe(true);
    expect(localStorage.getItem('prefs')).toBeNull();
  });

  it('loads the stored JSON value after mount', () => {
    localStorage.setItem('prefs', JSON.stringify({ size: 50 }));
    const { result } = renderHook(() => useLocalStorage('prefs', { size: 20 }));
    expect(result.current[0]).toEqual({ size: 50 });
  });

  it('falls back to the initial value when the stored value is not JSON', () => {
    localStorage.setItem('prefs', '{oops');
    const { result } = renderHook(() => useLocalStorage('prefs', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('saves new values as JSON', () => {
    const { result } = renderHook(() => useLocalStorage<number[]>('ids', []));
    act(() => result.current[1]([1, 2]));
    expect(result.current[0]).toEqual([1, 2]);
    expect(localStorage.getItem('ids')).toBe('[1,2]');
  });

  it('accepts an updater function like useState', () => {
    const { result } = renderHook(() => useLocalStorage('count', 1));
    act(() => result.current[1]((n) => n + 4));
    expect(result.current[0]).toBe(5);
    expect(localStorage.getItem('count')).toBe('5');
  });

  it('applies queued updater functions in order like useState', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    act(() => {
      result.current[1]((n) => n + 1);
      result.current[1]((n) => n + 1);
    });
    expect(result.current[0]).toBe(2);
  });

  it('keeps other hooks on the same key in sync', () => {
    const first = renderHook(() => useLocalStorage('view', 'grid'));
    const second = renderHook(() => useLocalStorage('view', 'grid'));
    const otherKey = renderHook(() => useLocalStorage('other', 'grid'));

    act(() => first.result.current[1]('table'));

    expect(second.result.current[0]).toBe('table');
    expect(otherKey.result.current[0]).toBe('grid');
  });

  it('picks up changes made in another tab and ignores removals', () => {
    const { result } = renderHook(() => useLocalStorage('view', 'grid'));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'view', newValue: JSON.stringify('table') }));
    });
    expect(result.current[0]).toBe('table');

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'view', newValue: null }));
    });
    expect(result.current[0]).toBe('table');
  });
});
