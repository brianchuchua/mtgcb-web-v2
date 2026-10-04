import { act, renderHook } from '@testing-library/react';
import { useConfettiBurst } from '../useConfetti';

describe('useConfettiBurst', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows confetti and stops spawning new pieces after 5 seconds', () => {
    const { result } = renderHook(() => useConfettiBurst());
    act(() => result.current.celebrate());
    expect(result.current.showConfetti).toBe(true);
    expect(result.current.recycleConfetti).toBe(true);

    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.recycleConfetti).toBe(false);

    act(() => result.current.handleConfettiComplete());
    expect(result.current.showConfetti).toBe(false);
  });

  it('still stops spawning when a second celebration lands mid-burst', () => {
    const { result } = renderHook(() => useConfettiBurst());
    act(() => result.current.celebrate());
    act(() => jest.advanceTimersByTime(3000));
    act(() => result.current.celebrate());
    act(() => jest.advanceTimersByTime(4999));
    expect(result.current.recycleConfetti).toBe(true);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.recycleConfetti).toBe(false);
  });
});
