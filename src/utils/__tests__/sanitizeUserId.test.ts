import { isValidUserId, stripInvalidUserId } from '../sanitizeUserId';

describe('isValidUserId', () => {
  it('accepts positive integers', () => {
    expect(isValidUserId(1)).toBe(true);
    expect(isValidUserId(42)).toBe(true);
    expect(isValidUserId(2147483647)).toBe(true);
  });

  it('rejects zero', () => {
    expect(isValidUserId(0)).toBe(false);
  });

  it('rejects negative numbers', () => {
    expect(isValidUserId(-1)).toBe(false);
    expect(isValidUserId(-9999)).toBe(false);
  });

  it('rejects non-integer numbers', () => {
    expect(isValidUserId(1.5)).toBe(false);
    expect(isValidUserId(0.1)).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    expect(isValidUserId(NaN)).toBe(false);
    expect(isValidUserId(Infinity)).toBe(false);
    expect(isValidUserId(-Infinity)).toBe(false);
  });

  it('rejects non-number types', () => {
    expect(isValidUserId(undefined)).toBe(false);
    expect(isValidUserId(null)).toBe(false);
    expect(isValidUserId('1')).toBe(false);
    expect(isValidUserId('abc')).toBe(false);
    expect(isValidUserId({})).toBe(false);
    expect(isValidUserId([])).toBe(false);
    expect(isValidUserId(true)).toBe(false);
  });
});

describe('stripInvalidUserId', () => {
  it('returns params unchanged when userId is missing', () => {
    const params = { name: 'Lightning Bolt', limit: 20 };
    expect(stripInvalidUserId(params)).toEqual(params);
  });

  it('returns params unchanged when userId is a valid positive integer', () => {
    const params = { userId: 42, name: 'Lightning Bolt', limit: 20 };
    const result = stripInvalidUserId(params);
    expect(result).toEqual(params);
    expect(result.userId).toBe(42);
  });

  it('strips userId when it is 0 (the production bug)', () => {
    const params = { userId: 0, name: 'Lightning Bolt', limit: 20 };
    const result = stripInvalidUserId(params);
    expect(result).not.toHaveProperty('userId');
    expect(result).toEqual({ name: 'Lightning Bolt', limit: 20 });
  });

  it('strips userId when it is negative', () => {
    const params = { userId: -1, name: 'Lightning Bolt' };
    const result = stripInvalidUserId(params);
    expect(result).not.toHaveProperty('userId');
  });

  it('strips userId when it is a non-integer number', () => {
    const params = { userId: 1.5 };
    const result = stripInvalidUserId(params);
    expect(result).not.toHaveProperty('userId');
  });

  it('strips userId when it is NaN', () => {
    const params = { userId: NaN };
    const result = stripInvalidUserId(params);
    expect(result).not.toHaveProperty('userId');
  });

  it('does not mutate the original params', () => {
    const params = { userId: 0, name: 'Lightning Bolt' };
    const result = stripInvalidUserId(params);
    expect(params).toHaveProperty('userId', 0);
    expect(result).not.toBe(params);
  });

  it('preserves all other fields when stripping userId', () => {
    const params = {
      userId: 0,
      name: 'Lightning Bolt',
      goalId: 5,
      limit: 20,
      offset: 0,
      sortBy: 'releasedAt',
    };
    const result = stripInvalidUserId(params);
    expect(result).toEqual({
      name: 'Lightning Bolt',
      goalId: 5,
      limit: 20,
      offset: 0,
      sortBy: 'releasedAt',
    });
  });
});
