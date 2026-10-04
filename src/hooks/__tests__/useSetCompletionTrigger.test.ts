import { renderHook } from '@testing-library/react';
import { useSetCompletionTrigger } from '../useConfetti';

describe('useSetCompletionTrigger', () => {
  const setup = (initial: Props) => {
    const celebrate = jest.fn();
    const hook = renderHook((props: Props) => useSetCompletionTrigger({ ...props, celebrate }), {
      initialProps: initial,
    });
    return { celebrate, ...hook };
  };

  it('celebrates when a collection change takes the set to 100%', () => {
    const { celebrate, rerender } = setup(settled('mh3|', 99));
    rerender(fetching('mh3|', 99));
    rerender(settled('mh3|', 100));
    expect(celebrate).toHaveBeenCalledTimes(1);
  });

  it('does not celebrate a set that is already complete when the page loads', () => {
    const { celebrate, rerender } = setup(fetching('mh3|', undefined));
    rerender(settled('mh3|', 100));
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('ignores the paused query while the goal syncs from a ?goalId= link', () => {
    // Paused: no data yet. The old hook read this as 0% and then celebrated the real 100%.
    const { celebrate, rerender } = setup({ resetKey: 'mh3|', isSettled: false, percentageCollected: undefined });
    rerender({ resetKey: 'mh3|7', isSettled: false, percentageCollected: undefined });
    rerender(settled('mh3|7', 100));
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('does not celebrate when switching to a goal that is already complete for this set', () => {
    const { celebrate, rerender } = setup(settled('mh3|7', 80));
    // Mid-switch RTK Query still returns the previous goal's data while fetching.
    rerender(fetching('mh3|8', 80));
    rerender(settled('mh3|8', 100));
    expect(celebrate).not.toHaveBeenCalled();
  });

  // Relies on RTK Query reporting isFetching on the render where the args change, so the previous
  // goal's value is never seen as settled under the new key. If it were, it becomes the baseline.
  it('treats a value settled under a new key as the baseline for that key', () => {
    const { celebrate, rerender } = setup(settled('mh3|7', 80));
    rerender(settled('mh3|8', 80));
    rerender(settled('mh3|8', 100));
    expect(celebrate).toHaveBeenCalledTimes(1);
  });

  it('does not celebrate when navigating to a different, already complete set', () => {
    const { celebrate, rerender } = setup(settled('mh3|', 40));
    rerender(fetching('lea|', 40));
    rerender(settled('lea|', 100));
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('does not celebrate when toggling subsets changes the percentage to 100%', () => {
    const { celebrate, rerender } = setup(settled('mh3||false', 95));
    rerender(settled('mh3||true', 100));
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('ignores values that arrive while a refetch is in flight', () => {
    const { celebrate, rerender } = setup(settled('mh3|', 100));
    rerender(fetching('mh3|', 99));
    rerender(settled('mh3|', 100));
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('celebrates again after dropping below 100% and completing it a second time', () => {
    const { celebrate, rerender } = setup(settled('mh3|', 99));
    rerender(settled('mh3|', 100));
    rerender(settled('mh3|', 99));
    rerender(settled('mh3|', 100));
    expect(celebrate).toHaveBeenCalledTimes(2);
  });
});

const settled = (resetKey: string, percentageCollected: number | undefined): Props => ({
  resetKey,
  isSettled: true,
  percentageCollected,
});

const fetching = (resetKey: string, percentageCollected: number | undefined): Props => ({
  resetKey,
  isSettled: false,
  percentageCollected,
});

interface Props {
  resetKey: string;
  isSettled: boolean;
  percentageCollected: number | undefined;
}
