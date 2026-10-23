import { act, renderHook } from '@testing-library/react';
import { useSessionStorage } from '@/hooks/useSessionStorage';

describe('useSessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the initial value and is ready when nothing is stored', () => {
    const { result } = renderHook(() => useSessionStorage('prefs', { size: 20 }));
    expect(result.current[0]).toEqual({ size: 20 });
    expect(result.current[2]).toBe(true);
    expect(sessionStorage.getItem('prefs')).toBeNull();
  });

  it('loads the stored JSON value after mount', () => {
    sessionStorage.setItem('prefs', JSON.stringify({ size: 50 }));
    const { result } = renderHook(() => useSessionStorage('prefs', { size: 20 }));
    expect(result.current[0]).toEqual({ size: 50 });
  });

  it('falls back to the initial value when the stored value is not JSON', () => {
    sessionStorage.setItem('prefs', '{oops');
    const { result } = renderHook(() => useSessionStorage('prefs', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('saves new values as JSON', () => {
    const { result } = renderHook(() => useSessionStorage<number[]>('ids', []));
    act(() => result.current[1]([1, 2]));
    expect(result.current[0]).toEqual([1, 2]);
    expect(sessionStorage.getItem('ids')).toBe('[1,2]');
  });

  it('accepts an updater function like useState', () => {
    const { result } = renderHook(() => useSessionStorage('count', 1));
    act(() => result.current[1]((n) => n + 4));
    expect(result.current[0]).toBe(5);
    expect(sessionStorage.getItem('count')).toBe('5');
  });

  it('applies queued updater functions in order like useState', () => {
    const { result } = renderHook(() => useSessionStorage('count', 0));
    act(() => {
      result.current[1]((n) => n + 1);
      result.current[1]((n) => n + 1);
    });
    expect(result.current[0]).toBe(2);
  });

  it('keeps other hooks on the same key in sync', () => {
    const first = renderHook(() => useSessionStorage('view', 'grid'));
    const second = renderHook(() => useSessionStorage('view', 'grid'));
    const otherKey = renderHook(() => useSessionStorage('other', 'grid'));

    act(() => first.result.current[1]('table'));

    expect(second.result.current[0]).toBe('table');
    expect(otherKey.result.current[0]).toBe('grid');
  });

  it('picks up changes made in another tab and ignores removals', () => {
    const { result } = renderHook(() => useSessionStorage('view', 'grid'));
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
