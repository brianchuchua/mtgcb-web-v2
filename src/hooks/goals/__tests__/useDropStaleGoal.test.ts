import { isUnknownGoal } from '../useDropStaleGoal';
import { forgetStoredGoal } from '@/hooks/useSearchStateSync';

const goal = (id: number, isActive = true) => ({ id, isActive }) as any;
const response = (ids: number[], totalCount = ids.length) =>
  ({ success: true, data: { goals: ids.map((id) => goal(id)), totalCount, limit: 500, offset: 0 } }) as any;

describe('isUnknownGoal', () => {
  it('is false when no goal is selected', () => {
    expect(isUnknownGoal(null, response([1]))).toBe(false);
  });

  it('is false until the goal list has loaded', () => {
    expect(isUnknownGoal(5, undefined)).toBe(false);
    expect(isUnknownGoal(5, { success: false, data: null } as any)).toBe(false);
  });

  it('is false when the goal is in the list, active or not', () => {
    expect(isUnknownGoal(2, response([1, 2]))).toBe(false);
    const inactive = { success: true, data: { goals: [goal(2, false)], totalCount: 1, limit: 500, offset: 0 } } as any;
    expect(isUnknownGoal(2, inactive)).toBe(false);
  });

  it('is true when a complete list does not have the goal (deleted or someone else\'s)', () => {
    expect(isUnknownGoal(9, response([1, 2]))).toBe(true);
    expect(isUnknownGoal(9, response([]))).toBe(true);
  });

  it('is false when the list is only a partial page', () => {
    expect(isUnknownGoal(9, response([1, 2], 600))).toBe(false);
  });
});

describe('forgetStoredGoal', () => {
  const read = (view: string) => JSON.parse(sessionStorage.getItem(`mtgcb_search_state_${view}`) ?? 'null');

  beforeEach(() => sessionStorage.clear());

  it('removes the goal and showGoals from both views but keeps other fields', () => {
    sessionStorage.setItem('mtgcb_search_state_cards', JSON.stringify({ selectedGoalId: 7, showGoals: 'incomplete', name: 'bolt' }));
    sessionStorage.setItem('mtgcb_search_state_sets', JSON.stringify({ selectedGoalId: 7 }));

    forgetStoredGoal();

    expect(read('cards')).toEqual({ name: 'bolt' });
    expect(read('sets')).toBeNull();
  });

  it('only removes the given goal', () => {
    sessionStorage.setItem('mtgcb_search_state_cards', JSON.stringify({ selectedGoalId: 7 }));

    forgetStoredGoal(8);
    expect(read('cards')).toEqual({ selectedGoalId: 7 });

    forgetStoredGoal(7);
    expect(read('cards')).toBeNull();
  });

  it('handles a goal stored in only one view', () => {
    sessionStorage.setItem('mtgcb_search_state_sets', JSON.stringify({ selectedGoalId: 7, setTypes: ['core'] }));

    forgetStoredGoal(7);

    expect(read('sets')).toEqual({ setTypes: ['core'] });
    expect(read('cards')).toBeNull();
  });

  it('leaves a view with no stored goal untouched, even if it has showGoals', () => {
    sessionStorage.setItem('mtgcb_search_state_cards', JSON.stringify({ showGoals: 'complete', name: 'bolt' }));

    forgetStoredGoal();

    expect(read('cards')).toEqual({ showGoals: 'complete', name: 'bolt' });
  });

  it('does nothing when storage is empty', () => {
    expect(() => forgetStoredGoal(7)).not.toThrow();
    expect(sessionStorage.length).toBe(0);
  });

  it('does not throw on corrupt stored state', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.setItem('mtgcb_search_state_cards', '{not json');

    expect(() => forgetStoredGoal(7)).not.toThrow();
    expect(sessionStorage.getItem('mtgcb_search_state_cards')).toBe('{not json');
    warn.mockRestore();
  });
});
