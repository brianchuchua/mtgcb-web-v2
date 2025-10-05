import { Goal } from '@/api/goals/types';

interface GoalsCacheData {
  version: number;
  userId: number;
  goals: Record<number, Goal>; // Keyed by goal ID for fast lookup
  timestamp: number;
}

const CACHE_KEY = 'mtgcb_goals_cache';
const CACHE_VERSION = 1;
const MAX_CACHE_AGE_DAYS = 30;

export const goalsCache = {
  /**
   * Save goals to localStorage, keyed by ID
   */
  save(userId: number, goals: Goal[]): void {
    const goalsById = goals.reduce((acc, goal) => {
      acc[goal.id] = goal;
      return acc;
    }, {} as Record<number, Goal>);

    const cacheData: GoalsCacheData = {
      version: CACHE_VERSION,
      userId,
      goals: goalsById,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Failed to cache goals:', e);
    }
  },

  /**
   * Get a single goal by ID from localStorage
   * Returns null if cache is invalid or goal doesn't exist
   */
  getGoal(userId: number, goalId: number): Goal | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: GoalsCacheData = JSON.parse(cached);

      // Version check
      if (data.version !== CACHE_VERSION) {
        this.clear();
        return null;
      }

      // User check
      if (data.userId !== userId) {
        this.clear();
        return null;
      }

      // Age check - clear if older than 30 days
      const age = Date.now() - data.timestamp;
      const maxAge = MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
      if (age > maxAge) {
        this.clear();
        return null;
      }

      return data.goals[goalId] || null;
    } catch (e) {
      console.warn('Failed to load goal from cache:', e);
      return null;
    }
  },

  /**
   * Update a single goal in the cache
   */
  updateGoal(userId: number, goal: Goal): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        // No cache exists, create new one with just this goal
        this.save(userId, [goal]);
        return;
      }

      const data: GoalsCacheData = JSON.parse(cached);

      // Verify user matches
      if (data.userId !== userId) {
        this.save(userId, [goal]);
        return;
      }

      // Update the goal
      data.goals[goal.id] = goal;
      data.timestamp = Date.now();

      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to update goal in cache:', e);
    }
  },


  /**
   * Clear the entire cache
   */
  clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {
      console.warn('Failed to clear goals cache:', e);
    }
  },
};
