import { formatSearchCriteria } from '@/utils/goals/formatSearchCriteria';

const describeGoal = (conditions: Record<string, unknown>, onePrintingPerPureName = false) =>
  formatSearchCriteria({ conditions } as never, onePrintingPerPureName);

/**
 * The goal description is the only place a saved goal explains itself back to the
 * user, so a tri-state filter that renders nothing for `false` would make
 * "exclude full art" indistinguishable from "no full art filter".
 */
describe('formatSearchCriteria — full art', () => {
  it('describes a full-art-only goal', () => {
    expect(describeGoal({ isFullArt: true })).toContain('(Full Art only)');
  });

  it('describes a goal that excludes full art', () => {
    expect(describeGoal({ isFullArt: false })).toContain('(excluding Full Art)');
  });

  it('says nothing about full art when the filter is unset', () => {
    expect(describeGoal({ name: 'Plains' })).not.toMatch(/Full Art/i);
  });

  it('describes full art and Reserved List together', () => {
    const description = describeGoal({ isFullArt: true, isReserved: false });

    expect(description).toContain('(Full Art only)');
    expect(description).toContain('(excluding Reserved List)');
  });

  it('describes the full art basic land goal', () => {
    const description = describeGoal({ isFullArt: true, type: { AND: ['Basic', 'Land'] } });

    expect(description).toContain('(Full Art only)');
    expect(description).toMatch(/Basic/);
    expect(description).toMatch(/Land/);
  });
});

/**
 * Treatment phrasing in goal descriptions. Border colours arrive quoted (exact
 * match) and frame effects unquoted (substring), so the formatter has to strip
 * quotes from one and not choke on their absence in the other.
 */
describe('formatSearchCriteria — treatments', () => {
  it('describes a borderless goal and strips the quoting', () => {
    const description = describeGoal({ borderColor: { OR: ['"borderless"'] } });

    expect(description).toContain('Borderless border');
    expect(description).not.toContain('"');
  });

  it('describes several border colours', () => {
    expect(describeGoal({ borderColor: { OR: ['"borderless"', '"gold"'] } })).toContain(
      'Borderless/Gold border',
    );
  });

  it('describes an excluded border colour', () => {
    expect(describeGoal({ borderColor: { NOT: ['"black"'] } })).toContain('excluding Black border');
  });

  it('describes a frame effect using its display name', () => {
    expect(describeGoal({ frameEffects: { OR: ['extendedart'] } })).toContain('Extended Art');
  });

  it('describes several frame effects', () => {
    const description = describeGoal({ frameEffects: { OR: ['extendedart', 'showcase'] } });

    expect(description).toContain('Extended Art');
    expect(description).toContain('Showcase');
  });

  it('describes an excluded frame effect', () => {
    expect(describeGoal({ frameEffects: { NOT: ['inverted'] } })).toContain('excluding Inverted');
  });

  it('says nothing about treatments when neither is set', () => {
    const description = describeGoal({ name: 'Plains' });

    expect(description).not.toMatch(/border/i);
    expect(description).not.toMatch(/Extended Art/i);
  });

  it('describes full art and borderless together without conflating them', () => {
    const description = describeGoal({
      isFullArt: true,
      borderColor: { OR: ['"borderless"'] },
    });

    expect(description).toContain('(Full Art only)');
    expect(description).toContain('Borderless border');
  });
});
