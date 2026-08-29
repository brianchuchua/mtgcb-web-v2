/**
 * The "Searching cards: …" line under the results.
 *
 * It used to copy a hand-written list of fields out of the API params, so every
 * filter added since that list was written reported "cards: all" — the search
 * was correct, the sentence describing it was not. The list is now an exclusion
 * list of paging/ordering keys, and these tests exist to keep it that way: the
 * drift guard at the bottom fails when a new filter reaches the API without
 * reaching the sentence.
 */

import { BrowseSearchParams } from '@/types/browse';
import { formatSearchDescription } from '@/utils/search/formatSearchDescription';

const describeCards = (searchParams: Partial<BrowseSearchParams>) =>
  formatSearchDescription(searchParams as BrowseSearchParams, 'cards');

describe('formatSearchDescription — treatments', () => {
  it('describes the frame era', () => {
    expect(describeCards({ frameStyles: { include: ['1997'], exclude: [] } })).toContain('1997 Retro frame');
  });

  it('describes the release date', () => {
    expect(describeCards({ releaseDate: { from: '2019' } })).toContain('released 2019 or later');
  });

  it('describes border colours', () => {
    expect(describeCards({ borderColors: { include: ['borderless'], exclude: [] } })).toContain(
      'Borderless border',
    );
  });

  it('describes frame effects', () => {
    expect(describeCards({ frameEffects: { include: ['showcase'], exclude: [] } })).toContain('Showcase');
  });

  it('describes the full art filter', () => {
    expect(describeCards({ isFullArt: true })).toContain('Full Art');
  });

  it('describes the reserved list filter', () => {
    expect(describeCards({ isReserved: true })).toContain('Reserved');
  });
});

describe('formatSearchDescription — the retro frame search', () => {
  it('describes both halves of the query', () => {
    const description = describeCards({
      frameStyles: { include: ['1993', '1997'], exclude: [] },
      releaseDate: { from: '2019' },
    });

    expect(description).toContain('1993 Original/1997 Retro frame');
    expect(description).toContain('released 2019 or later');
  });

  it('describes a two-sided window', () => {
    expect(
      describeCards({
        frameStyles: { include: ['1997'], exclude: [] },
        releaseDate: { from: '2019', to: '2021' },
      }),
    ).toContain('released 2019 to 2021');
  });
});

/**
 * Colour, rarity, type and layout supply the noun the parenthesised attributes
 * qualify. With none of them set the sentence still needs one, or a frame-only
 * search reads "Searching (1997 Retro frame)".
 */
describe('formatSearchDescription — attribute-only searches keep a noun', () => {
  it.each([
    ['frame era', { frameStyles: { include: ['1997'], exclude: [] } }],
    ['release date', { releaseDate: { from: '2019' } }],
    ['border colour', { borderColors: { include: ['borderless'], exclude: [] } }],
    ['full art', { isFullArt: true }],
  ])('names cards for a %s search', (_label, params) => {
    expect(describeCards(params as Partial<BrowseSearchParams>)).toMatch(/^cards:/);
  });

  it('does not add a second noun when one is already there', () => {
    const description = describeCards({
      rarities: { include: ['4'], exclude: [] },
      frameStyles: { include: ['1997'], exclude: [] },
    });

    expect(description).toBe('cards: Rare (1997 Retro frame)');
  });
});

describe('formatSearchDescription — no filters', () => {
  it('still says "all" when nothing is set', () => {
    expect(describeCards({})).toBe('cards: all');
  });

  /**
   * These reach the API but describe how to run the search, not what it matches,
   * so they must not flip the sentence away from "all".
   */
  it.each([
    ['sortBy', { sortBy: 'name' as const }],
    ['sortOrder', { sortOrder: 'desc' as const }],
    ['pageSize', { pageSize: 100 }],
    ['currentPage', { currentPage: 3 }],
    ['viewMode', { viewMode: 'table' as const }],
  ])('is unaffected by %s', (_label, params) => {
    expect(describeCards(params)).toBe('cards: all');
  });
});

/**
 * The drift guard. Every filter the user can set has to change the sentence —
 * if one does not, the sentence is lying about what is being searched.
 */
describe('formatSearchDescription — no filter is silently undescribed', () => {
  const FILTERS: Array<[string, Partial<BrowseSearchParams>]> = [
    ['name', { name: 'Bolt' }],
    ['oracleText', { oracleText: 'flying' }],
    ['artist', { artist: 'Rebecca Guay' }],
    ['types', { types: { include: ['Creature'], exclude: [] } }],
    ['layouts', { layouts: { include: ['normal'], exclude: [] } }],
    ['rarities', { rarities: { include: ['4'], exclude: [] } }],
    ['borderColors', { borderColors: { include: ['borderless'], exclude: [] } }],
    ['frameStyles', { frameStyles: { include: ['1997'], exclude: [] } }],
    ['frameEffects', { frameEffects: { include: ['showcase'], exclude: [] } }],
    ['releaseDate', { releaseDate: { from: '2019' } }],
    ['isFullArt', { isFullArt: true }],
    ['isReserved', { isReserved: true }],
    ['formatsLegal', { formatsLegal: { include: ['modern'], exclude: [] } }],
    ['stats', { stats: { convertedManaCost: ['gte3'] } }],
    ['colors', { colors: { colors: ['W'], matchType: 'atLeast' } }],
  ];

  it.each(FILTERS)('%s changes the description', (_label, params) => {
    expect(describeCards(params)).not.toBe('cards: all');
  });
});
