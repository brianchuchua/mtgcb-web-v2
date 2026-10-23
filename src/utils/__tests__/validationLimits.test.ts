import {
  COLLECTION_QUANTITY_DELTA_MAX,
  COLLECTION_QUANTITY_DELTA_MIN,
  COLLECTION_QUANTITY_MAX,
  COLLECTION_QUANTITY_MIN,
  GOAL_TARGET_QUANTITY_MAX,
  GOAL_TARGET_QUANTITY_MIN,
  SEARCH_TEXT_MAX_LENGTH,
  clampCollectionQuantity,
  clampCollectionQuantityDelta,
  clampGoalTargetQuantity,
} from '@/utils/validationLimits';

describe('validation limits mirror the API', () => {
  it('exposes the API bounds', () => {
    expect([COLLECTION_QUANTITY_MIN, COLLECTION_QUANTITY_MAX]).toEqual([0, 9999]);
    expect([COLLECTION_QUANTITY_DELTA_MIN, COLLECTION_QUANTITY_DELTA_MAX]).toEqual([-9999, 9999]);
    expect([GOAL_TARGET_QUANTITY_MIN, GOAL_TARGET_QUANTITY_MAX]).toEqual([1, 9999]);
    expect(SEARCH_TEXT_MAX_LENGTH).toBe(2000);
  });
});

describe.each([
  ['clampCollectionQuantity', clampCollectionQuantity, 0, 9999],
  ['clampCollectionQuantityDelta', clampCollectionQuantityDelta, -9999, 9999],
  ['clampGoalTargetQuantity', clampGoalTargetQuantity, 1, 9999],
])('%s', (_name, clamp, min, max) => {
  it('keeps in-range values', () => {
    expect(clamp(min)).toBe(min);
    expect(clamp(max)).toBe(max);
    expect(clamp(5)).toBe(5);
  });

  it('clamps values just outside the range', () => {
    expect(clamp(min - 1)).toBe(min);
    expect(clamp(max + 1)).toBe(max);
  });

  it('clamps infinities', () => {
    expect(clamp(Infinity)).toBe(max);
    expect(clamp(-Infinity)).toBe(min);
  });

  // Callers parse with `parseInt(...) || 0` before clamping, so NaN never reaches here in practice.
  it('passes NaN through unchanged (current behavior)', () => {
    expect(clamp(NaN)).toBeNaN();
  });

  it('does not round fractional values', () => {
    expect(clamp(2.5)).toBe(2.5);
  });
});
