import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { useGetGoalQuery } from '@/api/goals/goalsApi';
import { useAuth } from '@/hooks/useAuth';
import { useViewModeToggle } from '@/hooks/useViewModeToggle';
import { setSelectedGoalId } from '@/redux/slices/browse';
import { makeStore } from '@/redux/store';

jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/api/goals/goalsApi', () => ({ useGetGoalQuery: jest.fn() }));

const mockUseAuth = useAuth as jest.Mock;
const mockUseGetGoalQuery = useGetGoalQuery as jest.Mock;

const setup = ({ goalId, onePrintingPerPureName }: { goalId?: number; onePrintingPerPureName?: boolean }) => {
  mockUseGetGoalQuery.mockReturnValue({
    data: onePrintingPerPureName === undefined ? undefined : { data: { id: goalId, onePrintingPerPureName } },
  });
  const store = makeStore();
  if (goalId) store.dispatch(setSelectedGoalId(goalId));
  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useViewModeToggle(), { wrapper });
  return { store, result, browse: () => store.getState().browse };
};

beforeEach(() => {
  mockUseAuth.mockReset().mockReturnValue({ user: { userId: 1337 } });
  mockUseGetGoalQuery.mockReset();
});

describe('useViewModeToggle', () => {
  it('switches the view', () => {
    const { result, browse } = setup({});
    act(() => result.current.handleViewModeChange('cards'));
    expect(browse().viewContentType).toBe('cards');
    act(() => result.current.handleViewModeChange('sets'));
    expect(browse().viewContentType).toBe('sets');
  });

  it('skips the goal lookup with no goal selected', () => {
    setup({});
    expect(mockUseGetGoalQuery).toHaveBeenCalledWith({ userId: 1337, goalId: 0 }, { skip: true });
  });

  it('skips the goal lookup when logged out', () => {
    mockUseAuth.mockReturnValue({ user: null });
    setup({ goalId: 5 });
    expect(mockUseGetGoalQuery).toHaveBeenCalledWith({ userId: 0, goalId: 5 }, { skip: true });
  });

  it('turns on one result per card name for a one-printing goal when moving to cards', () => {
    const { result, browse } = setup({ goalId: 5, onePrintingPerPureName: true });
    expect(mockUseGetGoalQuery).toHaveBeenCalledWith({ userId: 1337, goalId: 5 }, { skip: false });

    act(() => result.current.handleViewModeChange('cards'));

    expect(browse().cardsSearchParams.oneResultPerCardName).toBe(true);
  });

  it('leaves the setting alone for other goals', () => {
    const { result, browse } = setup({ goalId: 5, onePrintingPerPureName: false });
    act(() => result.current.handleViewModeChange('cards'));
    expect(browse().cardsSearchParams).not.toHaveProperty('oneResultPerCardName');
  });

  it('does not touch the setting when moving to sets', () => {
    const { result, browse } = setup({ goalId: 5, onePrintingPerPureName: true });
    act(() => result.current.handleViewModeChange('sets'));
    expect(browse().cardsSearchParams).not.toHaveProperty('oneResultPerCardName');
  });
});
