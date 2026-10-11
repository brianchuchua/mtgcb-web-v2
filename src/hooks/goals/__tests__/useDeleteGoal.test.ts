import { act } from '@testing-library/react';
import { createTestStore, renderHookWithRedux } from '@/__tests__/utils/testUtils';
import { setSelectedGoalId, setShowGoals } from '@/redux/slices/browse';
import { useDeleteGoal } from '../useDeleteGoal';

const mockDelete = jest.fn();
jest.mock('@/api/goals/goalsApi', () => ({
  useDeleteGoalMutation: () => [mockDelete, { isLoading: false }],
}));

const mockSnackbar = jest.fn();
jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockSnackbar }),
}));

const goal = (id: number) => ({ id, name: `Goal ${id}` }) as any;
const stored = (view: 'cards' | 'sets') => JSON.parse(sessionStorage.getItem(`mtgcb_search_state_${view}`) ?? 'null');

const succeed = () => mockDelete.mockReturnValue({ unwrap: () => Promise.resolve({ success: true }) });
const fail = () => mockDelete.mockReturnValue({ unwrap: () => Promise.reject(new Error('nope')) });

const setup = (selectedGoalId: number | null, options?: Parameters<typeof useDeleteGoal>[1]) => {
  const store = createTestStore();
  if (selectedGoalId != null) {
    store.dispatch(setSelectedGoalId(selectedGoalId));
    store.dispatch(setShowGoals('incomplete'));
    sessionStorage.setItem(
      'mtgcb_search_state_cards',
      JSON.stringify({ selectedGoalId, showGoals: 'incomplete', name: 'bolt' }),
    );
    sessionStorage.setItem('mtgcb_search_state_sets', JSON.stringify({ selectedGoalId }));
  }
  return renderHookWithRedux(() => useDeleteGoal(5, options), { store });
};

const deleteGoal = async (result: { current: ReturnType<typeof useDeleteGoal> }, id: number) => {
  act(() => result.current.handleDeleteClick(goal(id)));
  await act(() => result.current.handleConfirmDelete());
};

const goalIds = (store: ReturnType<typeof createTestStore>) => [
  store.getState().browse.cardsSearchParams.selectedGoalId ?? null,
  store.getState().browse.setsSearchParams.selectedGoalId ?? null,
];

beforeEach(() => {
  sessionStorage.clear();
  mockDelete.mockReset();
  mockSnackbar.mockReset();
});

describe('useDeleteGoal', () => {
  it('clears the selected goal everywhere when it is the one deleted', async () => {
    succeed();
    const onSuccess = jest.fn();
    const { store, result } = setup(7, { onSuccess });

    await deleteGoal(result, 7);

    expect(mockDelete).toHaveBeenCalledWith({ userId: 5, goalId: 7 });
    expect(goalIds(store)).toEqual([null, null]);
    expect(store.getState().browse.cardsSearchParams.showGoals).toBeUndefined();
    expect(stored('cards')).toEqual({ name: 'bolt' });
    expect(stored('sets')).toBeNull();
    expect(mockSnackbar).toHaveBeenCalledWith('Goal deleted', { variant: 'success' });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('keeps the selected goal when a different goal is deleted', async () => {
    succeed();
    const { store, result } = setup(7);

    await deleteGoal(result, 8);

    expect(goalIds(store)).toEqual([7, 7]);
    expect(store.getState().browse.cardsSearchParams.showGoals).toBe('incomplete');
    expect(stored('cards')).toEqual({ selectedGoalId: 7, showGoals: 'incomplete', name: 'bolt' });
    expect(stored('sets')).toEqual({ selectedGoalId: 7 });
  });

  it('clears a stored goal even when Redux has no goal selected (deleting from the Goals page)', async () => {
    succeed();
    const { store, result } = setup(null);
    sessionStorage.setItem('mtgcb_search_state_cards', JSON.stringify({ selectedGoalId: 7 }));

    await deleteGoal(result, 7);

    expect(stored('cards')).toBeNull();
    expect(goalIds(store)).toEqual([null, null]);
  });

  it('keeps everything when the delete fails', async () => {
    fail();
    const onError = jest.fn();
    const { store, result } = setup(7, { onError });

    await deleteGoal(result, 7);

    expect(goalIds(store)).toEqual([7, 7]);
    expect(stored('sets')).toEqual({ selectedGoalId: 7 });
    expect(mockSnackbar).toHaveBeenCalledWith('Failed to delete goal', { variant: 'error' });
    expect(onError).toHaveBeenCalled();
  });

  it('closes the dialog after deleting, and does nothing when no goal was picked', async () => {
    succeed();
    const { result } = setup(7);

    await act(() => result.current.handleConfirmDelete());
    expect(mockDelete).not.toHaveBeenCalled();

    await deleteGoal(result, 7);
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.goalToDelete).toBeNull();
  });

  it('cancelling keeps the goal', () => {
    const { store, result } = setup(7);
    act(() => result.current.handleDeleteClick(goal(7)));
    act(() => result.current.handleCancelDelete());
    expect(mockDelete).not.toHaveBeenCalled();
    expect(goalIds(store)).toEqual([7, 7]);
  });
});
