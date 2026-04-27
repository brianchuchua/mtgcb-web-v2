import { act, renderHook } from '@testing-library/react';
import { usePersistedBoolean } from '../usePersistedBoolean';

describe('usePersistedBoolean', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the default value when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedBoolean('test-key-1', false));
    expect(result.current[0]).toBe(false);
  });

  it('reads the stored value on mount and overrides the default', () => {
    window.localStorage.setItem('test-key-2', JSON.stringify(true));
    const { result } = renderHook(() => usePersistedBoolean('test-key-2', false));
    // useEffect runs synchronously in the renderHook call, applying the stored value.
    expect(result.current[0]).toBe(true);
  });

  it('persists the toggled value to localStorage', () => {
    const { result } = renderHook(() => usePersistedBoolean('test-key-3', false));
    expect(result.current[0]).toBe(false);
    act(() => {
      result.current[1](); // toggle
    });
    expect(result.current[0]).toBe(true);
    expect(window.localStorage.getItem('test-key-3')).toBe('true');
  });

  it('toggling twice flips back to the default and writes that to storage', () => {
    const { result } = renderHook(() => usePersistedBoolean('test-key-4', false));
    act(() => {
      result.current[1]();
      result.current[1]();
    });
    expect(result.current[0]).toBe(false);
    expect(window.localStorage.getItem('test-key-4')).toBe('false');
  });

  it('explicit set() writes the value directly without toggling', () => {
    const { result } = renderHook(() => usePersistedBoolean('test-key-5', false));
    act(() => {
      result.current[2](true); // setter
    });
    expect(result.current[0]).toBe(true);
    expect(window.localStorage.getItem('test-key-5')).toBe('true');
  });

  it('falls back to the default if the stored value is malformed JSON', () => {
    window.localStorage.setItem('test-key-6', '{not valid json}');
    const { result } = renderHook(() => usePersistedBoolean('test-key-6', true));
    expect(result.current[0]).toBe(true);
  });

  it('falls back to the default if the stored value is the wrong type', () => {
    window.localStorage.setItem('test-key-7', JSON.stringify(42));
    const { result } = renderHook(() => usePersistedBoolean('test-key-7', false));
    expect(result.current[0]).toBe(false);
  });

  it('two hooks reading the same key see the value the other one wrote on next mount', () => {
    const { result: a } = renderHook(() => usePersistedBoolean('test-key-shared', false));
    act(() => {
      a.current[2](true);
    });
    expect(window.localStorage.getItem('test-key-shared')).toBe('true');
    // Fresh hook — sees the stored value via the mount effect.
    const { result: b } = renderHook(() => usePersistedBoolean('test-key-shared', false));
    expect(b.current[0]).toBe(true);
  });
});
