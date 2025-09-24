# Card Pluralization Audit Report

## Summary
This report identifies all locations in the codebase where card counts may incorrectly display "1 cards" instead of "1 card" or "1 card(s)".

## Locations Requiring Fixes

### 1. **LocationsList Component** ✅ CORRECT
- **File**: `src/components/locations/LocationsList.tsx:111`
- **Current**: `{location.totalCards} {location.totalCards === 1 ? 'card' : 'cards'}`
- **Status**: Already handles singular/plural correctly

### 2. **GoalsList Component** ❌ NEEDS FIX
- **File**: `src/components/goals/GoalsList.tsx:159`
- **Current**: `{goal.progress.collectedCards} / {goal.progress.totalCards} cards`
- **Issue**: Always uses "cards" even when totalCards is 1
- **Fix needed**: Conditional pluralization

### 3. **SetItemRenderer Component** ❌ NEEDS FIX
- **File**: `src/components/sets/SetItemRenderer.tsx:239`
- **Current**: `{cardCount ? `${cardCount} cards` : 'N/A'}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 4. **CollectionSetItemRenderer Component** ❌ NEEDS FIX
- **File**: `src/components/collections/CollectionSetItemRenderer.tsx:253`
- **Current**: `{cardCount ? `${cardCount} cards` : 'N/A'}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 5. **CollectionSetItemRenderer - Total Cards** ❌ NEEDS FIX
- **File**: `src/components/collections/CollectionSetItemRenderer.tsx:275`
- **Current**: `({collectionData.totalCardsCollectedInSet} total cards)`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 6. **CollectionSetItemRenderer - Percentage Display** ❌ NEEDS FIX
- **File**: `src/components/collections/CollectionSetItemRenderer.tsx:288`
- **Current**: `({percentage}% collected, {collectionData.totalCardsCollectedInSet} total cards)`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 7. **CollectionHeader Component** ❌ NEEDS FIX
- **File**: `src/components/collections/CollectionHeader.tsx:264`
- **Current**: `({totalCardsCollected} total cards collected)`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 8. **SubsetDropdown Component** ❌ NEEDS FIX
- **File**: `src/components/pagination/SubsetDropdown.tsx:153`
- **Current**: `{subset.cardCount ? `${subset.cardCount} cards` : 'N/A'}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 9. **ParentDropdown Component** ❌ NEEDS FIX
- **File**: `src/components/pagination/ParentDropdown.tsx:162`
- **Current**: `{parentSet.cardCount ? `${parentSet.cardCount} cards` : 'N/A'}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 10. **AuthenticatedHomePageClient - Quick Wins** ❌ NEEDS FIX
- **File**: `src/app/AuthenticatedHomePageClient.tsx:489`
- **Current**: `return \`${numValue.toLocaleString()} cards (${percentage}%)\``
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 11. **AuthenticatedHomePageClient - Second Closest Set** ❌ NEEDS FIX
- **File**: `src/app/AuthenticatedHomePageClient.tsx:679`
- **Current**: `{stats.quickWins.secondClosestSetByCost.totalCards} cards`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 12. **TCGPlayerMassImportChunksDialog** ❌ NEEDS FIX
- **File**: `src/components/tcgplayer/TCGPlayerMassImportChunksDialog.tsx:94`
- **Current**: `split your {totalCards} cards into {totalChunks} separate entries.`
- **Issue**: Always uses "cards" even if totalCards is 1
- **Fix needed**: Conditional pluralization

### 13. **TCGPlayerMassImportChunksDialog - Chunk Label** ❌ NEEDS FIX
- **File**: `src/components/tcgplayer/TCGPlayerMassImportChunksDialog.tsx:137`
- **Current**: `label={\`${chunk.length} cards\`}`
- **Issue**: Always uses "cards" regardless of chunk length
- **Fix needed**: Conditional pluralization

### 14. **TCGPlayerSplitByFinishDialog - Regular Cards** ❌ NEEDS FIX
- **File**: `src/components/tcgplayer/TCGPlayerSplitByFinishDialog.tsx:108`
- **Current**: `label={\`${regularCards.length} cards, ${totalRegularQuantity} total\`}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 15. **TCGPlayerSplitByFinishDialog - Foil Cards** ❌ NEEDS FIX
- **File**: `src/components/tcgplayer/TCGPlayerSplitByFinishDialog.tsx:120`
- **Current**: `label={\`${foilCards.length} cards, ${totalFoilQuantity} total\`}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 16. **TCGPlayerSplitByFinishChunksDialog - Regular Chunks** ❌ NEEDS FIX
- **File**: `src/components/tcgplayer/TCGPlayerSplitByFinishChunksDialog.tsx:156`
- **Current**: `label={\`${chunk.length} cards, ${chunkQuantity} total\`}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 17. **TCGPlayerSplitByFinishChunksDialog - Foil Chunks** ❌ NEEDS FIX
- **File**: `src/components/tcgplayer/TCGPlayerSplitByFinishChunksDialog.tsx:201`
- **Current**: `label={\`${chunk.length} cards, ${chunkQuantity} total\`}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 18. **TCGPlayerFoilOnlyDialog** ❌ NEEDS FIX
- **File**: `src/components/tcgplayer/TCGPlayerFoilOnlyDialog.tsx:86`
- **Current**: `label={\`${foilCards.length} cards, ${totalQuantity} total\`}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 19. **SetBrowseClient** ❌ NEEDS FIX
- **File**: `src/app/browse/sets/[setSlug]/SetBrowseClient.tsx:255`
- **Current**: `{set?.cardCount ? \`${set.cardCount} cards\` : 'N/A'}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 20. **SubsetSection** ❌ NEEDS FIX
- **File**: `src/app/browse/sets/[setSlug]/SubsetSection.tsx:150`
- **Current**: `{subset.cardCount ? \`${subset.cardCount} cards\` : 'N/A'}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

### 21. **SubsetSection - Second Instance** ❌ NEEDS FIX
- **File**: `src/app/browse/sets/[setSlug]/SubsetSection.tsx:269`
- **Current**: `{subset.cardCount ? \`${subset.cardCount} cards\` : 'N/A'}`
- **Issue**: Always uses "cards" regardless of count
- **Fix needed**: Conditional pluralization

## Recommended Solution Pattern

Replace instances like:
```typescript
`${count} cards`
```

With:
```typescript
`${count} ${count === 1 ? 'card' : 'cards'}`
```

Or create a utility function:
```typescript
const pluralizeCards = (count: number): string => {
  return count === 1 ? 'card' : 'cards';
};

// Usage:
`${count} ${pluralizeCards(count)}`
```

## Notes

- The Pagination component appears to handle pluralization correctly for both "cards" and "sets"
- Some instances already handle pluralization correctly (e.g., LocationsList)
- Consider creating a centralized pluralization utility to ensure consistency across the codebase