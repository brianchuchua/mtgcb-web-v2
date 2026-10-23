import { getCardSortOptions, getSetSortOptions, getSortOptionLabel } from '../sortOptions';

describe('getSortOptionLabel', () => {
  const allMismatched = () => true;

  it('drops the price warning icon from the selected label', () => {
    const options = getCardSortOptions(allMismatched, false);

    expect(getSortOptionLabel(options, 'low')).toBe('Price (Low)');
    expect(getSortOptionLabel(options, 'market')).toBe('Price (Market)');
    expect(getSortOptionLabel(options, 'average')).toBe('Price (Average)');
    expect(getSortOptionLabel(options, 'high')).toBe('Price (High)');
  });

  it('returns plain labels for options without an icon', () => {
    const options = getCardSortOptions(() => false, true);

    expect(getSortOptionLabel(options, 'name')).toBe('Name');
    expect(getSortOptionLabel(options, 'quantityAll')).toBe('Quantity (Total)');
    expect(getSortOptionLabel(getSetSortOptions(true), 'costToComplete.oneOfEachCard')).toBe('Cost to Complete');
  });

  it('falls back to the raw value when the option is missing', () => {
    expect(getSortOptionLabel(getCardSortOptions(() => false, false), 'quantityReg')).toBe('quantityReg');
  });
});
