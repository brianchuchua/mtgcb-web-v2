import { renderHook } from '@testing-library/react';
import { useGoalCompletionTrigger } from '../useConfetti';

describe('useGoalCompletionTrigger', () => {
  const setup = (initial: Props) => {
    const celebrate = jest.fn();
    const hook = renderHook((props: Props) => useGoalCompletionTrigger({ ...props, celebrate }), {
      initialProps: initial,
    });
    return { celebrate, ...hook };
  };

  it('celebrates when collecting the last card takes the goal to 100%', () => {
    const { celebrate, rerender } = setup({ goalId: 7, goalSummary: summary(7, 99, 3, 4), enabled: true });
    rerender({ goalId: 7, goalSummary: summary(7, 100, 4, 4), enabled: true });
    expect(celebrate).toHaveBeenCalledTimes(1);
  });

  it('does not celebrate a goal that is already complete when the page loads', () => {
    const { celebrate, rerender } = setup({ goalId: 7, goalSummary: undefined, enabled: true });
    rerender({ goalId: 7, goalSummary: summary(7, 100, 4, 4), enabled: true });
    rerender({ goalId: 7, goalSummary: summary(7, 100, 4, 4), enabled: true });
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('does not celebrate when switching from an incomplete goal to a complete one', () => {
    const { celebrate, rerender } = setup({ goalId: 7, goalSummary: summary(7, 50, 2, 4), enabled: true });
    // Mid-switch the old goal's summary is still showing; it must be ignored.
    rerender({ goalId: 8, goalSummary: summary(7, 50, 2, 4), enabled: true });
    rerender({ goalId: 8, goalSummary: summary(8, 100, 10, 10), enabled: true });
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('does not celebrate when the goal is edited down to 100% rather than collected', () => {
    const { celebrate, rerender } = setup({ goalId: 7, goalSummary: summary(7, 75, 3, 4), enabled: true });
    rerender({ goalId: 7, goalSummary: summary(7, 100, 3, 3), enabled: true });
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('does not celebrate when viewing someone else’s collection', () => {
    const { celebrate, rerender } = setup({ goalId: 7, goalSummary: summary(7, 99, 3, 4), enabled: false });
    rerender({ goalId: 7, goalSummary: summary(7, 100, 4, 4), enabled: false });
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('celebrates again after dropping below 100% and completing it a second time', () => {
    const { celebrate, rerender } = setup({ goalId: 7, goalSummary: summary(7, 99, 3, 4), enabled: true });
    rerender({ goalId: 7, goalSummary: summary(7, 100, 4, 4), enabled: true });
    rerender({ goalId: 7, goalSummary: summary(7, 75, 3, 4), enabled: true });
    rerender({ goalId: 7, goalSummary: summary(7, 100, 4, 4), enabled: true });
    expect(celebrate).toHaveBeenCalledTimes(2);
  });
});

const summary = (goalId: number, percentageCollected: number, collectedCards: number, totalCards: number) => ({
  goalId,
  percentageCollected,
  collectedCards,
  totalCards,
});

interface Props {
  goalId: number | null;
  goalSummary: ReturnType<typeof summary> | undefined;
  enabled: boolean;
}
