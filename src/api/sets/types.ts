import { Set } from '@/types/sets';

export interface CostToComplete {
  oneOfEachCard: number;
  oneOfEachMythic: number;
  oneOfEachRare: number;
  oneOfEachUncommon: number;
  oneOfEachCommon: number;
  fourOfEachCard: number;
  fourOfEachMythic: number;
  fourOfEachRare: number;
  fourOfEachUncommon: number;
  fourOfEachCommon: number;
  draftCube: number;
  totalValue: number;
}

export interface SetWithCostToComplete extends Set {
  costToComplete?: CostToComplete;
}

export interface CostToCompleteResponse {
  sets: SetWithCostToComplete[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface CostToCompleteParams {
  priceType: 'market' | 'low' | 'average' | 'high';
  includeSubsetsInSets?: boolean;
}

export interface AllSetsResponse {
  sets: Set[];
}
