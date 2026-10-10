// Matches "Basic Land — Forest", "Basic Snow Land — Island" and Wastes ("Basic Land").
// Same rule as the API's isBasicLand (mtgcb-api-v3 src/features/cards/isBasicLand.ts).
const BASIC_LAND_TYPE_LINE_REGEX = /^basic.*land/i;

export const isBasicLand = (typeLine?: string | null): boolean =>
  !!typeLine && BASIC_LAND_TYPE_LINE_REGEX.test(typeLine);
