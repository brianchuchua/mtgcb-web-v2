import { CardApiParams } from '@/api/browse/types';
import { formatSearchCriteria } from '@/utils/goals/formatSearchCriteria';

const describeGoal = (conditions: Partial<CardApiParams>) =>
  formatSearchCriteria({ conditions } as Parameters<typeof formatSearchCriteria>[0]);

describe('formatSearchCriteria — frame styles', () => {
  it('names the included era rather than echoing the raw year', () => {
    expect(describeGoal({ frameStyle: { OR: ['1997'] } })).toContain('1997 Retro frame');
  });

  it('joins several eras', () => {
    const summary = describeGoal({ frameStyle: { OR: ['1993', '1997'] } });

    expect(summary).toContain('1993 Original/1997 Retro frame');
  });

  it('phrases an exclusion as an exclusion', () => {
    expect(describeGoal({ frameStyle: { NOT: ['2015'] } })).toContain('excluding 2015 Current frame');
  });

  it('strips the quotes a saved goal may carry', () => {
    expect(describeGoal({ frameStyle: { OR: ['"1997"'] } })).toContain('1997 Retro frame');
  });

  it('says nothing about frames when the goal has no frame criterion', () => {
    expect(describeGoal({ name: 'Lightning Bolt' })).not.toContain('frame');
  });
});

describe('formatSearchCriteria — release date', () => {
  it('phrases a two-sided window as a range', () => {
    expect(describeGoal({ releasedAt: { AND: ['>=2019', '<=2021'] } })).toContain('released 2019 to 2021');
  });

  it('phrases a from-only window as an open end', () => {
    expect(describeGoal({ releasedAt: '>=2019' })).toContain('released 2019 or later');
  });

  it('phrases a to-only window as an open start', () => {
    expect(describeGoal({ releasedAt: '<=2003' })).toContain('released 2003 or earlier');
  });

  it('collapses a window whose bounds are equal', () => {
    expect(describeGoal({ releasedAt: { AND: ['>=2019-07', '<=2019-07'] } })).toContain('released 2019-07');
  });

  it('phrases a bare date as an exact date', () => {
    expect(describeGoal({ releasedAt: '2022-11-18' })).toContain('released 2022-11-18');
  });

  it('says nothing about the release date when the goal has no date criterion', () => {
    expect(describeGoal({ name: 'Lightning Bolt' })).not.toContain('released');
  });
});

/**
 * The goal the whole feature exists for. Both criteria have to show up in the
 * summary, or a saved retro frame goal reads as a plain frame goal and the user
 * cannot tell the date bound survived.
 */
describe('formatSearchCriteria — the retro frame goal', () => {
  it('describes both the frame era and the date bound', () => {
    const summary = describeGoal({
      frameStyle: { OR: ['1993', '1997'] },
      releasedAt: '>=2019',
    });

    expect(summary).toContain('1993 Original/1997 Retro frame');
    expect(summary).toContain('released 2019 or later');
  });

  it('keeps them distinct from the other treatment criteria', () => {
    const summary = describeGoal({
      frameStyle: { OR: ['1997'] },
      frameEffects: { OR: ['showcase'] },
      borderColor: { OR: ['"borderless"'] },
      releasedAt: '>=2019',
    });

    expect(summary).toContain('1997 Retro frame');
    expect(summary).toContain('Showcase');
    expect(summary).toContain('Borderless border');
    expect(summary).toContain('released 2019 or later');
  });
});

/**
 * Colour, rarity, type and layout supply the noun the parenthesised attributes
 * qualify. With none of them set the summary still needs one, or a retro frame
 * goal reads "1x of (1997 Retro frame)".
 */
describe('formatSearchCriteria — attribute-only goals keep a noun', () => {
  it.each([
    ['frame era', { frameStyle: { OR: ['1997'] } }],
    ['release date', { releasedAt: '>=2019' }],
    ['border colour', { borderColor: { OR: ['"borderless"'] } }],
    ['full art', { isFullArt: true }],
  ])('names every card for a %s goal', (_label, conditions) => {
    expect(describeGoal(conditions as Partial<CardApiParams>)).toMatch(/^every card/);
  });

  it('does not add a second noun when one is already there', () => {
    expect(describeGoal({ rarityNumeric: { OR: ['=4'] }, frameStyle: { OR: ['1997'] } })).toBe(
      'Rare (1997 Retro frame)',
    );
  });

  it('still says every card when nothing is set', () => {
    expect(describeGoal({})).toBe('every card');
  });
});
