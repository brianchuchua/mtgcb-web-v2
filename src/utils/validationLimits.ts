/**
 * Numeric validation limits that mirror the API's request-body schema bounds.
 * Keep in sync with mtgcb-api-v3 CLAUDE.md "Numeric Limits" section.
 */

export const COLLECTION_QUANTITY_MIN = 0;
export const COLLECTION_QUANTITY_MAX = 9999;

export const COLLECTION_QUANTITY_DELTA_MIN = -9999;
export const COLLECTION_QUANTITY_DELTA_MAX = 9999;

export const GOAL_TARGET_QUANTITY_MIN = 1;
export const GOAL_TARGET_QUANTITY_MAX = 9999;

export const clampCollectionQuantity = (value: number): number =>
  Math.min(COLLECTION_QUANTITY_MAX, Math.max(COLLECTION_QUANTITY_MIN, value));

export const clampCollectionQuantityDelta = (value: number): number =>
  Math.min(COLLECTION_QUANTITY_DELTA_MAX, Math.max(COLLECTION_QUANTITY_DELTA_MIN, value));

export const clampGoalTargetQuantity = (value: number): number =>
  Math.min(GOAL_TARGET_QUANTITY_MAX, Math.max(GOAL_TARGET_QUANTITY_MIN, value));
