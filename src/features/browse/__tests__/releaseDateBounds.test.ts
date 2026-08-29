import {
  RELEASE_DATE_FROM_PLACEHOLDER,
  RELEASE_DATE_TO_PLACEHOLDER,
  isUsableReleaseBound,
} from '@/features/browse/releaseDateBounds';

describe('isUsableReleaseBound', () => {
  it.each(['1993', '2019-07', '2019-7', '2019-07-12', '2026-12-31'])('accepts %s', (value) => {
    expect(isUsableReleaseBound(value)).toBe(true);
  });

  /**
   * An empty bound is not an error — a one-sided window ("everything printed
   * since 1993") is the common case.
   */
  it.each(['', '   '])('accepts %p as no bound at all', (value) => {
    expect(isUsableReleaseBound(value)).toBe(true);
  });

  it('tolerates surrounding whitespace', () => {
    expect(isUsableReleaseBound('  2019  ')).toBe(true);
  });

  /**
   * A half-typed year has to read as not-yet-usable, or the filter fires on "20"
   * and empties the results while the user is still typing.
   */
  it.each(['20', '199', 'last tuesday', '2019/07', '2019-07-12-01', ''.padEnd(5, '9')])(
    'rejects %p',
    (value) => {
      expect(isUsableReleaseBound(value)).toBe(false);
    },
  );
});

describe('release date placeholders', () => {
  it('suggests Magic’s first year as the lower bound', () => {
    expect(RELEASE_DATE_FROM_PLACEHOLDER).toBe('From (1993)');
  });

  /**
   * Hardcoding the upper year would leave the hint reading as a date in the past
   * within a few months of shipping.
   */
  it('tracks the current year for the upper bound', () => {
    expect(RELEASE_DATE_TO_PLACEHOLDER).toBe(`To (${new Date().getFullYear()})`);
  });

  it('offers both placeholders as bounds the filter would actually accept', () => {
    for (const placeholder of [RELEASE_DATE_FROM_PLACEHOLDER, RELEASE_DATE_TO_PLACEHOLDER]) {
      const example = placeholder.match(/\((\d{4})\)/)?.[1];

      expect(example).toBeDefined();
      expect(isUsableReleaseBound(example!)).toBe(true);
    }
  });
});
