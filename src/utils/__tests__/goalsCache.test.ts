import { Goal } from '@/api/goals/types';
import { goalsCache } from '@/utils/goalsCache';

const CACHE_KEY = 'mtgcb_goals_cache';
const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date('2026-01-01T00:00:00.000Z').getTime();

const makeGoal = (id: number, name = `Goal ${id}`): Goal =>
  ({
    id,
    userId: 1337,
    name,
    description: null,
    searchCriteria: { conditions: {} },
    targetQuantityReg: null,
    targetQuantityFoil: null,
    targetQuantityAll: 1,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    onePrintingPerPureName: false,
    includeSetsOutsideGoal: false,
  }) as Goal;

const readRaw = () => JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');

describe('goalsCache', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(T0);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns null when nothing is cached', () => {
    expect(goalsCache.getGoal(1337, 1)).toBeNull();
  });

  it('saves goals keyed by id with version, user and timestamp', () => {
    goalsCache.save(1337, [makeGoal(1), makeGoal(2)]);

    expect(readRaw()).toEqual({
      version: 1,
      userId: 1337,
      goals: { 1: makeGoal(1), 2: makeGoal(2) },
      timestamp: T0,
    });
    expect(goalsCache.getGoal(1337, 2)).toEqual(makeGoal(2));
    expect(goalsCache.getGoal(1337, 99)).toBeNull();
  });

  it('clears the cache and returns null for a different user', () => {
    goalsCache.save(1337, [makeGoal(1)]);

    expect(goalsCache.getGoal(42, 1)).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it('clears the cache and returns null on a version mismatch', () => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: 2, userId: 1337, goals: { 1: makeGoal(1) }, timestamp: T0 }),
    );

    expect(goalsCache.getGoal(1337, 1)).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it('keeps entries for exactly 30 days', () => {
    goalsCache.save(1337, [makeGoal(1)]);
    jest.setSystemTime(T0 + 30 * DAY);

    expect(goalsCache.getGoal(1337, 1)).toEqual(makeGoal(1));
  });

  it('expires entries older than 30 days', () => {
    goalsCache.save(1337, [makeGoal(1)]);
    jest.setSystemTime(T0 + 30 * DAY + 1);

    expect(goalsCache.getGoal(1337, 1)).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it('returns null and warns on corrupt JSON', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(CACHE_KEY, '{not json');

    expect(goalsCache.getGoal(1337, 1)).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  describe('updateGoal', () => {
    it('creates a cache when none exists', () => {
      goalsCache.updateGoal(1337, makeGoal(5));

      expect(goalsCache.getGoal(1337, 5)).toEqual(makeGoal(5));
    });

    it('replaces one goal, keeps the rest and refreshes the timestamp', () => {
      goalsCache.save(1337, [makeGoal(1), makeGoal(2)]);
      jest.setSystemTime(T0 + 29 * DAY);

      goalsCache.updateGoal(1337, makeGoal(2, 'Renamed'));
      jest.setSystemTime(T0 + 40 * DAY);

      expect(goalsCache.getGoal(1337, 2)?.name).toBe('Renamed');
      expect(goalsCache.getGoal(1337, 1)).toEqual(makeGoal(1));
      expect(readRaw().timestamp).toBe(T0 + 29 * DAY);
    });

    it('starts a fresh cache when the stored one belongs to another user', () => {
      goalsCache.save(42, [makeGoal(1)]);

      goalsCache.updateGoal(1337, makeGoal(2));

      expect(readRaw().userId).toBe(1337);
      expect(Object.keys(readRaw().goals)).toEqual(['2']);
    });
  });

  it('clear removes the cache', () => {
    goalsCache.save(1337, [makeGoal(1)]);
    goalsCache.clear();

    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => goalsCache.save(1337, [makeGoal(1)])).not.toThrow();
    expect(() => goalsCache.clear()).not.toThrow();
  });
});
