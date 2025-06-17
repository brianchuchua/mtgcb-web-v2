import { CardApiParams } from '@/api/browse/types';

export interface GoalProgress {
  totalCards: number;
  collectedCards: number;
  percentageCollected: number;
  totalValue: number;
  costToComplete: number;
}

export interface Goal {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  searchCriteria: {
    conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>;
    sort?: string;
    order?: 'asc' | 'desc';
  };
  targetQuantityReg: number | null;
  targetQuantityFoil: number | null;
  targetQuantityAll: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  progress?: GoalProgress;
}

export interface CreateGoalRequest {
  name: string;
  description?: string;
  searchCriteria: {
    conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>;
    sort?: string;
    order?: 'asc' | 'desc';
  };
  targetQuantityReg?: number;
  targetQuantityFoil?: number;
  targetQuantityAll?: number;
}

export interface GetGoalsResponse {
  goals: Goal[];
}

export interface UpdateGoalRequest {
  name: string;
  description?: string;
  searchCriteria: {
    conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>;
    sort?: string;
    order?: 'asc' | 'desc';
  };
  targetQuantityReg?: number | null;
  targetQuantityFoil?: number | null;
  targetQuantityAll?: number | null;
  isActive?: boolean;
}